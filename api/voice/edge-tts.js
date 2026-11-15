'use strict';

/**
 * Microsoft Edge online text-to-speech client (the voices behind Edge's
 * Read Aloud feature), for Amharic: am-ET-MekdesNeural / am-ET-AmehaNeural.
 * No API key and no account are needed; the service is reached over a
 * WebSocket with a Sec-MS-GEC token (see edge-drm.js).
 *
 * Wire protocol, mirrored from the edge-tts reference implementation
 * (rany2/edge-tts, communicate.py / constants.py):
 *   - Connect to wss://speech.platform.bing.com/consumer/speech/synthesize/
 *     readaloud/edge/v1?TrustedClientToken=...&ConnectionId=...&Sec-MS-GEC=
 *     ...&Sec-MS-GEC-Version=2-<chromium version>, with Edge browser
 *     headers and a random muid cookie.
 *   - Send a speech.config message (audio-24khz-48kbitrate-mono-mp3),
 *     then an SSML message (single <voice> + <prosody>; the service
 *     rejects anything else).
 *   - Binary frames carry MP3: a 2-byte big-endian header length, the
 *     header block, a CRLF separator, then audio bytes. A text frame
 *     with Path:turn.end marks completion.
 *   - Text is split into chunks of at most 4096 escaped bytes (one
 *     connection per chunk), at word boundaries, without splitting
 *     multi-byte characters or XML entities.
 *   - A 403 handshake response means the client clock is off: the skew
 *     is corrected from the server Date header and the request is
 *     retried once, like the reference implementation.
 *
 * This service is UNOFFICIAL: Microsoft can change or restrict it without
 * notice. The voice endpoint (speak.js) therefore treats Edge TTS as the
 * first provider and falls back to Gemini TTS when it fails and a Gemini
 * key is configured, so a service change degrades the voice instead of
 * silencing it. Nothing sent here is logged; the text is the same
 * already-redacted page text the Gemini path receives, and only after
 * the user consents in the browser.
 */

var WebSocket = require('ws');
var crypto = require('crypto');
var drm = require('./edge-drm.js');

var WSS_BASE = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
var SEC_MS_GEC_VERSION = '2-143.0.3650.75';
var CHROMIUM_MAJOR_VERSION = '143';
// If Microsoft moves Edge's Read Aloud service to a newer Chromium, the
// version above and this User-Agent move together (see VOICE-ASSISTANT.md).
var USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  + ' (KHTML, like Gecko) Chrome/' + CHROMIUM_MAJOR_VERSION + '.0.0.0 Safari/537.36'
  + ' Edg/' + CHROMIUM_MAJOR_VERSION + '.0.0.0';

var EDGE_VOICES = ['am-ET-MekdesNeural', 'am-ET-AmehaNeural'];
var DEFAULT_EDGE_VOICE = 'am-ET-MekdesNeural';
var MAX_CHUNK_BYTES = 4096;
var DEFAULT_TIMEOUT_MS = 12000;

function getEdgeVoice(env) {
  var voice = (env.EDGE_TTS_VOICE || '').trim() || DEFAULT_EDGE_VOICE;
  return EDGE_VOICES.indexOf(voice) !== -1 ? voice : null;
}

// The service rejects a few control-character ranges; edge-tts replaces
// them with spaces (tab, LF and CR are kept).
function removeIncompatibleCharacters(text) {
  return String(text || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
}

// xml.sax.saxutils.escape default: & < > only, in that order.
function escapeXml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

var WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateToString(date) {
  var d = date || new Date();
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  return WEEKDAYS[d.getUTCDay()] + ' ' + MONTHS[d.getUTCMonth()] + ' ' + pad(d.getUTCDate())
    + ' ' + d.getUTCFullYear() + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes())
    + ':' + pad(d.getUTCSeconds()) + ' GMT+0000 (Coordinated Universal Time)';
}

function buildConfigMessage() {
  return 'X-Timestamp:' + dateToString() + '\r\n'
    + 'Content-Type:application/json; charset=utf-8\r\n'
    + 'Path:speech.config\r\n\r\n'
    + '{"context":{"synthesis":{"audio":{"metadataoptions":'
    + '{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},'
    + '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n';
}

