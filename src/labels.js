import { SUPPORT_NEEDS, ACCOMMODATIONS } from './vocabulary.js';

// DRAFT Amharic: reviewed and expanded for language and speech consistency
export const LABELS = {
  support: {
    read_aloud:    { en: 'Read to me',               am: 'ጮክ ብሎ ማንበብ' },
    larger_text:   { en: 'Larger text',              am: 'ትልቅ ጽሑፍ' },
    voice_input:   { en: 'Speak instead of typing',  am: 'ከመጻፍ ይልቅ በድምፅ መናገር' },
    more_time:     { en: 'More time',                am: 'ተጨማሪ ጊዜ' },
    sign_language: { en: 'Sign language',            am: 'የምልክት ቋንቋ' },
    nav_label:     { en: 'Main menu',                 am: 'ዋና ምናሌ' },
    mode_label:    { en: 'Simple + Icons',            am: 'ቀላል + ምስሎች' },
    modal_title:   { en: 'Savanna Accessible Access', am: 'የሳቫና ተደራሽ መዳረሻ' },
    close:         { en: 'Close',                     am: 'ዝጋ' },
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
  speakToMe: { en: 'Speak to me', am: 'ጮክ ብለህ አንብብልኝ' },
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
  employerSuccess: { en: 'Job posted successfully!', am: 'ስራው በተሳካ ሁኔታ ተለጠፈ!' },
  accommodationsAvailable: { en: 'Accommodations available:', am: 'የተዘጋጁ ድጋፎች፡' },
  clearFilters: { en: 'Clear all filters', am: 'ሁሉንም ማጣሪያዎች አጽዳ' },
  loadError: { en: 'Could not load jobs.', am: 'ስራዎችን መጫን አልተቻለም።' },
  at: { en: 'at', am: 'በ' },
  description: { en: 'Description:', am: 'የሥራው ዝርዝር፡' },
  workFromHome: { en: 'Work from home (Remote).', am: 'ሥራው ከቤት የሚሰራ ነው (የርቀት ሥራ)።' },
  trainingProvided: { en: 'Training is provided.', am: 'ስልጠና ይሰጣል።' },
  // Voice assistant strings (DRAFT Amharic: needs native-speaker review, as
  // with the other Amharic strings in this file).
  voiceReadPage: { en: 'Read this page', am: 'ይህን ገጽ አንብብልኝ' },
  voiceStop: { en: 'Stop voice', am: 'ድምፅ አቁም' },
  voiceCommands: { en: 'Voice commands', am: 'የድምፅ ትዕዛዞች' },
  voiceListening: { en: 'Listening…', am: 'እያዳመጥኩ ነው…' },
  voiceConsentTitle: { en: 'Use the Amharic voice service?', am: 'የአማርኛ ድምፅ አገልግሎትን መጠቀም ይፈልጋሉ?' },
  voiceConsentBody: { en: 'Amharic speech is made by Google Gemini. The text on this page will be sent to Google to make audio. Your typed answers, passwords and ID numbers are not sent.', am: 'የአማርኛ ንግግር በGoogle Gemini ይዘጋጃል። በዚህ ገጽ ላይ ያለው ጽሑፍ ድምፅ ለመሥራት ወደ Google ይላካል። የጻፍካቸው መልሶች፣ የይለፍ ቃሎች እና የመታወቂያ ቁጥሮች አይላኩም።' },
  voiceConsentSession: { en: 'Allow for this session', am: 'ለዚህ ክፍለ ጊዜ ፍቀድ' },
  voiceConsentOnce: { en: 'Allow this once', am: 'ለዚህ ጊዜ ብቻ ፍቀድ' },
  voiceConsentDecline: { en: 'Not now', am: 'አሁን አይደለም' },
  voiceDeclined: { en: 'Amharic voice is off. You can still read on screen.', am: 'የአማርኛ ድምፅ ጠፍቷል። በማያ ገጹ ላይ ማንበብ ይችላሉ።' },
  voiceUnavailable: { en: 'Voice is not available on this device. You can still use the keyboard and type.', am: 'ድምፅ በዚህ መሣሪያ ላይ አይገኝም። ኪቦርዱን ተጠቅመው መጻፍ ይችላሉ።' },
  voiceServiceUnavailable: { en: 'The Amharic voice service is not available here. If you are testing locally, run the app with Vercel dev.', am: 'የአማርኛ ድምፅ አገልግሎት እዚህ አይገኝም። በአካባቢ እየሞከሩ ከሆነ፣ መተግበሪያውን በVercel dev ያሂዱ።' },
  voiceNotConfigured: { en: 'The Amharic voice service is not set up yet. The server has no API key.', am: 'የአማርኛ ድምፅ አገልግሎት ገና አልተዘጋጀም። በአገልጋዩ ላይ API ቁልፍ የለም።' },
  voiceError: { en: 'Sorry, the voice service could not speak that. Please try again.', am: 'ይቅርታ፣ የድምፅ አገልግሎቱ ይህን ማንበብ አልቻለም። እባክዎ እንደገና ይሞክሩ።' },
  voiceStopped: { en: 'Voice stopped.', am: 'ድምፁ ቆምቷል።' },
  voiceNothingToRead: { en: 'There is nothing to read on this page yet.', am: 'በዚህ ገጽ ላይ የሚነበብ ነገር ገና የለም።' },
  voiceHelp: { en: 'You can say: read page, stop, help, career, profile, onboarding, or post a job.', am: 'እነዚህን መናገር ይችላሉ፡ ገጹን አንብብ፣ አቁም፣ እርዳታ፣ የሥራ እድሎች፣ መገለጫ፣ ምዝገባ፣ ወይም ሥራ ይለጥፉ።' },
  voiceUnknownCommand: { en: 'I did not understand that. Say help for what you can say.', am: 'ይህን አልተረዳሁም። ምን መናገር እንደሚችሉ ለማወቅ እርዳታ ይበሉ።' },
  voiceCommandError: { en: 'Voice commands did not work. Please use the keyboard or type instead.', am: 'የድምፅ ትዕዛዞች አልሰሩም። እባክዎ ኪቦርዱን ይጠቀሙ ወይም ይጻፉ።' },
  voiceNoMicrophone: { en: 'Microphone access was denied. Voice commands need microphone permission, or you can type instead.', am: 'የማይክሮፎን ፈቃድ ተከልክሏል። የድምፅ ትዕዛዞች የማይክሮፎን ፈቃድ ያስፈልጋቸዋል፣ ወይም መጻፍ ይችላሉ።' },
  // Voice guide strings (DRAFT Amharic: needs native-speaker review, as
  // with the other Amharic strings in this file). The guide greets the
  // user automatically and walks the onboarding screens by voice, so
  // these strings are spoken, never only shown on screen.
  guideGreeting: { en: 'Welcome to Savanna Accessible Learning.', am: 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ።' },
  guideGreetingFollow: { en: 'I will guide you through registration by voice, from your name until you finish.', am: 'ከስምዎ ጀምሮ እስከ ምዝገባው መጨረሻ ድረስ በድምፅ እመራዎታለሁ።' },
  guideMicPrompt: { en: 'To answer by voice, please allow microphone access when your browser asks.', am: 'በድምፅ ለመመለስ፣ አሳሽዎ ሲጠይቅ የማይክሮፎን ፈቃድ ይስጡ።' },
  guideMicDenied: { en: 'Microphone access was blocked, so the voice guide is off. You can still use the keyboard and the buttons.', am: 'የማይክሮፎን ፈቃድ ተከልክሏል፣ ስለዚህ የድምፅ መመሪያው ጠፍቷል። ኪቦርዱን እና ቁልፎቹን መጠቀም ይችላሉ።' },
  guideMicUnavailable: { en: 'Voice input is not available in this browser, so the voice guide is off. You can still use the keyboard and the buttons.', am: 'የድምፅ ግብአት በዚህ አሳሽ ላይ አይገኝም፣ ስለዚህ የድምፅ መመሪያው ጠፍቷል። ኪቦርዱን እና ቁልፎቹን መጠቀም ይችላሉ።' },
  guideSayAnswer: { en: 'Please say your answer.', am: 'እባክዎ መልስዎን ይበሉ።' },
  guideChooseOptions: { en: 'Say the number of your choice.', am: 'የምርጫዎን ቁጥር ይበሉ።' },
  guideCheckboxDone: { en: 'Say the numbers you want, then say done to continue.', am: 'የሚፈልጓቸውን ቁጥሮች ይበሉ፣ ከዚያም ለመቀጠል ተጠናቋል ይበሉ።' },
  guideDidNotHear: { en: 'I did not hear you. Please speak again.', am: 'አልሰማሁም። እባክዎ እንደገና ይናገሩ።' },
  guideUnknownAnswer: { en: 'I did not understand that answer. Please try again.', am: 'ይህን መልስ አልተረዳሁም። እባክዎ እንደገና ይሞክሩ።' },
  guideHeard: { en: 'You said:', am: 'እርስዎ ያሉት፡' },
  guideGotIt: { en: 'Got it.', am: 'ገብቶኛል።' },
  guideSelected: { en: 'Selected:', am: 'የተመረጡት፡' },
  guideNoneSelected: { en: 'Nothing selected yet.', am: 'እስካሁን ምንም አልተመረጠም።' },
  guideHelp: { en: 'Answer by voice. Say a number to choose an option. Say back to go to the previous question, repeat to hear the question again, or stop to end the voice guide.', am: 'በድምፅ ይመልሱ። አማራጭ ለመምረጥ ቁጥር ይበሉ። ወደ ቀዳሚው ጥያቄ ለመመለስ ተመለስ ይበሉ፣ ጥያቄውን እንደገና ለመስማት እንደገና ይበሉ፣ የድምፅ መመሪያውን ለማቆም አቁም ይበሉ።' },
  guideStopped: { en: 'Voice guide stopped.', am: 'የድምፅ መመሪያው ቆምቷል።' },
  guideComplete: { en: 'Congratulations! Registration completed. Welcome to Savanna!', am: 'እንኳን ደስ አለዎት! ምዝገባው ተጠናቋል። እንኳን ወደ ሳቫና ደህና መጡ!' },
  guideError: { en: 'Something went wrong with the voice guide. You can continue with the keyboard and the buttons.', am: 'በድምፅ መመሪያው ላይ ችግር ተከስቷል። በኪቦርድ እና ቁልፎች መቀጠል ይችላሉ።' },
  guideListening: { en: 'Listening. Please speak your answer.', am: 'እያዳመጥኩ ነው። እባክዎ መልስዎን ይናገሩ።' },
  guideTapToStart: { en: 'Tap anywhere or press any key to start the voice guide.', am: 'የድምፅ መመሪያውን ለመጀመር በማንኛውም ቦታ ይንኩ ወይም ማንኛውንም ቁልፍ ይጫኑ።' },
  guideLangFallback: { en: 'Amharic voice understanding is not available on this device. Please answer with numbers or English words.', am: 'የአማርኛ ድምፅ መረዳት በዚህ መሣሪያ ላይ አይሰራም። እባክዎ ቁጥሮችን ወይም የእንግሊዝኛ ቃላትን ይጠቀሙ።' },
  guideSkipHint: { en: 'You can say skip to leave this empty.', am: 'ባዶ ለማለፍ ዝለል ይበሉ።' },
  guideBackFirst: { en: 'You are on the first question.', am: 'በመጀመሪያው ጥያቄ ላይ ነዎት።' },
  guideRequired: { en: 'This question needs an answer before continuing.', am: 'ይህ ጥያቄ ከመቀጠልዎ በፊት መልስ ያስፈልገዋል።' },
  guideGiveUp: { en: 'I could not hear a clear answer. The voice guide is off, but you can still type or use the buttons.', am: 'ግልጽ መልስ መስማት አልቻልኩም። የድምፅ መመሪያው ጠፍቷል፣ ግን መጻፍ ወይም ቁልፎቹን መጠቀም ይችላሉ።' },
  guideRetryPrompt: { en: 'Say retry to try again, or stop to end the voice guide.', am: 'እንደገና ለመሞከር እንደገና ሞክር ይበሉ፣ ለማቆም አቁም ይበሉ።' },
  guideStillWorking: { en: 'Registration is still being processed. Please wait a little longer.', am: 'ምዝገባው አሁንም በመካሄድ ላይ ነው። እባክዎ ትንሽ ይጠብቁ።' },
  guideLanguagePrompt: { en: 'Choose your language. Say 1 for English, 2 for English simple with icons, 3 for Amharic, 4 for Amharic simple with icons. Or just say English or Amharic.', am: 'ቋንቋዎን ይምረጡ። እንግሊዝኛ ከፈለጉ 1 ይበሉ፣ ቀላል እንግሊዝኛ ከፈለጉ 2 ይበሉ፣ አማርኛ ከፈለጉ 3 ይበሉ፣ ቀላል አማርኛ ከፈለጉ 4 ይበሉ። ወይም እንግሊዝኛ ወይም አማርኛ ብለው መናገር ይችላሉ።' }
};

// Full translations for default jobs to guarantee Amharic text and speech consistency
export const JOB_TRANSLATIONS = {
  job_1: {
    title: { en: 'Remote VA - Customer Support', am: 'የርቀት ደንበኞች አገልግሎት ረዳት' },
    employer: { en: 'Acme Logistics', am: 'አክሜ ሎጂስቲክስ' },
    description: {
      en: 'Answer customer questions by chat and email. Training is provided. You will work from home.',
      am: 'የደንበኞችን ጥያቄዎች በቻት እና በኢሜይል መመለስ። ስልጠና ይሰጣል። ሥራው ከቤት የሚሰራ ነው።'
    }
  },
  job_2: {
    title: { en: 'Data Entry Assistant', am: 'የመረጃ ማስገቢያ ረዳት' },
    employer: { en: 'Blue Nile Services', am: 'ብሉ ናይል ሰርቪስስ' },
    description: {
      en: 'Enter records into a spreadsheet. Work is quiet and detailed. Screen readers are supported.',
      am: 'መረጃዎችን ወደ ሰንጠረዥ ማስገባት። ሥራው ጸጥ ያለና ጥንቃቄ የሚፈልግ ነው። ስክሪን አንባቢዎች ይደገፋሉ።'
    }
  },
  job_3: {
    title: { en: 'Community Outreach Assistant', am: 'የማህበረሰብ ተደራሽነት ረዳት' },
    employer: { en: 'Addis Community Trust', am: 'አዲስ ኮሚዩኒቲ ትረስት' },
    description: {
      en: 'Help visit local groups and share information. An interpreter is available for meetings.',
      am: 'የአካባቢ ቡድኖችን መጎብኘትና መረጃዎችን ማጋራት። ለስብሰባዎች አስተርጓሚ ይቀርባል።'
    }
  },
  job_4: {
    title: { en: 'Content Reviewer', am: 'የይዘት ገምጋሚ' },
    employer: { en: 'Sunrise Media', am: 'ሰንራይዝ ሚዲያ' },
    description: {
      en: 'Read short articles and check them for mistakes.',
      am: 'አጫጭር ጽሑፎችን ማንበብና ስህተቶችን መፈተሽ።'
    }
  }
};

/**
 * Returns localized job fields (title, employer, description) for the target language.
 */
export function getLocalizedJob(job, lang = 'en') {
  if (!job) return job;
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.toLowerCase().startsWith('am'));
  const translation = JOB_TRANSLATIONS[job.id];

  const title = (translation && translation.title && (isAm ? translation.title.am : translation.title.en))
    || (isAm && job.title_am)
    || job.title;

  const employer = (translation && translation.employer && (isAm ? translation.employer.am : translation.employer.en))
    || (isAm && job.employer_am)
    || job.employer;

  const description = (translation && translation.description && (isAm ? translation.description.am : translation.description.en))
    || (isAm && job.description_am)
    || job.description;

  return Object.assign({}, job, {
    title: title,
    employer: employer,
    description: description
  });
}

// Fallback phrase dictionary to translate text if an English string is passed for Amharic speech
export const TRANSLATION_MAP = {
  'welcome to savanna accessible learning': 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ',
  'please choose how you would like to proceed': 'እባክዎ እንዴት መቀጠል እንደሚፈልጉ ይምረጡ',
  'what should we call you': 'ምን ብለን እንጥራዎት',
  'your name or nickname': 'የእርስዎ ስም ወይም ቅጽል ስም',
  'how can we reach you': 'እንዴት እናገኝዎት',
  'phone number or email address': 'የስልክ ቁጥር ወይም የኢሜይል አድራሻ',
  'identification document route': 'የመታወቂያ ሰነድ መንገድ',
  'enter your id document number': 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ',
  'support you need': 'የሚያስፈልግዎት ድጋፍ',
  'read to me': 'ጮክ ብሎ ማንበብ',
  'speak to me': 'ጮክ ብለህ አንብብልኝ',
  'larger text': 'ትልቅ ጽሑፍ',
  'speak instead of typing': 'ከመጻፍ ይልቅ በድምፅ መናገር',
  'more time': 'ተጨማሪ ጊዜ',
  'sign language': 'የምልክት ቋንቋ',
  'remote va - customer support': 'የርቀት ደንበኞች አገልግሎት ረዳት',
  'data entry assistant': 'የመረጃ ማስገቢያ ረዳት',
  'community outreach assistant': 'የማህበረሰብ ተደራሽነት ረዳት',
  'content reviewer': 'የይዘት ገምጋሚ',
  'acme logistics': 'አክሜ ሎጂስቲክስ',
  'blue nile services': 'ብሉ ናይል ሰርቪስስ',
  'addis community trust': 'አዲስ ኮሚዩኒቲ ትረስት',
  'sunrise media': 'ሰንራይዝ ሚዲያ',
  'training is provided': 'ስልጠና ይሰጣል',
  'work from home': 'ሥራው ከቤት የሚሰራ ነው',
  'accommodations provided': 'የተዘጋጁ ድጋፎች',
  'description': 'የሥራው ዝርዝር'
};

/**
 * Auto-translates English phrase to Amharic if target language is Amharic.
 */
export function translateToAmharic(text) {
  if (!text || typeof text !== 'string') return text;
  // If already contains Amharic/Ethiopic script, return as is
  if (/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/.test(text)) {
    return text;
  }
  let translated = text;
  Object.keys(TRANSLATION_MAP).forEach(engKey => {
    const re = new RegExp(engKey, 'gi');
    if (re.test(translated)) {
      translated = translated.replace(re, TRANSLATION_MAP[engKey]);
    }
  });
  return translated;
}

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
