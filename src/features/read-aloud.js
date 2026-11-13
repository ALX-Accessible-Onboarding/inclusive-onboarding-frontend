// Read-aloud wrapper using SpeechSynthesis

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let activeUtterance = null;
let voices = [];

function loadVoices() {
  if (!isSpeechSupported()) return;
  voices = synth.getVoices() || [];
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
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
 * Speaks text using SpeechSynthesis.
 * @param {string} text
 * @param {Object} options
 * @param {string} options.language - 'en' or 'am'
 * @param {Function} options.onStart
 * @param {Function} options.onEnd
 * @param {Function} options.onError
 */
export function speak(text, options) {
  const opts = options || {};
  if (!isSpeechSupported() || !text) {
    if (opts.onEnd) opts.onEnd();
    return;
  }

  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;

  const targetLang = opts.language === 'am' ? 'am-ET' : 'en-US';
  utterance.lang = targetLang;
  utterance.rate = 0.95; // slightly slower for better accessibility and comprehension
  utterance.pitch = 1.0;

  // Find appropriate voice if available
  if (voices.length > 0) {
    const matchedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
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
