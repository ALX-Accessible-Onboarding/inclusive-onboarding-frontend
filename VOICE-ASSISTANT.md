# Voice assistant — ACCESSFLOW voice integration

An accessible AI voice assistant integrated into the existing Inclusive
Access Kit. It reuses the kit's existing speech modules; it does not replace
Dev 1 or Dev 2, and it does not redesign anything.

## What it does

- **Read this page** — reads the current view aloud: headings, labels,
  instructions, buttons, errors and status messages. Profile values (name,
  contact, ID), private support needs, form values and voice transcripts are
  never collected. See `collectPageText` in
  `src/features/voice-assistant.js` for the exclusion list.
- **Navigation announcements** — screen readers already get the new heading
  via focus (mount.js). After the user has used a voice feature, view names
  are also spoken. Views without a heading get a live-region announcement.
- **Voice commands** — "read page", "stop", "help", "career", "profile",
  "registration", "post a job", in English and Amharic (see
  `VOICE_COMMANDS`). One tap on the microphone opens continuous
  listening: the microphone stays open across views until the user
  says "stop", taps Stop, or leaves the site. On a question screen,
  voice commands also answer the question — "Amharic standard",
  "1 and 3", a spoken name — through the same interpretation the
  guide uses, and each question is read aloud as it appears, with a
  spoken congratulations when registration completes. See
  "Continuous voice commands" below. Typing and keyboard always
  remain available.
- **Keyboard** — all voice controls are native buttons in the nav bar with
  the kit's existing visible focus ring and 44px targets. No pointer-only
  or voice-only path exists.
- **Voice Guide** — a hands-free path through onboarding for blind users
  who cannot read the on-screen voice instructions: an automatic
  greeting, a microphone-permission request, then the whole registration
  driven by voice. See "Voice Guide" below.

## Voice Guide (hands-free onboarding)

For a blind user, a "voice instructions" tab is itself unreadable. The
guide (`src/features/voice-guide.js`, owned by the voice assistant)
therefore speaks first and asks nothing on screen:

1. **Automatic greeting.** On mount, the kit speaks "Welcome to Savanna
   Accessible Learning" in the kit's language, then the same welcome in
   the other language, then "I will guide you through registration by
   voice, from your name until you finish." The greeting uses fixed
   strings only — no page text, no user data.
2. **Microphone permission.** The guide asks the user to allow microphone
   access when the browser asks, then requests it. The stream is stopped
   immediately; the guide only listens inside recognition windows. If
   permission is denied, the guide says so and ends — the site stays
   fully usable by keyboard and buttons.
3. **Guided registration.** The guide moves to the onboarding view and
   walks the existing screens question by question — language, name,
   contact, ID route, ID number, goals, support needs — speaking each
   question and its options, listening for the answer, filling the real
   controls, and pressing the real Next button. The same validation, the
   same backend calls, and the same success screen run as for a sighted
   user; the guide builds no parallel form. At the end it speaks
   "Registration completed" plus the success message.

