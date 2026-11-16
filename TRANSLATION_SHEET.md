# Translation sheet — Somali, Afaan Oromoo, Tigrinya

Status (updated 2026-11-15, after the co-designer request): DRAFT translations for all 87 UI strings and 17 support/accommodation labels are now IN the code (src/labels.js) — the toggle switches the visible words in all five languages. They are AI-drafted from knowledge: Google Translate was blocked and MyMemory's free quota was exhausted, so no translation API could be used. Every Somali, Oromo, and Tigrinya string MUST be reviewed and corrected by a native speaker before any claim of correctness — fix them directly in src/labels.js (same key, same field). This sheet is now the review checklist: the English column is what each key must mean.

Voice status (verified 2026-11-15): Somali has a real voice (Edge: Ubax female / Muuse male). Afaan Oromoo and Tigrinya have NO voice in the Edge service (checked live: 318 voices, 142 locales, no om-ET or ti-ET) — recognition is wired (om-ET / ti-ET) with English fallback, speech uses a genuine local voice when the device has one and otherwise says honestly that no voice is available.

Full-content translation (2026-11-15, second pass): ALL flow content is now translated too, not just the header/labels — the onboarding screens B1–B10 (titles, labels, help text, placeholders, read-aloud text, option labels), the profile view and its edit forms, the employer form, the job-apply flow, the career gateway (subtitle, search, count bar, empty state, pagination, read-aloud speech), validation messages, voice-input error messages, and the 4 demo jobs (titles, employers, descriptions). They live in src/content-translations.js (164 entries, keyed by the exact English text) plus JOB_TRANSLATIONS in src/labels.js, reached through pickLang() — English and Amharic render exactly as before. The language chooser now offers 7 options (English standard/simple, Amharic standard/simple, Somali, Oromo, Tigrinya standard) and the voice guide understands spoken language names in all five languages. Same DRAFT warning: every Somali/Oromo/Tigrinya string here is AI-drafted and needs native-speaker review — fix them in src/content-translations.js (same English key) or JOB_TRANSLATIONS. Still English-only: server error messages from the backend (src/api-client.js — they arrive from the live Render backend, this repo cannot translate them), jobs posted through the live backend (only the 4 demo jobs have translations; a posted job shows in the poster's language), and the dev harness page (index.html, not part of the product).

How to fill this in: a native speaker writes each string in their language. Only real translations — never guess. When a column is filled, the strings drop into src/labels.js (UI_STRINGS keys, LABELS groups) and the voice speaks them in that language automatically.

## UI strings (t)

| Key | English | Somali (so) | Afaan Oromoo (om) | Tigrinya (ti) |
|---|---|---|---|---|
| onboarding | Sign Up |  |  |  |
| profile | My Profile |  |  |  |
| career | Career Gateway |  |  |  |
| employer | Post a Job |  |  |  |
| save | Save |  |  |  |
| saving | Saving... |  |  |  |
| cancel | Cancel |  |  |  |
| edit | Edit |  |  |  |
| back | Back |  |  |  |
| next | Next |  |  |  |
| submit | Submit |  |  |  |
| submitting | Submitting... |  |  |  |
| close | Close |  |  |  |
| apply | Apply Now |  |  |  |
| readAloud | Read to me |  |  |  |
| speakToMe | Speak to me |  |  |  |
| stopReading | Stop reading |  |  |  |
| micStart | Speak answer |  |  |  |
| micListening | Listening... speak clearly |  |  |  |
| micConfirm | Is this right? Confirm or edit. |  |  |  |
| confirm | Confirm |  |  |  |
| privateBadge | Private |  |  |  |
| privateNotice | Stored privately. No medical proof needed. |  |  |  |
| addIdLater | Add my ID later |  |  |  |
| idPendingReview | Partner referral pending review |  |  |  |
| filterBySupport | Support I need (filtered on your device) |  |  |  |
| allJobs | All Jobs |  |  |  |
| plainLanguageSummary | Plain-language summary |  |  |  |
| standardView | Original description |  |  |  |
| noJobsFound | No jobs match your selected support criteria. |  |  |  |
| applicationSubmitted | Application submitted successfully! |  |  |  |
| employerSuccess | Job posted successfully! |  |  |  |
| accommodationsAvailable | Accommodations available: |  |  |  |
| clearFilters | Clear all filters |  |  |  |
| loadError | Could not load jobs. |  |  |  |
| at | at |  |  |  |
| description | Description: |  |  |  |
| workFromHome | Work from home (Remote). |  |  |  |
| trainingProvided | Training is provided. |  |  |  |
| voiceReadPage | Read this page |  |  |  |
| voiceStop | Stop voice |  |  |  |
| voiceCommands | Voice commands |  |  |  |
| voiceListening | Listening… |  |  |  |
| voiceConsentTitle | Use the Amharic voice service? |  |  |  |
| voiceConsentBody | Amharic speech is made by Google Gemini. The text on this page will be sent to Google to make audio. Your typed answers, passwords and ID numbers are not sent. |  |  |  |
| voiceConsentSession | Allow for this session |  |  |  |
| voiceConsentOnce | Allow this once |  |  |  |
| voiceConsentDecline | Not now |  |  |  |
| voiceDeclined | Amharic voice is off. You can still read on screen. |  |  |  |
| voiceUnavailable | Voice is not available on this device. You can still use the keyboard and type. |  |  |  |
| voiceServiceUnavailable | The Amharic voice service is not available here. If you are testing locally, run the app with Vercel dev. |  |  |  |
| voiceNotConfigured | The Amharic voice service is not set up yet. The server has no API key. |  |  |  |
| voiceError | Sorry, the voice service could not speak that. Please try again. |  |  |  |
| voiceStopped | Voice stopped. |  |  |  |
| voiceNothingToRead | There is nothing to read on this page yet. |  |  |  |
| voiceHelp | You can say: read page, stop, help, career, profile, onboarding, post a job, next page, previous page, page 2, apply, apply 2, or click any button by name. |  |  |  |
| voiceUnknownCommand | I did not understand that. Say help for what you can say. |  |  |  |
| voiceCommandError | Voice commands did not work. Please use the keyboard or type instead. |  |  |  |
| voiceNoMicrophone | Microphone access was denied. Voice commands need microphone permission, or you can type instead. |  |  |  |
| guideGreeting | Welcome to Savanna Accessible Learning. |  |  |  |
| guideGreetingFollow | I will guide you through registration by voice, from your name until you finish. |  |  |  |
| guideMicPrompt | To answer by voice, please allow microphone access when your browser asks. |  |  |  |
| guideMicDenied | Microphone access was blocked, so the voice guide is off. You can still use the keyboard and the buttons. |  |  |  |
| guideMicUnavailable | Voice input is not available in this browser, so the voice guide is off. You can still use the keyboard and the buttons. |  |  |  |
| guideSayAnswer | Please say your answer. |  |  |  |
| guideChooseOptions | Say the number of your choice. |  |  |  |
| guideCheckboxDone | Say the numbers you want, then say done to continue. |  |  |  |
| guideDidNotHear | I did not hear you. Please speak again. |  |  |  |
| guideUnknownAnswer | I did not understand that answer. Please try again. |  |  |  |
| guideHeard | You said: |  |  |  |
| guideGotIt | Got it. |  |  |  |
| guideSelected | Selected: |  |  |  |
| guideNoneSelected | Nothing selected yet. |  |  |  |
| guideHelp | Answer by voice. Say a number to choose an option. Say back to go to the previous question, repeat to hear the question again, or stop to end the voice guide. |  |  |  |
| guideStopped | Voice guide stopped. |  |  |  |
| guideComplete | Congratulations! Registration completed. Welcome to Savanna! |  |  |  |
| guideError | Something went wrong with the voice guide. You can continue with the keyboard and the buttons. |  |  |  |
| guideListening | Listening. Please speak your answer. |  |  |  |
| guideTapToStart | Tap anywhere or press any key to start the voice guide. |  |  |  |
| guideLangFallback | Amharic voice understanding is not available on this device. Please answer with numbers or English words. |  |  |  |
| guideSkipHint | You can say skip to leave this empty. |  |  |  |
| guideBackFirst | You are on the first question. |  |  |  |
| guideRequired | This question needs an answer before continuing. |  |  |  |
| guideGiveUp | I could not hear a clear answer. The voice guide is off, but you can still type or use the buttons. |  |  |  |
| guideRetryPrompt | Say retry to try again, or stop to end the voice guide. |  |  |  |
| guideStillWorking | Registration is still being processed. Please wait a little longer. |  |  |  |
| guideLanguagePrompt | Choose your language. Say 1 for English, 2 for English simple with icons, 3 for Amharic, 4 for Amharic simple with icons. Or just say English or Amharic. |  |  |  |

## Support / accommodation labels

| Group | Value | English | Somali (so) | Afaan Oromoo (om) | Tigrinya (ti) |
|---|---|---|---|---|---|
| support | read_aloud | Read to me |  |  |  |
| support | larger_text | Larger text |  |  |  |
| support | voice_input | Speak instead of typing |  |  |  |
| support | more_time | More time |  |  |  |
| support | sign_language | Sign language |  |  |  |
| support | nav_label | Main menu |  |  |  |
| support | mode_label | Simple + Icons |  |  |  |
| support | modal_title | Savanna Accessible Access |  |  |  |
| support | close | Close |  |  |  |
| support | other | Something else |  |  |  |
| accommodation | read_aloud | Read-aloud support |  |  |  |
| accommodation | flexible_hours | Flexible hours |  |  |  |
| accommodation | screen_reader_friendly | Screen-reader friendly |  |  |  |
| accommodation | voice_application | Apply by voice |  |  |  |
| accommodation | extra_interview_time | Extra interview time |  |  |  |
| accommodation | sign_language_interpreter | Sign language interpreter |  |  |  |
| accommodation | other | Other |  |  |  |

## Also owed (not in this sheet)

- Onboarding question content (headings, options, help text) lives in the team data / backend — it needs the same three translations before the guide can ask questions in those languages. Until then the guide detects English content and speaks it in English, which is correct.
- Guide commands and spoken numbers are now matched in all five languages (DRAFT phrases, src/features/voice-guide.js). Navigation voice commands (read page, career, profile, apply, click by name) are still matched in English and Amharic only (src/features/voice-assistant.js).
- A future TTS path for Oromo/Tigrinya is Meta MMS-TTS (open models covering both languages), but it needs a self-hosted server and its licence is non-commercial (CC-BY-NC-4.0) — not a Vercel deploy, and not verified here.

## Voice agent in all five languages (2026-11-15)

The voice agent (hands-free guide + mic commands + read-aloud) now runs in all five languages. Per-language speech reality: Somali speaks through the remote voice service (Edge Ubax/Muuse, same as Amharic). Afaan Oromoo and Tigrinya have NO remote voice in any reachable service (verified live 2026-11-15) — they speak only through a genuine voice on the device, and when the device has none, the guide continues with text announcements and listening and says so honestly; nothing is ever spoken with another language's voice. Recognition listens in the kit language for all five, falling back to English listening (numbers still work) when the device has no recognizer for the language.

DRAFT strings added for this work — same review owed, fix them in src/labels.js (same key, same field): guideNoVoice ("There is no spoken voice for this language on this device. The guide will continue with text on screen and listening."), guideLangFallbackGeneric ("Voice understanding in this language is not available on this device. Please answer with numbers or English words."), voiceConsentTitleGeneric / voiceConsentBodyGeneric (consent dialog wording that names no provider and no language, used for Somali), voiceServiceUnavailableGeneric / voiceNotConfiguredGeneric (service-failure notices that name no language), voiceNoVoice ("There is no spoken voice for this language on this device."). The voice command words (src/features/voice-assistant.js: VOICE_COMMANDS, STOP_UTTERANCES, NEXT/PREV/APPLY/CLICK word lists) reuse the on-screen button words plus common verbs and are also DRAFT — a wrong command word only means that command does not match; check them with a native speaker.
