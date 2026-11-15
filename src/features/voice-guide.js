// Voice Guide: a hands-free, voice-driven path through onboarding for
// blind users who cannot read the on-screen voice instructions.
//
// The guide speaks first: on mount it greets the user automatically
// ("Welcome to Savanna", in English and Amharic), asks for microphone
// permission, then walks the existing onboarding screens question by
// question — language, name, contact, ID route, goals, support needs —
// until registration completes, driving the real controls (inputs,
// radios, checkboxes, Next/Back) through the DOM. It never builds a
// parallel form and never changes a screen: the same validation, the
// same backend calls, the same success screen.
//
// Speech output stays in read-aloud.js (speak/stopSpeaking) and speech
// input stays in voice-input.js (startVoiceRecognition); this file adds
// only the guide loop, the transcript interpretation, and the
// autoplay/activation handling. The question-reading, answer
// interpretation and answer-filling helpers are shared with the voice
// assistant, so the mic-button voice commands answer questions exactly
// the way the guide does — one interpretation, two entry points.
//
// Privacy: the greeting uses fixed strings only — no page text, no user
// data — so it needs no consent dialog (a blind user could not read
// one). Everything after the microphone grant is spoken because the
// user explicitly allowed the microphone for this voice interaction:
// prompts are the visible question text, and confirmations echo only
// what the user just said, through speech that stays on the device
// (see confirmValue). Profile values from previous sessions, passwords
// and stored data are never spoken by the guide. Voice is never the
// only way: Stop, the keyboard, and every button keep working, and
// saying "stop" ends the guide at any point.
//
// Autoplay honesty: browsers block <audio> playback (the remote
// Amharic path) until the first tap or keypress. The guide attempts the
// greeting immediately; when playback is blocked it waits for the
// first user activation anywhere on the page and retries. English
// greetings, and Amharic greetings on devices with a local Amharic
// voice, use SpeechSynthesis, which browsers do not block the same
// way, so they usually play at once.
import {
  speak,
  stopSpeaking,
  findVoiceForLanguage
} from './read-aloud.js';
import { startVoiceRecognition, isVoiceSupported } from './voice-input.js';
import { t } from '../labels.js';

const ETHIOPIC_RE = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/;

// The guide greets once per browser session. 'done' (registration
// completed by voice) and 'stopped' (the user ended it) both suppress
// the automatic greeting; anything else — a denied microphone, a
// speech failure — leaves the next page load free to try again.
export const GUIDE_SESSION_KEY = 'ik_voice_guide_state';

export function getGuideSessionState() {
  try {
    return sessionStorage.getItem(GUIDE_SESSION_KEY);
  } catch (e) {
    return null;
  }
}

function setGuideSessionState(value) {
  try {
    sessionStorage.setItem(GUIDE_SESSION_KEY, value);
  } catch (e) {}
}

// The kit's language can change under the guide (the first onboarding
// screen is the language chooser), and the mount language is not
// updated by that choice, so each question's language is detected from
// its own rendered text.
export function detectGuideLanguage(text, fallback) {
  if (text && ETHIOPIC_RE.test(text)) return 'am';
  if (text && /[A-Za-z]/.test(text)) return 'en';
  return fallback === 'am' ? 'am' : 'en';
}