Answers: say a **number** ("1", "one", "ሁለት"), an **option word**
("passport", "ፓስፖርት", "Amharic"), or the **answer itself** for text
fields (spoken phone digits and spoken emails — "name at example dot
com" — are normalized). For multi-select screens, say numbers and then
"done". Commands work at any question: **stop**, **back**, **repeat**,
**help**, **skip** (optional fields only), **retry** (after a failed
registration). The guide re-speaks validation errors and re-asks; after
three unheard answers on one question it ends with a spoken message
instead of looping forever. After each answer it waits for the screen
to actually change before asking the next question, so screens that
validate asynchronously (the contact screen's existing-learner check)
are never asked twice. If the learner is already registered, the guide
speaks the already-registered card and ends — the session is done.

**Autoplay.** Browsers block `<audio>` playback (the remote Amharic
path) until the first tap or keypress, so on a first visit the greeting
may wait: the guide attempts it immediately, and if playback is
blocked it announces "Tap anywhere or press any key to start the voice
guide" and retries at the first activation. English greetings, and
Amharic greetings on devices with a local Amharic voice (Edge exposes
the same native voices to SpeechSynthesis), use local speech and
usually play at once. Preferring a genuine local Amharic voice also
keeps the greeting off the network entirely.

**Language switching.** The first onboarding screen is the language
chooser, and the guide's prompt for it is fixed and bilingual-friendly
("Say 1 for English ... 3 for Amharic"), because its option labels mix
scripts. After the choice, the guide detects each question's language
from its own rendered text and speaks/listens in that language.

**Amharic recognition.** Many devices have no Amharic speech
recognition. When it reports `language-not-supported`, the guide says
so in Amharic and falls back to listening in English — numbers and
digits still work, so the flow can complete. (`voice-input.js` now
passes the raw recognition error code to `onError` so the guide can
tell this case from a denied microphone.)

**Control.** The guide greets once per browser session. Finishing
registration by voice, or ending it with "stop" / the Stop button,
suppresses the automatic greeting for the rest of the session; a
denied microphone or a speech failure leaves the next page load free
to try again. The host can disable it with the mount option
`autoVoiceGuide: false`, and restart it any time with
`instance.startVoiceGuide()`. The modal embed never auto-greets (only
one guide may run per page), and navigating by hand ends a running
guide. No visual changes: the guide adds no new controls or layout.

**Privacy decision (read before changing it).** The guide does not show
the consent dialog: its whole point is a user who cannot read one. The
greeting sends nothing personal (fixed strings only). Everything after
the microphone grant is spoken because the user explicitly allowed the
microphone for this voice interaction: prompts are the visible question
text, and confirmations echo only what the user just said — and only
through speech that stays on the device (`localOnly`; with no local
voice for the language, a generic "Got it" is spoken instead of sending
the value to the remote service). Profile values from previous
sessions, passwords and stored data are never spoken by the guide. The
completion announcement speaks the fixed completion string plus the
success message, not the success title (which names the learner). The
standard read-aloud consent dialog is unchanged for non-guide speech.

## Speech paths (English / Amharic only)

| Language | Speech output | Sent anywhere? |
|---|---|---|
| English | Browser SpeechSynthesis (local) | No |
| Amharic | Edge TTS native voices via `POST /api/voice/speak`, Gemini TTS fallback when a key is set | Yes, only after consent |

Amharic speech is **never** silently replaced with an English voice. If the
remote service fails, local speech is used only when a real Amharic voice
exists on the device; otherwise the user gets a clear error message and no
speech. If the user declines consent, no Amharic page text is sent and no
substitute voice speaks.

Consent is asked in a native dialog the first time Amharic reading is
requested each session: "Allow for this session", "Allow this once", or
"Not now". Session consent is stored only in `sessionStorage`
(`ik_voice_consent`); "once" is in-memory only. The dialog text states what
is sent (page text) and what is not (typed answers, passwords, ID numbers).

## Voice providers: Edge TTS first, Gemini fallback

`POST /api/voice/speak` serves Amharic through a provider chain, chosen by
`VOICE_PROVIDER` (default `auto`):

| `VOICE_PROVIDER` | Behaviour |
|---|---|
| `auto` (default) | Microsoft Edge TTS first; if it fails and `GEMINI_API_KEY` is set, Gemini TTS serves the request instead. |
| `edge` | Edge TTS only. No key needed. |
| `gemini` | Gemini TTS only. Needs `GEMINI_API_KEY`. |

**Edge TTS** is the service behind Microsoft Edge's Read Aloud feature.
It has two native Amharic neural voices — `am-ET-MekdesNeural` (female,
default) and `am-ET-AmehaNeural` (male) — which is why it is first:
native voices carry the Ethiopian accent that cross-lingual studio
voices miss. It needs no API key, no account, and no signup. Choose the
voice with `EDGE_TTS_VOICE` (only the two Amharic voices are accepted).

Edge TTS is **unofficial**: Microsoft documents no public API for it,
and the service can change or restrict access without notice. The
implementation (`api/voice/edge-tts.js`) mirrors the maintained edge-tts
reference implementation's wire protocol (WebSocket, `speech.config` +
SSML messages, MP3 audio), including its Sec-MS-GEC request token
(`api/voice/edge-drm.js`, verified against the reference with
fixed-timestamp test vectors). If Microsoft changes the protocol, the
endpoint falls back to Gemini when a key is configured, and otherwise
reports a clear error — it never silently substitutes an English voice.
Maintenance note: the token scheme and the Chromium version string in
`edge-tts.js` (`SEC_MS_GEC_VERSION`, User-Agent) track the Edge release
the reference implementation targets; if Edge TTS stops working after an
Edge release, check the reference implementation first.

**Gemini TTS** remains the fallback (and the `gemini` mode). Its setup
and model verification follow below.

## Gemini model — verified, not guessed

Verified against Google's official TTS guide (Gemini API, speech
generation) on 2026-11-14:

