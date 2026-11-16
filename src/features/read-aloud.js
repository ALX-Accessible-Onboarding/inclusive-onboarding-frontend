// Read-aloud wrapper with strict language synchronization.
//
// English: browser-native SpeechSynthesis, kept local (nothing is sent anywhere).
// Amharic, Somali, and Tigrinya: the server endpoint /api/voice/speak
// (Edge TTS native voices first for Amharic and Somali, Gemini TTS as
// fallback when configured; Tigrinya via Gemini only — no Edge voice),
// but only when the user has consented (see getVoiceConsent/
// setVoiceConsent). Without consent, they fall back to the pre-existing
// local behaviour: an utterance with the language tag and NO English
// voice assigned. A remote failure falls back to local speech only when
// a real voice for the language exists on the device; it never silently
// uses an English voice for non-English text. Afaan Oromoo has no remote
// voice in any reachable service (verified 2026-11-15): it speaks only
// through a genuine local voice, and otherwise reports honestly that no
// voice is available.
//
// This module is the single speech-output path for the kit. Do not add a second
// voice system elsewhere; the voice assistant (voice-assistant.js) calls speak()
// here and adds page-text extraction, consent UI, announcements and commands.
import { translateToAmharic, isEnglishLabelText } from '../labels.js';

// Display names for the no-voice error message. English needs none:
// English always has the browser's default voice.
const LANGUAGE_NAMES = {
  am: 'Amharic',
  so: 'Somali',
  om: 'Afaan Oromoo',
  ti: 'Tigrinya'
};

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let activeUtterance = null;
let cachedVoices = [];

export function getAvailableVoices() {
  if (!isSpeechSupported()) return [];
  const voices = synth.getVoices() || [];
  if (voices.length > 0) {
    cachedVoices = voices;
  }
  return cachedVoices.length > 0 ? cachedVoices : voices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  getAvailableVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = getAvailableVoices;
  }
}

/* ------------------------------------------------------------------ */
/* Remote Amharic speech state (Edge TTS / Gemini via /api/voice/speak) */
/* ------------------------------------------------------------------ */

let voiceEndpoint = '/api/voice/speak';
let remoteToken = 0;
let remoteAudio = null;
let remoteAbort = null;
let remoteObjectUrl = null;
let remoteSpeaking = false;
let remotePlaybackResolve = null;
let allowOnce = false;

export const VOICE_CONSENT_KEY = 'ik_voice_consent';

export function isRemoteVoiceSupported() {
  return typeof fetch !== 'undefined'
    && typeof Audio !== 'undefined'
    && typeof URL !== 'undefined'
    && typeof URL.createObjectURL === 'function';
}

export function configureVoice(options) {
  if (!options || typeof options.endpoint !== 'string') return;
  const endpoint = options.endpoint.trim();
  // Same-origin relative path, or an explicit https URL (cross-origin embed),
  // or http only for local development hosts. Anything else is ignored.
  if (/^\/(?!\/)/.test(endpoint)
    || /^https:\/\//.test(endpoint)
    || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(endpoint)) {
    voiceEndpoint = endpoint;
  }
}

export function getVoiceEndpoint() {
  return voiceEndpoint;
}

