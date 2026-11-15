// List Amharic voices from the Gemini Extended Voice Library so the team
// can pick a native-sounding voice for GEMINI_TTS_VOICE.
//
// Reads GEMINI_API_KEY from the project's .env file (same file `vercel
// dev` reads). The key is sent only to Google's API in the request header
// and is never printed. Run with:
//   npm run voices
//
// Docs: Gemini API speech generation, "Extended Voice Library and
// filtering" (GET /v1beta/voices). Filters below use BCP-47 language tags;
// both "am" and "am-ET" are queried because library voices are tagged
// with either form. To audition voices in the browser instead, open
// https://aistudio.google.com/generate-speech

const fs = require('fs');
const path = require('path');

function readDotEnvKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return '';
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^GEMINI_API_KEY\s*=\s*(.*)$/);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

async function main() {
  const apiKey = readDotEnvKey();
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found. Put it in .env in the project root (see .env.example), then run this again.');
    process.exitCode = 1;
    return;
  }
  if (typeof fetch === 'undefined') {
    console.error('This script needs Node 18 or newer (global fetch). Check with: node -v');
    process.exitCode = 1;
    return;
  }

  const params = new URLSearchParams();
  params.append('language_code', 'am');
  params.append('language_code', 'am-ET');
  params.append('page_size', '200');
  const url = 'https://generativelanguage.googleapis.com/v1beta/voices?' + params.toString();

  let res;
  try {
    res = await fetch(url, { headers: { 'x-goog-api-key': apiKey, Accept: 'application/json' } });
  } catch (err) {
    console.error('Could not reach the Gemini API. Check your internet connection and try again.');
    process.exitCode = 1;
    return;
  }
  if (!res.ok) {
    let detail = '';
    try {
      const data = await res.json();
      if (data && data.error && data.error.message) detail = ' ' + String(data.error.message).slice(0, 200);
    } catch (e) {}
    console.error('The Gemini API answered with status ' + res.status + '.' + detail);
    console.error('If this is an authentication error, check that GEMINI_API_KEY in .env is current.');
    process.exitCode = 1;
    return;
  }

  const data = await res.json();
  const voices = Array.isArray(data.voices) ? data.voices : [];
  if (voices.length === 0) {
    console.log('No voices were returned for language_code=am / am-ET.');
    console.log('Audition voices in the browser instead: https://aistudio.google.com/generate-speech');
    console.log('Or design a custom voice there ("Voice design") and paste its voice_... ID into GEMINI_TTS_VOICE.');
    return;
  }

  console.log('Amharic voices (' + voices.length + '):\n');
  voices.forEach(function (voice, index) {
    const accent = Array.isArray(voice.accent) ? voice.accent.join(', ') : (voice.accent || '');
    console.log((index + 1) + '. ' + (voice.display_name || voice.id || '(unnamed)'));
    console.log('   id: ' + (voice.id || '(no id)'));
    console.log('   language: ' + (voice.language_code || '?') + ' | accent: ' + (accent || '?') + ' | gender: ' + (voice.gender || '?') + ' | pitch: ' + (voice.pitch || '?'));
    if (voice.description) console.log('   ' + String(voice.description).slice(0, 160));
    console.log('');
  });
  console.log('To use one: set GEMINI_TTS_VOICE=<id> in .env (paste the id exactly), restart `vercel dev`, and listen.');
  console.log('To hear samples first: https://aistudio.google.com/generate-speech');
}

main();
