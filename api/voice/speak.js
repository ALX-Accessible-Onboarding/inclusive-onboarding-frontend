'use strict';

/**
 * Vercel Serverless Function: /api/voice/speak
 *
 * Remote text-to-speech for Amharic, Somali, and Tigrinya. English
 * is never sent here: the frontend speaks English locally with
 * browser SpeechSynthesis. Afaan Oromoo has no voice in any
 * reachable service (no Edge voice; absent from the Gemini TTS
 * language list and the ElevenLabs v4 list, all verified
 * 2026-11-15) and is rejected, never spoken with another
 * language's voice. Tigrinya has no Edge voice either; it is
 * served by Gemini TTS only, which lists Tigrinya on its flagship
 * model (see the model note below).
 *
 *   GET  -> health check: { available, language: 'am',
 *           languages: ['am', 'so', 'ti'], provider, geminiConfigured }
 *           (no key is exposed)
 *   POST -> { text, language: 'am' | 'so' | 'ti' } -> audio (MP3 from
 *           Edge TTS, or WAV from Gemini TTS for fallback and for
 *           Tigrinya)
 *
 * Providers, in order (VOICE_PROVIDER env var, default 'auto'):
 *   - 'auto' (default): Microsoft Edge online TTS first — native Amharic
 *     voices (am-ET-MekdesNeural / am-ET-AmehaNeural) and native Somali
 *     voices (so-SO-UbaxNeural / so-SO-MuuseNeural), no API key needed.
 *     If Edge fails and a Gemini key is configured, Gemini TTS serves
 *     the request instead. Tigrinya skips Edge entirely (no voice) and
 *     goes straight to Gemini. If neither works, the caller gets a stable
 *     error, never silence and never an English voice.
 *   - 'edge': Edge TTS only (Amharic and Somali only).
 *   - 'gemini': Gemini TTS only (the original behaviour).
 *
 * Edge TTS is an unofficial service (it powers Edge's Read Aloud
 * feature); Microsoft can change it without notice. That is why the
 * Gemini fallback exists and why the provider chain is explicit here
 * rather than hidden. See api/voice/edge-tts.js and VOICE-ASSISTANT.md.
 *
 * Security rules enforced here:
 * - GEMINI_API_KEY is read only from server-side environment variables. It is
 *   never returned, logged, or placed in a URL (it travels in the
 *   x-goog-api-key header to Google only).
 * - Requests are validated: language must be Amharic, Somali, or
 *   Tigrinya, text is capped, and the model/voices come from server
 *   environment variables, never from the client.
 * - User text is never logged. Logs carry only method, status, provider
 *   and lengths.
 * - Upstream error bodies are never echoed back (they could leak details);
 *   callers get a stable { error: { code, message } } shape.
 *
 * CommonJS on purpose: this repo has no "type": "module" in package.json
 * (inject-savanna.js uses require()), so a .js Vercel function must be CJS.
 * Do not convert this file to ESM without also fixing the build contract.
 *
 * Gemini request shape (Gemini API Interactions API, speech generation;
 * verified against the official TTS guide on 2026-11-14):
 *   POST https://generativelanguage.googleapis.com/v1beta/interactions
 *   { model, input: [{ type: 'user_input',
 *       content: [{ type: 'text', text }] }],
 *     response_format: { type: 'audio' },
 *     generation_config: { speech_config: [{ voice: voiceName }] } }
 * The language is auto-detected from the text; no language field is
 * sent. Every request carries one short, constant speech_metadata style
 * annotation steering native delivery in the request's language (the
 * guide says style guides accent, pace and tone; the transcript itself
 * stays verbatim). Override it with GEMINI_TTS_STYLE, or set GEMINI_TTS_STYLE
 * to "none" to send no annotation. The stronger lever for accent is the
 * voice itself: GEMINI_TTS_VOICE accepts a prebuilt name (default Kore),
 * a Voice design/remix ID (voice_...), or an Extended Voice Library ID
 * (GET /v1beta/voices, filtered by language_code=am). The prebuilt studio
 * voices are cross-lingual and can sound American speaking Amharic; a
 * regional library voice matched to Amharic is the recommended fix when
 * the style steering alone is not enough. See VOICE-ASSISTANT.md and
 * scripts/list-amharic-voices.js.
 * requests return complete WAV (RIFF header, 24 kHz mono 16-bit PCM) by
 * default, so the bytes are forwarded as audio/wav. If a response ever
 * carries headerless PCM (audio/l16), it is wrapped in a WAV header here.
 *
 * Models: only the two current Gemini 3.8 TTS models are allowlisted.
 * Default: gemini-3.8-flash-lite-tts, the fast cost-efficient model the
 * guide recommends for read-aloud features and the replacement for
 * gemini-3.1-flash-tts-preview (shut down on the Gemini API on 17 Nov
 * 2026). Amharic is listed as supported by BOTH 3.8 models in the guide's
 * Supported languages table. Tigrinya and Somali are listed ONLY on the
 * flagship gemini-3.8-flash-tts (verified against the guide's table on
 * 2026-11-15), so a request in either language is always sent to the
 * flagship model, even when GEMINI_TTS_MODEL names the Lite model —
 * sending it to Lite would ask a model that does not list the language.
 * Older preview models are rejected: their request/response shapes differ
 * and their language support is not in the current guide. See
 * VOICE-ASSISTANT.md.
 */