// Consent is stored for the browser session only (sessionStorage). 'once'
// is kept in memory and consumed by the next remote utterance. Nothing about
// consent is sent to the server; the server never sees this value.
export function getVoiceConsent() {
  try {
    const value = sessionStorage.getItem(VOICE_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch (e) {
    return null;
  }
}

export function setVoiceConsent(value) {
  if (value === 'once') {
    allowOnce = true;
    return;
  }
  allowOnce = false;
  try {
    if (value === 'granted' || value === 'denied') {
      sessionStorage.setItem(VOICE_CONSENT_KEY, value);
    } else {
      sessionStorage.removeItem(VOICE_CONSENT_KEY);
    }
  } catch (e) {}
}

function remoteConsentAllows(opts) {
  if (opts && opts.consent === 'granted') return true;
  if (opts && opts.consent === 'once') return true;
  if (allowOnce) return true;
  return getVoiceConsent() === 'granted';
}

function consumeOnceConsent(opts) {
  const sessionGranted = getVoiceConsent() === 'granted';
  const optsGranted = Boolean(opts && opts.consent === 'granted');
  if (!sessionGranted && !optsGranted) allowOnce = false;
}

// GET the voice endpoint's health response. Distinguishes three states the
// UI must explain differently: endpoint missing (static server, no function),
// endpoint present but the configured provider unavailable, and ready.
// Never sends text.
export function checkVoiceService() {
  if (typeof fetch === 'undefined') {
    return Promise.resolve({ reachable: false, configured: false, reason: 'fetch_unsupported' });
  }
  let controller = null;
  let timeoutId = null;
  const fetchOptions = { method: 'GET', headers: { Accept: 'application/json' } };
  if (typeof AbortController !== 'undefined') {
    controller = new AbortController();
    fetchOptions.signal = controller.signal;
    timeoutId = setTimeout(function () { controller.abort(); }, 5000);
  }
  return fetch(getVoiceEndpoint(), fetchOptions)
    .then(function (res) {
      if (timeoutId) clearTimeout(timeoutId);
      if (!res.ok) {
        return { reachable: res.status !== 404, configured: false, status: res.status, reason: 'endpoint_error' };
      }
      return res.text().then(function (bodyText) {
        let data = null;
        try { data = JSON.parse(bodyText); } catch (e) { data = null; }
        if (data && typeof data.available === 'boolean') {
          return {
            reachable: true,
            configured: data.available,
            geminiConfigured: data.geminiConfigured === true,
            languages: Array.isArray(data.languages) ? data.languages : null,
            reason: data.available ? 'ready' : 'not_configured'
          };
        }
        // A 200 HTML page means a static server answered, not the function.
        return { reachable: false, configured: false, reason: 'endpoint_missing' };
      });
    })
    .catch(function () {
      if (timeoutId) clearTimeout(timeoutId);
      return { reachable: false, configured: false, reason: 'unreachable' };
    });
}

// Split long text into sentence-sized chunks for the remote API (which caps
// request length). Splits on '.', '!', '?', ':' and the Ethiopic full stop
// U+1362, then packs sentences greedily. Pure function: unit-tested.
export function splitTextForSpeech(text, maxChars) {
  const max = maxChars || 1200;
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = [];
  let start = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean.charAt(i);
    const isEnd = ch === '.' || ch === '!' || ch === '?' || ch === ':' || ch === '።' || ch === ';';
    const nextIsSpace = i + 1 >= clean.length || clean.charAt(i + 1) === ' ';
    if (isEnd && nextIsSpace) {
      sentences.push(clean.slice(start, i + 1).trim());
      start = i + 1;
    }
  }
  const tail = clean.slice(start).trim();
  if (tail) sentences.push(tail);

  const chunks = [];
  let current = '';
  sentences.forEach(function (sentence) {
    if (sentence.length > max) {
      // One very long sentence: hard-split on word boundaries.
      if (current) { chunks.push(current); current = ''; }
      const words = sentence.split(' ');
      words.forEach(function (word) {
        while (word.length > max) {
          if (current) { chunks.push(current); current = ''; }
          chunks.push(word.slice(0, max));
          word = word.slice(max);
        }
        if ((current + ' ' + word).trim().length > max && current) {
          chunks.push(current);
          current = word;
        } else {
          current = (current + ' ' + word).trim();
        }
      });
      return;
    }
    if (current && (current + ' ' + sentence).length > max) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  });
  if (current) chunks.push(current);
  return chunks;
}

// Defence in depth for remote requests only: email addresses and long digit
// runs (phone / ID-like numbers) are replaced before anything is sent. The
// page-text extractor already excludes profile values and form values; this
// catches stray numbers inside otherwise safe UI text.
export function redactSensitivePatterns(text) {
  return String(text || '')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '…')
    .replace(/\+?\d[\d\s\-/]{5,}\d/g, '…');
}

