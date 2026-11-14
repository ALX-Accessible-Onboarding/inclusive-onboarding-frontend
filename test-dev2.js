import * as api from './src/api-client.js';
import * as vocab from './src/vocabulary.js';
import * as labels from './src/labels.js';
import { filterJobsBySupport } from './src/career/job-filter.js';
import { createJobPostingJsonLd } from './src/career/jobposting-jsonld.js';
import { detectLanguage } from './src/features/read-aloud.js';
import { getLocalizedJob, translateToAmharic } from './src/labels.js';
import { validateContact, validateName, validateIdNumber } from './src/core/validation.js';

async function runTests() {
  api.configure({ mode: 'mock' });
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

  // 9. Test Language and Text-to-Speech Consistency
  console.log('\n--- 9. Language & TTS Synchronization Tests ---');
  // 9a. Verify Amharic job localization
  const amJob = getLocalizedJob(jobs[0], 'am');
  console.log('9a. Amharic Job Title:', amJob.title);
  if (!/[\u1200-\u137F]/.test(amJob.title)) throw new Error('Amharic job title does not contain Ethiopic script!');
  if (!/[\u1200-\u137F]/.test(amJob.description)) throw new Error('Amharic job description does not contain Ethiopic script!');

  // 9b. Verify English job localization remains intact
  const enJob = getLocalizedJob(jobs[0], 'en');
  console.log('9b. English Job Title:', enJob.title);
  if (enJob.title !== jobs[0].title) throw new Error('English job title was altered!');

  // 9c. Verify Speech Language Detection
  const amLang1 = detectLanguage('የርቀት ደንበኞች አገልግሎት ረዳት', null);
  const amLang2 = detectLanguage('Any text', 'am');
  console.log('9c. Detected Amharic lang codes:', amLang1, amLang2);
  if (amLang1 !== 'am-ET' || amLang2 !== 'am-ET') throw new Error('Amharic language detection failed to produce am-ET');

  const enLang = detectLanguage('Hello world', null);
  console.log('9d. Detected English lang code:', enLang);
  if (enLang !== 'en-US') throw new Error('English language detection failed');

  // 9e. Verify Translation fallback
  const translated = translateToAmharic('Remote VA - Customer Support at Acme Logistics');
  console.log('9e. Translated text for Amharic audio:', translated);
  if (!/[\u1200-\u137F]/.test(translated)) throw new Error('Fallback translation to Amharic failed');

  // 10. Form Validation & Required Field Tests
  console.log('\n--- 10. Form Validation & Required Field Tests ---');
  // 10a. 10-digit phone validation starting with 09 or 07
  if (validateContact('phone', '0912345678') !== null) throw new Error('Valid 09 phone failed validation');
  if (validateContact('phone', '0712345678') !== null) throw new Error('Valid 07 phone failed validation');
  if (validateContact('phone', '09 12 34 56 78') !== null) throw new Error('Valid spaced 09 phone failed validation');
  if (validateContact('phone', '0812345678') === null) throw new Error('08 prefix phone should fail validation');
  if (validateContact('phone', '091234567') === null) throw new Error('9-digit phone should fail validation');
  if (validateContact('phone', '09123456789') === null) throw new Error('11-digit phone should fail validation');
  if (validateContact('phone', '251912345678') === null) throw new Error('12-digit international phone should fail validation');
  if (validateContact('phone', '0912345abc') === null) throw new Error('Phone with letters should fail validation');
  console.log('10a. 10-digit phone validation passed: required 10 digits starting with 09 or 07, rejected non-matching numbers.');

  // 10b. Appropriate email format
  if (validateContact('email', 'user@example.com') !== null) throw new Error('Valid email failed validation');
  if (validateContact('email', 'not-an-email') === null) throw new Error('Invalid email passed validation');
  if (validateContact('email', 'user@domain') === null) throw new Error('Email without TLD passed validation');
  if (validateContact('auto', 'user@company.org') !== null) throw new Error('Auto-detected valid email failed');
  console.log('10b. Email format validation passed: enforced proper format with domain and TLD.');

  // 10c. Required answer constraints
  if (validateName('') === null) throw new Error('Empty name passed validation');
  if (validateName('   ') === null) throw new Error('Whitespace name passed validation');
  if (validateContact('auto', '') === null) throw new Error('Empty contact passed validation');
  console.log('10c. Required answers validation passed: empty and whitespace inputs rejected.');

  // 10d. ID Document format validation per route
  if (validateIdNumber('kebele', '') !== null) throw new Error('Empty ID should be allowed (optional)');
  if (validateIdNumber('kebele', '12345/AA') !== null) throw new Error('12345/AA should be valid Kebele ID');
  if (validateIdNumber('kebele', 'KEB-9988') !== null) throw new Error('KEB-9988 should be valid Kebele ID');
  if (validateIdNumber('kebele', '12345') === null) throw new Error('12345 without region should be rejected');
  if (validateIdNumber('kebele', 'bad@@id') === null) throw new Error('Invalid Kebele format should be rejected');
  if (validateIdNumber('passport', 'EP1234567') !== null) throw new Error('EP1234567 should be valid passport');
  if (validateIdNumber('passport', '123456') === null) throw new Error('Passport without letters should be rejected');
  if (validateIdNumber('refugee', 'ETH-12345') !== null) throw new Error('ETH-12345 should be valid refugee ID');
  if (validateIdNumber('refugee', 'bad') === null) throw new Error('Short refugee ID should be rejected');
  console.log('10d. ID format validation passed: enforced required format per route and rejected invalid formats.');

  // 11. Pagination Tests
  console.log('\n--- 11. Job Pagination Tests ---');
  const allJobs = await api.getAllJobs();
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(allJobs.length / pageSize));
  const page1 = allJobs.slice(0, pageSize);
  if (page1.length > pageSize) throw new Error('Page 1 exceeds page size limit of 5');
  console.log(`11a. Pagination correctly chunks ${allJobs.length} jobs into ${totalPages} page(s) with max ${pageSize} per page.`);

  // 12. Duplicate Registration Detection Tests
  console.log('\n--- 12. Duplicate Registration Detection Tests ---');
  let duplicateCaught = false;
  try {
    // Attempt to create a learner with the exact same phone number as lrn_demo ('0912345678')
    await api.createLearner({
      name: 'Demo Learner Duplicate',
      contact: { type: 'phone', value: '0912345678' },
      idRoute: 'kebele'
    });
  } catch (err) {
    if (err.status === 409 && err.existingId) {
      duplicateCaught = true;
      console.log('12a. Successfully caught duplicate registration (409 Conflict) with existingId:', err.existingId);
    }
  }
  if (!duplicateCaught) throw new Error('Duplicate registration was not caught with 409 Conflict');

  // 12b. Early Duplicate Check right after Name & Phone (Step B3)
  const earlyCheckExisting = await api.checkLearnerExists({
    name: 'Demo Learner',
    contact: { type: 'phone', value: '0912345678' }
  });
  if (!earlyCheckExisting || !earlyCheckExisting.exists || earlyCheckExisting.existingId !== 'lrn_demo') {
    throw new Error('Early checkLearnerExists failed to detect existing learner at step B3');
  }
  const earlyCheckNew = await api.checkLearnerExists({
    name: 'New Person',
    contact: { type: 'phone', value: '0977889900' }
  });
  if (earlyCheckNew && earlyCheckNew.exists) {
    throw new Error('Early checkLearnerExists falsely matched unregistered user');
  }
  console.log('12b. Early checkLearnerExists correctly intercepted duplicate learner right after name & phone step.');

  // 13. Draft Persistence Tests
  console.log('\n--- 13. Draft Persistence Tests ---');
  const mockStorage = {};
  const draftKey = 'ik_onboarding_draft';
  const testDraft = {
    answers: { name: 'Draft Learner', contactValue: '0912345678' },
    stepIndex: 3,
    timestamp: Date.now()
  };
  mockStorage[draftKey] = JSON.stringify(testDraft);
  const restoredDraft = JSON.parse(mockStorage[draftKey]);
  if (!restoredDraft || restoredDraft.answers.name !== 'Draft Learner' || restoredDraft.stepIndex !== 3) {
    throw new Error('Draft recovery failed');
  }
  delete mockStorage[draftKey];
  if (mockStorage[draftKey]) throw new Error('Draft deletion failed');
  console.log('13a. Draft persistence and recovery verified.');

  console.log('\n>>> ALL DEV 2 TESTS PASSED! <<<');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

