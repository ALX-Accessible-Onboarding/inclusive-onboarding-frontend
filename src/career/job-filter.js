/**
 * Task E1: Client-side job filtering.
 * Crucial Privacy Guarantee: Match is client-side by set intersection;
 * no disclosure of disability is ever required or sent to the server.
 */

// Mapping of learner support needs to employer accommodations
export const SUPPORT_TO_ACCOMMODATION_MAP = {
  read_aloud: ['read_aloud'],
  larger_text: ['screen_reader_friendly'],
  voice_input: ['voice_application'],
  more_time: ['flexible_hours', 'extra_interview_time'],
  sign_language: ['sign_language_interpreter'],
  other: ['other']
};

/**
 * Returns the relevant accommodations for a given support need.
 * @param {string} need - member of SUPPORT_NEEDS
 * @returns {Array<string>} list of matching accommodation keys
 */
export function getMatchingAccommodations(need) {
  return SUPPORT_TO_ACCOMMODATION_MAP[need] || [need];
}

/**
 * Filter jobs on the client by learner's selected support needs.
 * @param {Array<Object>} jobs - list of jobs from getAllJobs()
 * @param {Array<string>} selectedNeeds - list of support needs selected by user
 * @returns {Array<Object>} filtered jobs
 */
export function filterJobsBySupport(jobs, selectedNeeds) {
  if (!jobs || !Array.isArray(jobs)) return [];
  if (!selectedNeeds || selectedNeeds.length === 0) {
    return jobs; // No filter: show all accessible jobs
  }

  // Compile the set of target accommodations corresponding to selected needs
  const targetAccommodations = new Set();
  selectedNeeds.forEach(need => {
    const matching = getMatchingAccommodations(need);
    matching.forEach(acc => targetAccommodations.add(acc));
  });

  return jobs.filter(job => {
    if (!job.accommodations || !Array.isArray(job.accommodations)) return false;
    // Client-side set intersection: Does the job offer at least one of the needed accommodations?
    return job.accommodations.some(acc => targetAccommodations.has(acc));
  });
}

