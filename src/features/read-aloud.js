// Read-aloud wrapper using SpeechSynthesis with strict language synchronization
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

export function stopSpeaking() {
  if (!isSpeechSupported()) return;
  try {
    synth.cancel();
    activeUtterance = null;
  } catch (e) {}
}

export function isSpeaking() {
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
    if (clean === 'en' || clean.startsWith('en-') || clean.startsWith('en_')) {
      return 'en-US';
    }
    return specifiedLang;
  }
  // Auto-detect Ethiopic/Amharic script in text
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

  // 3. Name-based search for Amharic or Ethiopian voices
  if (base === 'am') {
    matched = voices.find(v => /amharic|ethiopia/i.test(v.name));
    if (matched) return matched;
  }

  return null;
}

/**
 * Speaks text using SpeechSynthesis, maintaining strict language consistency.
 * @param {string} text
 * @param {Object} options
 * @param {string} [options.language] - 'en', 'am', 'am-ET', etc. Auto-detected if omitted.
 * @param {Function} [options.onStart]
 * @param {Function} [options.onEnd]
 * @param {Function} [options.onError]
 */
export function speak(text, options) {
  const opts = options || {};
  if (!isSpeechSupported() || !text) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  stopSpeaking();

  const targetLang = detectLanguage(text, opts.language);
  const isAmharic = targetLang.startsWith('am');

  // Enforce language consistency:
  // If target language is Amharic, ensure spoken text is in Amharic
  let finalText = text;
  if (isAmharic) {
    finalText = translateToAmharic(text);
  }

  const utterance = new SpeechSynthesisUtterance(finalText);
  activeUtterance = utterance;

  utterance.lang = targetLang;
  utterance.rate = 0.95; // slightly slower for better accessibility and comprehension
  utterance.pitch = 1.0;

  // Assign appropriate voice matching target language
  const matchedVoice = findVoiceForLanguage(targetLang);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  } else if (isAmharic) {
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