var edgeTts = require('./edge-tts.js');

var ALLOWED_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts'
];
var DEFAULT_MODEL = 'gemini-3.8-flash-lite-tts';
var FLASH_MODEL = 'gemini-3.8-flash-tts';
// Languages the Gemini guide lists ONLY on the flagship model (see the
// header note). A request in one of these languages is always sent to
// the flagship model, whatever GEMINI_TTS_MODEL says.
var FLASH_ONLY_LANGUAGES = { ti: true, so: true };
var DEFAULT_VOICE = 'Kore';
// One short, constant style for every Amharic turn: the guide recommends a
// single short string reused across turns. It steers delivery only; the
// transcript is always sent verbatim.
var DEFAULT_STYLE = 'Native Ethiopian Amharic accent, natural pronunciation, clear and calm, speaking slowly at a natural pace that is easy to hear and understand.';
var TIGRINYA_STYLE = 'Native Tigrinya accent, natural pronunciation, clear and calm, speaking slowly at a natural pace that is easy to hear and understand.';
var SOMALI_STYLE = 'Native Somali accent, natural pronunciation, clear and calm, speaking slowly at a natural pace that is easy to hear and understand.';
var MAX_STYLE_LENGTH = 300;
var MAX_TEXT_LENGTH = 2000;
var MAX_BODY_LENGTH = 8192;
var UPSTREAM_TIMEOUT_MS = 25000;
var EDGE_TIMEOUT_MS = 12000;
var FALLBACK_TIMEOUT_MS = 12000;
// Hard budget for the whole provider chain (Edge + Gemini fallback).
// Must stay below the function's maxDuration (30s in vercel.json) with
// margin for the response to flush: if a provider hangs without ever
// settling, this race — not the platform kill — answers the caller.
var HANDLER_TIMEOUT_MS = 25000;
var INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function getModel(env) {
  var model = (env.GEMINI_TTS_MODEL || '').trim() || DEFAULT_MODEL;
  return ALLOWED_MODELS.indexOf(model) !== -1 ? model : null;
}

// The model for one language: the configured model, upgraded to the
// flagship model when the language is listed only there. Returns null
// when the configured model is not allowlisted (misconfiguration).
function getModelForLanguage(env, language) {
  var model = getModel(env);
  if (!model) return null;
  if (FLASH_ONLY_LANGUAGES[language] && model !== FLASH_MODEL) return FLASH_MODEL;
  return model;
}

function getVoice(env) {
  var voice = (env.GEMINI_TTS_VOICE || '').trim() || DEFAULT_VOICE;
  // Prebuilt names (Kore), designed/replicated IDs (voice_...), and
  // Extended Voice Library IDs / resource-style names. Sent only as a JSON
  // string, never in a URL, so dots and slashes are safe; spaces and
  // control characters are not.
  return /^[A-Za-z0-9][A-Za-z0-9._\/-]{0,127}$/.test(voice) ? voice : null;
}