- API: **Interactions API** —
  `POST https://generativelanguage.googleapis.com/v1beta/interactions`
  with `response_format: { type: 'audio' }` and
  `generation_config.speech_config: [{ voice: 'Kore' }]`. The transcript is
  sent verbatim, with one short constant `speech_metadata` style
  annotation steering native Ethiopian Amharic delivery (see "Amharic
  accent" below). The language is auto-detected from the text.
- Default model: **`gemini-3.8-flash-lite-tts`** — the guide recommends it
  for read-aloud features and as the replacement for
  `gemini-3.1-flash-tts-preview`. The only other allowlisted model is
  **`gemini-3.8-flash-tts`** (higher fidelity). Both list **Amharic** as
  supported in the guide's Supported languages table.
- `gemini-3.1-flash-tts-preview` is deliberately **rejected** by the
  endpoint: it shuts down on the Gemini API on 17 Nov 2026, returns
  headerless PCM instead of WAV, and uses the older shape. Do not add it
  back without re-verifying against the current guide.
- Audio: unary Interactions responses return complete **WAV** (RIFF,
  24 kHz, mono, 16-bit PCM) by default; the endpoint forwards those bytes
  as `audio/wav`. Headerless `audio/l16` responses, if ever returned, are
  wrapped in a WAV header server-side.

Guide: https://aistudio.google.com/docs/speech-generation
(also at ai.google.dev under Gemini API docs, "Text-to-speech generation").

## Amharic accent

Amharic is spoken by default with a native voice: Edge TTS
`am-ET-MekdesNeural` (switch to the male `am-ET-AmehaNeural` with
`EDGE_TTS_VOICE`). Native voices carry the Ethiopian accent — this
replaces the earlier problem, where the default Gemini voice (Kore, a
cross-lingual studio voice) read Amharic with an American accent.

When Gemini serves a request (fallback, or `VOICE_PROVIDER=gemini`), two
levers fix its accent, strongest first:

1. **A regional voice (recommended).** The Extended Voice Library holds
   hundreds more voices across languages and regional accents. List the
   Amharic ones with the project's own key — the key never leaves the
   machine and is never printed:

   ```bash
   npm run voices
   ```

   Then set `GEMINI_TTS_VOICE=<id>` in `.env` (paste the id exactly) and
   restart `vercel dev`. To hear samples first, or to design a custom
   voice ("Voice design" in AI Studio, returns a `voice_...` ID), open
   https://aistudio.google.com/generate-speech — a designed ID works in
   `GEMINI_TTS_VOICE` too.
2. **Style steering (on by default).** Every Amharic request now carries
   one short, constant `speech_metadata` style annotation: "Native
   Ethiopian Amharic accent, natural pronunciation, clear and calm, at a
   natural pace." The transcript is still sent verbatim. Override it with
   `GEMINI_TTS_STYLE`, or set `GEMINI_TTS_STYLE=none` to send no
   annotation. Style steers delivery; it cannot fully replace a voice
   that natively carries the accent, so use lever 1 when the default
   still sounds foreign.

A related guard: Amharic is never spoken through the browser's local
speech unless the device actually has an Amharic voice. Previously, a
read-aloud request without remote consent could fall through to local
speech with `lang="am-ET"` and no voice assigned, letting the browser
substitute its default (usually English) voice — the same American-accent
symptom. Now that case reports an error and stays silent instead. The
consented "Read this page" flow is unaffected: it always uses the remote
endpoint.

## Files changed and added

Added:

- `api/voice/speak.js` — Vercel Serverless Function (CommonJS; see the
  comment at the top of the file for why). Validates requests, serves
  Amharic through the Edge TTS / Gemini provider chain (see above), and
  returns MP3 audio (Edge) or WAV audio (Gemini). Includes a `GET` health
  check (`{ available, language: 'am', provider, geminiConfigured }`).
  Gemini requests send a `speech_metadata` style annotation steering
  native Ethiopian Amharic delivery; `GEMINI_TTS_VOICE` accepts prebuilt,
  Voice design, and Extended Voice Library voice IDs.
- `api/voice/edge-tts.js` — Edge TTS WebSocket client (uses the `ws`
  package): `speech.config` + SSML messages, MP3 frame parsing, 4096-byte
  text chunking, and a 403 clock-skew retry. No key needed.
- `api/voice/edge-drm.js` — Sec-MS-GEC request-token generation, a port
  of the edge-tts reference implementation's DRM module, verified against
  known-answer vectors in `test-voice.js`.
- `src/features/voice-assistant.js` — page-text extraction, consent dialog,
  status announcements, voice commands, nav-bar controls, continuous
  listening with pause-during-speech, and question answering through
  the guide's shared helpers.
- `src/features/voice-guide.js` — the hands-free onboarding guide:
  automatic greeting, microphone-permission request, autoplay/activation
  handling, and the question-by-question voice loop that drives the real
  onboarding controls, plus the pure transcript-interpretation helpers
  (numbers, commands, option matching, phone/email normalization, the
  language-chooser rule) and the shared question reading/filling
  helpers (`readQuestionFromElement`, `interpretAnswer`, `fillAnswer`,
  `applyGuideAction`) that the voice commands reuse.
- `test-voice.js` — endpoint + client-helper tests (stubbed upstream, no
  network, no real key).
- `scripts/list-amharic-voices.js` — lists Amharic voices from the
  Extended Voice Library using the key in `.env` (never prints it).
  Run with `npm run voices`.
- `vercel.json` — build command (`npm run build`) so `dist/` exists on
  Vercel, plus a 30s function timeout for the voice endpoint.
- `VOICE-ASSISTANT.md` — this file.

Changed (focused, minimal):

- `src/features/read-aloud.js` — Amharic remote path through the endpoint
  when consented; unified stop/speaking state for local + remote audio;
  consent + endpoint configuration; text chunking and sensitive-pattern
  redaction helpers; Amharic local speech is refused unless the device
  has a genuine Amharic voice (no silent English-voice substitution);
  `speak()` accepts `localOnly` to keep one utterance on-device even
  when consent is stored (used by the guide's confirmations).
  English behaviour and all existing exports are unchanged.
- `src/features/voice-input.js` — `onError` now also receives the raw
  recognition error code as a second argument, so callers can tell a
  denied microphone from an unsupported language; and a `continuous`
  option: the recognizer delivers every final result and restarts
  itself after routine ends until stopped, swallowing routine
  silence errors. Callers that read only the message, and the
  default one-shot behaviour, are unaffected.
- `src/mount.js` — voice controls in the nav actions, status live region,
  `voiceApiUrl` mount option (default `/api/voice/speak`), navigation
  announcement hook, unified speech stop, `autoVoiceGuide` mount option
  (default `true`; the modal always disables it), and
  `startVoiceGuide()` on the instance. No layout or colour changes.
- `src/labels.js` — voice-assistant and voice-guide strings only (English
  + DRAFT Amharic; needs native-speaker review like the other Amharic
  strings).
- `src/inclusive-kit.js` — exports the `voiceAssistant` and `voiceGuide`
  namespaces.
- `src/styles/ik-components.css` — appended speaking-state + consent-dialog
  styles only. No existing selector changed.
- `src/dev-check.js` — appended a `GET /api/voice/speak` health check to
  the dev-check page.
- `package.json` — `test` now runs `test-dev2.js` and `test-voice.js`;
  added `test:voice`; added the `ws` runtime dependency for the Edge TTS
  WebSocket client. Build setup otherwise unchanged.
- `.env.example` — added `GEMINI_API_KEY` (empty), provider/voice
  overrides (`VOICE_PROVIDER`, `EDGE_TTS_VOICE`), and optional Gemini
  model/voice/style overrides.
- `README.md`, `ACCESSIBILITY-TESTING.md` — pointers/checklist only.

Unchanged on purpose: all Dev 1 / Dev 2 flows, the step engine, question
screens, profile, career gateway, employer form, API client, build setup,
colours, layout, typography and branding.

## Setup: no key needed by default (Gemini key optional)

The default provider (Edge TTS) needs no configuration at all — just
`npm install` (which installs the `ws` package) and run. The Gemini key
below is only needed for the Gemini fallback (`auto` mode) or for
`VOICE_PROVIDER=gemini`.

Optional provider/voice overrides (defaults shown):

```bash
VOICE_PROVIDER=auto
EDGE_TTS_VOICE=am-ET-MekdesNeural
```

### Gemini key (fallback only)

1. Create a key at https://aistudio.google.com/apikey (Google AI Studio).
   Do not use a key that is shared with other projects, and do not paste
   it into chat, code, HTML, browser storage, or GitHub.
2. Local development: create `.env` in the project root (it is already in
   `.gitignore` — verify with `git status` that it never shows up):

   ```bash
   GEMINI_API_KEY=paste-your-key-here
   ```

   Optional Gemini overrides (defaults shown):

   ```bash
   GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts
   GEMINI_TTS_VOICE=Kore
   ```

3. Deployment: set `GEMINI_API_KEY` in the Vercel dashboard
   (Project → Settings → Environment Variables) for Production (and
   Preview if you test preview deploys). Never commit `.env`.

The key is read only by `api/voice/speak.js` on the server. It is sent to
Google in the `x-goog-api-key` header only, never in a URL, and never
logged. The frontend never sees it: the built bundle contains no key
(verify with `grep -r "AIza" dist/` after a build — it must print nothing
unless you accidentally pasted a key into source, in which case revoke it
and remove it).

## Local testing (Vercel dev mode)

A plain static server (`python -m http.server`, `npx serve`) cannot run
`api/voice/speak.js` — Amharic voice will report "not available" there.
Use Vercel dev, which serves the static files and the function together:

```bash
npm install
npm run build
npm test            # existing Dev 2 tests + voice tests
npx vercel dev      # first run: link/create a project when asked; it reads .env
```

Then open the URL `vercel dev` prints (usually http://localhost:3000):

1. **Health check** — open http://localhost:3000/api/voice/speak in the
   browser. With no key set it returns
   `{"available":true,"language":"am","provider":"auto","geminiConfigured":false}`
   (Edge TTS needs no key); with a key, `geminiConfigured` is `true`. Also
   open `/dev-check.html` (after `npm run check`) — the last entry reports
   the voice API status.
2. **English** — language English, click **Read this page**. It must speak
   with a local browser voice and stop with **Stop voice**. No network
   request to `/api/voice/speak` should appear (check DevTools → Network).
3. **Amharic, no consent yet** — switch to አማርኛ, click **Read this page**.
   The consent dialog must appear, focus must land on its first button,
   and Esc must close it without sending anything.
4. **Amharic, consent granted** — allow for the session. The page must be
   read in Amharic (Edge TTS audio). Check DevTools → Network: a `POST`
   to `/api/voice/speak` returning `audio/mpeg`. Profile values must not
   be spoken on the Profile view.
5. **Gemini fallback** — set `VOICE_PROVIDER=gemini` in `.env` with no key,
   restart `vercel dev`, and repeat step 3: the app must show the "not set
   up" message instead of failing silently or speaking English. With a
   key set, the same mode must speak via Gemini (a `POST` returning
   `audio/wav`). Remove the override to return to the Edge default.
6. **Keyboard only** — Tab to Read / Stop / Voice commands, activate with
   Enter/Space, confirm the focus ring is visible on every control, and
   that the consent dialog traps focus and returns it on close.
7. **Voice commands** — in Chrome, tap the microphone once and say
   "read page", "stop", "help", "career". The microphone must stay
   open across views without another tap, until "stop" or the Stop
   button. If the browser/device does not support recognition (or
   Amharic recognition), a clear message must appear; typing remains
   available.
8. **Voice Guide** — load the page fresh (new tab, or clear session
   storage). The greeting must speak without any click (or after the
   first tap/keypress where the browser blocks autoplay — see "Voice
   Guide" above). Allow the microphone when asked. Answer by voice from
   the language choice to the success screen: numbers for options,
   spoken name/phone, "done" on the multi-select screens. Try "repeat",
   "back", and "stop" on the way. Deny the microphone on a fresh load:
   the guide must say so and end, leaving the screens usable by hand.
9. **Voice commands answer questions** — with the guide off
   (`autoVoiceGuide: false`), tap the microphone once on the home
   page and say "registration": onboarding must open and the
   language question must be read aloud. Say "Amharic standard":
   the Amharic option must be chosen and the next screen must be in
   Amharic, with listening continuing in Amharic. Answer every
   screen by voice: each question must be read aloud as it appears,
   each answer must advance automatically, and the success screen
   must be congratulated by voice. Say "stop": the microphone must
   close.

If audio does not play after allowing, tap **Read this page** again:
browsers can block audio that starts after a slow network fetch until the
user interacts again. The app reports blocked audio as a voice error.

## Deployment (Vercel)

```bash
# From the project root, after committing (never commit .env):
npx vercel --prod
# Or: import the GitHub repo in the Vercel dashboard (Add New → Project).
# vercel.json already sets the build command and output directory.
```

Then:

1. Optional: set `GEMINI_API_KEY` in Project → Settings → Environment
   Variables (Production) to enable the Gemini fallback. Without it,
   Amharic still works through Edge TTS. Redeploy after adding it.
2. Verify `https://<your-deployment>/api/voice/speak` returns
   `{"available":true,"language":"am","provider":"auto",...}`.
3. Verify the deployed page: English read-aloud works, Amharic asks for
   consent and then speaks, and no console errors appear.
4. For the Savanna static-pages embed: the kit is loaded from the Savanna
   host, so the relative `/api/voice/speak` would hit the wrong origin.
   Pass the deployed URL explicitly when mounting:

   ```js
   InclusiveKit.mount({
     element: '#inclusive-kit-mount',
     voiceApiUrl: 'https://<your-deployment>/api/voice/speak',
     // ... existing options
   });
   ```

   The function sends no CORS headers, so a cross-origin embed also needs
   the function deployed on the same origin as the page, or a same-origin
   proxy. Prefer deploying the kit + function together (this repo).

## Privacy notes

- English speech never leaves the device.
- Amharic page text is sent to Microsoft's Edge TTS service (default) or
  to Google's Gemini API (fallback / `gemini` mode) only after consent,
  only for the current view, and only the collected UI text — never form
  values, passwords, profile values, support needs, or transcripts.
  Email-like strings and long digit runs are redacted before sending.
- The server logs only method, status, text length and audio size — never
  the text itself, the key, or upstream response bodies.
- The Voice Guide speaks fixed greeting strings with no consent dialog,
  then — only after the microphone grant — visible question text and
  on-device-only echoes of the user's just-spoken answers. See the
  privacy decision in "Voice Guide" above before changing this.
- The API key is server-side only. If a key is ever committed or pasted
  publicly, revoke it in AI Studio immediately and replace it.

## Continuous voice commands

The microphone button (`toggleVoiceCommands`) starts **continuous**
listening: `startVoiceRecognition({ continuous: true })` delivers
every utterance and restarts itself after the browser ends a session
(pauses, silence), so one permission grant keeps the microphone open
until the user says "stop", taps the button again, taps Stop, or
leaves the site. Routine silence errors never surface; a denied
microphone or an unsupported language stops the mode with an
announcement.

**The microphone never closes on its own.** Chrome's recognition runs
through Google's servers, so a wifi blip reports a `network` error —
in continuous mode that error (and `audio-capture`,
`service-not-allowed`, and start races) restarts the session with
backoff instead of ending it; only a denied microphone stops the
mode, and an unsupported Amharic recognition falls back to listening
in English. Two more guards cover silent deaths: a watchdog checks
every 5 seconds that continuous mode still has a live session and
restarts it when nothing is live and nothing is speaking (a lost
speech-end event, a failed resume, a backgrounded tab), and returning
to the tab restarts a dead session at once. Session tokens keep a
stale session's late callbacks from killing the live one.

Every utterance is handled the same way:

1. Navigation commands (`VOICE_COMMANDS`) — stop, read, help, and the
   four views — work on every screen.
2. On a question screen, anything else is tried as an answer through
   `interpretAnswer`/`fillAnswer` (the guide's shared helpers): the
   same numbers, option words, spoken names/phones/emails, and the
   same language-chooser rule, so "Amharic standard" selects the
   Amharic option. Guide commands work too: "repeat", "done",
   "skip", "back". Confirmations follow the guide's privacy rule: a
   spoken value gets a generic "Got it", never a remote echo.
3. Anything else gets the "I did not understand" response.

After every utterance — and on arriving at a new screen — the
current screen is read aloud (`speakCurrentScreenPrompt`): the
question prompt (heading, label, help, numbered options) on a
question screen, the congratulations on the success card, the
already-registered message when the learner already has an account,
or the error message with its retry hint on the error card (where
"retry" presses the retry button by voice). The prompt waits for the
screen to settle — including screens that validate asynchronously,
like the contact screen's existing-learner check — and for
in-flight speech to finish, and is spoken once per screen; "repeat"
re-speaks it at once. Tapping the microphone while already on a
question screen reads that question immediately. So the whole
registration runs as a spoken conversation: tap the mic, say
"registration", hear each question, answer it, hear the next one,
until the congratulations.

Two details matter. First, **language follows the screen**: the
recognition language is re-read from the current question's rendered
text (`currentLang`), so answering the language chooser switches
listening to the chosen language without any tap. Second, **listening
pauses while the site speaks** — responses and read-aloud pause the
recognizer so it cannot hear the site's own voice and act on it, then
resume in the screen's language. Only one listener runs at a time:
starting commands ends a running guide, and starting the guide ends
commands.

## What could not be tested without a real key / real devices

- Actual Edge TTS audio quality and Amharic accent on a real network.
  The development environment cannot open WebSocket connections, so the
  live Edge service was never reached from it: the client was verified
  against a local mock implementing the service's wire protocol, the
  DRM token was checked byte-for-byte against the reference
  implementation, and real MP3 playback was verified in a headless
  browser — but a native Amharic speaker must listen to the real output
  on a normal network before judging-day claims.
- Actual Gemini fallback audio quality and Amharic pronunciation (no API
  key was available during development; the endpoint was tested with a
  stubbed upstream returning WAV/PCM in the documented shape).
- NVDA, TalkBack, 400% zoom and co-designer testing — see
  ACCESSIBILITY-TESTING.md. The voice checklist there must be completed
  on the target devices.
- SpeechRecognition for Amharic on the target Android devices (support
  varies by device/browser; the guide falls back to English recognition
  with a spoken notice, and the app degrades to a clear message +
  typing). Real-microphone permission behaviour and the autoplay wait
  were verified only with stubbed browser APIs in a headless browser —
  the first-tap greeting, the permission prompt, and the full spoken
  flow must be tried on a real phone and a real desktop browser.
  Continuous recognition was likewise verified only against a stub:
  Chrome's real restart behaviour after long pauses, and the
  pause-while-speaking echo guard on real hardware, still need a
  real-device pass.
- The new Amharic UI strings are drafts and need native-speaker review,
  as flagged for the existing Amharic strings. This includes the voice
  guide prompts and the Amharic number/command words.
- Long-page chunk sequencing against the live API (chunking is unit-
  tested; end-to-end sequencing with real latency was not).