export function normalizeTranscript(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[.,!?።؟:;'"“”«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NUMBER_WORDS_EN = {
  zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
};

const NUMBER_WORDS_AM = {
  'ዜሮ': 0, 'አንድ': 1, 'ሁለት': 2, 'ሦስት': 3, 'ሶስት': 3, 'አራት': 4,
  'አምስት': 5, 'ስድስት': 6, 'ሰባት': 7, 'ስምንት': 8, 'ዘጠኝ': 9,
  'አሥር': 10, 'አስር': 10
};

const ETHIOPIC_DIGITS = {
  '፩': 1, '፪': 2, '፫': 3, '፬': 4, '፭': 5,
  '፮': 6, '፯': 7, '፰': 8, '፱': 9, '፲': 10
};

// Every number in a transcript, in order: Latin digits ("1 and 3"),
// English and Amharic number words, and Ethiopic digits. Pure function:
// unit-tested.
export function parseNumbers(transcript) {
  const text = normalizeTranscript(transcript);
  if (!text) return [];
  const found = [];
  text.split(' ').forEach(function (token) {
    if (!token) return;
    if (/^\d+$/.test(token)) { found.push(parseInt(token, 10)); return; }
    if (ETHIOPIC_DIGITS[token] !== undefined) { found.push(ETHIOPIC_DIGITS[token]); return; }
    if (NUMBER_WORDS_EN[token] !== undefined) { found.push(NUMBER_WORDS_EN[token]); return; }
    if (NUMBER_WORDS_AM[token] !== undefined) { found.push(NUMBER_WORDS_AM[token]); return; }
  });
  return found;
}

// Guide commands, English and Amharic. Matching is whole-word based so
// a transcript with extra words still works. Order matters: 'try again'
// must be checked before 'again', and 'stop' before everything else.
export const GUIDE_COMMANDS = [
  { action: 'stop', phrases: ['stop', 'quit', 'exit', 'cancel', 'አቁም', 'ቁም'] },
  { action: 'back', phrases: ['go back', 'back', 'previous', 'ተመለስ', 'ወደ ኋላ'] },
  { action: 'help', phrases: ['help', 'what can i say', 'እርዳታ'] },
  { action: 'done', phrases: ['done', 'finished', 'continue', 'next', 'that is all', "that's all", 'ተጠናቋል', 'ቀጥል', 'ጨርሻለሁ', 'አልቋል'] },
  { action: 'skip', phrases: ['skip', 'ዝለል'] },
  { action: 'retry', phrases: ['retry', 'try again', 'እንደገና ሞክር'] },
  { action: 'repeat', phrases: ['repeat', 'say again', 'again', 'እንደገና', 'ድገም'] }
];

export function matchGuideCommand(transcript) {
  const text = ' ' + normalizeTranscript(transcript) + ' ';
  if (text.trim() === '') return null;
  for (let i = 0; i < GUIDE_COMMANDS.length; i++) {
    const command = GUIDE_COMMANDS[i];
    for (let j = 0; j < command.phrases.length; j++) {
      if (text.indexOf(' ' + command.phrases[j] + ' ') !== -1) return command.action;
    }
  }
  return null;
}

const OPTION_STOPWORDS = [
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'to', 'with', 'id',
  'የ', 'በ', 'እና', 'ወደ', 'ለ', 'ከ', 'ላይ'
];

function optionWords(label) {
  return normalizeTranscript(label).split(' ').filter(function (word) {
    return word.length >= 2 && OPTION_STOPWORDS.indexOf(word) === -1;
  });
}

// Match a spoken answer to one option by its label words ("passport",
// "ፓስፖርት", "kebele"). The option with the most/longest matching words
// wins; ties go to the first option, which is the sensible default for
// the language chooser ("English" matches both English options and
// picks standard). Pure function: unit-tested.
// A spoken language name must match the option in either script:
// "Amharic" has to find "አማርኛ (መደበኛ)" on the language chooser.
const LANGUAGE_ALIASES = [['amharic', 'አማርኛ'], ['english', 'እንግሊዝኛ']];

export function matchOptionByWords(transcript, options) {
  let text = ' ' + normalizeTranscript(transcript) + ' ';
  if (text.trim() === '' || !options || options.length === 0) return null;
  LANGUAGE_ALIASES.forEach(function (pair) {
    if (text.indexOf(' ' + pair[0] + ' ') !== -1) text += pair[1] + ' ';
    if (text.indexOf(' ' + pair[1] + ' ') !== -1) text += pair[0] + ' ';
  });
  let bestIndex = null;
  let bestScore = 0;
  options.forEach(function (opt, idx) {
    const words = optionWords(opt.label);
    let score = 0;
    words.forEach(function (word) {
      if (text.indexOf(' ' + word + ' ') !== -1) score += word.length;
    });
    if (score > bestScore) { bestScore = score; bestIndex = idx; }
  });
  return bestIndex;
}

// Match a spoken language choice on the language chooser
// ("Amharic standard", "English simple", "አማርኛ ቀላል"). Word-length
// scoring alone gets this wrong — "Amharic standard" would match
// "English (Standard)" because 'standard' is longer than the alias —
// so a spoken language name restricts the choice to that language's
// options first, and 'simple'/'ቀላል' picks the simple variant,
// otherwise the standard one. Only applies to option sets whose values
// look like language choices (en_standard, am_simple, ...); returns
// null everywhere else. Pure function: unit-tested.
export function matchLanguageOption(transcript, options) {
  if (!options || options.length === 0) return null;
  const hasLangValues = options.some(function (opt) {
    return opt.value && /^(en|am)[_-]/i.test(String(opt.value));
  });
  if (!hasLangValues) return null;
  const text = ' ' + normalizeTranscript(transcript) + ' ';
  let lang = null;
  if (text.indexOf(' amharic ') !== -1 || text.indexOf(' አማርኛ ') !== -1) lang = 'am';
  else if (text.indexOf(' english ') !== -1 || text.indexOf(' እንግሊዝኛ ') !== -1) lang = 'en';
  if (!lang) return null;
  const sameLang = [];
  options.forEach(function (opt, idx) {
    const value = String(opt.value || '').toLowerCase();
    const isAm = value.indexOf('am_') === 0 || value.indexOf('am-') === 0
      || ETHIOPIC_RE.test(String(opt.label || ''));
    if ((lang === 'am') === isAm) sameLang.push(idx);
  });
  if (sameLang.length === 0) return null;
  const wantsSimple = text.indexOf(' simple ') !== -1 || text.indexOf(' ቀላል ') !== -1;
  if (wantsSimple) {
    for (let i = 0; i < sameLang.length; i++) {
      const value = String(options[sameLang[i]].value || '').toLowerCase();
      if (value.indexOf('simple') !== -1) return sameLang[i];
    }
  }
  return sameLang[0];
}

// Interpret a spoken answer for the current question. Returns
// { kind: 'text', value }, { kind: 'radio', index }, or
// { kind: 'checkbox', selection } (an array of indices, 'all', or
// 'none') — or null when the transcript is not an answer (a command,
// or something unrecognised). Numbers win over words, and on the
// language chooser a spoken language name wins over label words (see
// matchLanguageOption). Pure function: unit-tested. Shared by the
// guide loop and the voice assistant's question answering.
export function interpretAnswer(question, transcript) {
  if (!question || !transcript) return null;
  if (question.type === 'text') {
    const value = normalizeTextAnswer(transcript, question.inputType);
    return value ? { kind: 'text', value: value } : null;
  }
  if (question.type === 'radio') {
    const numbers = parseNumbers(transcript);
    if (numbers.length > 0) {
      const idx = numbers[0] - 1;
      if (idx >= 0 && idx < question.options.length) return { kind: 'radio', index: idx };
      return null;
    }
    const langIdx = matchLanguageOption(transcript, question.options);
    if (langIdx !== null) return { kind: 'radio', index: langIdx };
    const idx = matchOptionByWords(transcript, question.options);
    return idx !== null ? { kind: 'radio', index: idx } : null;
  }
  if (question.type === 'checkbox') {
    const norm = ' ' + normalizeTranscript(transcript) + ' ';
    if (norm.indexOf(' all ') !== -1 || norm.indexOf(' ሁሉም ') !== -1) {
      return { kind: 'checkbox', selection: 'all' };
    }
    if (norm.indexOf(' none ') !== -1 || norm.indexOf(' nothing ') !== -1
      || norm.indexOf(' ምንም ') !== -1) {
      return { kind: 'checkbox', selection: 'none' };
    }
    const numbers = parseNumbers(transcript);
    const indices = [];
    numbers.forEach(function (num) {
      const idx = num - 1;
      if (idx >= 0 && idx < question.options.length && indices.indexOf(idx) === -1) {
        indices.push(idx);
      }
    });
    if (indices.length === 0) {
      const one = matchOptionByWords(transcript, question.options);
      if (one !== null) indices.push(one);
    }
    return indices.length > 0 ? { kind: 'checkbox', selection: indices } : null;
  }
  return null;
}

// A transcript that is ONLY spoken digits ("two five one nine...") or
// digit groups ("251 912") becomes one digit string. Anything else
// returns null so the caller can fall back to plain digit extraction.
export function wordsToDigits(transcript) {
  const tokens = normalizeTranscript(transcript).split(' ').filter(Boolean);
  if (tokens.length === 0) return null;
  let digits = '';
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (/^\d+$/.test(token)) { digits += token; continue; }
    if (NUMBER_WORDS_EN[token] !== undefined && NUMBER_WORDS_EN[token] <= 9) {
      digits += String(NUMBER_WORDS_EN[token]);
      continue;
    }
    if (NUMBER_WORDS_AM[token] !== undefined && NUMBER_WORDS_AM[token] <= 9) {
      digits += String(NUMBER_WORDS_AM[token]);
      continue;
    }
    return null;
  }
  return digits;
}