// Returns the style string, null when annotations are disabled with
// GEMINI_TTS_STYLE=none, or false when the configured value is invalid.
function getStyle(env) {
  var raw = env.GEMINI_TTS_STYLE;
  if (raw === undefined || raw === null) return DEFAULT_STYLE;
  var style = String(raw).trim();
  if (!style) return DEFAULT_STYLE;
  if (style.toLowerCase() === 'none') return null;
  if (style.length > MAX_STYLE_LENGTH) return false;
  if (/[\u0000-\u001F\u007F]/.test(style)) return false; // single-line instruction: no control characters at all
  return style;
}

// The style for one language: an explicit GEMINI_TTS_STYLE (including
// 'none') always wins; otherwise the per-language default, so a
// Tigrinya or Somali turn is never steered with the Amharic accent
// instruction. Same return contract as getStyle.
function getStyleForLanguage(env, language) {
  var raw = env.GEMINI_TTS_STYLE;
  if (raw === undefined || raw === null || !String(raw).trim()) {
    if (language === 'ti') return TIGRINYA_STYLE;
    if (language === 'so') return SOMALI_STYLE;
    return DEFAULT_STYLE;
  }
  return getStyle(env);
}

function getApiKey(env) {
  var key = (env.GEMINI_API_KEY || '').trim();
  return key ? key : null;
}

// 'auto' (default), 'edge' or 'gemini'. Anything else is a misconfiguration.
function getProvider(env) {
  var provider = (env.VOICE_PROVIDER || '').trim().toLowerCase() || 'auto';
  if (provider === 'auto' || provider === 'edge' || provider === 'gemini') return provider;
  return null;
}

// Test/debug override for the Edge WebSocket endpoint. Must be a ws(s) URL
// when set; anything else is a misconfiguration. Unset in production.
function getEdgeWsUrl(env) {
  var url = (env.EDGE_TTS_WS_URL || '').trim();
  if (!url) return null;
  if (/^wss?:\/\//.test(url)) return url;
  return false;
}

function getEdgeVoice(env) {
  return edgeTts.getEdgeVoice(env);
}

function errorBody(code, message) {
  return JSON.stringify({ error: { code: code, message: message } });
}

function sendJson(res, status, body, extraHeaders) {
  var headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };
  if (extraHeaders) {
    Object.keys(extraHeaders).forEach(function (key) { headers[key] = extraHeaders[key]; });
  }
  res.writeHead(status, headers);
  res.end(body);
}

function sendError(res, status, code, message, extraHeaders) {
  sendJson(res, status, errorBody(code, message), extraHeaders);
}

/**
 * Validate a parsed request body. Returns { text, language } on success or
 * { error: { status, code, message } } on failure. Pure: unit-tested.
 */
function validateVoiceRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: { status: 400, code: 'voice_bad_request', message: 'Request body must be a JSON object.' } };
  }
  var language = typeof body.language === 'string' ? body.language.trim().toLowerCase() : '';
  // Remote voices exist for Amharic and Somali (Edge + Gemini) and for
  // Tigrinya (Gemini flagship only — no Edge voice; verified against
  // the live Edge voices list and the Gemini TTS language table on
  // 2026-11-15). Afaan Oromoo has no voice in any reachable service
  // and is rejected honestly instead of being spoken with another
  // language's voice. English is spoken locally in the browser.
  var resolved = null;
  if (language === 'am' || language === 'am-et') resolved = 'am';
  else if (language === 'so' || language === 'so-so') resolved = 'so';
  else if (language === 'ti' || language === 'ti-et') resolved = 'ti';
  if (!resolved) {
    return { error: { status: 400, code: 'voice_language_not_supported', message: 'Only Amharic (am), Somali (so), and Tigrinya (ti) are supported by this endpoint. English is spoken locally in the browser.' } };
  }
  if (typeof body.text !== 'string') {
    return { error: { status: 400, code: 'voice_bad_request', message: 'Field "text" must be a string.' } };
  }
  var text = body.text.trim();
  if (!text) {
    return { error: { status: 400, code: 'voice_bad_request', message: 'Field "text" must not be empty.' } };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return { error: { status: 400, code: 'voice_text_too_long', message: 'Field "text" must be at most ' + MAX_TEXT_LENGTH + ' characters.' } };
  }
  // Reject control characters (NUL etc.) other than tab / newline / CR.
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    return { error: { status: 400, code: 'voice_bad_request', message: 'Field "text" contains unsupported characters.' } };
  }
  return { text: text, language: resolved };
}

