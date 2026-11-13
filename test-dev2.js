import * as api from './src/api-client.js';
import * as vocab from './src/vocabulary.js';
import * as labels from './src/labels.js';
import { filterJobsBySupport } from './src/career/job-filter.js';
import { createJobPostingJsonLd } from './src/career/jobposting-jsonld.js';

async function runTests() {
  console.log('--- Testing Dev 2 Features ---');

  // 1. Missing labels check
  const missing = labels.missingLabels();
  console.log('1. Missing labels count:', missing.length);
  if (missing.length > 0) throw new Error('Missing labels found: ' + JSON.stringify(missing));

  // 2. Test getAllJobs
  const jobs = await api.getAllJobs();
  console.log('2. Loaded jobs count:', jobs.length);
  if (jobs.length === 0) throw new Error('No jobs returned');

  // 3. Test filterJobsBySupport (Client-side Set Intersection)
  const filteredReadAloud = filterJobsBySupport(jobs, ['read_aloud']);
  console.log('3a. Jobs matching "read_aloud":', filteredReadAloud.map(j => j.title));
  if (!filteredReadAloud.some(j => j.id === 'job_1')) throw new Error('job_1 should match read_aloud');

  const filteredSignLang = filterJobsBySupport(jobs, ['sign_language']);
  console.log('3b. Jobs matching "sign_language":', filteredSignLang.map(j => j.title));
  if (!filteredSignLang.some(j => j.id === 'job_3')) throw new Error('job_3 should match sign_language');

  const filteredNone = filterJobsBySupport(jobs, []);
  console.log('3c. Filter with empty needs returns all jobs:', filteredNone.length === jobs.length);

  // 4. Test JobPosting JSON-LD (Task E5)
  const jsonLd = createJobPostingJsonLd(jobs[0], 'en');
  console.log('4. Generated JSON-LD:', JSON.stringify(jsonLd, null, 2));
  if (jsonLd['@type'] !== 'JobPosting') throw new Error('JSON-LD @type must be JobPosting');
  if (jsonLd.title !== jobs[0].title) throw new Error('JSON-LD title mismatch');

  // 5. Test Learner Profile API (Task D1)
  const learner = await api.getLearner('lrn_demo');
  console.log('5a. Learner name:', learner.name);

  const patched = await api.patchLearner('lrn_demo', { name: 'Updated Demo Learner', idNumber: 'KEB-9988' });
  console.log('5b. Patched name:', patched.name, 'idNumber:', patched.idNumber);
  if (patched.name !== 'Updated Demo Learner' || patched.idNumber !== 'KEB-9988') throw new Error('Patch failed');

  // 6. Test Support Needs API (Task D1)
  const support = await api.saveSupport('lrn_demo', ['read_aloud', 'voice_input']);
  console.log('6. Saved support needs:', support.items);
  if (!support.items.includes('voice_input')) throw new Error('Support save failed');

  // 7. Test Create Job (Task E4)
  const newJob = await api.createJob({
    title: 'Accessible QA Tester',
    employer: 'Inclusive Tech Hub',
    description: 'Test accessible web applications and screen reader flows.',
    accommodations: ['screen_reader_friendly', 'voice_application']
  });
  console.log('7. Created new job:', newJob.id, newJob.title);

  // 8. Test Job Application (Task E3)
  const app = await api.createApplication({
    learnerId: 'lrn_demo',
    jobId: newJob.id,
    answers: { coverNote: 'Passionate about accessibility!' },
    supportRequested: true
  });
  console.log('8. Created application:', app.id, 'status:', app.status);

  console.log('\n>>> ALL DEV 2 TESTS PASSED! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