// Normalize a spoken answer for a text field. Phone numbers keep digits
// (and a leading +); a spoken email ("name at example dot com") becomes
// an address. Names are left exactly as spoken. Pure function:
// unit-tested.
export function normalizeTextAnswer(transcript, inputType) {
  let value = String(transcript || '').trim();
  if (!value) return '';
  const type = String(inputType || 'text').toLowerCase();
  if (type === 'tel' || type === 'email') {
    if (/(\s+at\s+|\s+dot\s+)/i.test(value)) {
      value = value.replace(/\s+at\s+/gi, '@').replace(/\s+dot\s+/gi, '.').replace(/\s+/g, '');
    }
    if (value.indexOf('@') === -1 && type === 'tel') {
      const plus = value.charAt(0) === '+' ? '+' : '';
      const digitWords = wordsToDigits(value);
      if (digitWords !== null) return plus + digitWords;
      return plus + value.replace(/[^0-9]/g, '');
    }
  }
  return value;
}

// The following DOM helpers read and drive the current question screen
// through the real controls. They are shared by the guide loop and the
// voice assistant's question answering, so both paths fill, select and
// validate exactly the way a sighted user does.

export function findQuestionScreen(content) {
  if (!content || typeof content.querySelector !== 'function') return null;
  return content.querySelector('.ik-question-screen');
}

export function readQuestionOptions(inputs) {
  return inputs.map(function (input) {
    let label = '';
    const card = input.closest ? input.closest('.ik-option-card') : null;
    const textEl = card ? card.querySelector('.ik-opt-text') : null;
    if (textEl) label = elementText(textEl);
    if (!label && input.id && typeof document !== 'undefined') {
      const labelEl = document.querySelector('label[for="' + input.id + '"]');
      label = elementText(labelEl);
    }
    return { value: input.value, label: label, el: input };
  });
}