function parseSampleRate(mimeType) {
  var match = /rate=(\d+)/.exec(String(mimeType || ''));
  var rate = match ? parseInt(match[1], 10) : 24000;
  if (!rate || rate < 8000 || rate > 48000) return 24000;
  return rate;
}

// Find the audio block in an Interactions API response: the last
// steps[].content[] item with type 'audio' (per the guide, raw REST audio
// lives in steps[].content[].data). The SDK convenience field
// output_audio.data is accepted too. Returns { data, mimeType } or null.
function extractAudioData(interactionJson) {
  if (!interactionJson || typeof interactionJson !== 'object') return null;
  if (interactionJson.output_audio && typeof interactionJson.output_audio.data === 'string' && interactionJson.output_audio.data) {
    return { data: interactionJson.output_audio.data, mimeType: interactionJson.output_audio.mime_type || interactionJson.output_audio.mimeType || '' };
  }
  if (!Array.isArray(interactionJson.steps)) return null;
  var found = null;
  for (var i = 0; i < interactionJson.steps.length; i++) {
    var step = interactionJson.steps[i];
    if (!step || !Array.isArray(step.content)) continue;
    for (var j = 0; j < step.content.length; j++) {
      var item = step.content[j];
      if (item && item.type === 'audio' && typeof item.data === 'string' && item.data) {
        found = { data: item.data, mimeType: item.mime_type || item.mimeType || '' };
      }
    }
  }
  return found;
}

// Wrap raw PCM s16le mono samples in a 44-byte WAV header. Pure: unit-tested.
function pcmToWav(pcmBuffer, sampleRate) {
  var header = Buffer.alloc(44);
  var dataLength = pcmBuffer.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function parseBody(req) {
  var body = req.body;
  if (body === undefined || body === null) return null;
  if (typeof body === 'string') {
    if (body.length > MAX_BODY_LENGTH) return { tooLarge: true };
    if (!body.trim()) return null;
    try {
      return JSON.parse(body);
    } catch (e) {
      return { invalidJson: true };
    }
  }
  return body;
}

function logEvent(fields) {
  // Deliberately no user text, no key, no upstream body.
  console.log(JSON.stringify(Object.assign({ service: 'voice-speak' }, fields)));
}

function upstreamFailure(status, code, message, retryAfter) {
  var err = new Error(message);
  err.status = status;
  err.code = code;
  if (retryAfter) err.retryAfter = retryAfter;
  return err;
}

// Race a provider attempt against a REF'D timer: the timer is deliberately
// never unref'd, so on serverless runtimes it fires even if the provider's
// own socket and timers stall. The handler always answers within ms — a
// fast stable error — instead of hanging until the platform kills it.
// The losing promise is left to settle on its own; its socket cannot
// block the response once the race has decided.
function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    var timerId = setTimeout(function () {
      reject(upstreamFailure(502, 'voice_upstream_timeout',
        'The voice service timed out. Please try again.'));
    }, ms);
    promise.then(function (value) {
      clearTimeout(timerId);
      resolve(value);
    }, function (err) {
      clearTimeout(timerId);
      reject(err);
    });
  });
}

