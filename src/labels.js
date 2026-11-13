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

export const UI_STRINGS = {
  onboarding: { en: 'Sign Up', am: 'ይመዝገቡ' },
  profile: { en: 'My Profile', am: 'መገለጫዬ' },
  career: { en: 'Career Gateway', am: 'የሥራ እድሎች' },
  employer: { en: 'Post a Job', am: 'ሥራ ይለጥፉ' },
  save: { en: 'Save', am: 'አስቀምጥ' },
  saving: { en: 'Saving...', am: 'በማስቀመጥ ላይ...' },
  cancel: { en: 'Cancel', am: 'ሰርዝ' },
  edit: { en: 'Edit', am: 'አስተካክል' },
  back: { en: 'Back', am: 'ተመለስ' },
  next: { en: 'Next', am: 'ቀጣይ' },
  submit: { en: 'Submit', am: 'አስገባ' },
  submitting: { en: 'Submitting...', am: 'በማስገባት ላይ...' },
  close: { en: 'Close', am: 'ዝጋ' },
  apply: { en: 'Apply Now', am: 'አሁን ያመልክቱ' },
  readAloud: { en: 'Read to me', am: 'ጮክ ብሎ አንብብልኝ' },
  stopReading: { en: 'Stop reading', am: 'ማንበብ አቁም' },
  micStart: { en: 'Speak answer', am: 'በድምፅ ይመልሱ' },
  micListening: { en: 'Listening... speak clearly', am: 'እያዳመጥኩ ነው... በግልጽ ይናገሩ' },
  micConfirm: { en: 'Is this right? Confirm or edit.', am: 'ይህ ትክክል ነው? ያረጋግጡ ወይም ያስተካክሉ።' },
  confirm: { en: 'Confirm', am: 'አረጋግጥ' },
  privateBadge: { en: 'Private', am: 'የግል' },
  privateNotice: { en: 'Stored privately. No medical proof needed.', am: 'በግል የተጠበቀ። የህክምና ማረጋገጫ አያስፈልግም።' },
  addIdLater: { en: 'Add my ID later', am: 'መታወቂያዬን ቆይቼ አስገባለሁ' },
  idPendingReview: { en: 'Partner referral pending review', am: 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ' },
  filterBySupport: { en: 'Support I need (filtered on your device)', am: 'የምፈልገው ድጋፍ (በመሳሪያዎ ላይ የተጣራ)' },
  allJobs: { en: 'All Jobs', am: 'ሁሉም ስራዎች' },
  plainLanguageSummary: { en: 'Plain-language summary', am: 'ቀላል ማጠቃለያ' },
  standardView: { en: 'Original description', am: 'መደበኛ መግለጫ' },
  noJobsFound: { en: 'No jobs match your selected support criteria.', am: 'ከተመረጠው ድጋፍ ጋር የሚዛመድ ስራ አልተገኘም።' },
  applicationSubmitted: { en: 'Application submitted successfully!', am: 'ማመልከቻዎ በተሳካ ሁኔታ ገብቷል!' },
  employerSuccess: { en: 'Job posted successfully!', am: 'ስራው በተሳካ ሁኔታ ተለጠፈ!' }
};

// label('accommodation', 'flexible_hours', 'am') -> Amharic text, falls back to English
export function label(group, value, lang) {
  const entry = LABELS[group] && LABELS[group][value];
  if (!entry) return value;
  return entry[lang] || entry.en;
}

export function t(key, lang) {
  const code = lang || 'en';
  if (UI_STRINGS[key]) {
    return UI_STRINGS[key][code] || UI_STRINGS[key].en;
  }
  return key;
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
