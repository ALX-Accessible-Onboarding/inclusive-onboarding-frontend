// Voice assistant tests: server endpoint validation/WAV/handler behaviour
// (with fetch stubbed, no network, no real API key), the Edge TTS client
// (against a local mock WebSocket server, no network), the Sec-MS-GEC
// token generator (known-answer vectors from the edge-tts reference),
// plus the pure client helpers (text chunking, redaction, voice
// commands). Run with:
//   npm run test:voice        (also runs as part of `npm test`)
import voiceApi from './api/voice/speak.js';
import edgeDrm from './api/voice/edge-drm.js';
import edgeTts from './api/voice/edge-tts.js';
import wsPkg from 'ws';
import { splitTextForSpeech, redactSensitivePatterns, speak } from './src/features/read-aloud.js';
import { matchVoiceCommand } from './src/features/voice-assistant.js';
import { t } from './src/labels.js';
import {
  normalizeTranscript, parseNumbers, matchGuideCommand, matchOptionByWords,
  wordsToDigits, normalizeTextAnswer, detectGuideLanguage,
  matchLanguageOption, interpretAnswer, VoiceGuide
} from './src/features/voice-guide.js';

const handler = voiceApi.handler || voiceApi;
const validateVoiceRequest = voiceApi.validateVoiceRequest;
const pcmToWav = voiceApi.pcmToWav;
const extractAudioData = voiceApi.extractAudioData;
const parseSampleRate = voiceApi.parseSampleRate;
const getVoice = voiceApi.getVoice;
const getStyle = voiceApi.getStyle;
const getProvider = voiceApi.getProvider;
const DEFAULT_STYLE = voiceApi.DEFAULT_STYLE;
const WSServer = wsPkg.WebSocketServer || wsPkg.Server;

function assert(condition, message) {
  if (!condition) throw new Error('Assertion failed: ' + message);
}

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    writeHead: function (status, headers) { this.statusCode = status; this.headers = headers || {}; },
    end: function (body) { this.body = body; }
  };
}

function withEnv(overrides, fn) {
  const saved = {};
  const keys = ['GEMINI_API_KEY', 'GEMINI_TTS_MODEL', 'GEMINI_TTS_VOICE', 'GEMINI_TTS_STYLE',
    'VOICE_PROVIDER', 'EDGE_TTS_VOICE', 'EDGE_TTS_WS_URL'];
  keys.forEach(function (key) { saved[key] = process.env[key]; });
  keys.forEach(function (key) {
    if (overrides[key] === undefined) { delete process.env[key]; }
    else { process.env[key] = overrides[key]; }
  });
  return Promise.resolve()
    .then(fn)
    .finally(function () {
      keys.forEach(function (key) {
        if (saved[key] === undefined) { delete process.env[key]; }
        else { process.env[key] = saved[key]; }
      });
    });
}

// Build one binary Edge TTS frame the way the real service frames it:
// [2-byte BE header length][header block][CRLF][payload], where the
// length counts the 2 length bytes plus the header block.
function buildAudioFrame(payload, requestId) {
  const headerText = 'X-RequestId:' + (requestId || 'test') + '\r\nContent-Type:audio/mpeg\r\nPath:audio\r\n';
  const headerBytes = Buffer.from(headerText, 'utf8');
  const len = Buffer.alloc(2);
  len.writeUInt16BE(2 + headerBytes.length, 0);
  return Buffer.concat([len, headerBytes, Buffer.from('\r\n'), Buffer.from(payload)]);
}

// Local mock of the Edge TTS WebSocket service. Behaviours: 'ok' (two
// audio frames + turn.end), 'no-audio' (turn.end only), 'close' (drop
// the socket), 'silent' (never reply). Records connections and messages.
function startMockEdgeServer(behavior) {
  return new Promise(function (resolve) {
    const state = { connections: [], messages: [] };
    const server = new WSServer({ host: '127.0.0.1', port: 0 }, function () {
      state.url = 'ws://127.0.0.1:' + server.address().port + '/edge/v1';
      resolve(state);
    });
    state.server = server;
    state.close = function () {
      return new Promise(function (done) {
        server.clients.forEach(function (c) { try { c.terminate(); } catch (e) {} });
        server.close(function () { done(); });
      });
    };
    server.on('connection', function (socket, req) {
      state.connections.push({ headers: req.headers, url: req.url });
      socket.on('message', function (data) {
        const text = data.toString('utf8');
        state.messages.push(text);
        if (text.indexOf('Path:ssml') === -1) return;
        if (behavior === 'ok') {
          socket.send('X-RequestId:test\r\nPath:turn.start\r\n\r\n');
          socket.send(buildAudioFrame(Buffer.from([0xFF, 0xFB, 0x90, 0x00, 1, 2, 3, 4])));
          socket.send(buildAudioFrame(Buffer.from([5, 6, 7, 8, 9, 10])));
          socket.send('X-RequestId:test\r\nPath:turn.end\r\n\r\n');
        } else if (behavior === 'no-audio') {
          socket.send('X-RequestId:test\r\nPath:turn.end\r\n\r\n');
        } else if (behavior === 'close') {
          socket.terminate();
        }
        // 'silent': never reply, so the client must time out.
      });
    });
  });
}