export function readQuestionFromElement(screenEl) {
  const id = screenEl.getAttribute('data-question-id') || '';
  const heading = elementText(screenEl.querySelector('.ik-question-heading'));
  const helpText = elementText(screenEl.querySelector('.ik-help-text'));
  const labelEl = screenEl.querySelector('label.ik-label') || screenEl.querySelector('legend.ik-legend');
  const label = elementText(labelEl);
  const input = screenEl.querySelector('input.ik-input, textarea.ik-textarea');
  const radios = Array.prototype.slice.call(screenEl.querySelectorAll('input.ik-radio-input'));
  const checks = Array.prototype.slice.call(screenEl.querySelectorAll('input.ik-checkbox-input'));
  const errorEl = screenEl.querySelector('.ik-error-alert');
  const errorText = errorEl && !errorEl.classList.contains('ik-hidden') ? elementText(errorEl) : '';
  let type = 'unknown';
  let options = [];
  if (radios.length > 0) {
    type = 'radio';
    options = readQuestionOptions(radios);
  } else if (checks.length > 0) {
    type = 'checkbox';
    options = readQuestionOptions(checks);
  } else if (input) {
    type = 'text';
  }
  return {
    kind: 'question',
    id: id,
    heading: heading,
    helpText: helpText,
    label: label,
    type: type,
    options: options,
    input: input,
    inputType: input ? (input.type || 'text') : 'text',
    nextBtn: screenEl.querySelector('.ik-btn-next'),
    backBtn: screenEl.querySelector('.ik-btn-back'),
    skipBtn: screenEl.querySelector('.ik-btn-skip'),
    errorText: errorText,
    element: screenEl
  };
}

export function buildQuestionPrompt(question, lang) {
  // The language chooser gets a fixed bilingual-friendly prompt: its
  // option labels mix English and Amharic script, which no single
  // voice reads well, and numbers plus the words "English"/"Amharic"
  // are all the user needs.
  if (question.id === 'welcome_settings') return t('guideLanguagePrompt', lang);
  const parts = [];
  if (question.heading) parts.push(question.heading);
  if (question.label && question.label !== question.heading) parts.push(question.label);
  if (question.helpText) parts.push(question.helpText);
  if ((question.type === 'radio' || question.type === 'checkbox') && question.options.length > 0) {
    parts.push(question.options.map(function (opt, idx) {
      return (idx + 1) + '. ' + opt.label;
    }).join(' '));
  }
  if (question.type === 'text') {
    parts.push(t('guideSayAnswer', lang));
    if (question.skipBtn) parts.push(t('guideSkipHint', lang));
  } else if (question.type === 'radio') {
    parts.push(t('guideChooseOptions', lang));
  } else if (question.type === 'checkbox') {
    parts.push(t('guideCheckboxDone', lang));
  }
  return parts.join(' ');
}

