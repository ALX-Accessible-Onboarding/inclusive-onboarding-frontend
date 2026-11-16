// Voice input wrapper using Web Speech API (SpeechRecognition / webkitSpeechRecognition)
// Strictly privacy-preserving: No raw audio stored or uploaded.
import { pickLang, translateContent } from '../content-translations.js';

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

export function isVoiceSupported() {
  return SpeechRecognition !== null;
}

export function getRecognitionLanguage(lang) {
  if (lang === 'am') return 'am-ET';
  if (lang === 'so') return 'so-SO';
  if (lang === 'om') return 'om-ET';
  if (lang === 'ti') return 'ti-ET';
  return 'en-US';
}

// Every live recognition session, so a total stop ("stop", the Stop
// button) can silence every microphone at once — the commands mic,
// the guide's listen window, and the per-field mics — instead of
// only the one the caller happens to hold.
const liveSessions = new Set();

export function stopAllRecognition() {
  const sessions = Array.from(liveSessions);
  sessions.forEach(function (handle) {
    try { handle.stop(); } catch (e) {}
  });
}

/**
 * Start speech recognition.
 * @param {Object} options
 * @param {string} options.language - 'en', 'am', 'so', 'om', or 'ti'
 * @param {boolean} [options.continuous] - when true, the microphone stays
 *   open: every final result is delivered through onResult, and the
 *   recognizer restarts itself after the browser ends it (pauses,
 *   silence) until the caller calls stop()/abort(). It NEVER gives up
 *   on its own: routine 'no-speech'/'aborted' errors are swallowed,
 *   and recoverable errors ('network', 'audio-capture',
 *   'service-not-allowed', start failures) restart with backoff
 *   instead of ending the session — a venue wifi blip must not close
 *   a microphone the user turned on. A start the browser never
 *   acknowledges (no onstart, onerror, or onend) is treated as a
 *   wedged session and force-restarted, so a silent stall can never
 *   leave the microphone dead either. Only a denied microphone
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
    if (opts.onError) opts.onError(translateContent('Speech recognition is not supported in this browser.', opts.language), 'unsupported');
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
  let handle = null;
  // Recoverable errors in a row, without a successful start or a
  // result between them. Drives the restart backoff and the one
  // recurring-error report per episode.
  let consecutiveFailures = 0;
  let recurringReported = false;
  // When the current start() call was made, while it is still
  // unacknowledged (no onstart, onerror, or onend yet). A start that
  // is never acknowledged means the browser's speech service wedged
  // silently — no event ever arrives, so the normal restart paths
  // never run. The stall timer below watches this and forces a fresh
  // start, so a microphone the user turned on can never die quietly.
  let startPendingAt = 0;
  let stallTimer = null;

  function clearStallTimer() {
    if (stallTimer) {
      clearInterval(stallTimer);
      stallTimer = null;
    }
  }

  // Continuous mode only: a start that no event acknowledges within
  // a few seconds is wedged. Abort the stuck session (which may fire
  // onend and restart on its own) and schedule a restart regardless,
  // so exactly one fresh start follows either way. Quiet listening
  // never trips this: onstart clears startPendingAt, and a live
  // session that hears nothing simply has no start pending.
  function startStallTimer() {
    if (!continuous || stallTimer) return;
    stallTimer = setInterval(function () {
      if (stopped || fatalError) {
        clearStallTimer();
        return;
      }
      if (!startPendingAt || Date.now() - startPendingAt <= 5000 || restartScheduled) return;
      startPendingAt = 0;
      try { recognition.abort(); } catch (e) {}
      scheduleRestart(250);
    }, 2000);
    // Never keep a Node test process alive on a leaked timer.
    if (stallTimer && typeof stallTimer.unref === 'function') stallTimer.unref();
  }

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
      startPendingAt = Date.now();
      startStallTimer();
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
    startPendingAt = 0;
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
    const code = event.error || 'unknown';
    startPendingAt = 0;
    // In continuous mode, silence and aborts are routine: the
    // recognizer restarts from onend without bothering the caller.
    if (continuous && (code === 'no-speech' || code === 'aborted')) return;
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
    clearStallTimer();
    liveSessions.delete(handle);
    let msg = 'Voice recognition error: ' + code;
    if (code === 'not-allowed') {
      msg = translateContent('Microphone access was denied. Please allow microphone permissions or type manually.', opts.language);
    } else if (code === 'no-speech') {
      msg = translateContent('No speech was detected. Please try speaking again.', opts.language);
    } else if (code === 'language-not-supported') {
      msg = pickLang('This language is not supported by your speech engine.', 'Amharic speech recognition is not supported on this device. Manual typing is available.', opts.language);
    } else if (code === 'network') {
      msg = pickLang('Speech recognition service is unreachable. Manual typing is available.', 'የድምፅ አገልግሎቱን ማግኘት አልተቻለም። በእጅ መጻፍ ይችላሉ።', opts.language);
    }
    if (opts.onError) opts.onError(msg, code);
  };

  recognition.onend = function () {
    startPendingAt = 0;
    if (continuous && !stopped && !fatalError) {
      // Browsers end continuous recognition after pauses; restart so
      // the microphone stays open until the caller stops it. If the
      // error handler already scheduled a backoff restart, this is a
      // no-op and the backoff stands.
      scheduleRestart(250);
      return;
    }
    clearStallTimer();
    liveSessions.delete(handle);
    if (opts.onEnd) opts.onEnd(hasResult);
  };

  safeStart();

  handle = {
    stop: function () {
      stopped = true;
      restartScheduled = false;
      startPendingAt = 0;
      clearStallTimer();
      liveSessions.delete(handle);
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition.stop(); } catch (e) {}
    },
    abort: function () {
      stopped = true;
      restartScheduled = false;
      startPendingAt = 0;
      clearStallTimer();
      liveSessions.delete(handle);
      if (restartTimer) clearTimeout(restartTimer);
      try { recognition.abort(); } catch (e) {}
    }
  };
  liveSessions.add(handle);
  return handle;
}

