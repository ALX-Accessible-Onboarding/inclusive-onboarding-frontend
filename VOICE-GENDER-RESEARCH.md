# Research: matching the voice to the speaker (boy / girl)

Co-designer request: greet first in a woman's voice; when the user answers,
use their answering voice to decide — boy answers get a boy's voice, girl
answers get a girl's voice, for the rest of the session.

## Short answer

Yes, this can be handled, on the device, with no cloud service and no audio
ever leaving the phone. The approach is pitch detection on the user's first
spoken answer. It is a heuristic guess, not a certainty, so the design must
let the user override it at any time. It is NOT built in this ZIP — it needs
real-device microphone testing that cannot be faked in the headless harness.

## How it would work

1. The guide greets in the female voice (the current default in every
   language: Mekdes for Amharic, Ubax for Somali).
2. During the FIRST listen window, the page also opens the microphone raw
   stream (getUserMedia — the guide already does this once for the permission
   check) and runs it through the Web Audio API. SpeechRecognition and the raw
   stream can use the same microphone at the same time.
3. While the user speaks their first answer, a pitch estimator (autocorrelation
   over short audio frames — the standard textbook method, ~100 lines, no
   library, no model) collects the fundamental frequency (F0) of the voiced
   frames and takes the median.
4. Median F0 below ~160 Hz → male voice for the rest of the session; above
   → female voice. The voice switch uses the per-language female/male voices
   that already exist in the endpoint (Mekdes/Ameha, Ubax/Muuse).
5. The guide confirms once, in the new voice ("I will speak with a boy's
   voice — say 'girl voice' to change it"), and the choice is remembered only
   for the session. "Boy voice" / "girl voice" commands and a settings choice
   override it any time. No recording is kept: pitch numbers are computed
   live and discarded.

## What the evidence says about accuracy

Typical adult speaking pitch (standard speech-science ranges, widely
documented): adult men roughly 85–155 Hz, adult women roughly 165–255 Hz.
Adults separate fairly cleanly around 160 Hz. Children do NOT: before
puberty, boys' and girls' voices overlap heavily (both often 250–300+ Hz),
so a child will usually be read as "girl". Noisy rooms, whispering, colds,
and very short answers ("yes") make the estimate less reliable — a 1–2
second answer is the practical minimum.

So: the guess is usually right for adults, often wrong for children, and
must always be presented as a changeable preference, never as an identity
decision. Nothing about the guess is stored, uploaded, or shown to anyone.

## What the build would touch

- A small pitch module (autocorrelation + median, pure functions, unit-tested
  with synthetic tones).
- The guide's listen(): capture the raw stream during the first answer only,
  stop it the moment the answer ends.
- The speech path: a session voice-gender setting that selects the
  female/male Edge voice per language (the endpoint already resolves voices
  per language; it needs the optional voice choice plumbed through).
- "Boy voice" / "girl voice" commands in the guide and commands mode.
- Real-device testing with several Ethiopian men, women, and children,
  in a noisy room and a quiet room, before any claim about accuracy.

## What it will not do

No machine-learning model, no cloud call, no voiceprint, no recording kept,
no gender label stored or sent anywhere. If the estimate is unsure (too
short, too noisy), the voice stays female and the user is asked, not guessed.