// xml:lang stays en-US exactly as the reference implementation sends it;
// the voice name carries the Amharic locale. Single quotes, one <voice>
// and one <prosody>: the service rejects anything more elaborate.
function buildSsml(voice, escapedText) {
  return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
    + "<voice name='" + voice + "'>"
    + "<prosody pitch='+0Hz' rate='+0%' volume='+0%'>"
    + escapedText
    + '</prosody></voice></speak>';
}

function buildSsmlMessage(requestId, ssml) {
  return 'X-RequestId:' + requestId + '\r\n'
    + 'Content-Type:application/ssml+xml\r\n'
    + 'X-Timestamp:' + dateToString() + 'Z\r\n' // The trailing Z is intentional (Edge quirk).
    + 'Path:ssml\r\n\r\n'
    + ssml;
}

// --- Text splitting (port of edge-tts split_text_by_byte_length) --------

function findSplitPoint(bytes, limit) {
  var splitAt = bytes.lastIndexOf(10, limit - 1); // newline
  if (splitAt < 0) splitAt = bytes.lastIndexOf(32, limit - 1); // space
  return splitAt;
}

function findSafeUtf8SplitPoint(segment) {
  // Largest prefix of the segment that is a complete UTF-8 sequence.
  var splitAt = segment.length;
  while (splitAt > 0) {
    var head = segment.subarray(0, splitAt).toString('utf8');
    // A replacement character at the end means the last byte sequence
    // was cut mid-character (the input itself contains no U+FFFD: it
    // comes from validated request text, and escapeXml never adds one).
    if (head.charCodeAt(head.length - 1) !== 0xFFFD) return splitAt;
    splitAt -= 1;
  }
  return splitAt;
}

function adjustSplitPointForXmlEntity(bytes, splitAt) {
  while (splitAt > 0 && bytes.indexOf(38, 0) !== -1) { // '&'
    var amp = bytes.lastIndexOf(38, splitAt - 1);
    if (amp < 0) break;
    if (bytes.indexOf(59, amp) !== -1 && bytes.indexOf(59, amp) < splitAt) break; // ';' terminates it
    splitAt = amp;
  }
  return splitAt;
}

// Split escaped text into Buffers of at most maxBytes, at word boundaries,
// never splitting a multi-byte character or an XML entity. Pure: tested.
function splitTextForEdge(escapedText, maxBytes) {
  var limit = maxBytes || MAX_CHUNK_BYTES;
  var text = Buffer.from(String(escapedText || ''), 'utf8');
  var chunks = [];
  while (text.length > limit) {
    var splitAt = findSplitPoint(text, limit);
    if (splitAt < 0) splitAt = findSafeUtf8SplitPoint(text.subarray(0, limit));
    splitAt = adjustSplitPointForXmlEntity(text, splitAt);
    if (splitAt <= 0) splitAt = 1; // never stall on pathological input
    var chunk = text.subarray(0, splitAt).toString('utf8').trim();
    if (chunk) chunks.push(Buffer.from(chunk, 'utf8'));
    text = text.subarray(splitAt);
  }
  var tail = text.toString('utf8').trim();
  if (tail) chunks.push(Buffer.from(tail, 'utf8'));
  return chunks;
}

// --- Message parsing ------------------------------------------------------