function stopRemote() {
  remoteToken += 1;
  remoteSpeaking = false;
  if (remoteAbort) {
    try { remoteAbort.abort(); } catch (e) {}
    remoteAbort = null;
  }
  if (remotePlaybackResolve) {
    const resolve = remotePlaybackResolve;
    remotePlaybackResolve = null;
    resolve();
  }
  if (remoteAudio) {
    try { remoteAudio.pause(); } catch (e) {}
    remoteAudio.onended = null;
    remoteAudio.onerror = null;
    try { remoteAudio.removeAttribute('src'); remoteAudio.load(); } catch (e) {}
    remoteAudio = null;
  }
  if (remoteObjectUrl) {
    try { URL.revokeObjectURL(remoteObjectUrl); } catch (e) {}
    remoteObjectUrl = null;
  }
}

export function stopSpeaking() {
  if (isSpeechSupported()) {
    try {
      synth.cancel();
      activeUtterance = null;
    } catch (e) {}
  }
  // Remote audio must stop even in browsers without SpeechSynthesis.
  stopRemote();
}

export function isSpeaking() {
  if (remoteSpeaking) return true;
  return isSpeechSupported() && synth.speaking;
}

/**
 * Automatically detects the appropriate BCP-47 language tag.
 * @param {string} text - text to be spoken
 * @param {string} [specifiedLang] - language code requested by user/caller ('am', 'en', etc.)
 * @returns {string} normalized BCP-47 tag (e.g. 'am-ET', 'en-US')
 */
export function detectLanguage(text, specifiedLang) {
  if (specifiedLang) {
    const clean = String(specifiedLang).toLowerCase().trim();
    if (clean === 'am' || clean.startsWith('am-') || clean.startsWith('am_')) {
      return 'am-ET';
    }
    if (clean === 'so' || clean.startsWith('so-') || clean.startsWith('so_')) {
      return 'so-SO';
    }
    if (clean === 'om' || clean.startsWith('om-') || clean.startsWith('om_')) {
      return 'om-ET';
    }
    if (clean === 'ti' || clean.startsWith('ti-') || clean.startsWith('ti_')) {
      return 'ti-ET';
    }
    if (clean === 'en' || clean.startsWith('en-') || clean.startsWith('en_')) {
      return 'en-US';
    }
    return specifiedLang;
  }
  // Auto-detect Ethiopic script in text. Ethiopic is shared by
  // Amharic and Tigrinya, so script alone cannot tell them apart:
  // Tigrinya content must pass its language explicitly, and
  // unlabelled Ethiopic text stays Amharic, as before.
  if (text && /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(text)) {
    return 'am-ET';
  }
  return 'en-US';
}

/**
 * Searches available browser voices for the best match for the target language.
 * @param {string} langCode - target BCP-47 tag ('am-ET', 'en-US', etc.)
 * @returns {SpeechSynthesisVoice|null}
 */
export function findVoiceForLanguage(langCode) {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  const target = langCode.toLowerCase().replace('_', '-');
  const base = target.split('-')[0];

  // 1. Exact match e.g. 'am-ET'
  let matched = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === target);
  if (matched) return matched;

  // 2. Base language prefix match e.g. starts with 'am'
  matched = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
  if (matched) return matched;

  // 3. Name-based search for voices whose lang tag does not match
  // (some engines, e.g. eSpeak on Android, report a name like
  // "Tigrinya" with an unexpected tag). Only the requested
  // language's own names match — never another language's voice.
  if (base === 'am') {
    matched = voices.find(v => /amharic|ethiopia/i.test(v.name));
    if (matched) return matched;
  } else if (base === 'so') {
    matched = voices.find(v => /somali|soomaali/i.test(v.name));
    if (matched) return matched;
  } else if (base === 'om') {
    matched = voices.find(v => /oromo|oromoo|afaan/i.test(v.name));
    if (matched) return matched;
  } else if (base === 'ti') {
    matched = voices.find(v => /tigrinya|tigri|ትግርኛ/i.test(v.name));
    if (matched) return matched;
  }

  return null;
}

