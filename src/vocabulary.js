// Shared constants. Must stay IDENTICAL to the backend's copy (API doc, section 1).
// If you change a value here, tell the backend dev.
export const ID_ROUTES = ['kebele', 'passport', 'refugee', 'other_document', 'referral'];

export const SUPPORT_NEEDS = [
  'read_aloud',
  'larger_text',
  'voice_input',
  'more_time',
  'sign_language',
  'other'
];

export const ACCOMMODATIONS = [
  'read_aloud',
  'flexible_hours',
  'screen_reader_friendly',
  'voice_application',
  'extra_interview_time',
  'sign_language_interpreter',
  'other'
];

export const LANGUAGES = ['en', 'am'];
export const MODES = ['standard', 'simple'];