function parseHeaders(headerBlock) {
  var headers = {};
  headerBlock.split('\r\n').forEach(function (line) {
    var idx = line.indexOf(':');
    if (idx > 0) headers[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return headers;
}

// Text frame: "Header: value\r\n...\r\n\r\nbody". Returns { headers, body }.
function parseTextMessage(text) {
  var sep = text.indexOf('\r\n\r\n');
  if (sep < 0) return { headers: parseHeaders(text), body: '' };
  return { headers: parseHeaders(text.slice(0, sep)), body: text.slice(sep + 4) };
}

// Binary frame: [2-byte BE header length][header block][CRLF][payload].
// The length counts the 2 length bytes plus the header block. Pure: tested.
function parseBinaryMessage(buffer) {
  var buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (buf.length < 2) return { error: 'short' };
  var headerLength = buf.readUInt16BE(0);
  if (headerLength < 2 || headerLength + 2 > buf.length) return { error: 'bad_header_length' };
  var headers = parseHeaders(buf.subarray(2, headerLength).toString('utf8'));
  return { headers: headers, data: buf.subarray(headerLength + 2) };
}

// --- WebSocket layer ------------------------------------------------------

function buildWsUrl(wsBaseUrl) {
  var base = wsBaseUrl || WSS_BASE;
  var sep = base.indexOf('?') === -1 ? '?' : '&';
  return base + sep
    + 'TrustedClientToken=' + drm.TRUSTED_CLIENT_TOKEN
    + '&ConnectionId=' + crypto.randomUUID().replace(/-/g, '')
    + '&Sec-MS-GEC=' + encodeURIComponent(drm.generateSecMsGecNow())
    + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION;
}

function buildWsHeaders() {
  return {
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
    'User-Agent': USER_AGENT,
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en-US,en;q=0.9',
    Cookie: 'muid=' + crypto.randomBytes(16).toString('hex').toUpperCase() + ';'
  };
}

function edgeError(code, message) {
  var err = new Error(message);
  err.code = code;
  return err;
}

// One connection, one chunk. Rejects with err.statusCode / err.serverDate
// when the handshake itself is rejected, so the caller can retry a 403
// after correcting clock skew.
function synthesizeChunkOnce(chunkText, voice, timeoutMs, wsBaseUrl, WebSocketImpl) {
  return new Promise(function (resolve, reject) {
    var WS = WebSocketImpl || WebSocket;
    var audioParts = [];
    var audioBytes = 0;
    var turnEnded = false;
    var settled = false;
    var ws = null;

    function settle(fn, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timerId);
      try { ws.removeAllListeners(); } catch (e) {}
      // terminate() on a CONNECTING socket emits an 'error' event; keep a
      // no-op listener so it cannot become an unhandled error.
      try { ws.on('error', function () {}); } catch (e) {}
      try { ws.terminate(); } catch (e) {}
      fn(value);
    }
    function fail(err) { settle(reject, err); }
    function done() {
      if (audioBytes === 0) {
        fail(edgeError('edge_empty_audio', 'The Edge voice service returned no audio.'));
        return;
      }
      settle(resolve, Buffer.concat(audioParts, audioBytes));
    }

    var timerId = setTimeout(function () {
      fail(edgeError('edge_timeout', 'The Edge voice service timed out.'));
    }, timeoutMs);
    if (timerId.unref) timerId.unref();

    try {
      ws = new WS(buildWsUrl(wsBaseUrl), { headers: buildWsHeaders(), handshakeTimeout: timeoutMs });
    } catch (e) {
      fail(edgeError('edge_unreachable', 'The Edge voice service could not be reached.'));
      return;
    }

    ws.on('unexpected-response', function (req, res) {
      // The handshake was rejected (e.g. 403 for clock skew). Fail now
      // with the status and server Date: 'close' does not reliably
      // follow a rejected handshake, so waiting for it would stall
      // until the timeout. The retry wrapper uses the Date header.
      var dateHeader = res && res.headers ? res.headers.date : null;
      var err = edgeError('edge_rejected', 'The Edge voice service rejected the request.');
      err.statusCode = res ? res.statusCode : 0;
      err.serverDate = dateHeader ? Date.parse(dateHeader) / 1000 : NaN;
      fail(err);
    });

    ws.on('open', function () {
      try {
        ws.send(buildConfigMessage());
        ws.send(buildSsmlMessage(crypto.randomUUID().replace(/-/g, ''), buildSsml(voice, chunkText)));
      } catch (e) {
        fail(edgeError('edge_unreachable', 'The Edge voice service connection failed.'));
      }
    });

    ws.on('message', function (data, isBinary) {
      if (settled) return;
      try {
        if (isBinary) {
          var parsed = parseBinaryMessage(data);
          if (parsed.error) {
            fail(edgeError('edge_protocol_error', 'The Edge voice service sent an unreadable response.'));
            return;
          }
          if (parsed.headers.Path !== 'audio') return; // ignore non-audio binary frames
          var contentType = parsed.headers['Content-Type'];
          if (contentType && contentType !== 'audio/mpeg') {
            fail(edgeError('edge_protocol_error', 'The Edge voice service sent audio in an unexpected format.'));
            return;
          }
          if (parsed.data.length === 0) return; // end-of-stream marker frame
          audioParts.push(Buffer.from(parsed.data));
          audioBytes += parsed.data.length;
          return;
        }
        var text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
        var path = parseTextMessage(text).headers.Path;
        if (path === 'turn.end') {
          turnEnded = true;
          done();
        }
        // turn.start, response and audio.metadata carry nothing this
        // client needs; unknown paths are ignored, not fatal.
      } catch (e) {
        fail(edgeError('edge_protocol_error', 'The Edge voice service sent an unreadable response.'));
      }
    });

    ws.on('close', function () {
      if (settled) return;
      if (turnEnded) { done(); return; }
      if (audioBytes > 0) { done(); return; } // clean close after audio, without turn.end
      fail(edgeError('edge_unreachable', 'The Edge voice service connection closed unexpectedly.'));
    });

    ws.on('error', function () {
      if (settled) return;
      // A socket error before the connection is established (refused,
      // DNS, TLS) may never be followed by 'close': fail now. For an
      // established socket, 'close' follows and decides the outcome
      // (audio already received still counts as success there).
      if (ws.readyState === WS.CONNECTING) {
        fail(edgeError('edge_unreachable', 'The Edge voice service could not be reached.'));
      }
    });
  });
}

function synthesizeChunkWithRetry(chunkText, voice, timeoutMs, wsBaseUrl, WebSocketImpl) {
  return synthesizeChunkOnce(chunkText, voice, timeoutMs, wsBaseUrl, WebSocketImpl)
    .catch(function (err) {
      if (err.statusCode === 403 && isFinite(err.serverDate)) {
        // Clock skew: correct from the server clock and try once more
        // with a fresh token, exactly like the reference implementation.
        var skew = err.serverDate - drm.getUnixTimestamp();
        if (isFinite(skew) && Math.abs(skew) < 86400) drm.adjustClockSkew(skew);
        return synthesizeChunkOnce(chunkText, voice, timeoutMs, wsBaseUrl, WebSocketImpl);
      }
      throw err;
    });
}

// Synthesize Amharic text to MP3. Splits long text into one connection per
// chunk and concatenates the audio. The timeout is a TOTAL budget across
// chunks so a long page cannot overrun the serverless time limit.
async function synthesizeWithEdge(options) {
  var opts = options || {};
  var voice = opts.voice || DEFAULT_EDGE_VOICE;
  var timeoutMs = opts.timeoutMs || DEFAULT_TIMEOUT_MS;
  var deadline = Date.now() + timeoutMs;
  var cleaned = escapeXml(removeIncompatibleCharacters(opts.text || ''));
  var chunks = splitTextForEdge(cleaned, MAX_CHUNK_BYTES);
  if (chunks.length === 0) {
    throw edgeError('edge_empty_audio', 'No text to speak.');
  }
  var parts = [];
  var total = 0;
  for (var i = 0; i < chunks.length; i++) {
    var remaining = deadline - Date.now();
    if (remaining <= 500) {
      throw edgeError('edge_timeout', 'The Edge voice service timed out.');
    }
    var audio = await synthesizeChunkWithRetry(
      chunks[i].toString('utf8'), voice, remaining, opts.wsBaseUrl, opts.WebSocketImpl
    );
    parts.push(audio);
    total += audio.length;
  }
  if (total === 0) throw edgeError('edge_empty_audio', 'The Edge voice service returned no audio.');
  return Buffer.concat(parts, total);
}

module.exports = {
  synthesizeWithEdge: synthesizeWithEdge,
  getEdgeVoice: getEdgeVoice,
  buildConfigMessage: buildConfigMessage,
  buildSsml: buildSsml,
  buildSsmlMessage: buildSsmlMessage,
  splitTextForEdge: splitTextForEdge,
  escapeXml: escapeXml,
  removeIncompatibleCharacters: removeIncompatibleCharacters,
  dateToString: dateToString,
  parseTextMessage: parseTextMessage,
  parseBinaryMessage: parseBinaryMessage,
  EDGE_VOICES: EDGE_VOICES,
  DEFAULT_EDGE_VOICE: DEFAULT_EDGE_VOICE,
  MAX_CHUNK_BYTES: MAX_CHUNK_BYTES,
  WSS_BASE: WSS_BASE,
  SEC_MS_GEC_VERSION: SEC_MS_GEC_VERSION
};