// Gemini TTS synthesis. Resolves with a WAV Buffer, or rejects with an
// upstreamFailure carrying the HTTP status and stable error code.
async function synthesizeWithGemini(options) {
  var textContent = { type: 'text', text: options.text };
  if (options.style) {
    textContent.annotations = [{ type: 'speech_metadata', style: options.style }];
  }

  var controller = new AbortController();
  var timeoutId = setTimeout(function () { controller.abort(); }, options.timeoutMs);
  var upstream;
  try {
    upstream = await fetch(INTERACTIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'x-goog-api-key': options.apiKey
      },
      body: JSON.stringify({
        model: options.model,
        input: [{ type: 'user_input', content: [textContent] }],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [{ voice: options.voice }]
        }
      }),
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    var timedOut = err && err.name === 'AbortError';
    throw upstreamFailure(502, timedOut ? 'voice_upstream_timeout' : 'voice_upstream_unreachable',
      'The voice service could not be reached. Please try again.');
  }
  clearTimeout(timeoutId);

  if (!upstream.ok) {
    var status = upstream.status;
    // Drain the body without logging or echoing it.
    try { await upstream.text(); } catch (e) {}
    if (status === 429) {
      var retryAfter = '30';
      try {
        var headerValue = upstream.headers && upstream.headers.get('retry-after');
        if (headerValue) {
          var seconds = parseInt(headerValue, 10);
          if (seconds > 0 && seconds <= 60) retryAfter = String(seconds);
        }
      } catch (e) {}
      throw upstreamFailure(429, 'voice_rate_limited',
        'The voice service is busy. Please wait and try again.', retryAfter);
    }
    var code = (status === 401 || status === 403) ? 'voice_upstream_auth' : 'voice_upstream_error';
    throw upstreamFailure(502, code, 'The voice service could not speak that text. Please try again.');
  }

  var geminiJson;
  try {
    geminiJson = await upstream.json();
  } catch (e) {
    throw upstreamFailure(502, 'voice_upstream_bad_response', 'The voice service returned an unreadable response.');
  }

  var audio = extractAudioData(geminiJson);
  if (!audio) {
    throw upstreamFailure(502, 'voice_empty_audio', 'The voice service returned no audio for that text.');
  }

  var audioBuffer;
  try {
    audioBuffer = Buffer.from(audio.data, 'base64');
  } catch (e) {
    throw upstreamFailure(502, 'voice_upstream_bad_response', 'The voice service returned unreadable audio.');
  }
  if (audioBuffer.length === 0) {
    throw upstreamFailure(502, 'voice_empty_audio', 'The voice service returned no audio for that text.');
  }

  // Unary Interactions responses are complete WAV by default. Only wrap
  // headerless PCM when the MIME type says so; unknown headerless bytes
  // are reported as an error rather than guessed at.
  var isWav = audioBuffer.length >= 4 && audioBuffer.toString('ascii', 0, 4) === 'RIFF';
  var mimeType = String(audio.mimeType || '').toLowerCase();
  if (isWav) return audioBuffer;
  if (mimeType.indexOf('l16') !== -1 || mimeType.indexOf('pcm') !== -1) {
    return pcmToWav(audioBuffer, parseSampleRate(audio.mimeType));
  }
  throw upstreamFailure(502, 'voice_upstream_bad_response', 'The voice service returned audio in an unexpected format.');
}

function sendAudio(res, buffer, contentType, provider, startedAt, textLength) {
  logEvent({ method: 'POST', status: 200, provider: provider, durationMs: Date.now() - startedAt, textLength: textLength, audioBytes: buffer.length });
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(buffer);
}