function voiceError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function speakLocally(finalText, targetLang, opts) {
  const utterance = new SpeechSynthesisUtterance(finalText);
  activeUtterance = utterance;

  utterance.lang = targetLang;
  utterance.rate = 0.95; // slightly slower for better accessibility and comprehension
  utterance.pitch = 1.0;

  // Assign appropriate voice matching target language
  const matchedVoice = findVoiceForLanguage(targetLang);
  if (matchedVoice) {
    try {
      utterance.voice = matchedVoice;
    } catch (err) {
      // A browser that rejects the voice object must not kill read-aloud;
      // the utterance still carries the correct lang for engine fallback.
    }
  } else if (targetLang.startsWith('am')) {
    // If no specific Amharic voice is bundled, keep utterance.lang = 'am-ET'
    // Do NOT assign an English voice to Amharic text!
    // The browser engine will synthesize using its language fallback or OS provider.
  }

  utterance.onstart = function () {
    if (opts.onStart) opts.onStart();
  };

  utterance.onend = function () {
    activeUtterance = null;
    if (opts.onEnd) opts.onEnd();
  };

  utterance.onerror = function (event) {
    activeUtterance = null;
    if (opts.onError) opts.onError(event);
    if (opts.onEnd) opts.onEnd();
  };

  try {
    synth.speak(utterance);
  } catch (err) {
    activeUtterance = null;
    if (opts.onError) opts.onError(err);
    if (opts.onEnd) opts.onEnd();
  }
}

function playRemoteChunk(blob, token) {
  return new Promise(function (resolve, reject) {
    if (token !== remoteToken) { resolve(false); return; }
    const objectUrl = URL.createObjectURL(blob);
    remoteObjectUrl = objectUrl;
    const audio = new Audio();
    remoteAudio = audio;
    audio.src = objectUrl;
    audio.onended = function () {
      remotePlaybackResolve = null;
      resolve(true);
    };
    audio.onerror = function () {
      remotePlaybackResolve = null;
      reject(voiceError('audio_playback_failed', 'Remote audio could not be played.'));
    };
    remotePlaybackResolve = function () { resolve(false); };
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function (err) {
        remotePlaybackResolve = null;
        reject(voiceError('audio_blocked', 'Audio playback was blocked by the browser. ' + (err && err.message ? err.message : '')));
      });
    }
  });
}

async function speakViaRemote(finalText, opts) {
  const token = remoteToken + 1;
  remoteToken = token;
  // The remote language is the one speak() resolved (Amharic,
  // Somali, or Tigrinya — the only languages with a remote voice).
  // It comes from the caller's specified language, never from
  // guessing the text.
  const remoteLang = detectLanguage(finalText, opts.language).split('-')[0];
  const chunks = splitTextForSpeech(redactSensitivePatterns(finalText));
  let started = false;
  let playedAny = false;

  try {
    for (let i = 0; i < chunks.length; i++) {
      if (token !== remoteToken) return; // stopped
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      remoteAbort = controller;
      const timeoutId = controller ? setTimeout(function () { controller.abort(); }, 25000) : null;
      let res;
      try {
        res = await fetch(getVoiceEndpoint(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'audio/*, application/json' },
          body: JSON.stringify({ text: chunks[i], language: remoteLang }),
          signal: controller ? controller.signal : undefined
        });
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        if (remoteAbort === controller) remoteAbort = null;
      }
      if (token !== remoteToken) return; // stopped while fetching
      if (!res.ok) {
        let code = 'voice_request_failed';
        try {
          const data = await res.json();
          if (data && data.error && data.error.code) code = data.error.code;
        } catch (e) {}
        throw voiceError(code, 'Voice service request failed with status ' + res.status + '.');
      }
      const blob = await res.blob();
      if (token !== remoteToken) return;
      if (!blob || blob.size === 0) {
        throw voiceError('voice_empty_audio', 'Voice service returned no audio.');
      }
      remoteSpeaking = true;
      if (!started) {
        started = true;
        if (opts.onStart) opts.onStart();
      }
      const played = await playRemoteChunk(blob, token);
      if (token !== remoteToken) return; // stopped during playback
      if (played) playedAny = true;
    }
    remoteSpeaking = false;
    if (opts.onEnd) opts.onEnd();
  } catch (err) {
    // If stopSpeaking() ran, the token has moved on and the caller already
    // reset its own state: stay silent. Otherwise clean up remote state
    // (which advances the token) and then report the failure below.
    if (token !== remoteToken) return;
    remoteSpeaking = false;
    stopRemote();
    // Graceful fallback, but ONLY to a genuine voice for the SAME
    // language on the device. The remote voice can fail for any
    // language (no key, network down, provider error), and when the
    // device itself has a voice for that language, speaking locally
    // is strictly better than silence. Never fall back to another
    // language's voice: Tigrinya text must never be read by an
    // Amharic voice, or Somali text by any voice but Somali.
    const fallbackTags = { am: 'am-ET', so: 'so-SO', ti: 'ti-ET' };
    const fallbackTag = fallbackTags[remoteLang];
    if (!playedAny && isSpeechSupported() && fallbackTag && findVoiceForLanguage(fallbackTag)) {
      speakLocally(finalText, fallbackTag, opts);
      return;
    }
    if (opts.onError) opts.onError(err);
    if (opts.onEnd) opts.onEnd();
  }
}

