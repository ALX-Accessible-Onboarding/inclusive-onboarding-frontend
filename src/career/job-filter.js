export const SUPPORT_TO_ACCOMMODATION_MAP = {
  read_aloud: ['read_aloud'],
  larger_text: ['screen_reader_friendly'],
  voice_input: ['voice_application'],
  more_time: ['flexible_hours', 'extra_interview_time'],
  sign_language: ['sign_language_interpreter'],
  other: ['other']
};

export function getMatchingAccommodations(need) {
  return SUPPORT_TO_ACCOMMODATION_MAP[need] || [need];
}

export function filterJobsBySupport(jobs, selectedNeeds) {
  if (!jobs || !Array.isArray(jobs)) return [];
  if (!selectedNeeds || !selectedNeeds.length) return jobs;
  const targets = new Set();
  selectedNeeds.forEach(need => (SUPPORT_TO_ACCOMMODATION_MAP[need] || [need]).forEach(a => targets.add(a)));
  return jobs.filter(j => Array.isArray(j.accommodations) && j.accommodations.some(a => targets.has(a)));
}