async function runTests() {
  console.log('--- Testing Voice Assistant ---');

  // 1. Request validation
  let valid = validateVoiceRequest({ text: 'ሰላም ዓለም', language: 'am' });
  assert(!valid.error && valid.text === 'ሰላም ዓለም' && valid.language === 'am', 'valid Amharic request passes');
  assert(validateVoiceRequest({ text: 'ሰላም', language: 'am-ET' }).language === 'am', 'am-ET normalizes to am');
  assert(validateVoiceRequest({ text: 'Hello', language: 'en' }).error.code === 'voice_language_not_supported', 'English is rejected by the endpoint');
  assert(validateVoiceRequest({ text: '', language: 'am' }).error.status === 400, 'empty text rejected');
  assert(validateVoiceRequest({ text: '   ', language: 'am' }).error.status === 400, 'whitespace text rejected');
  assert(validateVoiceRequest({ text: 42, language: 'am' }).error.status === 400, 'non-string text rejected');
  assert(validateVoiceRequest({ language: 'am' }).error.status === 400, 'missing text rejected');
  assert(validateVoiceRequest(null).error.status === 400, 'null body rejected');
  assert(validateVoiceRequest('nope').error.status === 400, 'string body rejected');
  assert(validateVoiceRequest({ text: 'x'.repeat(2001), language: 'am' }).error.code === 'voice_text_too_long', 'over-long text rejected');
  assert(validateVoiceRequest({ text: 'a\u0000b', language: 'am' }).error.status === 400, 'control characters rejected');
  console.log('1. Request validation passed');

  // 2. WAV header construction
  const pcm = Buffer.from([0, 0, 1, 0, 255, 255, 0, 128]);
  const wav = pcmToWav(pcm, 24000);
  assert(wav.length === 44 + pcm.length, 'WAV length is header + PCM');
  assert(wav.toString('ascii', 0, 4) === 'RIFF', 'WAV starts with RIFF');
  assert(wav.toString('ascii', 8, 12) === 'WAVE', 'WAV has WAVE marker');
  assert(wav.readUInt32LE(24) === 24000, 'WAV sample rate field is 24000');
  assert(wav.readUInt16LE(22) === 1, 'WAV is mono');
  assert(wav.readUInt16LE(34) === 16, 'WAV is 16-bit');
  assert(wav.slice(44).equals(pcm), 'WAV payload is the original PCM');
  console.log('2. WAV header passed');

  // 3. Gemini Interactions response parsing
  assert(parseSampleRate('audio/L16;codec=pcm;rate=24000') === 24000, 'sample rate parsed from MIME type');
  assert(parseSampleRate('audio/L16;codec=pcm;rate=999999') === 24000, 'out-of-range sample rate falls back to 24000');
  assert(parseSampleRate('') === 24000, 'missing MIME type falls back to 24000');
  const audio = extractAudioData({ steps: [{ type: 'model_output', content: [{ type: 'text', text: 'ignored' }, { type: 'audio', mime_type: 'audio/wav', data: 'aGVsbG8=' }] }] });
  assert(audio && audio.data === 'aGVsbG8=' && audio.mimeType === 'audio/wav', 'audio step extracted');
  const lastAudio = extractAudioData({ steps: [{ content: [{ type: 'audio', data: 'Zmlyc3Q=' }] }, { content: [{ type: 'audio', data: 'bGFzdA==' }] }] });
  assert(lastAudio && lastAudio.data === 'bGFzdA==', 'last audio block wins');
  const convenience = extractAudioData({ output_audio: { data: 'Y29udg==', mime_type: 'audio/wav' } });
  assert(convenience && convenience.data === 'Y29udg==', 'output_audio convenience field accepted');
  assert(extractAudioData({ steps: [{ content: [{ type: 'text', text: 'no audio' }] }] }) === null, 'missing audio returns null');
  assert(extractAudioData({}) === null, 'empty response returns null');
  console.log('3. Gemini response parsing passed');

  // 4. GET health check
  await withEnv({ GEMINI_API_KEY: undefined, VOICE_PROVIDER: 'gemini' }, async function () {
    const res = mockRes();
    await handler({ method: 'GET', body: undefined }, res);
    const data = JSON.parse(res.body);
    assert(res.statusCode === 200, 'health check returns 200');
    assert(data.available === false, 'gemini-only health reports unavailable without a key');
    assert(data.provider === 'gemini', 'health reports the configured provider');
    assert(JSON.stringify(data).indexOf('GEMINI') === -1, 'health response never mentions the key');
  });
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini' }, async function () {
    const res = mockRes();
    await handler({ method: 'GET', body: undefined }, res);
    const data = JSON.parse(res.body);
    assert(data.available === true, 'gemini-only health reports available with a key');
    assert(data.geminiConfigured === true, 'health reports Gemini configured');
  });
  await withEnv({ GEMINI_API_KEY: undefined }, async function () {
    const res = mockRes();
    await handler({ method: 'GET', body: undefined }, res);
    const data = JSON.parse(res.body);
    assert(data.available === true, 'default (Edge) health reports available without a key');
    assert(data.provider === 'auto', 'default provider is auto');
    assert(data.geminiConfigured === false, 'health reports Gemini unconfigured without a key');
  });
  console.log('4. Health check passed');

  // 5. POST without a key -> 503, no upstream call (Gemini-only mode)
  await withEnv({ GEMINI_API_KEY: undefined, VOICE_PROVIDER: 'gemini' }, async function () {
    let fetchCalled = false;
    const originalFetch = global.fetch;
    global.fetch = async function () { fetchCalled = true; throw new Error('must not be called'); };
    try {
      const res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 503, 'missing key returns 503');
      assert(JSON.parse(res.body).error.code === 'voice_not_configured', 'missing key error code');
      assert(!fetchCalled, 'upstream is not called without a key');
    } finally {
      global.fetch = originalFetch;
    }
  });
  console.log('5. Missing-key handling passed');

  // 6. Invalid POSTs never reach the upstream
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini' }, async function () {
    let fetchCalled = false;
    const originalFetch = global.fetch;
    global.fetch = async function () { fetchCalled = true; throw new Error('must not be called'); };
    try {
      const cases = [
        [{ text: 'Hello', language: 'en' }, 400],
        [{ text: '', language: 'am' }, 400],
        [{ text: 'x'.repeat(2001), language: 'am' }, 400]
      ];
      for (let i = 0; i < cases.length; i++) {
        const res = mockRes();
        await handler({ method: 'POST', body: cases[i][0] }, res);
        assert(res.statusCode === cases[i][1], 'invalid request returns ' + cases[i][1]);
      }
      assert(!fetchCalled, 'upstream is not called for invalid requests');
      const putRes = mockRes();
      await handler({ method: 'PUT', body: {} }, putRes);
      assert(putRes.statusCode === 405, 'PUT returns 405');
    } finally {
      global.fetch = originalFetch;
    }
  });
  console.log('6. Invalid-request handling passed');

  // 7. Successful synthesis with a stubbed Gemini Interactions response
  await withEnv({ GEMINI_API_KEY: 'test-key-123', VOICE_PROVIDER: 'gemini' }, async function () {
    const originalFetch = global.fetch;
    let captured = null;
    const stubWav = pcmToWav(pcm, 24000);
    global.fetch = async function (url, options) {
      captured = { url: url, options: options };
      return {
        ok: true,
        status: 200,
        headers: { get: function () { return null; } },
        json: async function () {
          return { steps: [{ type: 'model_output', content: [{ type: 'audio', mime_type: 'audio/wav', data: stubWav.toString('base64') }] }] };
        },
        text: async function () { return ''; }
      };
    };
    try {
      const res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም ዓለም', language: 'am' } }, res);
      assert(res.statusCode === 200, 'synthesis returns 200');
      assert(res.headers['Content-Type'] === 'audio/wav', 'synthesis returns audio/wav');
      assert(Buffer.isBuffer(res.body), 'synthesis body is a Buffer');
      assert(res.body.equals(stubWav), 'WAV bytes from the Interactions API are forwarded unchanged');
      assert(captured.url === 'https://generativelanguage.googleapis.com/v1beta/interactions', 'upstream is the Interactions API');
      assert(captured.url.indexOf('test-key-123') === -1, 'API key is never in the upstream URL');
      assert(captured.options.headers['x-goog-api-key'] === 'test-key-123', 'API key travels in the header only');
      const sent = JSON.parse(captured.options.body);
      assert(sent.model === 'gemini-3.8-flash-lite-tts', 'default model is used');
      assert(sent.input[0].content[0].text === 'ሰላም ዓለም', 'Amharic text is sent verbatim');
      assert(sent.input[0].type === 'user_input' && sent.input[0].content[0].type === 'text', 'Interactions input shape');
      assert(sent.response_format.type === 'audio', 'response format is audio');
      assert(sent.generation_config.speech_config[0].voice === 'Kore', 'default voice is Kore');
      const annotations = sent.input[0].content[0].annotations;
      assert(Array.isArray(annotations) && annotations.length === 1, 'one style annotation is sent');
      assert(annotations[0].type === 'speech_metadata', 'annotation type is speech_metadata');
      assert(annotations[0].style === DEFAULT_STYLE, 'default style steers native Ethiopian Amharic delivery');
    } finally {
      global.fetch = originalFetch;
    }
  });
  console.log('7. Successful synthesis (stubbed upstream) passed');

  // 7b. Headerless PCM responses are wrapped in a WAV header
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini' }, async function () {
    const originalFetch = global.fetch;
    global.fetch = async function () {
      return {
        ok: true,
        status: 200,
        headers: { get: function () { return null; } },
        json: async function () {
          return { steps: [{ content: [{ type: 'audio', mime_type: 'audio/l16;rate=24000', data: Buffer.from(pcm).toString('base64') }] }] };
        },
        text: async function () { return ''; }
      };
    };
    try {
      const res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 200, 'PCM synthesis returns 200');
      assert(res.body.toString('ascii', 0, 4) === 'RIFF', 'PCM is wrapped as WAV');
      assert(res.body.slice(44).equals(pcm), 'PCM payload is preserved inside the WAV');
    } finally {
      global.fetch = originalFetch;
    }
  });
  console.log('7b. PCM fallback wrapping passed');

  // 8. Upstream errors are mapped, never echoed
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini' }, async function () {
    const originalFetch = global.fetch;
    try {
      global.fetch = async function () {
        return { ok: false, status: 429, headers: { get: function (name) { return name === 'retry-after' ? '12' : null; } }, text: async function () { return 'secret upstream detail'; } };
      };
      let res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 429, 'upstream 429 maps to 429');
      assert(res.headers['Retry-After'] === '12', 'Retry-After is passed through (capped)');
      assert(JSON.parse(res.body).error.code === 'voice_rate_limited', 'rate limit error code');
      assert(res.body.indexOf('secret') === -1, 'upstream body is never echoed');

      global.fetch = async function () {
        return { ok: false, status: 401, headers: { get: function () { return null; } }, text: async function () { return 'bad key detail'; } };
      };
      res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 502, 'upstream 401 maps to 502');
      assert(JSON.parse(res.body).error.code === 'voice_upstream_auth', 'upstream auth error code');
      assert(res.body.indexOf('bad key') === -1, 'upstream auth detail is never echoed');

      global.fetch = async function () {
        return { ok: true, status: 200, headers: { get: function () { return null; } }, json: async function () { return { steps: [] }; }, text: async function () { return ''; } };
      };
      res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 502, 'empty audio maps to 502');
      assert(JSON.parse(res.body).error.code === 'voice_empty_audio', 'empty audio error code');
    } finally {
      global.fetch = originalFetch;
    }
  });
  console.log('8. Upstream error mapping passed');

  // 9. Non-allowlisted models are rejected server-side (including the
  // retired 3.1 preview model, whose shape differs and which shuts down
  // on the Gemini API on 17 Nov 2026).
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini', GEMINI_TTS_MODEL: 'gemini-3.1-flash-tts-preview' }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'retired preview model returns 500');
    assert(JSON.parse(res.body).error.code === 'voice_misconfigured', 'misconfigured error code');
  });
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini', GEMINI_TTS_MODEL: 'not-a-real-model' }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'unknown model returns 500');
  });
  console.log('9. Model allowlist passed');

  // 10. Text chunking for remote requests
  assert(splitTextForSpeech('').length === 0, 'empty text splits to no chunks');
  assert(splitTextForSpeech('Short sentence.').length === 1, 'short text is one chunk');
  const longText = 'First sentence here. Second sentence here. Third sentence here. Fourth sentence here.';
  const chunks = splitTextForSpeech(longText, 40);
  assert(chunks.length > 1, 'long text splits into several chunks');
  chunks.forEach(function (chunk) { assert(chunk.length <= 40, 'no chunk exceeds the limit: ' + chunk); });
  assert(chunks.join(' ') === longText, 'chunks rejoin to the original text');
  const amharicText = 'ሰላም። እንዴት ነህ። ደህና ነኝ።';
  const amChunks = splitTextForSpeech(amharicText, 12);
  assert(amChunks.length === 3, 'Amharic sentences split on ።: ' + JSON.stringify(amChunks));
  const oneLongWord = 'x'.repeat(50);
  assert(splitTextForSpeech(oneLongWord, 20).every(function (c) { return c.length <= 20; }), 'oversized words are hard-split');
  console.log('10. Text chunking passed');

  // 11. Sensitive-pattern redaction (remote path only)
  const redacted = redactSensitivePatterns('Call me at user@example.com or 251912345678 please. ሰላም ዓለም');
  assert(redacted.indexOf('user@example.com') === -1, 'email addresses are redacted');
  assert(redacted.indexOf('251912345678') === -1, 'long digit runs are redacted');
  assert(redacted.indexOf('ሰላም ዓለም') !== -1, 'Amharic text is preserved');
  assert(redacted.indexOf('Call me') !== -1, 'ordinary words are preserved');
  console.log('11. Redaction passed');

  // 12. Voice commands (English and Amharic)
  assert(matchVoiceCommand('read the page').action === 'read', 'EN read command');
  assert(matchVoiceCommand('please stop reading').action === 'stop', 'EN stop command wins with extra words');
  assert(matchVoiceCommand('help').action === 'help', 'EN help command');
  assert(matchVoiceCommand('go to career').view === 'career', 'EN career command');
  assert(matchVoiceCommand('my profile').view === 'profile', 'EN profile command');
  assert(matchVoiceCommand('sign up').view === 'onboarding', 'EN onboarding command');
  assert(matchVoiceCommand('post a job').view === 'employer', 'EN employer command');
  assert(matchVoiceCommand('ገጹን አንብብ').action === 'read', 'AM read command');
  assert(matchVoiceCommand('አቁም').action === 'stop', 'AM stop command');
  assert(matchVoiceCommand('እርዳታ').action === 'help', 'AM help command');
  assert(matchVoiceCommand('የሥራ እድሎች').view === 'career', 'AM career command');
  assert(matchVoiceCommand('መገለጫዬ').view === 'profile', 'AM profile command');
  assert(matchVoiceCommand('hello world') === null, 'unknown command returns null');
  assert(matchVoiceCommand('') === null, 'empty transcript returns null');
  console.log('12. Voice commands passed');

  // 13. Style steering and voice ID formats
  assert(getStyle({}) === DEFAULT_STYLE, 'default style is used when unset');
  assert(getStyle({ GEMINI_TTS_STYLE: '  calm and slow  ' }) === 'calm and slow', 'style override is trimmed');
  assert(getStyle({ GEMINI_TTS_STYLE: 'none' }) === null, 'style=none disables annotations');
  assert(getStyle({ GEMINI_TTS_STYLE: 'NONE' }) === null, 'style=NONE disables annotations');
  assert(getStyle({ GEMINI_TTS_STYLE: 'x'.repeat(301) }) === false, 'overlong style is invalid');
  assert(getStyle({ GEMINI_TTS_STYLE: 'bad\nstyle' }) === false, 'control characters in style are invalid');
  assert(getVoice({}) === 'Kore', 'default voice is Kore');
  assert(getVoice({ GEMINI_TTS_VOICE: 'Puck' }) === 'Puck', 'prebuilt voice name accepted');
  assert(getVoice({ GEMINI_TTS_VOICE: 'voice_abc123' }) === 'voice_abc123', 'designed voice ID accepted');
  assert(getVoice({ GEMINI_TTS_VOICE: 'voices/amharic-narrator.01' }) === 'voices/amharic-narrator.01', 'library/resource-style voice ID accepted');
  assert(getVoice({ GEMINI_TTS_VOICE: 'bad voice!' }) === null, 'voice with spaces is rejected');
  // Style=none sends no annotation at all (stubbed upstream).
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini', GEMINI_TTS_STYLE: 'none' }, async function () {
    const originalFetch = global.fetch;
    let captured = null;
    global.fetch = async function (url, options) {
      captured = JSON.parse(options.body);
      return { ok: true, status: 200, headers: { get: function () { return null; } }, json: async function () { return { steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: pcmToWav(pcm, 24000).toString('base64') }] }] }; }, text: async function () { return ''; } };
    };
    try {
      const res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 200, 'style=none request succeeds');
      assert(!('annotations' in captured.input[0].content[0]), 'no annotation is sent when style is none');
    } finally {
      global.fetch = originalFetch;
    }
  });
  // Invalid style is a server misconfiguration, not a silent fallback.
  await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'gemini', GEMINI_TTS_STYLE: 'x'.repeat(301) }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'invalid style returns 500');
    assert(JSON.parse(res.body).error.code === 'voice_misconfigured', 'misconfigured error code for style');
  });
  console.log('13. Style steering and voice IDs passed');

  // 14. Amharic is never spoken locally without a genuine Amharic voice.
  // In Node there is no SpeechSynthesis and no voice list, so the guard
  // must report no_amharic_voice instead of falling through to local
  // speech (where a browser would substitute its default English voice).
  let guardError = null;
  let guardEnded = false;
  speak('ሰላም ዓለም', {
    language: 'am',
    onError: function (err) { guardError = err; },
    onEnd: function () { guardEnded = true; }
  });
  assert(guardError && guardError.code === 'no_amharic_voice', 'Amharic without a voice reports no_amharic_voice');
  assert(guardEnded, 'onEnd still fires after the guard');
  let englishError = null;
  let englishEnded = false;
  speak('Hello world', {
    language: 'en',
    onError: function (err) { englishError = err; },
    onEnd: function () { englishEnded = true; }
  });
  assert(englishError === null, 'English path does not hit the Amharic guard');
  assert(englishEnded, 'English onEnd fires');
  console.log('14. Amharic local-voice guard passed');

  // 15. Sec-MS-GEC tokens match the edge-tts Python reference exactly
  // (known-answer vectors generated from edge_tts.drm with fixed
  // timestamps). The token is deterministic per 5-minute window.
  const drmVectors = [
    [1700000000.0, '2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2'],
    [1763116800.0, 'B1B628A5DAD33E70-0681299B3A7CFC8DDAE085F0CDCC81AF6F92070F17D21E73D90A6AA74A6075C5'],
    [1799999999.0, '8DD724B1AF1AEBDA-7EAB32704E1EBDC4C7D8109CC130E2B31826441D7C07CA6E8118FBCE8902837E'],
    [1700000000.123456, '2CD23A2CA0B2595A-F3C846C370E05F9CC83ACC5F995C5F5D87A4D0F14CE8936A0F902E64099E38A2'],
    [0.0, '52BC7A17B50DFEC9-28C4394775C8751CD2F6859C030C06DB1489ACAB3B3A7651831FC26895177ED6']
  ];
  drmVectors.forEach(function (pair) {
    assert(edgeDrm.generateSecMsGec(pair[0]) === pair[1], 'DRM token matches reference for ' + pair[0]);
  });
  assert(edgeDrm.generateSecMsGec(1699999800.0) === edgeDrm.generateSecMsGec(1699999800.0 + 299.0), 'tokens are stable within a 5-minute window');
  assert(edgeDrm.generateSecMsGec(1699999800.0) !== edgeDrm.generateSecMsGec(1699999800.0 + 300.0), 'tokens change across a 5-minute boundary');
  console.log('15. Sec-MS-GEC vectors passed');

  // 16. Edge TTS message building and parsing
  assert(edgeTts.escapeXml('a & b <c> "d"') === 'a &amp; b &lt;c&gt; "d"', 'XML escaping matches edge-tts (& < > only)');
  assert(edgeTts.removeIncompatibleCharacters('a\u0001b\u000bc\td\ne') === 'a b c\td\ne', 'rejected control chars become spaces, tab/LF kept');
  assert(edgeTts.dateToString(new Date(Date.UTC(2026, 10, 14, 12, 30, 5))) === 'Sat Nov 14 2026 12:30:05 GMT+0000 (Coordinated Universal Time)', 'JS-style UTC date string');
  const cfg = edgeTts.buildConfigMessage();
  assert(cfg.indexOf('Path:speech.config') !== -1 && cfg.indexOf('audio-24khz-48kbitrate-mono-mp3') !== -1, 'config message requests 24kHz MP3');
  assert(cfg.indexOf('sentenceBoundaryEnabled":"true') !== -1, 'config message enables sentence boundaries');
  const ssml = edgeTts.buildSsml('am-ET-MekdesNeural', 'ሰላም');
  assert(ssml === "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='am-ET-MekdesNeural'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>ሰላም</prosody></voice></speak>", 'SSML shape matches the reference');
  const ssmlMsg = edgeTts.buildSsmlMessage('reqid123', ssml);
  assert(ssmlMsg.indexOf('X-RequestId:reqid123\r\n') === 0, 'SSML message starts with the request id');
  assert(ssmlMsg.indexOf('Content-Type:application/ssml+xml\r\n') !== -1, 'SSML message content type');
  assert(/X-Timestamp:.+Z\r\nPath:ssml\r\n\r\n/.test(ssmlMsg), 'SSML message timestamp carries the trailing Z quirk');
  const parsedText = edgeTts.parseTextMessage('X-RequestId:x\r\nPath:turn.end\r\n\r\n');
  assert(parsedText.headers.Path === 'turn.end', 'text frame Path parsed');
  const frame = buildAudioFrame(Buffer.from([9, 8, 7]));
  const parsedBin = edgeTts.parseBinaryMessage(frame);
  assert(!parsedBin.error, 'binary frame parses');
  assert(parsedBin.headers.Path === 'audio' && parsedBin.headers['Content-Type'] === 'audio/mpeg', 'binary frame headers parsed');
  assert(Buffer.from(parsedBin.data).equals(Buffer.from([9, 8, 7])), 'binary frame payload recovered exactly');
  assert(edgeTts.parseBinaryMessage(Buffer.from([0])).error, 'short binary frame rejected');
  assert(edgeTts.parseBinaryMessage(Buffer.from([0xFF, 0xFF, 1, 2])).error, 'impossible header length rejected');
  assert(edgeTts.getEdgeVoice({}) === 'am-ET-MekdesNeural', 'default Edge voice is Mekdes');
  assert(edgeTts.getEdgeVoice({ EDGE_TTS_VOICE: 'am-ET-AmehaNeural' }) === 'am-ET-AmehaNeural', 'Ameha accepted');
  assert(edgeTts.getEdgeVoice({ EDGE_TTS_VOICE: 'en-US-AriaNeural' }) === null, 'non-Amharic Edge voice rejected');
  assert(getProvider({}) === 'auto', 'default provider is auto');
  assert(getProvider({ VOICE_PROVIDER: 'EDGE' }) === 'edge', 'provider value is case-insensitive');
  assert(getProvider({ VOICE_PROVIDER: 'gemini' }) === 'gemini', 'gemini provider accepted');
  assert(getProvider({ VOICE_PROVIDER: 'bogus' }) === null, 'unknown provider rejected');
  console.log('16. Edge message building and parsing passed');

  // 17. Edge text splitting (4096 escaped bytes, word boundaries, UTF-8
  // and entity safe)
  const shortSplit = edgeTts.splitTextForEdge('ሰላም ዓለም', 4096);
  assert(shortSplit.length === 1 && shortSplit[0].toString('utf8') === 'ሰላም ዓለም', 'short text is one chunk');
  const longAmharic = 'ሰላም ዓለም '.repeat(500).trim();
  const amParts = edgeTts.splitTextForEdge(edgeTts.escapeXml(longAmharic), 4096);
  assert(amParts.length > 1, 'long Amharic text splits into several chunks');
  amParts.forEach(function (part) { assert(part.length <= 4096, 'no Edge chunk exceeds 4096 bytes'); });
  assert(amParts.map(function (p) { return p.toString('utf8'); }).join(' ') === longAmharic, 'Amharic chunks rejoin exactly (no split multi-byte chars)');
  const entityText = 'a & b <c> '.repeat(800).trim();
  const entityParts = edgeTts.splitTextForEdge(edgeTts.escapeXml(entityText), 4096);
  entityParts.forEach(function (part) { assert(part.length <= 4096, 'no entity chunk exceeds 4096 bytes'); });
  assert(entityParts.map(function (p) { return p.toString('utf8'); }).join(' ') === edgeTts.escapeXml(entityText), 'entity chunks rejoin exactly (no split entities)');
  assert(entityParts.every(function (p) { return !/&(amp|lt|gt)?$/.test(p.toString('utf8')) || /&(amp|lt|gt);$/.test(p.toString('utf8')); }), 'no chunk ends mid-entity');
  console.log('17. Edge text splitting passed');

  // 18. Edge client against a local mock service
  const mockOk = await startMockEdgeServer('ok');
  try {
    const audio = await edgeTts.synthesizeWithEdge({
      text: 'ሰላም፣ እንኳን ደህና መጡ።', voice: 'am-ET-MekdesNeural',
      timeoutMs: 5000, wsBaseUrl: mockOk.url
    });
    assert(Buffer.isBuffer(audio), 'Edge synthesis returns a Buffer');
    assert(audio.equals(Buffer.from([0xFF, 0xFB, 0x90, 0x00, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])), 'audio frames are concatenated in order');
    assert(mockOk.connections.length === 1, 'one connection per synthesis');
    const conn = mockOk.connections[0];
    assert(conn.url.indexOf('TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4') !== -1, 'trusted client token in URL');
    assert(/ConnectionId=[0-9a-f]{32}/.test(conn.url), 'connection id in URL');
    assert(/Sec-MS-GEC=[0-9A-F]{16}-[0-9A-F]{64}/.test(conn.url), 'Sec-MS-GEC token in URL');
    assert(conn.url.indexOf('Sec-MS-GEC-Version=2-') !== -1, 'Sec-MS-GEC version in URL');
    assert(conn.headers.origin === 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold', 'Edge extension origin header sent');
    assert(/^muid=[0-9A-F]{32};$/.test(conn.headers.cookie || ''), 'muid cookie sent');
    assert((conn.headers['user-agent'] || '').indexOf('Edg/143') !== -1, 'Edge user agent sent');
    assert(mockOk.messages.length === 2, 'config + SSML messages sent');
    assert(mockOk.messages[0].indexOf('Path:speech.config') !== -1, 'first message is the config');
    assert(mockOk.messages[1].indexOf("name='am-ET-MekdesNeural'") !== -1, 'SSML names the Mekdes voice');
    assert(mockOk.messages[1].indexOf('ሰላም፣ እንኳን ደህና መጡ።') !== -1, 'SSML carries the Amharic text verbatim');
  } finally {
    await mockOk.close();
  }
  const mockAmeha = await startMockEdgeServer('ok');
  try {
    await edgeTts.synthesizeWithEdge({ text: 'a & b <c>', voice: 'am-ET-AmehaNeural', timeoutMs: 5000, wsBaseUrl: mockAmeha.url });
    assert(mockAmeha.messages[1].indexOf("name='am-ET-AmehaNeural'") !== -1, 'Ameha voice is used when configured');
    assert(mockAmeha.messages[1].indexOf('a &amp; b &lt;c&gt;') !== -1, 'SSML text is XML-escaped');
    assert(mockAmeha.messages[1].indexOf('a & b') === -1, 'raw & never reaches the SSML');
  } finally {
    await mockAmeha.close();
  }
  const mockNoAudio = await startMockEdgeServer('no-audio');
  try {
    let threw = null;
    try {
      await edgeTts.synthesizeWithEdge({ text: 'ሰላም', timeoutMs: 5000, wsBaseUrl: mockNoAudio.url });
    } catch (e) { threw = e; }
    assert(threw && threw.code === 'edge_empty_audio', 'turn.end without audio reports edge_empty_audio');
  } finally {
    await mockNoAudio.close();
  }
  const mockClose = await startMockEdgeServer('close');
  try {
    let threw = null;
    try {
      await edgeTts.synthesizeWithEdge({ text: 'ሰላም', timeoutMs: 5000, wsBaseUrl: mockClose.url });
    } catch (e) { threw = e; }
    assert(threw && threw.code === 'edge_unreachable', 'dropped socket reports edge_unreachable');
  } finally {
    await mockClose.close();
  }
  const mockSilent = await startMockEdgeServer('silent');
  try {
    let threw = null;
    try {
      await edgeTts.synthesizeWithEdge({ text: 'ሰላም', timeoutMs: 600, wsBaseUrl: mockSilent.url });
    } catch (e) { threw = e; }
    assert(threw && threw.code === 'edge_timeout', 'silent service reports edge_timeout');
  } finally {
    await mockSilent.close();
  }
  console.log('18. Edge client against mock service passed');

  // 19. A 403 handshake corrects clock skew from the server Date header
  // and retries once (reference behaviour).
  {
    let attempts = 0;
    const skewServer = new WSServer({
      host: '127.0.0.1', port: 0,
      verifyClient: function (info, cb) {
        attempts += 1;
        if (attempts === 1) {
          cb(false, 403, 'Forbidden', { Date: new Date(Date.now() + 3600000).toUTCString() });
          return;
        }
        cb(true);
      }
    });
    await new Promise(function (resolve) { skewServer.on('listening', resolve); });
    const skewUrl = 'ws://127.0.0.1:' + skewServer.address().port + '/edge/v1';
    skewServer.on('connection', function (socket) {
      socket.on('message', function (data) {
        if (data.toString('utf8').indexOf('Path:ssml') !== -1) {
          socket.send(buildAudioFrame(Buffer.from([1, 2, 3])));
          socket.send('X-RequestId:test\r\nPath:turn.end\r\n\r\n');
        }
      });
    });
    try {
      edgeDrm.resetClockSkew();
      const audio = await edgeTts.synthesizeWithEdge({ text: 'ሰላም', timeoutMs: 5000, wsBaseUrl: skewUrl });
      assert(attempts === 2, '403 is retried exactly once');
      assert(audio.equals(Buffer.from([1, 2, 3])), 'retry after skew correction succeeds');
      const skew = edgeDrm.getClockSkew();
      assert(Math.abs(skew - 3600) < 60, 'clock skew corrected from server Date (got ' + skew + ')');
    } finally {
      edgeDrm.resetClockSkew();
      await new Promise(function (done) { skewServer.close(function () { done(); }); });
    }
  }
  console.log('19. Clock-skew retry passed');

  // 20. Provider chain at the endpoint level
  const chainMock = await startMockEdgeServer('ok');
  try {
    // Auto + Edge up + no key: Edge serves, Gemini never touched.
    await withEnv({ GEMINI_API_KEY: undefined, EDGE_TTS_WS_URL: chainMock.url }, async function () {
      const originalFetch = global.fetch;
      global.fetch = async function () { throw new Error('Gemini must not be called when Edge succeeds'); };
      try {
        const res = mockRes();
        await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
        assert(res.statusCode === 200, 'auto + Edge up returns 200');
        assert(res.headers['Content-Type'] === 'audio/mpeg', 'Edge audio is MP3');
        assert(Buffer.isBuffer(res.body) && res.body.length === 14, 'MP3 bytes forwarded');
      } finally {
        global.fetch = originalFetch;
      }
    });
    // Auto + Edge down + Gemini key: Gemini fallback serves WAV.
    await withEnv({ GEMINI_API_KEY: 'test-key', EDGE_TTS_WS_URL: 'ws://127.0.0.1:1/edge' }, async function () {
      const originalFetch = global.fetch;
      let fetchCalled = 0;
      const stubWav = pcmToWav(pcm, 24000);
      global.fetch = async function () {
        fetchCalled += 1;
        return { ok: true, status: 200, headers: { get: function () { return null; } }, json: async function () { return { steps: [{ content: [{ type: 'audio', mime_type: 'audio/wav', data: stubWav.toString('base64') }] }] }; }, text: async function () { return ''; } };
      };
      try {
        const res = mockRes();
        await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
        assert(res.statusCode === 200, 'auto fallback returns 200');
        assert(res.headers['Content-Type'] === 'audio/wav', 'fallback audio is WAV');
        assert(res.body.equals(stubWav), 'fallback WAV bytes forwarded');
        assert(fetchCalled === 1, 'Gemini is called exactly once as fallback');
      } finally {
        global.fetch = originalFetch;
      }
    });
    // Auto + Edge down + no key: stable 502 with the Edge code.
    await withEnv({ GEMINI_API_KEY: undefined, EDGE_TTS_WS_URL: 'ws://127.0.0.1:1/edge' }, async function () {
      const res = mockRes();
      await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
      assert(res.statusCode === 502, 'auto with no working provider returns 502');
      assert(JSON.parse(res.body).error.code === 'edge_unreachable', 'Edge failure code surfaced');
    });
    // Edge-only + Edge down: no Gemini attempt even with a key.
    await withEnv({ GEMINI_API_KEY: 'test-key', VOICE_PROVIDER: 'edge', EDGE_TTS_WS_URL: 'ws://127.0.0.1:1/edge' }, async function () {
      const originalFetch = global.fetch;
      global.fetch = async function () { throw new Error('Gemini must not be called in edge-only mode'); };
      try {
        const res = mockRes();
        await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
        assert(res.statusCode === 502, 'edge-only failure returns 502');
        assert(JSON.parse(res.body).error.code === 'edge_unreachable', 'edge-only error code');
      } finally {
        global.fetch = originalFetch;
      }
    });
  } finally {
    await chainMock.close();
  }
  // Misconfigurations are 500s, decided before any provider is attempted.
  await withEnv({ VOICE_PROVIDER: 'bogus', EDGE_TTS_WS_URL: 'ws://127.0.0.1:1/edge' }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'unknown provider returns 500');
    assert(JSON.parse(res.body).error.code === 'voice_misconfigured', 'misconfigured code for provider');
  });
  await withEnv({ EDGE_TTS_VOICE: 'en-US-AriaNeural', EDGE_TTS_WS_URL: 'ws://127.0.0.1:1/edge' }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'invalid Edge voice returns 500');
    assert(JSON.parse(res.body).error.code === 'voice_misconfigured', 'misconfigured code for Edge voice');
  });
  await withEnv({ EDGE_TTS_WS_URL: 'http://not-a-websocket-url' }, async function () {
    const res = mockRes();
    await handler({ method: 'POST', body: { text: 'ሰላም', language: 'am' } }, res);
    assert(res.statusCode === 500, 'invalid Edge WS URL returns 500');
    assert(JSON.parse(res.body).error.code === 'voice_misconfigured', 'misconfigured code for WS URL');
  });
  console.log('20. Provider chain passed');

  // 21. Voice guide transcript interpretation (pure helpers)
  assert(normalizeTranscript('Hello, World!') === 'hello world', 'transcript lowercased, punctuation stripped');
  assert(normalizeTranscript('ሰላም። እንዴት ነህ?') === 'ሰላም እንዴት ነህ', 'Amharic punctuation stripped');
  assert(normalizeTranscript('') === '', 'empty transcript normalizes to empty');
  assert(JSON.stringify(parseNumbers('1 and 3')) === '[1,3]', 'Latin digits parsed in order');
  assert(JSON.stringify(parseNumbers('option 2')) === '[2]', 'digit after a word parsed');
  assert(JSON.stringify(parseNumbers('three')) === '[3]', 'English number word parsed');
  assert(JSON.stringify(parseNumbers('one two three')) === '[1,2,3]', 'English number words parsed in order');
  assert(JSON.stringify(parseNumbers('ሁለት')) === '[2]', 'Amharic number word parsed');
  assert(JSON.stringify(parseNumbers('አሥር')) === '[10]', 'Amharic ten parsed');
  assert(JSON.stringify(parseNumbers('፫')) === '[3]', 'Ethiopic digit parsed');
  assert(JSON.stringify(parseNumbers('12')) === '[12]', 'multi-digit number parsed');
  assert(JSON.stringify(parseNumbers('hello world')) === '[]', 'no numbers returns empty');
  assert(matchGuideCommand('stop') === 'stop', 'stop command');
  assert(matchGuideCommand('please stop reading') === 'stop', 'stop wins with extra words');
  assert(matchGuideCommand('stop and go back') === 'stop', 'stop beats back');
  assert(matchGuideCommand('go back') === 'back', 'go back command');
  assert(matchGuideCommand('ተመለስ') === 'back', 'Amharic back command');
  assert(matchGuideCommand('repeat') === 'repeat', 'repeat command');
  assert(matchGuideCommand('say again please') === 'repeat', 'say again command');
  assert(matchGuideCommand('try again') === 'retry', 'try again is retry, not repeat');
  assert(matchGuideCommand('እንደገና ሞክር') === 'retry', 'Amharic retry command');
  assert(matchGuideCommand('እንደገና') === 'repeat', 'Amharic repeat command');
  assert(matchGuideCommand('help') === 'help', 'help command');
  assert(matchGuideCommand('እርዳታ') === 'help', 'Amharic help command');
  assert(matchGuideCommand('done') === 'done', 'done command');
  assert(matchGuideCommand('ተጠናቋል') === 'done', 'Amharic done command');
  assert(matchGuideCommand('skip this') === 'skip', 'skip command');
  assert(matchGuideCommand('ዝለል') === 'skip', 'Amharic skip command');
  assert(matchGuideCommand('hello world') === null, 'unknown guide command returns null');
  assert(matchGuideCommand('') === null, 'empty guide command returns null');
  const idOptions = [{ label: 'Kebele ID Card' }, { label: 'Passport' }, { label: 'Refugee ID / UNHCR' }];
  assert(matchOptionByWords('passport', idOptions) === 1, 'option matched by label word');
  assert(matchOptionByWords('kebele', idOptions) === 0, 'first option matched by label word');
  assert(matchOptionByWords('my refugee document', idOptions) === 2, 'option matched inside a longer answer');
  assert(matchOptionByWords('something else entirely', idOptions) === null, 'no label match returns null');
  const langOptions = [
    { value: 'en_standard', label: 'English (Standard)' },
    { value: 'en_simple', label: 'English (Simple with icons)' },
    { value: 'am_standard', label: 'አማርኛ (መደበኛ)' },
    { value: 'am_simple', label: 'አማርኛ (ቀላል አቀራረብ ከምስሎች ጋር)' }
  ];
  assert(matchOptionByWords('english', langOptions) === 0, 'English picks the first English option');
  assert(matchOptionByWords('amharic', langOptions) === 2, 'Amharic finds the Amharic-script option');
  assert(matchOptionByWords('አማርኛ', langOptions) === 2, 'Amharic script finds the Amharic option');
  assert(matchOptionByWords('እንግሊዝኛ', langOptions) === 0, 'English in Amharic script finds the English option');
  assert(wordsToDigits('two five one') === '251', 'spoken digits become a digit string');
  assert(wordsToDigits('251 912') === '251912', 'digit groups join');
  assert(wordsToDigits('አንድ ሁለት ሦስት') === '123', 'Amharic spoken digits convert');
  assert(wordsToDigits('zero seven') === '07', 'zero converts');
  assert(wordsToDigits('call me') === null, 'non-digit words return null');
  assert(wordsToDigits('two five x') === null, 'mixed words return null');
  assert(normalizeTextAnswer('two five one nine one two three four five six seven eight', 'tel') === '251912345678', 'spoken phone number converts');
  assert(normalizeTextAnswer('251 912 345 678', 'tel') === '251912345678', 'spaced phone number joins');
  assert(normalizeTextAnswer('+251912345678', 'tel') === '+251912345678', 'leading plus kept');
  assert(normalizeTextAnswer('john at gmail dot com', 'tel') === 'john@gmail.com', 'spoken email converts');
  assert(normalizeTextAnswer('my number is 251912345678', 'tel') === '251912345678', 'digits extracted from a sentence');
  assert(normalizeTextAnswer('Test User', 'text') === 'Test User', 'names left as spoken');
  assert(normalizeTextAnswer('  hello  ', 'text') === 'hello', 'answer trimmed');
  assert(normalizeTextAnswer('', 'text') === '', 'empty answer stays empty');
  assert(detectGuideLanguage('ሰላም', 'en') === 'am', 'Ethiopic text detected as Amharic');
  assert(detectGuideLanguage('Hello', 'am') === 'en', 'Latin text detected as English');
  assert(detectGuideLanguage('', 'am') === 'am', 'empty text falls back to the mount language');
  assert(detectGuideLanguage('123', 'am') === 'am', 'digits fall back to the mount language');
  console.log('21. Voice guide transcript interpretation passed');

  // 22. Recognition errors carry the raw error code as a second
  // argument, so the guide can tell a denied microphone from an
  // unsupported language. The module is imported fresh (query
  // parameter) with a stubbed SpeechRecognition, because it captures
  // the constructor at import time.
  {
    const behaviors = [];
    class FakeRecognition {
      start() {
        const behavior = behaviors.shift() || 'ok';
        const self = this;
        setTimeout(function () {
          if (behavior === 'not-allowed') {
            if (self.onerror) self.onerror({ error: 'not-allowed' });
            if (self.onend) self.onend(false);
          } else if (behavior === 'language-not-supported') {
            if (self.onerror) self.onerror({ error: 'language-not-supported' });
            if (self.onend) self.onend(false);
          } else {
            if (self.onresult) self.onresult({ results: [[{ transcript: 'hello there' }]] });
            if (self.onend) self.onend(true);
          }
        }, 0);
      }
      stop() {}
      abort() {}
    }
    const savedWindow = global.window;
    global.window = { SpeechRecognition: FakeRecognition };
    try {
      const voiceInput = await import('./src/features/voice-input.js?guide-test');
      assert(voiceInput.isVoiceSupported() === true, 'stubbed recognition is detected');
      behaviors.push('not-allowed');
      let denied = null;
      await new Promise(function (resolve) {
        voiceInput.startVoiceRecognition({
          language: 'en',
          onError: function (message, code) { denied = { message: message, code: code }; },
          onEnd: function () { resolve(); }
        });
      });
      assert(denied && denied.code === 'not-allowed', 'not-allowed code is passed (got ' + JSON.stringify(denied) + ')');
      assert(/denied/i.test(denied.message), 'denied message stays human-readable');
      behaviors.push('language-not-supported');
      let langErr = null;
      await new Promise(function (resolve) {
        voiceInput.startVoiceRecognition({
          language: 'am',
          onError: function (message, code) { langErr = { message: message, code: code }; },
          onEnd: function () { resolve(); }
        });
      });
      assert(langErr && langErr.code === 'language-not-supported', 'language-not-supported code is passed');
      behaviors.push('ok');
      let heard = null;
      await new Promise(function (resolve) {
        voiceInput.startVoiceRecognition({
          language: 'en',
          onResult: function (transcript) { heard = transcript; },
          onEnd: function () { resolve(); }
        });
      });
      assert(heard === 'hello there', 'transcript is still delivered');
    } finally {
      if (savedWindow === undefined) delete global.window;
      else global.window = savedWindow;
    }
  }
  console.log('22. Recognition error codes passed');

  // 23. Language-chooser matching and shared answer interpretation.
  // Regression: "Amharic standard" used to match "English (Standard)"
  // by word length and pick the wrong language (or no option at all
  // through voice commands). A spoken language name must win.
  {
    const langOptions = [
      { value: 'en_standard', label: 'English (Standard)' },
      { value: 'en_simple', label: 'English (Simple with icons)' },
      { value: 'am_standard', label: 'አማርኛ (መደበኛ)' },
      { value: 'am_simple', label: 'አማርኛ (ቀላል አቀራረብ ከምስሎች ጋር)' }
    ];
    assert(matchLanguageOption('Amharic standard', langOptions) === 2, 'Amharic standard picks the Amharic standard option');
    assert(matchLanguageOption('English standard', langOptions) === 0, 'English standard picks the English standard option');
    assert(matchLanguageOption('Amharic', langOptions) === 2, 'Amharic alone picks Amharic standard');
    assert(matchLanguageOption('English', langOptions) === 0, 'English alone picks English standard');
    assert(matchLanguageOption('English simple', langOptions) === 1, 'English simple picks the simple variant');
    assert(matchLanguageOption('አማርኛ ቀላል', langOptions) === 3, 'Amharic simple in Amharic picks the simple variant');
    assert(matchLanguageOption('አማርኛ መደበኛ', langOptions) === 2, 'Amharic standard in Amharic picks Amharic standard');
    assert(matchLanguageOption('kebele', langOptions) === null, 'no language name, no language match');
    assert(matchLanguageOption('Amharic', [{ label: 'Kebele ID Card' }, { label: 'Passport' }]) === null, 'non-language options are untouched');
    const b1 = { type: 'radio', options: langOptions };
    assert(interpretAnswer(b1, '3').index === 2, 'number wins on the language chooser');
    assert(interpretAnswer(b1, 'Amharic standard').index === 2, 'interpretAnswer routes Amharic standard to Amharic');
    assert(interpretAnswer(b1, 'English simple').index === 1, 'interpretAnswer routes English simple correctly');
    assert(interpretAnswer(b1, 'gibberish') === null, 'unrecognised radio answer returns null');
    assert(interpretAnswer(b1, '9') === null, 'out-of-range number is not an answer');
    const idQ = { type: 'radio', options: [{ label: 'Kebele ID Card' }, { label: 'Passport' }, { label: 'Refugee ID / UNHCR' }] };
    assert(interpretAnswer(idQ, 'passport').index === 1, 'radio answer matched by label word');
    const nameQ = { type: 'text', inputType: 'text' };
    assert(interpretAnswer(nameQ, 'Test User').value === 'Test User', 'text answer kept as spoken');
    assert(interpretAnswer(nameQ, '') === null, 'empty text answer returns null');
    const telQ = { type: 'text', inputType: 'tel' };
    assert(interpretAnswer(telQ, 'two five one nine').value === '2519', 'spoken phone digits normalized');
    const goalsQ = { type: 'checkbox', options: [{ label: 'Learn Amharic' }, { label: 'Find a job' }, { label: 'Learn English' }, { label: 'Meet people' }] };
    assert(JSON.stringify(interpretAnswer(goalsQ, '1 and 3').selection) === '[0,2]', 'checkbox numbers parsed');
    assert(interpretAnswer(goalsQ, 'all').selection === 'all', 'checkbox all');
    assert(interpretAnswer(goalsQ, 'none').selection === 'none', 'checkbox none');
    assert(JSON.stringify(interpretAnswer(goalsQ, 'find a job').selection) === '[1]', 'checkbox matched by label word');
    assert(interpretAnswer(goalsQ, 'done') === null, 'done is a command, not an answer');
    assert(interpretAnswer(goalsQ, 'nonsense words') === null, 'unrecognised checkbox answer returns null');
    assert(interpretAnswer(null, 'hello') === null, 'no question returns null');
    assert(interpretAnswer({ type: 'unknown' }, 'hello') === null, 'unknown question type returns null');
  }
  console.log('23. Language matching and answer interpretation passed');

  // 24. Continuous recognition: the microphone stays open — the
  // recognizer restarts after routine ends, delivers only new
  // results, swallows routine silence errors, and stops restarting
  // after a real error or an explicit stop. One-shot behaviour is
  // unchanged. Fresh import with a controllable fake, as in group 22.
  {
    const instances = [];
    class FakeRecognition {
      constructor() {
        this.starts = 0;
        this.continuous = false;
        instances.push(this);
      }
      start() {
        this.starts += 1;
        const self = this;
        setTimeout(function () { if (self.onstart) self.onstart(); }, 0);
      }
      stop() {}
      abort() {}
      fireResult(results, resultIndex) {
        if (this.onresult) this.onresult({ results: results, resultIndex: resultIndex });
      }
      fireError(code) {
        if (this.onerror) this.onerror({ error: code });
      }
      fireEnd() {
        if (this.onend) this.onend();
      }
    }
    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const savedWindow = global.window;
    global.window = { SpeechRecognition: FakeRecognition };
    try {
      const voiceInput = await import('./src/features/voice-input.js?continuous-test');
      // Continuous: routine end restarts.
      let ended1 = 0;
      const h1 = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true, onEnd: function () { ended1 += 1; }
      });
      await sleep(50);
      assert(instances[0].starts === 1, 'continuous recognition starts once');
      instances[0].fireEnd();
      await sleep(400);
      assert(instances[0].starts === 2, 'continuous recognition restarts after an end');
      assert(ended1 === 0, 'routine ends do not call onEnd in continuous mode');
      h1.stop();
      instances[0].fireEnd();
      await sleep(400);
      assert(instances[0].starts === 2, 'no restart after stop');
      assert(ended1 === 1, 'onEnd fires once after stop');
      // Continuous: only new results are delivered, interim skipped.
      const heard = [];
      const h2 = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onResult: function (t) { heard.push(t); }
      });
      await sleep(50);
      const rec2 = instances[instances.length - 1];
      const interim = [[{ transcript: 'half' }]];
      interim[0].isFinal = false;
      rec2.fireResult(interim, 0);
      rec2.fireResult([[{ transcript: 'old' }], [{ transcript: 'new one' }]], 1);
      assert(JSON.stringify(heard) === '["new one"]', 'only new final results delivered (got ' + JSON.stringify(heard) + ')');
      h2.stop();
      // Continuous: silence errors are swallowed, restart continues.
      let err3 = null;
      const h3 = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onError: function (m, c) { err3 = c; }
      });
      await sleep(50);
      const rec3 = instances[instances.length - 1];
      rec3.fireError('no-speech');
      assert(err3 === null, 'no-speech is swallowed in continuous mode');
      rec3.fireEnd();
      await sleep(400);
      assert(rec3.starts === 2, 'restart continues after a swallowed error');
      h3.stop();
      // Continuous: a real error is reported and stops the restart.
      let err4 = null;
      const h4 = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onError: function (m, c) { err4 = c; }
      });
      await sleep(50);
      const rec4 = instances[instances.length - 1];
      rec4.fireError('not-allowed');
      assert(err4 === 'not-allowed', 'real errors are still reported in continuous mode');
      rec4.fireEnd();
      await sleep(400);
      assert(rec4.starts === 1, 'no restart after a real error');
      h4.stop();
      // One-shot (default): no restart, onEnd fires.
      let ended5 = 0;
      voiceInput.startVoiceRecognition({
        language: 'en',
        onEnd: function () { ended5 += 1; }
      });
      await sleep(50);
      const rec5 = instances[instances.length - 1];
      rec5.fireEnd();
      await sleep(400);
      assert(rec5.starts === 1, 'one-shot recognition does not restart');
      assert(ended5 === 1, 'one-shot onEnd fires');
    } finally {
      if (savedWindow === undefined) delete global.window;
      else global.window = savedWindow;
    }
  }
  console.log('24. Continuous recognition passed');

  // 25. The spoken registration flow: "registration" opens onboarding,
  // and the completion message congratulates the user (both languages).
  assert(matchVoiceCommand('registration') && matchVoiceCommand('registration').view === 'onboarding', '"registration" opens onboarding');
  assert(matchVoiceCommand('register me') && matchVoiceCommand('register me').view === 'onboarding', '"register" opens onboarding');
  assert(matchVoiceCommand('onboarding') && matchVoiceCommand('onboarding').view === 'onboarding', '"onboarding" still opens onboarding');
  assert(t('guideComplete', 'en').indexOf('Congratulations') !== -1, 'English completion congratulates');
  assert(t('guideComplete', 'en').indexOf('Registration completed') !== -1, 'English completion still says registration completed');
  assert(t('guideComplete', 'am').indexOf('እንኳን ደስ አለዎት') !== -1, 'Amharic completion congratulates');
  console.log('25. Registration command and congratulations passed');

  // 26. The already-registered card (new in the team's latest base)
  // is read as its own screen state, so the guide and the command
  // prompt-speaker can announce it instead of ending silently.
  const fakeCard = {
    querySelector: function (sel) {
      if (sel === '.ik-already-title') return { textContent: 'You are already registered!' };
      if (sel === '.ik-already-message') return { textContent: 'An account already exists.' };
      return null;
    }
  };
  const fakeContent = {
    querySelector: function (sel) {
      return sel === '.ik-already-registered-card' ? fakeCard : null;
    }
  };
  const probeGuide = new VoiceGuide({ getContent: function () { return fakeContent; } });
  const alreadyState = probeGuide.readScreenState();
  assert(alreadyState.kind === 'already', 'already-registered card reads as already state');
  assert(alreadyState.title === 'You are already registered!', 'already state carries the card title');
  assert(alreadyState.message === 'An account already exists.', 'already state carries the card message');
  const emptyGuide = new VoiceGuide({ getContent: function () { return { querySelector: function () { return null; } }; } });
  assert(emptyGuide.readScreenState().kind === 'unknown', 'empty content reads as unknown');
  console.log('26. Already-registered screen state passed');

  // 27. Never-close listening: in continuous mode, recoverable
  // errors restart with backoff instead of ending the session, only
  // the two fatal codes are reported, repeated failures warn once
  // per episode, and start failures keep retrying. One-shot
  // behaviour is unchanged. Fresh import with a controllable fake.
  {
    const instances = [];
    let startThrowRemaining = 0;
    class FakeRecognition {
      constructor() {
        this.starts = 0;
        this.attempts = 0;
        this.continuous = false;
        instances.push(this);
      }
      start() {
        this.attempts += 1;
        if (startThrowRemaining > 0) {
          startThrowRemaining -= 1;
          throw new Error('recognition busy');
        }
        this.starts += 1;
        const self = this;
        setTimeout(function () { if (self.onstart) self.onstart(); }, 0);
      }
      stop() {}
      abort() {}
      fireError(code) {
        if (this.onerror) this.onerror({ error: code });
      }
      fireEnd() {
        if (this.onend) this.onend();
      }
    }
    const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    const savedWindow = global.window;
    global.window = { SpeechRecognition: FakeRecognition };
    try {
      const voiceInput = await import('./src/features/voice-input.js?never-close-test');
      // A network blip restarts the session; nothing is reported.
      let errNet = null;
      let endedNet = 0;
      const hNet = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onError: function (m, c) { errNet = c; },
        onEnd: function () { endedNet += 1; }
      });
      await sleep(50);
      const recNet = instances[instances.length - 1];
      recNet.fireError('network');
      recNet.fireEnd();
      await sleep(800);
      assert(errNet === null, 'network error is not reported in continuous mode');
      assert(endedNet === 0, 'network error does not end continuous mode');
      assert(recNet.starts === 2, 'network error restarts the session (starts=' + recNet.starts + ')');
      hNet.stop();
      // A burst of recoverable errors warns once, restarts once, and
      // warns again for a later burst after a successful start.
      let recurring = 0;
      let errBurst = null;
      const hBurst = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onError: function (m, c) { errBurst = c; },
        onRecurringError: function () { recurring += 1; }
      });
      await sleep(50);
      const recBurst = instances[instances.length - 1];
      for (let i = 0; i < 5; i++) recBurst.fireError('audio-capture');
      assert(recurring === 1, 'five repeated failures warn once (got ' + recurring + ')');
      recBurst.fireError('audio-capture');
      assert(recurring === 1, 'a sixth failure does not warn again');
      assert(errBurst === null, 'recoverable burst is not reported as fatal');
      await sleep(5600);
      assert(recBurst.starts === 2, 'burst schedules exactly one restart (starts=' + recBurst.starts + ')');
      for (let i = 0; i < 5; i++) recBurst.fireError('network');
      assert(recurring === 2, 'a later burst warns again after recovery');
      hBurst.stop();
      // An unsupported language is still reported and stops restarts.
      let errLang = null;
      const hLang = voiceInput.startVoiceRecognition({
        language: 'am', continuous: true,
        onError: function (m, c) { errLang = c; }
      });
      await sleep(50);
      const recLang = instances[instances.length - 1];
      recLang.fireError('language-not-supported');
      recLang.fireEnd();
      await sleep(400);
      assert(errLang === 'language-not-supported', 'unsupported language is reported');
      assert(recLang.starts === 1, 'no restart after an unsupported language');
      hLang.stop();
      // Start failures in continuous mode keep retrying until one
      // succeeds; nothing is reported.
      startThrowRemaining = 3;
      let errStart = null;
      const hStart = voiceInput.startVoiceRecognition({
        language: 'en', continuous: true,
        onError: function (m, c) { errStart = c; }
      });
      await sleep(2500);
      const recStart = instances[instances.length - 1];
      assert(recStart.starts === 1, 'start retries until success in continuous mode');
      assert(errStart === null, 'no start-failed in continuous mode');
      hStart.stop();
      // One-shot: start failures still report start-failed, and a
      // network error is still reported with no restart.
      startThrowRemaining = 99;
      let errOneShot = null;
      voiceInput.startVoiceRecognition({
        language: 'en',
        onError: function (m, c) { errOneShot = c; }
      });
      await sleep(1200);
      assert(errOneShot === 'start-failed', 'one-shot start failures still report start-failed');
      startThrowRemaining = 0;
      let errOneNet = null;
      let endedOneNet = 0;
      const hOneNet = voiceInput.startVoiceRecognition({
        language: 'en',
        onError: function (m, c) { errOneNet = c; },
        onEnd: function () { endedOneNet += 1; }
      });
      await sleep(50);
      const recOneNet = instances[instances.length - 1];
      recOneNet.fireError('network');
      recOneNet.fireEnd();
      await sleep(100);
      assert(errOneNet === 'network', 'one-shot network error is reported');
      assert(endedOneNet === 1, 'one-shot onEnd fires after the error');
      assert(recOneNet.starts === 1, 'one-shot does not restart after an error');
      hOneNet.stop();
    } finally {
      if (savedWindow === undefined) delete global.window;
      else global.window = savedWindow;
    }
  }
  console.log('27. Never-close listening passed');

  console.log('\n>>> ALL VOICE TESTS PASSED! <<<');
}

runTests().catch(function (err) {
  console.error('Voice test failed:', err);
  process.exit(1);
});
