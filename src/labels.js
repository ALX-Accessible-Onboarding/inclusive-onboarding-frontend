import { SUPPORT_NEEDS, ACCOMMODATIONS } from './vocabulary.js';

// DRAFT Amharic: needs review by a native speaker before the demo.
export const LABELS = {
  support: {
    read_aloud:    { en: 'Read to me',               am: 'ጮክ ብሎ ማንበብ' },
    larger_text:   { en: 'Larger text',              am: 'ትልቅ ጽሑፍ' },
    voice_input:   { en: 'Speak instead of typing',  am: 'ከመጻፍ ይልቅ በድምፅ መናገር' },
    more_time:     { en: 'More time',                am: 'ተጨማሪ ጊዜ' },
    sign_language: { en: 'Sign language',            am: 'የምልክት ቋንቋ' },
    other:         { en: 'Something else',           am: 'ሌላ' }
  },
  accommodation: {
    read_aloud:                { en: 'Read-aloud support',        am: 'ጮክ ብሎ የማንበብ ድጋፍ' },
    flexible_hours:            { en: 'Flexible hours',            am: 'ተለዋዋጭ የሥራ ሰዓት' },
    screen_reader_friendly:    { en: 'Screen-reader friendly',    am: 'ለስክሪን አንባቢ ተስማሚ' },
    voice_application:         { en: 'Apply by voice',            am: 'በድምፅ ማመልከት' },
    extra_interview_time:      { en: 'Extra interview time',      am: 'ለቃለ መጠይቅ ተጨማሪ ጊዜ' },
    sign_language_interpreter: { en: 'Sign language interpreter', am: 'የምልክት ቋንቋ አስተርጓሚ' },
    other:                     { en: 'Other',                     am: 'ሌላ' }
  }
};

// label('accommodation', 'flexible_hours', 'am') -> Amharic text, falls back to English
export function label(group, value, lang) {
  const entry = LABELS[group] && LABELS[group][value];
  if (!entry) return value;
  return entry[lang] || entry.en;
}

// Dev check: returns the list of vocabulary values that lack a label (should be empty)
export function missingLabels() {
  const missing = [];
  [['support', SUPPORT_NEEDS], ['accommodation', ACCOMMODATIONS]].forEach(function (pair) {
    pair[1].forEach(function (value) {
      ['en', 'am'].forEach(function (lang) {
        if (!(LABELS[pair[0]][value] && LABELS[pair[0]][value][lang])) {
          missing.push(pair[0] + ':' + value + ':' + lang);
        }
      });
    });
  });
  return missing;
}