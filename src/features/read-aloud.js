import { translateToAmharic } from '../labels.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let activeUtterance = null;
let cachedVoices = [];

export function getAvailableVoices() {
  if (!isSpeechSupported()) return [];
  const voices = synth.getVoices() || [];
  if (voices.length > 0) cachedVoices = voices;
  return cachedVoices.length > 0 ? cachedVoices : voices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  getAvailableVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = getAvailableVoices;
  }
}

export function splitTextForSpeech(text, maxChars) {
  const max = maxChars || 1200;
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = [];
  let s = 0;
  for (let i = 0; i < clean.length; i++) {
    if ('.!?:;።'.includes(clean[i]) && (i + 1 >= clean.length || clean[i + 1] === ' ')) {
      sentences.push(clean.slice(s, i + 1).trim());
      s = i + 1;
    }
  }
  const rem = clean.slice(s).trim();
  if (rem) sentences.push(rem);

  const chunks = [];
  let cur = '';
  sentences.forEach(sent => {
    if (sent.length > max) {
      if (cur) { chunks.push(cur); cur = ''; }
      sent.split(' ').forEach(w => {
        while (w.length > max) {
          if (cur) { chunks.push(cur); cur = ''; }
          chunks.push(w.slice(0, max));
          w = w.slice(max);
        }
        if (cur && (cur + ' ' + w).length > max) { chunks.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
      });
    } else if (cur && (cur + ' ' + sent).length > max) {
      chunks.push(cur);
      cur = sent;
    } else {
      cur = cur ? cur + ' ' + sent : sent;
    }
  });
  if (cur) chunks.push(cur);
  return chunks;
}

export function redactSensitivePatterns(text) {
  return String(text || '')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '…')
    .replace(/\+?\d[\d\s\-/]{5,}\d/g, '…');
}



export function stopSpeaking() {
  if (isSpeechSupported()) {
    try {
      synth.cancel();
      activeUtterance = null;
    } catch (e) {}
  }
}

export function isSpeaking() {
  return Boolean(isSpeechSupported() && synth.speaking);
}

export function detectLanguage(text, specifiedLang) {
  if (specifiedLang) {
    const clean = String(specifiedLang).toLowerCase().trim();
    if (clean === 'am' || clean.startsWith('am-') || clean.startsWith('am_')) {
      return 'am-ET';
    }
    if (clean === 'en' || clean.startsWith('en-') || clean.startsWith('en_')) {
      return 'en-US';
    }
    return specifiedLang;
  }
  if (text && /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(text)) {
    return 'am-ET';
  }
  return 'en-US';
}

export function findVoiceForLanguage(langCode) {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  const target = langCode.toLowerCase().replace('_', '-');
  const base = target.split('-')[0];

  let matched = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-') === target);
  if (matched) return matched;

  matched = voices.find(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(base));
  if (matched) return matched;

  return null;
}

export function speak(text, options) {
  const opts = options || {};
  if (!text) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  stopSpeaking();

  const targetLang = detectLanguage(text, opts.language);
  const isAmharic = targetLang.startsWith('am');

  let finalText = text;
  if (isAmharic) {
    finalText = translateToAmharic(text);
    if (!findVoiceForLanguage(targetLang)) {
      const err = new Error('No Amharic voice is available on this device.');
      err.code = 'no_amharic_voice';
      if (typeof opts.onError === 'function') opts.onError(err);
      if (typeof opts.onEnd === 'function') opts.onEnd();
      return;
    }
  }

  if (!isSpeechSupported()) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.lang = targetLang;
    utterance.rate = opts.rate || (opts.isSimpleMode ? 0.85 : 0.95);

    const voice = findVoiceForLanguage(targetLang);
    if (voice) utterance.voice = voice;

    utterance.onend = function () {
      activeUtterance = null;
      if (typeof opts.onEnd === 'function') opts.onEnd();
    };

    utterance.onerror = function (e) {
      activeUtterance = null;
      if (typeof opts.onError === 'function') opts.onError(e);
      if (typeof opts.onEnd === 'function') opts.onEnd();
    };

    activeUtterance = utterance;
    synth.speak(utterance);
  } catch (err) {
    if (typeof opts.onError === 'function') opts.onError(err);
    if (typeof opts.onEnd === 'function') opts.onEnd();
  }
}

export const VOICE_CONSENT_KEY = 'ik_voice_consent';
let allowOnce = false;

export function getVoiceConsent() {
  try {
    const value = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(VOICE_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch (e) {
    return null;
  }
}

export function setVoiceConsent(value) {
  if (value === 'once') { allowOnce = true; return; }
  allowOnce = false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      if (value === 'granted' || value === 'denied') sessionStorage.setItem(VOICE_CONSENT_KEY, value);
      else sessionStorage.removeItem(VOICE_CONSENT_KEY);
    }
  } catch (e) {}
}

let voiceEndpoint = '/api/voice/speak';

export function configureVoice(opts) {
  if (opts && opts.endpoint) voiceEndpoint = opts.endpoint;
}

export function getVoiceEndpoint() {
  return voiceEndpoint;
}

export function checkVoiceService() {
  if (typeof fetch === 'undefined') return Promise.resolve({ reachable: false, configured: false, reason: 'fetch_unsupported' });
  return fetch(voiceEndpoint, { method: 'GET', headers: { Accept: 'application/json' } })
    .then(r => r.ok ? r.json() : { reachable: false, configured: false })
    .catch(() => ({ reachable: false, configured: false }));
}