// Fill a question with an interpreted answer, without navigating:
// text is typed (with the 'input' event the screen reads its value
// from), radios are clicked, checkboxes are toggled or set. The
// caller decides whether to press Next. Returns false when the
// answer cannot be applied.
export function fillAnswer(question, answer) {
  if (!question || !answer) return false;
  if (answer.kind === 'text') {
    if (!question.input) return false;
    question.input.value = answer.value;
    question.input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  if (answer.kind === 'radio') {
    const opt = question.options[answer.index];
    if (!opt || !opt.el) return false;
    opt.el.click();
    return true;
  }
  if (answer.kind === 'checkbox') {
    if (answer.selection === 'all' || answer.selection === 'none') {
      const checked = answer.selection === 'all';
      question.options.forEach(function (opt) {
        if (opt.el && opt.el.checked !== checked) opt.el.click();
      });
      return true;
    }
    let applied = false;
    answer.selection.forEach(function (idx) {
      const opt = question.options[idx];
      if (opt && opt.el) { opt.el.click(); applied = true; }
    });
    return applied;
  }
  return false;
}

// Apply a guide command ('done', 'skip', 'back') to the current
// question by clicking the real button. Returns false when the
// command does not apply (no such button, or 'done' on a screen
// that is not multi-select).
export function applyGuideAction(question, action) {
  if (!question) return false;
  if (action === 'done' && question.type === 'checkbox' && question.nextBtn) {
    question.nextBtn.click();
    return true;
  }
  if (action === 'skip' && question.skipBtn) {
    question.skipBtn.click();
    return true;
  }
  if (action === 'back' && question.backBtn) {
    question.backBtn.click();
    return true;
  }
  return false;
}

function stripEmojiForSpeech(text) {
  try {
    return String(text || '').replace(/[\u2190-\u21FF\u2600-\u27BF\u{1F000}-\u{1FAFF}]/gu, ' ');
  } catch (e) {
    return String(text || '');
  }
}

function elementText(el) {
  if (!el) return '';
  return stripEmojiForSpeech(el.textContent || '').replace(/\s+/g, ' ').trim();
}

function stoppedError() {
  const err = new Error('Voice guide stopped.');
  err.code = 'guide_stopped';
  return err;
}

function isStoppedError(err) {
  return Boolean(err && err.code === 'guide_stopped');
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// Only one guide may run on a page: the kit can exist twice (page +
// modal), and two guides would speak over each other.
let activeGuide = null;

export class VoiceGuide {
  constructor(options) {
    const opts = options || {};
    this.getContent = opts.getContent || function () { return null; };
    this.getRoot = opts.getRoot || function () { return null; };
    this.setView = opts.setView || function () {};
    this.getView = opts.getView || function () { return null; };
    this.getLanguage = opts.getLanguage || function () { return 'en'; };
    this.announce = opts.announce || function () {};
    this.onStateChange = opts.onStateChange || function () {};

    this.active = false;
    this.generation = 0;
    this.recognition = null;
    this.listening = false;
    this.audioUnlocked = false;
    this.recognitionLangOverride = null;
    this.suspendNavStop = false;
    this.activationWait = null;
    this.maxListenAttempts = 3;
  }

  isActive() {
    return this.active;
  }

  lang() {
    const raw = String(this.getLanguage() || 'en').toLowerCase();
    return raw === 'am' || raw.indexOf('am-') === 0 || raw.indexOf('am_') === 0 ? 'am' : 'en';
  }

  // Every await in the guide loop is followed by this check: a stop, a
  // navigation, or a re-render bumps the generation and unwinds the
  // stale run instead of letting it drive a screen that is gone.
  checkGen(gen) {
    if (!this.active || gen !== this.generation) throw stoppedError();
  }

  async start() {
    if (this.active) return false;
    if (activeGuide && activeGuide !== this) return false;
    this.active = true;
    activeGuide = this;
    this.generation += 1;
    const gen = this.generation;
    this.recognitionLangOverride = null;
    this.audioUnlocked = false;
    this.onStateChange();
    try {
      await this.run(gen);
    } catch (err) {
      if (!isStoppedError(err)) {
        try { this.announce(t('guideError', this.lang())); } catch (e) {}
      }
    } finally {
      this.finish('ended');
    }
    return true;
  }

  stop(reason) {
    const wasActive = this.active;
    this.generation += 1;
    this.stopRecognitionOnly();
    try { stopSpeaking(); } catch (e) {}
    this.cancelActivationWait();
    if (wasActive) {
      this.finish(reason === 'user' ? 'stopped' : 'ended');
    } else {
      this.onStateChange();
    }
  }

  finish(reason) {
    const wasActive = this.active;
    this.active = false;
    if (activeGuide === this) activeGuide = null;
    this.stopRecognitionOnly();
    if (reason === 'done') setGuideSessionState('done');
    if (reason === 'stopped') setGuideSessionState('stopped');
    if (wasActive) this.onStateChange();
  }

  stopRecognitionOnly() {
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }
    this.listening = false;
  }

  async run(gen) {
    const mountLang = this.lang();

    // 1. Greeting — fixed strings only, no consent dialog: a blind user
    // cannot read one, and the greeting carries no personal data.
    try {
      await this.say(t('guideGreeting', mountLang), mountLang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      this.announce(t('guideError', mountLang));
      return;
    }
    this.checkGen(gen);
    // The welcome in the other language, so an Amharic speaker hears
    // their language immediately even when the kit opens in English.
    // Non-fatal: if it cannot be spoken, the guide continues.
    const otherLang = mountLang === 'am' ? 'en' : 'am';
    try {
      await this.say(t('guideGreeting', otherLang), otherLang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
    }
    this.checkGen(gen);
    try {
      await this.say(t('guideGreetingFollow', mountLang), mountLang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      this.announce(t('guideError', mountLang));
      return;
    }
    this.checkGen(gen);

    // 2. Speech recognition must exist before asking for the microphone.
    if (!isVoiceSupported()) {
      try { await this.say(t('guideMicUnavailable', mountLang), mountLang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      this.announce(t('guideMicUnavailable', mountLang));
      return;
    }

    // 3. Microphone permission: the browser prompt is the user's
    // explicit opt-in to the voice interaction. The stream is stopped
    // at once; the guide only listens inside recognition windows.
    try {
      await this.say(t('guideMicPrompt', mountLang), mountLang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      this.announce(t('guideError', mountLang));
      return;
    }
    this.checkGen(gen);
    const mic = await this.requestMicrophone();
    this.checkGen(gen);
    if (mic === false) {
      try { await this.say(t('guideMicDenied', mountLang), mountLang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      this.announce(t('guideMicDenied', mountLang));
      return;
    }

    // 4. Move to the onboarding view (the guide drives registration).
    if (this.getView() !== 'onboarding') {
      this.suspendNavStop = true;
      try { this.setView('onboarding'); } catch (e) {}
      await sleep(150);
      this.suspendNavStop = false;
    }
    this.checkGen(gen);
    const screen = await this.waitForQuestionScreen(gen, 3000);
    if (!screen) {
      this.announce(t('guideError', mountLang));
      return;
    }

    // 5. Question loop: name to registration completed.
    let guard = 0;
    while (guard < 40) {
      guard += 1;
      this.checkGen(gen);
      const state = this.readScreenState();
      if (state.kind === 'success') {
        await this.announceCompletion(state, gen);
        this.finish('done');
        return;
      }
      if (state.kind === 'already') {
        await this.announceAlreadyRegistered(state, gen);
        this.finish('done');
        return;
      }
      if (state.kind === 'error') {
        const retry = await this.handleErrorCard(state, gen);
        if (!retry) return;
        continue;
      }
      if (state.kind === 'loading') {
        const settled = await this.waitForCompletion(gen, 30000);
        if (!settled) {
          const lang = this.lang();
          try { await this.say(t('guideStillWorking', lang), lang, gen); } catch (err) {
            if (isStoppedError(err)) throw err;
          }
          this.announce(t('guideStillWorking', lang));
          return;
        }
        continue;
      }
      if (state.kind !== 'question') {
        this.announce(t('guideError', this.lang()));
        return;
      }
      const outcome = await this.guideOneQuestion(state, gen);
      if (outcome === 'stopped') {
        this.finish('stopped');
        return;
      }
      if (outcome !== 'advanced') return;
    }
  }

  // One spoken utterance, with the two recoveries a hands-free flow
  // needs: a blocked first playback waits for the user's first tap or
  // keypress and retries once, and any other speech failure is retried
  // once after a short pause. Throws on stop and on unrecoverable
  // failure (including 'no_amharic_voice', which a retry cannot fix).
  async say(text, lang, gen, opts) {
    const speakOpts = opts || {};
    let blockedRetried = false;
    let errorRetried = false;
    for (;;) {
      this.checkGen(gen);
      try {
        await this.speakOnce(text, lang, gen, speakOpts);
        this.audioUnlocked = true;
        return;
      } catch (err) {
        if (isStoppedError(err)) throw err;
        this.checkGen(gen);
        if (err && err.code === 'audio_blocked' && !blockedRetried) {
          blockedRetried = true;
          await this.waitForActivation(lang, gen);
          continue;
        }
        if (!errorRetried && err && err.code !== 'audio_blocked' && err.code !== 'no_amharic_voice') {
          errorRetried = true;
          await sleep(800);
          this.checkGen(gen);
          continue;
        }
        throw err;
      }
    }
  }

  speakOnce(text, lang, gen, speakOpts) {
    const self = this;
    return new Promise(function (resolve, reject) {
      let settled = false;
      let failedErr = null;
      // Backstop only: a stuck utterance (no callback at all) must not
      // hang the guide forever. 45 seconds covers slow multi-chunk
      // remote speech; the common blocked case errors immediately.
      const timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        try { stopSpeaking(); } catch (e) {}
        const err = new Error('Speech timed out.');
        err.code = self.audioUnlocked ? 'speak_timeout' : 'audio_blocked';
        reject(err);
      }, 45000);
      function done() {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (failedErr) reject(failedErr);
        else resolve();
      }
      // Prefer speech that stays on the device: a genuine local Amharic
      // voice (Edge exposes the same native voices) avoids both the
      // network and the autoplay block. Otherwise the remote endpoint,
      // with the guide's opt-in (see the module header).
      const useLocal = lang === 'en'
        || Boolean(speakOpts.localOnly)
        || Boolean(lang === 'am' && findVoiceForLanguage('am-ET'));
      speak(text, {
        language: lang,
        localOnly: lang === 'am' && useLocal ? true : undefined,
        consent: lang === 'am' && !useLocal ? 'granted' : undefined,
        onStart: function () { self.onStateChange(); },
        onError: function (err) { failedErr = err; },
        onEnd: function () { done(); self.onStateChange(); }
      });
    });
  }

  waitForActivation(lang, gen) {
    const self = this;
    this.announce(t('guideTapToStart', lang));
    if (typeof window === 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      function onActivate() {
        cleanup();
        self.activationWait = null;
        resolve();
      }
      function cleanup() {
        window.removeEventListener('pointerdown', onActivate, true);
        window.removeEventListener('keydown', onActivate, true);
        window.removeEventListener('touchstart', onActivate, true);
      }
      window.addEventListener('pointerdown', onActivate, true);
      window.addEventListener('keydown', onActivate, true);
      window.addEventListener('touchstart', onActivate, true);
      self.activationWait = function () {
        cleanup();
        self.activationWait = null;
        reject(stoppedError());
      };
    });
  }

  cancelActivationWait() {
    if (this.activationWait) {
      const cancel = this.activationWait;
      this.activationWait = null;
      cancel();
    }
  }

  async requestMicrophone() {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices
        || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        return null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        stream.getTracks().forEach(function (track) {
          try { track.stop(); } catch (e) {}
        });
      } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  listen(lang, gen) {
    const self = this;
    this.checkGen(gen);
    const recognitionLang = this.recognitionLangOverride || lang;
    this.announce(t('guideListening', lang));
    // Let the spoken prompt finish ringing before opening the
    // microphone, so the recognizer does not hear the prompt itself.
    return sleep(350).then(function () {
      self.checkGen(gen);
      return new Promise(function (resolve) {
        let settled = false;
        self.listening = true;
        self.onStateChange();
        const timeoutId = setTimeout(function () {
          if (settled) return;
          settled = true;
          self.stopRecognitionOnly();
          self.onStateChange();
          resolve({ error: 'no-speech', code: 'no-speech' });
        }, 30000);
        function settle(result) {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          self.recognition = null;
          self.listening = false;
          self.onStateChange();
          resolve(result);
        }
        self.recognition = startVoiceRecognition({
          language: recognitionLang,
          onStart: function () {},
          onResult: function (transcript) { settle({ transcript: transcript }); },
          onError: function (message, code) { settle({ error: message, code: code || 'unknown' }); },
          onEnd: function (hasResult) {
            if (!hasResult) settle({ error: 'no-speech', code: 'no-speech' });
          }
        });
      });
    });
  }

  async handleListenError(heard, lang, gen) {
    const code = heard.code || '';
    if (code === 'not-allowed' || /denied/i.test(String(heard.error || ''))) {
      try { await this.say(t('guideMicDenied', lang), lang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      this.announce(t('guideMicDenied', lang));
      return 'end';
    }
    // Amharic recognition is missing on many devices. Numbers and
    // digits still work through English recognition, so the guide
    // falls back to listening in English and says so, instead of
    // abandoning a user who cannot read the screen.
    if (code === 'language-not-supported' && lang === 'am' && !this.recognitionLangOverride) {
      this.recognitionLangOverride = 'en';
      try { await this.say(t('guideLangFallback', 'am'), 'am', gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      return 'continue';
    }
    if (code === 'language-not-supported') {
      try { await this.say(t('guideMicUnavailable', lang), lang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      return 'end';
    }
    return 'retry';
  }

  readScreenState() {
    const content = this.getContent();
    if (!content || typeof content.querySelector !== 'function') return { kind: 'unknown' };
    const success = content.querySelector('.ik-success-card');
    if (success) {
      return {
        kind: 'success',
        title: elementText(success.querySelector('.ik-success-title')),
        message: elementText(success.querySelector('.ik-success-message'))
      };
    }
    const already = content.querySelector('.ik-already-registered-card');
    if (already) {
      return {
        kind: 'already',
        title: elementText(already.querySelector('.ik-already-title')),
        message: elementText(already.querySelector('.ik-already-message'))
      };
    }
    const errorCard = content.querySelector('.ik-error-card');
    if (errorCard) {
      return { kind: 'error', message: elementText(errorCard.querySelector('.ik-error-msg')) };
    }
    if (content.querySelector('.ik-loading-indicator')) return { kind: 'loading' };
    const screen = content.querySelector('.ik-question-screen');
    if (screen) return this.readQuestion(screen);
    return { kind: 'unknown' };
  }

  readQuestion(screenEl) {
    return readQuestionFromElement(screenEl);
  }

  readOptions(inputs) {
    return readQuestionOptions(inputs);
  }

  async waitForQuestionScreen(gen, budgetMs) {
    const started = Date.now();
    while (Date.now() - started < budgetMs) {
      this.checkGen(gen);
      const content = this.getContent();
      const screen = content && content.querySelector
        ? content.querySelector('.ik-question-screen')
        : null;
      if (screen) return screen;
      await sleep(200);
    }
    return null;
  }

  async waitForCompletion(gen, budgetMs) {
    const started = Date.now();
    while (Date.now() - started < budgetMs) {
      this.checkGen(gen);
      if (this.readScreenState().kind !== 'loading') return true;
      await sleep(500);
    }
    return this.readScreenState().kind !== 'loading';
  }

  // After a navigation click, wait until the screen actually leaves
  // the current question (or shows a validation error, or stops
  // being a question). Some screens validate asynchronously — the
  // contact screen checks for an existing learner — so a fixed short
  // sleep can re-read the stale screen and ask the same question
  // twice. Returns either way once the budget is spent.
  async waitForScreenChange(prevId, gen, budgetMs) {
    const budget = budgetMs || 4000;
    const started = Date.now();
    while (Date.now() - started < budget) {
      this.checkGen(gen);
      const state = this.readScreenState();
      if (state.kind !== 'question') return;
      if (state.id !== prevId) return;
      if (state.errorText) return;
      await sleep(200);
    }
  }

  async announceCompletion(state, gen) {
    const lang = detectGuideLanguage(state.title + ' ' + state.message, this.lang());
    // The success title names the learner; speak the fixed completion
    // string plus the status message (which carries no name) instead.
    try {
      await this.say(t('guideComplete', lang), lang, gen);
      if (state.message) await this.say(state.message, lang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
    }
    this.announce(t('guideComplete', lang));
  }

  async announceAlreadyRegistered(state, gen) {
    const lang = detectGuideLanguage(state.title + ' ' + state.message, this.lang());
    // The card carries no personal data: its title and message are
    // fixed UI text, so both may be spoken.
    try {
      if (state.title) await this.say(state.title, lang, gen);
      if (state.message) await this.say(state.message, lang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
    }
    this.announce(state.title || t('guideComplete', lang));
  }

  async handleErrorCard(state, gen) {
    const lang = detectGuideLanguage(state.message, this.lang());
    try {
      if (state.message) await this.say(state.message, lang, gen);
      await this.say(t('guideRetryPrompt', lang), lang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      return false;
    }
    const heard = await this.listen(lang, gen);
    if (heard.error) return false;
    const command = matchGuideCommand(heard.transcript || '');
    if (command === 'retry') {
      const content = this.getContent();
      const retryBtn = content && content.querySelector
        ? content.querySelector('.ik-retry-onboarding')
        : null;
      if (retryBtn) {
        retryBtn.click();
        await sleep(300);
        return true;
      }
    }
    return false;
  }

  buildPrompt(question, lang) {
    return buildQuestionPrompt(question, lang);
  }

  async saySelection(question, lang, gen) {
    const selected = question.options.filter(function (opt) {
      return opt.el && opt.el.checked;
    });
    if (selected.length === 0) {
      await this.say(t('guideNoneSelected', lang), lang, gen);
      return;
    }
    await this.say(t('guideSelected', lang) + ' ' + selected.map(function (opt) {
      return opt.label;
    }).join(', '), lang, gen);
  }

  // Echo a captured answer so the user can verify it. A user's own
  // spoken value is echoed ONLY through speech that stays on the
  // device: with no local voice for the language, the value is never
  // sent to the remote service just for confirmation — a generic
  // acknowledgement is spoken instead. Option labels are UI text, so
  // they may use the normal path (allowRemote).
  async confirmValue(value, lang, gen, allowRemote) {
    const text = t('guideHeard', lang) + ' ' + value;
    if (allowRemote) {
      await this.say(text, lang, gen);
      return;
    }
    try {
      await this.say(text, lang, gen, { localOnly: true });
      return;
    } catch (err) {
      if (isStoppedError(err)) throw err;
    }
    await this.say(t('guideGotIt', lang), lang, gen);
  }

  async noteMisheard(lang, gen, attempts) {
    const next = attempts + 1;
    if (next >= this.maxListenAttempts) {
      try { await this.say(t('guideGiveUp', lang), lang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
      }
      this.announce(t('guideGiveUp', lang));
      return null;
    }
    try {
      await this.say(t('guideUnknownAnswer', lang), lang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      return null;
    }
    return next;
  }

  async guideOneQuestion(question, gen) {
    const lang = detectGuideLanguage(question.heading + ' ' + question.label, this.lang());
    if (question.type === 'unknown' || !question.nextBtn) return 'ended';
    // A visible error means the previous answer failed validation: speak
    // it before asking again.
    if (question.errorText) {
      try { await this.say(question.errorText, lang, gen); } catch (err) {
        if (isStoppedError(err)) throw err;
        return 'ended';
      }
    }
    const prompt = this.buildPrompt(question, lang);
    try {
      await this.say(prompt, lang, gen);
    } catch (err) {
      if (isStoppedError(err)) throw err;
      return 'ended';
    }
    let attempts = 0;
    for (;;) {
      this.checkGen(gen);
      const heard = await this.listen(lang, gen);
      this.checkGen(gen);
      if (heard.error) {
        const outcome = await this.handleListenError(heard, lang, gen);
        if (outcome === 'end') return 'ended';
        if (outcome === 'continue') continue;
        attempts += 1;
        if (attempts >= this.maxListenAttempts) {
          try { await this.say(t('guideGiveUp', lang), lang, gen); } catch (err) {
            if (isStoppedError(err)) throw err;
          }
          this.announce(t('guideGiveUp', lang));
          return 'ended';
        }
        try { await this.say(t('guideDidNotHear', lang), lang, gen); } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      const transcript = heard.transcript || '';
      const command = matchGuideCommand(transcript);
      if (command === 'stop') {
        try { await this.say(t('guideStopped', lang), lang, gen); } catch (err) {
          if (isStoppedError(err)) throw err;
        }
        return 'stopped';
      }
      if (command === 'back') {
        if (question.backBtn) {
          question.backBtn.click();
          await this.waitForScreenChange(question.id, gen);
          return 'advanced';
        }
        try { await this.say(t('guideBackFirst', lang), lang, gen); } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      if (command === 'repeat' || command === 'retry') {
        try { await this.say(prompt, lang, gen); } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      if (command === 'help') {
        try {
          await this.say(t('guideHelp', lang), lang, gen);
          await this.say(prompt, lang, gen);
        } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      if (command === 'done' || command === 'skip') {
        if (question.type === 'checkbox') {
          // Validation runs on Next: a required screen with nothing
          // chosen shows an error, which the loop speaks and re-asks.
          question.nextBtn.click();
          await this.waitForScreenChange(question.id, gen);
          return 'advanced';
        }
        if (command === 'skip' && question.skipBtn) {
          question.skipBtn.click();
          await this.waitForScreenChange(question.id, gen);
          return 'advanced';
        }
        if (command === 'skip') {
          try { await this.say(t('guideRequired', lang), lang, gen); } catch (err) {
            if (isStoppedError(err)) throw err;
            return 'ended';
          }
          continue;
        }
        try { await this.say(prompt, lang, gen); } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      const answer = interpretAnswer(question, transcript);
      if (!answer) {
        attempts = await this.noteMisheard(lang, gen, attempts);
        if (attempts === null) return 'ended';
        continue;
      }
      if (answer.kind === 'checkbox') {
        fillAnswer(question, answer);
        try {
          await this.saySelection(question, lang, gen);
          await this.say(t('guideCheckboxDone', lang), lang, gen);
        } catch (err) {
          if (isStoppedError(err)) throw err;
          return 'ended';
        }
        continue;
      }
      fillAnswer(question, answer);
      try {
        if (answer.kind === 'text') {
          await this.confirmValue(answer.value, lang, gen, false);
        } else {
          await this.confirmValue(question.options[answer.index].label, lang, gen, true);
        }
      } catch (err) {
        if (isStoppedError(err)) throw err;
        return 'ended';
      }
      question.nextBtn.click();
      await this.waitForScreenChange(question.id, gen);
      return 'advanced';
    }
  }
}