/**
 * Speaks text, maintaining strict language consistency.
 * English is always spoken locally with SpeechSynthesis.
 * Amharic is spoken through the remote voice endpoint when the user has
 * consented (opts.consent or a stored session consent). Without consent,
 * Amharic is spoken locally ONLY when the device actually has an Amharic
 * voice: a browser left to pick its default voice will read Amharic text
 * with an English accent, which is exactly the silent substitution this
 * kit must never do. With no Amharic voice and no consent, speak()
 * reports an error and stays silent instead.
 * @param {string} text
 * @param {Object} options
 * @param {string} [options.language] - 'en', 'am', 'so', 'om', 'ti' (or a
 *   BCP-47 tag). Auto-detected if omitted.
 * @param {string} [options.consent] - 'granted' | 'once' for this utterance only.
 * @param {boolean} [options.localOnly] - never use the remote endpoint for
 *   this utterance, even when consent is stored. The voice guide uses it
 *   to echo a user's spoken answer only through on-device speech.
 * @param {Function} [options.onStart]
 * @param {Function} [options.onEnd]
 * @param {Function} [options.onError]
 */
export function speak(text, options) {
  const opts = options || {};
  if (!text) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  stopSpeaking();

  let targetLang = detectLanguage(text, opts.language);
  // A label with no translation yet returns English text: speak it
  // in English, never with another language's voice. (Real Somali,
  // Oromo, or Tigrinya content never equals an English label, so it
  // keeps its own language.)
  if ((targetLang === 'so-SO' || targetLang === 'om-ET' || targetLang === 'ti-ET')
    && isEnglishLabelText(text)) {
    targetLang = 'en-US';
  }
  const baseLang = targetLang.split('-')[0];
  const isAmharic = baseLang === 'am';
  // Remote voices exist for Amharic, Somali, and Tigrinya (Tigrinya
  // via Gemini only — no Edge voice; verified 2026-11-15). Afaan
  // Oromoo has no remote voice in any reachable service, so it uses
  // a genuine local voice when the device has one, and otherwise
  // fails honestly below — never with another language's voice.
  const useRemote = baseLang === 'am' || baseLang === 'so' || baseLang === 'ti';
  const needsOwnVoice = baseLang === 'am' || baseLang === 'so' || baseLang === 'om' || baseLang === 'ti';

  // Enforce language consistency:
  // If target language is Amharic, ensure spoken text is in Amharic
  let finalText = text;
  if (isAmharic) {
    finalText = translateToAmharic(text);
  }

  if (useRemote && !opts.localOnly && remoteConsentAllows(opts) && isRemoteVoiceSupported()) {
    consumeOnceConsent(opts);
    speakViaRemote(finalText, opts);
    return;
  }

  // No remote path for this utterance: local speech is allowed only
  // with a genuine voice for the language on the device. Without
  // one, the browser would substitute its default (usually English)
  // voice and read the text with the wrong accent — never do that
  // silently.
  if (needsOwnVoice && !findVoiceForLanguage(targetLang)) {
    if (baseLang === 'am') {
      if (opts.onError) opts.onError(voiceError('no_amharic_voice', 'No Amharic voice is available on this device.'));
    } else {
      if (opts.onError) opts.onError(voiceError('no_voice_for_language', 'No ' + LANGUAGE_NAMES[baseLang] + ' voice is available on this device.'));
    }
    if (opts.onEnd) opts.onEnd();
    return;
  }

  if (!isSpeechSupported()) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  speakLocally(finalText, targetLang, opts);
}
