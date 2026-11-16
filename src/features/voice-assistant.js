// Accessible voice assistant for the Inclusive Access Kit.
//
// This is the ONLY new voice layer. Speech output stays in read-aloud.js
// (speak/stopSpeaking) and speech input stays in voice-input.js
// (startVoiceRecognition); this file adds only what those modules do not
// have: page-text extraction, Gemini consent UI, screen-reader announcements,
// voice commands, and the nav-bar voice controls. The hands-free
// onboarding guide lives in voice-guide.js and is owned by this
// assistant (startGuide/maybeAutoStartGuide); it drives the same speak()
// and startVoiceRecognition() paths.
//
// Rules:
// - English and Amharic only. English speech stays local in the browser.
// - Amharic speech goes to Gemini only after informed consent (see
//   requestConsent). Typed answers, passwords, profile values and support
//   needs are never collected for speech (see collectPageText exclusions).
// - Voice commands listen CONTINUOUSLY once started: one tap on the
//   microphone (one permission grant) keeps the microphone open across
//   views until the user says "stop", taps Stop, or leaves the site.
//   Commands navigate everywhere; on a question screen they also
//   answer it, through the same interpretation the guide uses
//   (interpretAnswer/fillAnswer in voice-guide.js). While a spoken
//   response plays, listening pauses so the recognizer does not hear
//   the site's own voice, then resumes in the screen's language.
// - Voice is never the only way to do anything: every control is a native
//   button, keyboard reachable, with the kit's existing visible focus ring.
// - Navigation is announced to screen readers by the existing focus-to-
//   heading behaviour in mount.js; this assistant only adds spoken view
//   names after the user has used a voice feature, and a live-region
//   fallback when a view has no heading.
import {
  speak,
  stopSpeaking,
  isSpeaking,
  isSpeechSupported,
  checkVoiceService,
  getVoiceConsent,
  setVoiceConsent
} from './read-aloud.js';
import { startVoiceRecognition, isVoiceSupported } from './voice-input.js';
import {
  VoiceGuide,
  getGuideSessionState,
  matchGuideCommand,
  detectGuideLanguage,
  findQuestionScreen,
  readQuestionFromElement,
  buildQuestionPrompt,
  interpretAnswer,
  fillAnswer,
  applyGuideAction
} from './voice-guide.js';
import { t } from '../labels.js';

// Elements whose text must never be read aloud or sent to the voice service:
// profile values (name, contact, ID), the private support-needs chips, voice
// transcripts, screen-reader-only duplicates, hidden content, and form
// controls themselves (labels and help text are collected; field values,
// which live in .value rather than text, never are).
const EXCLUDED_CLOSEST = [
  '[data-ik-no-speech]',
  '[aria-hidden="true"]',
  '.ik-field-val',
  '.ik-profile-title',
  '.ik-profile-id-sub',
  '.ik-support-chips-list',
  '.ik-voice-preview',
  '.ik-voice-bar',
  '.ik-sr-only',
  '.ik-hidden',
  'select',
  'option',
  'script',
  'style',
  'noscript',
  'svg'
].join(', ');

const COLLECT_SELECTOR = 'h1, h2, h3, h4, p, li, label, legend, button, [role="alert"], [role="status"], figcaption, th, td';

function stripEmoji(text) {
  try {
    return text.replace(/[\u2190-\u21FF\u2600-\u27BF\u{1F000}-\u{1FAFF}]/gu, ' ');
  } catch (e) {
    return text;
  }
}

function isHiddenElement(el) {
  if (el.hidden) return true;
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    try {
      const style = window.getComputedStyle(el);
      if (style && (style.display === 'none' || style.visibility === 'hidden')) return true;
    } catch (e) {}
  }
  return false;
}