async function handler(req, res) {
  var startedAt = Date.now();
  var method = (req.method || '').toUpperCase();
  var env = process.env;

  if (method === 'GET') {
    var provider = getProvider(env);
    var geminiReady = Boolean(getApiKey(env)) && Boolean(getModel(env)) && Boolean(getVoice(env)) && getStyle(env) !== false;
    var edgeReady = Boolean(getEdgeVoice(env));
    var available = Boolean(provider) && (provider === 'gemini' ? geminiReady : edgeReady);
    logEvent({ method: 'GET', status: 200, available: available, provider: provider || 'invalid' });
    sendJson(res, 200, JSON.stringify({
      available: available,
      language: 'am',
      languages: ['am', 'so', 'ti'],
      provider: provider || 'auto',
      geminiConfigured: geminiReady
    }));
    return;
  }

  if (method !== 'POST') {
    res.writeHead(405, { Allow: 'GET, POST', 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(errorBody('voice_method_not_allowed', 'Only GET and POST are supported.'));
    return;
  }

  var parsed = parseBody(req);
  if (parsed && parsed.tooLarge) {
    sendError(res, 413, 'voice_body_too_large', 'Request body is too large.');
    return;
  }
  if (parsed && parsed.invalidJson) {
    sendError(res, 400, 'voice_bad_request', 'Request body must be valid JSON.');
    return;
  }
  var validated = validateVoiceRequest(parsed);
  if (validated.error) {
    logEvent({ method: 'POST', status: validated.error.status, code: validated.error.code });
    sendError(res, validated.error.status, validated.error.code, validated.error.message);
    return;
  }

  var providerName = getProvider(env);
  var edgeVoice = edgeTts.getEdgeVoiceFor(env, validated.language);
  var edgeWsUrl = getEdgeWsUrl(env);
  var usesEdge = providerName === 'auto' || providerName === 'edge';
  if (!providerName || edgeWsUrl === false) {
    logEvent({ method: 'POST', status: 500, code: 'voice_misconfigured' });
    sendError(res, 500, 'voice_misconfigured', 'The voice service is misconfigured on the server.');
    return;
  }

  var apiKey = getApiKey(env);
  var model = getModelForLanguage(env, validated.language);
  var voice = getVoice(env);
  var style = getStyleForLanguage(env, validated.language);
  var geminiReady = Boolean(apiKey) && Boolean(model) && Boolean(voice) && style !== false;

  // No Edge voice for this language (Tigrinya): in 'edge' mode that is
  // an honest rejection, in 'auto' mode Gemini is the only path and
  // must be configured, otherwise the caller would get a misleading
  // upstream error for what is really a missing key.
  if (usesEdge && !edgeVoice) {
    if (edgeTts.EDGE_VOICES_BY_LANG[validated.language]) {
      // The language HAS Edge voices, so a null voice means the env
      // override names a voice from another language: misconfigured,
      // exactly as before.
      logEvent({ method: 'POST', status: 500, code: 'voice_misconfigured' });
      sendError(res, 500, 'voice_misconfigured', 'The voice service is misconfigured on the server.');
      return;
    }
    if (providerName === 'edge') {
      logEvent({ method: 'POST', status: 400, code: 'voice_language_not_supported' });
      sendError(res, 400, 'voice_language_not_supported', 'Edge TTS has no voice for this language. Use the default provider setting or Gemini mode.');
      return;
    }
    if (!geminiReady) {
      logEvent({ method: 'POST', status: 503, code: 'voice_not_configured', textLength: validated.text.length });
      sendError(res, 503, 'voice_not_configured', 'The voice service is not configured on the server (GEMINI_API_KEY is missing).');
      return;
    }
  }

  // Gemini-only mode serves every language the endpoint accepts: the
  // Gemini TTS guide lists Amharic on both 3.8 models and Tigrinya
  // and Somali on the flagship model (verified 2026-11-15), and the
  // per-language model/style selection above routes each request to
  // the model and accent instruction that cover it.
  if (providerName === 'gemini') {
    if (!apiKey) {
      logEvent({ method: 'POST', status: 503, code: 'voice_not_configured', textLength: validated.text.length });
      sendError(res, 503, 'voice_not_configured', 'The voice service is not configured on the server (GEMINI_API_KEY is missing).');
      return;
    }
    if (!model || !voice || style === false) {
      logEvent({ method: 'POST', status: 500, code: 'voice_misconfigured' });
      sendError(res, 500, 'voice_misconfigured', 'The voice service is misconfigured on the server.');
      return;
    }
    try {
      var wav = await synthesizeWithGemini({
        text: validated.text, apiKey: apiKey, model: model, voice: voice,
        style: style, timeoutMs: UPSTREAM_TIMEOUT_MS
      });
      sendAudio(res, wav, 'audio/wav', 'gemini', startedAt, validated.text.length);
    } catch (err) {
      logEvent({ method: 'POST', status: err.status || 502, code: err.code || 'voice_upstream_error', provider: 'gemini', durationMs: Date.now() - startedAt, textLength: validated.text.length });
      sendError(res, err.status || 502, err.code || 'voice_upstream_error', err.message,
        err.retryAfter ? { 'Retry-After': err.retryAfter } : null);
    }
    return;
  }

  // Edge first; Gemini fallback in 'auto' mode when a key is configured.
  // The whole chain runs under one hard timeout (HANDLER_TIMEOUT_MS): if
  // a provider hangs without settling — Edge TTS never answered from
  // Vercel's network on 2026-11-14 and the request hung until Vercel
  // killed the function at maxDuration — the caller still gets a fast,
  // stable error instead of silence.
  async function runProviders() {
    var edgeErr = null;
    var audio = null;
    var usedProvider = null;
    // Edge has no voice for Tigrinya: edgeVoice is null and the Edge
    // attempt is skipped entirely, never made with another
    // language's voice.
    if (edgeVoice) {
      try {
        audio = await edgeTts.synthesizeWithEdge({
          text: validated.text, voice: edgeVoice, timeoutMs: EDGE_TIMEOUT_MS, wsBaseUrl: edgeWsUrl
        });
        usedProvider = 'edge';
      } catch (err) {
        edgeErr = err;
      }
    }

    // Gemini fallback in 'auto' mode, for every language the endpoint
    // serves (the per-language model/style above route each language
    // to the model that lists it). For Tigrinya this is the only
    // path, and the guard above already required a configured key.
    if (!audio && providerName === 'auto' && geminiReady) {
      try {
        audio = await synthesizeWithGemini({
          text: validated.text, apiKey: apiKey, model: model, voice: voice,
          style: style, timeoutMs: FALLBACK_TIMEOUT_MS
        });
        usedProvider = 'gemini';
      } catch (err) {
        err.provider = 'gemini';
        err.edgeCode = edgeErr && edgeErr.code;
        throw err;
      }
    }

    if (!audio) {
      var err = upstreamFailure(502, (edgeErr && edgeErr.code) || 'edge_unreachable',
        (edgeErr && edgeErr.message) || 'The voice service could not be reached. Please try again.');
      err.provider = 'edge';
      throw err;
    }
    return { audio: audio, usedProvider: usedProvider };
  }

  var result;
  try {
    result = await withTimeout(runProviders(), HANDLER_TIMEOUT_MS);
  } catch (err) {
    logEvent({ method: 'POST', status: err.status || 502, code: err.code || 'voice_upstream_error', provider: err.provider || 'chain', edgeCode: err.edgeCode, durationMs: Date.now() - startedAt, textLength: validated.text.length });
    sendError(res, err.status || 502, err.code || 'voice_upstream_error', err.message,
      err.retryAfter ? { 'Retry-After': err.retryAfter } : null);
    return;
  }

  sendAudio(res, result.audio, result.usedProvider === 'edge' ? 'audio/mpeg' : 'audio/wav', result.usedProvider, startedAt, validated.text.length);
}

module.exports = handler;
module.exports.handler = handler;
module.exports.validateVoiceRequest = validateVoiceRequest;
module.exports.pcmToWav = pcmToWav;
module.exports.extractAudioData = extractAudioData;
module.exports.parseSampleRate = parseSampleRate;
module.exports.getVoice = getVoice;
module.exports.getStyle = getStyle;
module.exports.getModelForLanguage = getModelForLanguage;
module.exports.getStyleForLanguage = getStyleForLanguage;
module.exports.TIGRINYA_STYLE = TIGRINYA_STYLE;
module.exports.SOMALI_STYLE = SOMALI_STYLE;
module.exports.FLASH_MODEL = FLASH_MODEL;
module.exports.getProvider = getProvider;
module.exports.getEdgeWsUrl = getEdgeWsUrl;
module.exports.withTimeout = withTimeout;
module.exports.HANDLER_TIMEOUT_MS = HANDLER_TIMEOUT_MS;
module.exports.DEFAULT_VOICE = DEFAULT_VOICE;
module.exports.DEFAULT_STYLE = DEFAULT_STYLE;
module.exports.ALLOWED_MODELS = ALLOWED_MODELS;
module.exports.DEFAULT_MODEL = DEFAULT_MODEL;
module.exports.MAX_TEXT_LENGTH = MAX_TEXT_LENGTH;
