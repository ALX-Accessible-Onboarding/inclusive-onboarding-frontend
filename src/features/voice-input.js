// Voice input wrapper using Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// Strictly privacy-preserving: No raw audio stored or uploaded.

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function isVoiceSupported() {
  return SpeechRecognition !== null;
}

export function getRecognitionLanguage(lang) {
  if (lang === 'am') return 'am-ET';
  return 'en-US';
}

/**
 * Start speech recognition.
 * @param {Object} options
 * @param {string} options.language - 'en' or 'am'
 * @param {Function} options.onStart
 * @param {Function} options.onResult - callback(transcript)
 * @param {Function} options.onError - callback(errorMessage)
 * @param {Function} options.onEnd
 * @returns {Object} { stop: Function, abort: Function }
 */
export function startVoiceRecognition(options) {
  const opts = options || {};
  if (!isVoiceSupported()) {
    if (opts.onError) opts.onError('Speech recognition is not supported in this browser.');
    return { stop: () => {}, abort: () => {} };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = getRecognitionLanguage(opts.language);
  recognition.maxAlternatives = 1;

  let hasResult = false;

  recognition.onstart = function () {
    if (opts.onStart) opts.onStart();
  };

  recognition.onresult = function (event) {
    if (event.results && event.results.length > 0) {
      const transcript = event.results[0][0].transcript;
      hasResult = true;
      if (opts.onResult) opts.onResult(transcript);
    }
  };

  recognition.onerror = function (event) {
    let msg = 'Voice recognition error: ' + (event.error || 'unknown');
    if (event.error === 'not-allowed') {
      msg = 'Microphone access was denied. Please allow microphone permissions or type manually.';
    } else if (event.error === 'no-speech') {
      msg = 'No speech was detected. Please try speaking again.';
    } else if (event.error === 'language-not-supported') {
      msg = opts.language === 'am'
        ? 'Amharic speech recognition is not supported on this device. Manual typing is available.'
        : 'This language is not supported by your speech engine.';
    }
    if (opts.onError) opts.onError(msg);
  };

  recognition.onend = function () {
    if (opts.onEnd) opts.onEnd(hasResult);
  };

  try {
    recognition.start();
  } catch (err) {
    if (opts.onError) opts.onError('Could not start microphone: ' + err.message);
  }

  return {
    stop: function () {
      try { recognition.stop(); } catch (e) {}
    },
    abort: function () {
      try { recognition.abort(); } catch (e) {}
    }
  };
}