// Collect readable page text (headings, labels, instructions, buttons,
// errors, status) from one container, in document order, without duplicates
// from nested collected elements. Never reads input values.
export function collectPageText(container, maxChars) {
  if (!container || typeof container.querySelectorAll !== 'function') return '';
  const max = maxChars || 8000;
  const nodes = container.querySelectorAll(COLLECT_SELECTOR);
  const parts = [];
  let total = 0;

  nodes.forEach(function (el) {
    if (total >= max) return;
    if (el.closest && el.closest(EXCLUDED_CLOSEST)) return;
    if (isHiddenElement(el)) return;
    // Skip elements nested inside another collected element (e.g. a button
    // inside a list item): the ancestor's text already includes them.
    let parent = el.parentElement;
    let nested = false;
    while (parent && parent !== container) {
      if (parent.matches && parent.matches(COLLECT_SELECTOR)) { nested = true; break; }
      parent = parent.parentElement;
    }
    if (nested) return;
    const text = stripEmoji(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    if (parts.length > 0 && parts[parts.length - 1] === text) return;
    parts.push(text);
    total += text.length + 1;
  });

  return parts.join(' ').slice(0, max);
}

// Voice commands, English and Amharic. Matching is substring-based so a
// transcript with extra words ("please read the page") still works. Order
// matters: stop is checked before read, help before view names.
export const VOICE_COMMANDS = [
  { action: 'stop', phrases: ['stop reading', 'stop', 'ማንበብ አቁም', 'አቁም'] },
  { action: 'read', phrases: ['read this page', 'read page', 'read aloud', 'read', 'ጮክ ብሎ አንብብ', 'ገጹን አንብብ', 'አንብብ'] },
  { action: 'help', phrases: ['help', 'what can i say', 'እርዳታ'] },
  { action: 'view', view: 'career', phrases: ['career gateway', 'career', 'jobs', 'የሥራ እድሎች', 'ስራዎች', 'ስራ'] },
  { action: 'view', view: 'profile', phrases: ['my profile', 'profile', 'መገለጫዬ', 'መገለጫ'] },
  { action: 'view', view: 'onboarding', phrases: ['onboarding', 'registration', 'register', 'sign up', 'ምዝገባ', 'ይመዝገቡ'] },
  { action: 'view', view: 'employer', phrases: ['post a job', 'employer', 'ሥራ ይለጥፉ', 'ሥራ ልጥፍ'] }
];

export function matchVoiceCommand(transcript) {
  const text = String(transcript || '')
    .toLowerCase()
    .replace(/[.,!?።؟]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;
  for (let i = 0; i < VOICE_COMMANDS.length; i++) {
    const command = VOICE_COMMANDS[i];
    for (let j = 0; j < command.phrases.length; j++) {
      if (text.indexOf(command.phrases[j]) !== -1) {
        return command.action === 'view'
          ? { action: 'view', view: command.view }
          : { action: command.action };
      }
    }
  }
  return null;
}

// Icon (hidden from screen readers) + text. Uses textContent, never innerHTML.
// Same pattern as mount.js.
function setIconLabel(button, icon, text, textLang) {
  const iconSpan = document.createElement('span');
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = icon;
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  if (textLang) textSpan.setAttribute('lang', textLang);
  button.textContent = '';
  button.appendChild(iconSpan);
  button.appendChild(document.createTextNode(' '));
  button.appendChild(textSpan);
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

export class VoiceAssistant {
  constructor(options) {
    const opts = options || {};
    this.getLanguage = opts.getLanguage || function () { return 'en'; };
    this.getContent = opts.getContent || function () { return null; };
    this.setView = opts.setView || function () {};
    this.getRoot = opts.getRoot || function () { return null; };
    this.getView = opts.getView || function () { return null; };

    this.statusEl = null;
    this.announceTimer = null;
    this.consentDialog = null;
    this.consentResolve = null;
    this.consentPromise = null;
    this.consentInvoker = null;
    this.recognition = null;
    this.listening = false;
    this.voiceAnnouncementsOn = false;
    // Continuous voice commands: true from the mic-button tap until the
    // user stops it. 'listening' is the recognizer's live state, which
    // also drops briefly while a spoken response plays (see
    // speakResponse) and is restored afterwards.
    this.continuousCommands = false;
    this.commandLang = 'en';
    this.resumeCommandsAfterSpeech = false;
    // Never-close listening: every recognition session gets a token,
    // so a stale session's late end/error callbacks cannot kill the
    // live one. recognitionLangFallback remembers that Amharic
    // recognition is unavailable on this device, so restarts listen
    // in English instead of failing again. commandsWatchdog is the
    // interval that rescues a silently dead session (see
    // maybeRestartCommands).
    this.recognitionToken = 0;
    this.recognitionLangFallback = false;
    this.commandsWatchdog = null;
    // Spoken screen prompts in continuous mode (see
    // speakCurrentScreenPrompt): the key of the last screen spoken,
    // so a prompt is said once per arrival, and a generation counter
    // so a newer prompt request supersedes a polling one.
    this.lastPromptKey = null;
    this.promptSpeakGen = 0;

    const self = this;
    this.guide = new VoiceGuide({
      getContent: function () { return self.getContent(); },
      getRoot: function () { return self.getRoot(); },
      setView: function (viewName) { self.setView(viewName); },
      getView: function () { return self.getView(); },
      getLanguage: function () { return self.lang(); },
      announce: function (message) { self.announce(message); },
      onStateChange: function () { self.updateControls(); }
    });
    // Returning to the tab must never leave a dead microphone: if
    // continuous mode is on but no session is live, restart it.
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') self.maybeRestartCommands();
      });
    }
  }

  lang() {
    const raw = String(this.getLanguage() || 'en').toLowerCase();
    return raw === 'am' || raw.indexOf('am-') === 0 || raw.indexOf('am_') === 0 ? 'am' : 'en';
  }

  // The language the user is actually looking at. The mount language
  // does not update when the onboarding language chooser switches the
  // engine, so on a question screen the rendered text decides (the
  // same detection the guide uses); everywhere else the mount
  // language applies. Used for the recognition language and for
  // command responses, so answering the language chooser switches
  // listening to the chosen language.
  currentLang() {
    const question = this.readCurrentQuestion();
    if (question) return detectGuideLanguage(question.heading + ' ' + question.label, this.lang());
    return this.lang();
  }

  // The language recognition listens in: the screen's language,
  // unless this device proved Amharic recognition unsupported, in
  // which case English for the rest of the session (spoken responses
  // still use currentLang, so Amharic speech is unaffected).
  recognitionLang() {
    return this.recognitionLangFallback ? 'en' : this.currentLang();
  }

  readCurrentQuestion() {
    const screen = findQuestionScreen(this.getContent());
    return screen ? readQuestionFromElement(screen) : null;
  }

  // One polite live region for voice status messages. Screen-reader
  // announcements of navigation, progress and errors already exist in the
  // kit (focus-to-heading, step live region, role="alert" cards); this
  // region only carries voice-specific status.
  renderStatus(root) {
    if (this.statusEl && this.statusEl.isConnected) return;
    const region = document.createElement('div');
    region.className = 'ik-voice-status ik-sr-only';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    root.appendChild(region);
    this.statusEl = region;
    // Now attached: sync control states (stop button, mic) for real.
    this.updateControls();
  }

  announce(message) {
    if (!this.statusEl || !message) return;
    const region = this.statusEl;
    if (this.announceTimer) clearTimeout(this.announceTimer);
    region.textContent = '';
    this.announceTimer = setTimeout(function () {
      region.textContent = message;
    }, 30);
  }

  renderControls(actionsEl) {
    const lang = this.lang();
    const self = this;

    const readBtn = document.createElement('button');
    readBtn.type = 'button';
    readBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-voice-read-btn';
    setIconLabel(readBtn, '🔊', t('voiceReadPage', lang));
    readBtn.addEventListener('click', function () { self.readCurrentPage(); });
    actionsEl.appendChild(readBtn);

    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-voice-stop-btn';
    setIconLabel(stopBtn, '⏹', t('voiceStop', lang));
    // Set directly: renderControls runs before the nav is attached to the
    // root, so updateControls() cannot find the button yet.
    stopBtn.disabled = !isSpeaking() && !this.listening;
    stopBtn.title = stopBtn.disabled ? t('disabledReasonVoiceStop', lang) : '';
    stopBtn.addEventListener('click', function () { self.stopAll(true); });
    actionsEl.appendChild(stopBtn);

    // Same convention as question screens: the microphone control is only
    // shown where speech recognition exists at all. Runtime failures
    // (denied microphone, unsupported Amharic recognition) are announced.
    if (isVoiceSupported()) {
      const micBtn = document.createElement('button');
      micBtn.type = 'button';
      micBtn.className = 'ik-btn ik-btn-mic ik-btn-sm ik-voice-command-btn';
      micBtn.setAttribute('aria-pressed', 'false');
      setIconLabel(micBtn, '🎤', t('voiceCommands', lang));
      micBtn.addEventListener('click', function () { self.toggleVoiceCommands(); });
      actionsEl.appendChild(micBtn);
    }

    this.updateControls();
  }

  updateControls() {
    const root = this.getRoot();
    if (!root || typeof root.querySelector !== 'function') return;
    const speaking = isSpeaking();
    const readBtn = root.querySelector('.ik-voice-read-btn');
    if (readBtn) readBtn.classList.toggle('ik-speaking', speaking);
    const stopBtn = root.querySelector('.ik-voice-stop-btn');
    if (stopBtn) {
      stopBtn.disabled = !speaking && !this.listening && !(this.guide && this.guide.isActive());
      stopBtn.title = stopBtn.disabled ? t('disabledReasonVoiceStop', this.lang()) : '';
    }
    const micBtn = root.querySelector('.ik-voice-command-btn');
    if (micBtn) {
      micBtn.classList.toggle('ik-listening', this.listening);
      micBtn.setAttribute('aria-pressed', this.listening ? 'true' : 'false');
      const labelSpan = micBtn.querySelector('span:last-child');
      if (labelSpan) {
        labelSpan.textContent = this.listening
          ? t('voiceListening', this.lang())
          : t('voiceCommands', this.lang());
      }
    }
  }

  speakResponse(text, lang) {
    const self = this;
    if (this.continuousCommands && this.listening) {
      // Pause listening while the response speaks, so the recognizer
      // does not hear the site's own voice and act on it; resume
      // afterwards, in the language of the screen now showing (the
      // command may have switched it). speak() can call onError and
      // onEnd for one utterance, so the resume is guarded to run once.
      this.stopRecognitionOnly();
      let resumed = false;
      const resume = function () {
        if (resumed) return;
        resumed = true;
        if (self.continuousCommands) {
          self.listening = true;
          self.startContinuousRecognition(self.recognitionLang());
        }
        // Update the controls AFTER restoring the listening flag, so
        // the mic button shows the resumed state.
        self.updateControls();
      };
      speak(text, {
        language: lang,
        onStart: function () { self.updateControls(); },
        onEnd: resume,
        onError: resume
      });
      return;
    }
    speak(text, {
      language: lang,
      onStart: function () { self.updateControls(); },
      onEnd: function () { self.updateControls(); },
      onError: function () { self.updateControls(); }
    });
  }

  // Resume continuous listening after a read-aloud that paused it
  // (see readCurrentPage). Runs once per pause; a Stop in between
  // clears the mode, so nothing resumes.
  maybeResumeCommands() {
    if (!this.resumeCommandsAfterSpeech) return;
    this.resumeCommandsAfterSpeech = false;
    if (this.continuousCommands) {
      this.listening = true;
      this.startContinuousRecognition(this.recognitionLang());
    }
    this.updateControls();
  }

  readCurrentPage() {
    const lang = this.lang();
    this.voiceAnnouncementsOn = true;
    // While the page is read aloud, pause continuous listening so the
    // recognizer does not hear the site's own voice and act on the
    // words it reads; resume when the reading ends (or is declined).
    if (this.continuousCommands && this.listening) {
      this.stopRecognitionOnly();
      this.resumeCommandsAfterSpeech = true;
    }
    const text = collectPageText(this.getContent());
    if (!text) {
      this.announce(t('voiceNothingToRead', lang));
      this.maybeResumeCommands();
      return;
    }

    if (lang === 'en') {
      if (!isSpeechSupported()) {
        this.announce(t('voiceUnavailable', lang));
        this.maybeResumeCommands();
        return;
      }
      this.speakPage(text, lang, {});
      return;
    }

    // Amharic: consent first, every session, unless already granted.
    if (getVoiceConsent() === 'granted') {
      this.speakPage(text, lang, { consent: 'granted' });
      return;
    }
    const self = this;
    checkVoiceService().then(function (health) {
      if (!health.reachable) {
        self.announce(t('voiceServiceUnavailable', lang));
        self.maybeResumeCommands();
        return;
      }
      if (!health.configured) {
        self.announce(t('voiceNotConfigured', lang));
        self.maybeResumeCommands();
        return;
      }
      self.requestConsent().then(function (choice) {
        if (choice === 'granted') {
          setVoiceConsent('granted');
          self.speakPage(text, lang, { consent: 'granted' });
        } else if (choice === 'once') {
          self.speakPage(text, lang, { consent: 'once' });
        } else {
          self.announce(t('voiceDeclined', lang));
          self.maybeResumeCommands();
        }
      });
    });
  }

  speakPage(text, lang, speakOpts) {
    const self = this;
    speak(text, {
      language: lang,
      consent: speakOpts.consent,
      onStart: function () { self.updateControls(); },
      onEnd: function () {
        self.updateControls();
        self.maybeResumeCommands();
      },
      onError: function () {
        self.updateControls();
        self.announce(t('voiceError', lang));
        self.maybeResumeCommands();
      }
    });
  }

  stopAll(announceIt) {
    const lang = this.lang();
    const wasActive = isSpeaking() || this.listening || (this.guide && this.guide.isActive());
    if (this.guide) this.guide.stop('user');
    stopSpeaking();
    this.continuousCommands = false;
    this.recognitionLangFallback = false;
    this.lastPromptKey = null;
    this.promptSpeakGen += 1;
    this.stopCommandsWatchdog();
    this.stopRecognitionOnly();
    this.updateControls();
    if (announceIt && wasActive) this.announce(t('voiceStopped', lang));
  }

  stopRecognitionOnly() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }
    this.listening = false;
  }

  // One tap opens the microphone and it stays open: the recognizer
  // restarts itself after pauses (see voice-input.js) and every
  // utterance is handled, across views, until the user taps the
  // button again, says "stop", taps Stop, or leaves the site. Only
  // one listener may run at a time, so starting commands ends a
  // running guide, and starting the guide ends commands.
  toggleVoiceCommands() {
    if (this.listening || this.continuousCommands) {
      this.stopContinuousCommands();
      return;
    }
    if (this.guide && this.guide.isActive()) this.guide.stop('teardown');
    this.voiceAnnouncementsOn = true;
    stopSpeaking();
    this.continuousCommands = true;
    this.recognitionLangFallback = false;
    this.listening = true;
    this.lastPromptKey = null;
    this.updateControls();
    this.startContinuousRecognition(this.recognitionLang());
    this.startCommandsWatchdog();
    // If the mic opens on a question screen, read the question at
    // once so the user can answer without saying anything first.
    this.speakCurrentScreenPrompt(false);
  }

  stopContinuousCommands() {
    this.continuousCommands = false;
    this.recognitionLangFallback = false;
    this.lastPromptKey = null;
    this.promptSpeakGen += 1;
    this.stopCommandsWatchdog();
    this.stopRecognitionOnly();
    this.updateControls();
  }

  // The watchdog rescues a microphone that died silently: a lost
  // speech-end event, a failed resume, a backgrounded tab. Every few
  // seconds it checks that continuous mode still has a live session,
  // and restarts it when nothing is live and nothing is speaking.
  // The normal pause-while-speaking is untouched (isSpeaking() is
  // true then, and read-aloud owns its own resume flag).
  startCommandsWatchdog() {
    const self = this;
    this.stopCommandsWatchdog();
    this.commandsWatchdog = setInterval(function () {
      self.maybeRestartCommands();
    }, 5000);
  }

  stopCommandsWatchdog() {
    if (this.commandsWatchdog) {
      clearInterval(this.commandsWatchdog);
      this.commandsWatchdog = null;
    }
  }

  maybeRestartCommands() {
    if (!this.continuousCommands) return;
    if (this.listening || this.recognition) return;
    if (this.guide && this.guide.isActive()) return;
    if (isSpeaking()) return;
    if (this.resumeCommandsAfterSpeech) {
      // A read-aloud ended without its resume firing: rescue it.
      this.maybeResumeCommands();
      return;
    }
    this.listening = true;
    this.startContinuousRecognition(this.recognitionLang());
    this.updateControls();
  }

  startContinuousRecognition(lang) {
    const self = this;
    const token = (this.recognitionToken += 1);
    this.commandLang = lang;
    this.recognition = startVoiceRecognition({
      language: lang,
      continuous: true,
      onResult: function (transcript) { self.handleCommand(transcript); },
      onError: function (message, code) {
        // A stale session's late error must not kill the live one.
        if (token !== self.recognitionToken) return;
        if (code === 'language-not-supported' && !self.recognitionLangFallback) {
          // Amharic recognition is not available on this device:
          // keep listening in English instead of closing the mic.
          self.recognitionLangFallback = true;
          self.listening = true;
          self.startContinuousRecognition('en');
          self.announce(t('guideLangFallback', self.currentLang()));
          return;
        }
        self.stopContinuousCommands();
        const denied = code === 'not-allowed' || /not-allowed|denied/i.test(String(message || ''));
        self.announce(t(denied ? 'voiceNoMicrophone' : 'voiceCommandError', self.currentLang()));
      },
      onRecurringError: function () {
        if (token !== self.recognitionToken) return;
        // The wrapper keeps retrying in the background; warn once so
        // the user knows the microphone is struggling.
        self.announce(t('voiceCommandError', self.currentLang()));
      },
      onEnd: function () {
        // Fires only on a real stop (the wrapper restarts itself
        // after routine ends while continuous mode is on). The mode
        // flag is untouched here: speakResponse pauses by stopping
        // and resumes from its own callback. A stale session's late
        // end must not clear the live session's state.
        if (token !== self.recognitionToken) return;
        self.listening = false;
        self.recognition = null;
        self.updateControls();
      }
    });
  }

  handleCommand(transcript) {
    try {
      this.handleCommandInner(transcript);
    } finally {
      // Whatever the utterance did, the screen may have changed: if
      // continuous listening is still on and a question, success, or
      // error screen is now showing, read it aloud — that is what
      // carries the user from one question to the next by voice.
      this.speakCurrentScreenPrompt(false);
    }
  }

  handleCommandInner(transcript) {
    const lang = this.currentLang();
    const matched = matchVoiceCommand(transcript);
    if (matched) {
      if (matched.action === 'stop') {
        this.stopAll(true);
        return;
      }
      if (matched.action === 'read') {
        this.readCurrentPage();
        return;
      }
      if (matched.action === 'help') {
        this.announce(t('voiceHelp', lang));
        this.speakResponse(t('voiceHelp', lang), lang);
        return;
      }
      if (matched.action === 'view') {
        this.setView(matched.view);
        return;
      }
    }
    // No navigation command matched: on a question screen, the
    // utterance may be an answer ("Amharic standard", "1 and 3", a
    // spoken name) or a guide command ("repeat", "done", "back").
    if (this.answerQuestionByVoice(transcript, lang)) return;
    this.announce(t('voiceUnknownCommand', lang));
    this.speakResponse(t('voiceUnknownCommand', lang), lang);
  }

  // Answer the current question screen by voice, through the same
  // interpretation the guide uses. Returns true when the transcript
  // was handled (an answer, a guide command that applies here, or a
  // retry on the registration error card).
  answerQuestionByVoice(transcript, lang) {
    const question = this.readCurrentQuestion();
    const guideAction = matchGuideCommand(transcript);
    if (!question) {
      // No question on screen: a failed registration shows an error
      // card whose retry button "retry" can press by voice.
      if (guideAction === 'retry') {
        const content = this.getContent();
        const retryBtn = content && content.querySelector
          ? content.querySelector('.ik-retry-onboarding')
          : null;
        if (retryBtn) {
          retryBtn.click();
          return true;
        }
      }
      return false;
    }
    if (guideAction === 'repeat' || guideAction === 'retry') {
      this.speakCurrentScreenPrompt(true);
      return true;
    }
    if (guideAction === 'done' || guideAction === 'skip' || guideAction === 'back') {
      if (applyGuideAction(question, guideAction)) {
        this.afterAnswerHandled();
        return true;
      }
      // 'done' on a single-answer screen, 'skip' on a required one, or
      // 'back' on the first screen: say why it did not apply.
      const key = guideAction === 'back' ? 'guideBackFirst' : 'guideRequired';
      this.speakResponse(t(key, lang), lang);
      return true;
    }
    if (guideAction) return false;
    const answer = interpretAnswer(question, transcript);
    if (!answer) return false;
    fillAnswer(question, answer);
    if (answer.kind === 'checkbox') {
      const selected = question.options.filter(function (opt) {
        return opt.el && opt.el.checked;
      });
      const text = selected.length === 0
        ? t('guideNoneSelected', lang)
        : t('guideSelected', lang) + ' ' + selected.map(function (opt) {
          return opt.label;
        }).join(', ');
      this.speakResponse(text, lang);
      return true;
    }
    // Next stops any speech, so confirm after advancing. A spoken
    // value is never echoed back through the remote service: the
    // confirmation is generic, exactly as in the guide. Option labels
    // are UI text and may be spoken.
    question.nextBtn.click();
    const text = answer.kind === 'text'
      ? t('guideGotIt', lang)
      : t('guideHeard', lang) + ' ' + question.options[answer.index].label;
    this.speakResponse(text, lang);
    this.afterAnswerHandled();
    return true;
  }

  // The screen may have switched language (the language chooser
  // answer). If listening is live, restart it in the new language;
  // if a spoken response paused it, the resume already re-reads the
  // language, so this does nothing.
  afterAnswerHandled() {
    if (this.continuousCommands && this.listening) {
      const newLang = this.recognitionLang();
      if (newLang !== this.commandLang) {
        this.stopRecognitionOnly();
        this.listening = true;
        this.startContinuousRecognition(newLang);
      }
    }
  }

  // Read the current screen aloud in continuous commands mode: the
  // question prompt (heading, label, help, numbered options), the
  // congratulations on the success card, the already-registered
  // message, or the error message with its retry hint. This is what
  // turns voice commands into a guided flow: say "registration",
  // hear each question, answer it, hear the next one, until the
  // congratulations. It waits for the screen to settle (loading,
  // re-renders, asynchronous validation) and for in-flight speech
  // (confirmations) to finish, speaks each screen once per arrival,
  // and a newer request supersedes a polling one. 'force' re-speaks
  // the current screen at once (the "repeat" command). Silent when
  // continuous mode is off, when the guide is running, or on views
  // without a question, success, already-registered, or error screen.
  speakCurrentScreenPrompt(force) {
    if (!this.continuousCommands) return;
    if (force) this.lastPromptKey = null;
    const gen = (this.promptSpeakGen += 1);
    const self = this;
    (async function () {
      const started = Date.now();
      while (Date.now() - started < 8000) {
        if (gen !== self.promptSpeakGen || !self.continuousCommands) return;
        if (!force && isSpeaking()) {
          await sleep(250);
          continue;
        }
        const state = self.guide ? self.guide.readScreenState() : { kind: 'unknown' };
        if (state.kind === 'loading') {
          await sleep(300);
          continue;
        }
        if (state.kind === 'question') {
          const key = 'q:' + state.id + ':' + (state.errorText || '');
          if (!force && key === self.lastPromptKey) {
            // Same screen as before: it may still be settling (some
            // screens validate asynchronously), so keep watching
            // instead of giving up — the prompt for the next screen
            // must still be spoken when it arrives.
            await sleep(300);
            continue;
          }
          self.lastPromptKey = key;
          const lang = detectGuideLanguage(state.heading + ' ' + state.label, self.lang());
          const text = (state.errorText ? state.errorText + ' ' : '')
            + buildQuestionPrompt(state, lang);
          self.speakResponse(text, lang);
          return;
        }
        if (state.kind === 'success') {
          if (!force && self.lastPromptKey === 'success') {
            await sleep(300);
            continue;
          }
          self.lastPromptKey = 'success';
          const lang = detectGuideLanguage(state.title + ' ' + state.message, self.currentLang());
          const text = t('guideComplete', lang) + (state.message ? ' ' + state.message : '');
          self.speakResponse(text, lang);
          return;
        }
        if (state.kind === 'already') {
          if (!force && self.lastPromptKey === 'already') {
            await sleep(300);
            continue;
          }
          self.lastPromptKey = 'already';
          const lang = detectGuideLanguage(state.title + ' ' + state.message, self.currentLang());
          const text = (state.title ? state.title + ' ' : '') + (state.message || '');
          if (text) self.speakResponse(text, lang);
          return;
        }
        if (state.kind === 'error') {
          const key = 'error:' + (state.message || '');
          if (!force && key === self.lastPromptKey) {
            await sleep(300);
            continue;
          }
          self.lastPromptKey = key;
          const lang = detectGuideLanguage(state.message, self.currentLang());
          const text = (state.message ? state.message + ' ' : '') + t('guideRetryPrompt', lang);
          self.speakResponse(text, lang);
          return;
        }
        return;
      }
    })();
  }

  // Automatic greeting + hands-free guide. Runs once per session unless
  // the user finished it or stopped it; anything else (denied
  // microphone, speech failure) leaves the next page load free to try
  // again. The host can disable it with the autoVoiceGuide mount
  // option, and restart it any time with startGuide().
  maybeAutoStartGuide() {
    const state = getGuideSessionState();
    if (state === 'done' || state === 'stopped') return false;
    return this.startGuide();
  }

  startGuide() {
    if (!this.guide || this.guide.isActive()) return false;
    // Only one listener at a time: continuous commands end so the
    // guide's per-question listening can run.
    this.stopContinuousCommands();
    this.guide.start();
    return true;
  }

  // Called after a view change (focus has already moved to the heading).
  // Screen readers announce the heading; this only adds a live-region
  // fallback when there is no heading, plus spoken view names for users
  // who have already used a voice feature in this session.
  onViewChanged(viewId) {
    // A view change the user made by hand ends the guide: the screens it
    // was driving are gone. The guide's own navigation sets
    // suspendNavStop so it is not stopped by its own move.
    if (this.guide && this.guide.isActive() && !this.guide.suspendNavStop) {
      this.guide.stop('teardown');
    }
    const lang = this.lang();
    const content = this.getContent();
    const heading = content && typeof content.querySelector === 'function'
      ? content.querySelector('h1, h2')
      : null;
    if (!heading) this.announce(t(viewId, lang));
    if (this.voiceAnnouncementsOn && !(this.guide && this.guide.isActive())) {
      // In continuous commands mode, arriving on a question, success,
      // or error screen speaks the screen itself instead of the view
      // name: the prompt is what the user needs to hear next.
      if (this.continuousCommands && this.guide) {
        const state = this.guide.readScreenState();
        if (state.kind === 'question' || state.kind === 'success' || state.kind === 'already' || state.kind === 'error') {
          this.speakCurrentScreenPrompt(false);
          return;
        }
      }
      this.speakResponse(t(viewId, lang), lang);
    }
  }

  // Informed consent before any page text is sent to the remote speech
  // service. Native <dialog>: focus-trapped, Esc closes, focus returns to
  // the invoker. Resolves 'granted' | 'once' | 'dismissed'. Nothing is
  // stored for 'dismissed', so the user is asked again next time.
  requestConsent() {
    if (this.consentPromise) return this.consentPromise;
    const lang = this.lang();
    const self = this;
    this.consentInvoker = document.activeElement;

    this.consentPromise = new Promise(function (resolve) {
      self.consentResolve = resolve;

      const dialog = document.createElement('dialog');
      dialog.className = 'ik-voice-consent-dialog';
      dialog.setAttribute('lang', lang);
      const titleId = 'ik-voice-consent-title';
      dialog.setAttribute('aria-labelledby', titleId);

      const title = document.createElement('h2');
      title.id = titleId;
      title.className = 'ik-voice-consent-title';
      title.textContent = t('voiceConsentTitle', lang);
      dialog.appendChild(title);

      const body = document.createElement('p');
      body.className = 'ik-voice-consent-body';
      body.textContent = t('voiceConsentBody', lang);
      dialog.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'ik-voice-consent-actions';

      let choice = 'dismissed';
      function addChoiceButton(label, className, value, focusIt) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = className;
        btn.textContent = label;
        btn.addEventListener('click', function () {
          choice = value;
          dialog.close();
        });
        actions.appendChild(btn);
        if (focusIt) self.consentFocusButton = btn;
        return btn;
      }

      addChoiceButton(t('voiceConsentSession', lang), 'ik-btn ik-btn-primary ik-btn-sm', 'granted', true);
      addChoiceButton(t('voiceConsentOnce', lang), 'ik-btn ik-btn-secondary ik-btn-sm', 'once', false);
      addChoiceButton(t('voiceConsentDecline', lang), 'ik-btn ik-btn-secondary ik-btn-sm', 'dismissed', false);
      dialog.appendChild(actions);

      dialog.addEventListener('close', function () {
        const resolveFn = self.consentResolve;
        self.consentDialog = null;
        self.consentResolve = null;
        self.consentPromise = null;
        dialog.remove();
        if (resolveFn) resolveFn(choice);
        const invoker = self.consentInvoker;
        self.consentInvoker = null;
        if (invoker && typeof invoker.focus === 'function' && document.contains(invoker)) {
          invoker.focus();
        }
      });

      const parent = self.getRoot() || document.body;
      parent.appendChild(dialog);
      self.consentDialog = dialog;
      try {
        dialog.showModal();
      } catch (e) {
        // showModal can fail if the dialog is already open; treat as dismissed.
        self.consentDialog = null;
        self.consentResolve = null;
        self.consentPromise = null;
        dialog.remove();
        resolve('dismissed');
        return;
      }
      if (self.consentFocusButton) self.consentFocusButton.focus();
    });
    return this.consentPromise;
  }

  cancelPending() {
    if (this.guide) this.guide.stop('teardown');
    if (this.consentDialog) {
      try { this.consentDialog.close(); } catch (e) {}
    }
    this.continuousCommands = false;
    this.recognitionLangFallback = false;
    this.lastPromptKey = null;
    this.promptSpeakGen += 1;
    this.stopCommandsWatchdog();
    this.stopRecognitionOnly();
  }

  destroy() {
    this.cancelPending();
    this.statusEl = null;
  }
}
