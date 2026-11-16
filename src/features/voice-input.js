// Voice input wrapper using Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// Strictly privacy-preserving: No raw audio stored or uploaded.

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function isVoiceSupported() {
  return SpeechRecognition !== null;
}

export function getRecognitionLanguage(lang) {
  if (lang && (lang === 'am' || String(lang).toLowerCase().startsWith('am'))) return 'am-ET';
  return 'en-US';
}

/**
 * Start speech recognition.
 * @param {Object} options
 * @param {string} options.language - 'en' or 'am'
 * @param {boolean} [options.continuous] - when true, the microphone stays
 *   open: every final result is delivered through onResult, and the
 *   recognizer restarts itself after the browser ends it (pauses,
 *   silence) until the caller calls stop()/abort(). It NEVER gives up
 *   on its own: routine 'no-speech'/'aborted' errors are swallowed,
 *   and recoverable errors ('network', 'audio-capture',
 *   'service-not-allowed', start failures) restart with backoff
 *   instead of ending the session — a venue wifi blip must not close
 *   a microphone the user turned on. Only a denied microphone
 *   ('not-allowed') and an unsupported language
 *   ('language-not-supported') are reported once through onError and
 *   stop the auto-restart, so the caller can react (the caller may
 *   restart in another language). Repeated recoverable failures are
 *   reported once per episode through onRecurringError. Defaults to
 *   false: one utterance, then onEnd; every error is reported and
 *   nothing restarts.
 * @param {Function} options.onStart
 * @param {Function} options.onResult - callback(transcript)
 * @param {Function} options.onError - callback(errorMessage, errorCode)
 *   The second argument is the raw recognition error code ('not-allowed',
 *   'no-speech', 'language-not-supported', 'network', 'unsupported',
 *   'start-failed') so callers can react differently to a denied
 *   microphone, an unsupported language, and a missed utterance.
 *   Existing callers that read only the message are unaffected. In
 *   continuous mode this fires only for the two fatal codes above.
 * @param {Function} options.onRecurringError - callback(errorCode),
 *   continuous mode only: fired once when recoverable errors repeat
 *   (5 in a row without a successful start or result), so the caller
 *   can warn the user while the retries continue in the background.
 * @param {Function} options.onEnd
 * @returns {Object} { stop: Function, abort: Function }
 */
export function startVoiceRecognition(options) {
  const opts = options || {};
  if (!isVoiceSupported()) {
    if (opts.onError) opts.onError('Speech recognition is not supported in this browser.', 'unsupported');
    return { stop: () => {}, abort: () => {} };
  }

  const recognition = new SpeechRecognition();
  const continuous = Boolean(opts.continuous);
  recognition.continuous = continuous;
  recognition.interimResults = false;
  recognition.lang = getRecognitionLanguage(opts.language);
  recognition.maxAlternatives = 1;

  let hasResult = false;
  let stopped = false;
  let fatalError = false;
  let restartFailures = 0;
  let restartTimer = null;
  let restartScheduled = false;
  // Recoverable errors in a row, without a successful start or a
  // result between them. Drives the restart backoff and the one
  // recurring-error report per episode.
  let consecutiveFailures = 0;
  let recurringReported = false;

  function backoffDelay() {
    return Math.min(500 * Math.pow(2, Math.max(0, consecutiveFailures - 1)), 5000);
  }

  // One restart path, shared by the error handler, the end handler,
  // and start retries: at most one restart is ever pending, so a
  // scheduled backoff restart is never doubled by the end event that
  // follows the error.
  function scheduleRestart(delayMs) {
    if (stopped || fatalError || restartScheduled) return;
    restartScheduled = true;
    restartTimer = setTimeout(function () {
      restartScheduled = false;
      safeStart();
    }, delayMs);
  }

  // Browsers throw if start() is called while a previous session is
  // still tearing down. One-shot callers get a few retries, then
  // start-failed; continuous mode keeps retrying forever, because a
  // microphone the user turned on must not die on a teardown race.
  function safeStart() {
    if (stopped || fatalError) return;
    try {
      recognition.start();
    } catch (err) {
      restartFailures += 1;
      if (!continuous && restartFailures >= 3) {
        stopped = true;
        if (opts.onError) opts.onError('Could not start microphone: ' + err.message, 'start-failed');
      } else {
        scheduleRestart(continuous ? Math.min(300 * restartFailures, 3000) : 300);
      }
    }
  }

  recognition.onstart = function () {
    restartFailures = 0;
    consecutiveFailures = 0;
    recurringReported = false;
    if (opts.onStart) opts.onStart();
  };

  recognition.onresult = function (event) {
    const results = event.results || [];
    // In continuous mode event.results accumulates; resultIndex marks
    // the first new result. One-shot callers get resultIndex 0.
    const startIndex = typeof event.resultIndex === 'number' ? event.resultIndex : 0;
    for (let i = startIndex; i < results.length; i++) {
      const result = results[i];
      if (!result || result.isFinal === false) continue;
      const transcript = result[0] && result[0].transcript;
      if (!transcript) continue;
      hasResult = true;
      consecutiveFailures = 0;
      recurringReported = false;
      if (opts.onResult) opts.onResult(transcript);
    }
  };

  recognition.onerror = function (event) {
    if (stopped) return;
    const code = event.error || 'unknown';
    // Silence and aborts are routine cancellations or timeouts; don't report as errors
    if (code === 'aborted') return;
    if (continuous && code === 'no-speech') return;
    if (continuous && code !== 'not-allowed' && code !== 'language-not-supported') {
      // Recoverable: a network blip, a mic glitch, a busy service.
      // Restart with backoff and keep the microphone open; warn the
      // caller once if the failures keep repeating, but never stop.
      consecutiveFailures += 1;
      if (consecutiveFailures >= 5 && !recurringReported) {
        recurringReported = true;
        if (opts.onRecurringError) opts.onRecurringError(code);
      }
      scheduleRestart(backoffDelay());
      return;
    }
    fatalError = true;
    const isAm = opts.language === 'am' || (opts.language && String(opts.language).startsWith('am'));
    let msg = isAm ? ('የድምፅ ግብዓት ስህተት፡ ' + code) : ('Voice recognition error: ' + code);
    const errMap = {
      'not-allowed': isAm ? 'የማይክሮፎን ፈቃድ ተከልክሏል' : 'Microphone access denied',
      'no-speech': isAm ? 'ምንም ድምፅ አልተሰማም' : 'No speech detected',
      'language-not-supported': isAm ? 'ይህ ቋንቋ አይደገፍም' : 'Language not supported',
      'network': isAm ? 'የድምፅ አገልግሎቱን ማግኘት አልተቻለም' : 'Speech recognition offline'
    };
    if (errMap[code]) msg = errMap[code] + (isAm ? '። በእጅ መጻፍ ይችላሉ።' : '. Manual typing is available.');
    if (opts.onError) opts.onError(msg, code);
  };

  recognition.onend = function () {
    if (continuous && !stopped && !fatalError) {
      // Browsers end continuous recognition after pauses; restart so
      // the microphone stays open until the caller stops it. If the
      // error handler already scheduled a backoff restart, this is a
      // no-op and the backoff stands.
      scheduleRestart(250);
      return;
    }
    if (opts.onEnd) opts.onEnd(hasResult);
  };

  safeStart();

  return {
    stop: function () {
      stopped = true;
      restartScheduled = false;
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition.stop(); } catch (e) {}
    },
    abort: function () {
      stopped = true;
      restartScheduled = false;
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition.abort(); } catch (e) {}
    }
  };
}

