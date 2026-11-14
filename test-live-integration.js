import * as api from './src/api-client.js';

const LIVE_BACKEND_URL = 'https://inclusive-onboarding-backend.onrender.com/api';

async function runLiveIntegrationTest() {
  console.log('====================================================');
  console.log('  Live Backend Integration Test');
  console.log('  Target:', LIVE_BACKEND_URL);
  console.log('====================================================\n');

  api.configure({
    mode: 'live',
    baseUrl: LIVE_BACKEND_URL,
    token: 'demo-token'
  });

  // 1. Jobs: GET /api/jobs
  console.log('1. Testing GET /api/jobs via api.getAllJobs()...');
  const jobs = await api.getAllJobs();
  console.log(`   Fetched ${jobs.length} jobs from live backend.`);
  if (!Array.isArray(jobs) || jobs.length === 0) {
    throw new Error('Failed to fetch jobs from live backend.');
  }
  console.log(`   First job: "${jobs[0].title}" by "${jobs[0].employer}" (ID: ${jobs[0].id})\n`);

  // 2. Jobs: POST /api/jobs
  console.log('2. Testing POST /api/jobs via api.createJob()...');
  const createdJob = await api.createJob({
    title: 'Accessible Web Tester - Live Test',
    employer: 'Inclusive Tech Hub',
    description: 'Verify accessibility and screen reader support.',
    accommodations: ['screen_reader_friendly', 'flexible_hours']
  });
  console.log(`   Created job successfully! ID: ${createdJob.id}, Title: "${createdJob.title}"\n`);

  // 3. Jobs: GET /api/jobs/:id via api.getJob()
  console.log(`3. Testing api.getJob("${createdJob.id}")...`);
  const fetchedJob = await api.getJob(createdJob.id);
  console.log(`   Retrieved job: "${fetchedJob.title}" (Employer: ${fetchedJob.employer})\n`);
  if (!fetchedJob || fetchedJob.id !== createdJob.id) {
    throw new Error('Job retrieval failed or ID mismatch.');
  }

  // 4. Learners: POST /api/learners via api.createLearner()
  console.log('4. Testing POST /api/learners via api.createLearner()...');
  const testPhone = '09' + Math.floor(10000000 + Math.random() * 90000000);
  const createdLearner = await api.createLearner({
    name: 'Live Integration Learner',
    contact: { type: 'phone', value: testPhone },
    idRoute: 'kebele',
    language: 'en',
    mode: 'standard'
  });
  console.log(`   Created learner successfully! ID: ${createdLearner.id}, Name: "${createdLearner.name}"\n`);
  const learnerId = createdLearner.id;

  // 5. Support Needs: POST /api/learners/:id/support via api.saveSupport()
  console.log(`5. Testing POST /api/learners/${learnerId}/support via api.saveSupport()...`);
  const supportResult = await api.saveSupport(learnerId, ['read_aloud', 'voice_input']);
  console.log('   Saved support needs successfully! Items:', supportResult.items, '\n');

  // 6. Support Needs: GET /api/learners/:id/support via api.getSupport()
  console.log(`6. Testing GET /api/learners/${learnerId}/support via api.getSupport()...`);
  const fetchedSupport = await api.getSupport(learnerId);
  console.log('   Retrieved support needs:', fetchedSupport.items, '\n');
  if (!fetchedSupport.items.includes('read_aloud')) {
    throw new Error('Support needs mismatch: read_aloud missing.');
  }

  // 7. Progress: POST /api/progress via api.saveProgress()
  const testSessionId = 'sess_live_' + Date.now();
  console.log(`7. Testing POST /api/progress for session "${testSessionId}"...`);
  const progressSave = await api.saveProgress({
    sessionId: testSessionId,
    flow: 'onboarding',
    step: 3,
    answers: { name: 'Live Integration Learner', language: 'en' }
  });
  console.log('   Saved progress successfully! ID:', progressSave.id, '\n');

  // 8. Progress: GET /api/progress/:sessionId via api.getProgress()
  console.log(`8. Testing GET /api/progress/${testSessionId}...`);
  const fetchedProgress = await api.getProgress(testSessionId);
  console.log(`   Retrieved progress! Session: ${fetchedProgress.sessionId}, Flow: ${fetchedProgress.flow}\n`);
  if (!fetchedProgress || fetchedProgress.sessionId !== testSessionId) {
    throw new Error('Progress retrieval failed.');
  }

  // 9. Applications: POST /api/applications via api.createApplication()
  console.log(`9. Testing POST /api/applications for job "${createdJob.id}"...`);
  const application = await api.createApplication({
    learnerId: learnerId,
    jobId: createdJob.id,
    supportRequested: true,
    answers: { coverNote: 'Eager to contribute and work remotely.' }
  });
  console.log(`   Submitted application successfully! Application ID: ${application.id}, Status: ${application.status}\n`);

  console.log('====================================================');
  console.log('  ALL LIVE BACKEND INTEGRATION TESTS PASSED! ');
  console.log('====================================================');
}

runLiveIntegrationTest().catch(err => {
  console.error('\n❌ Live integration test failed:');
  console.error(err);
  process.exit(1);
});

