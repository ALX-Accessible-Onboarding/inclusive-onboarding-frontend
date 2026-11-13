import * as api from './api-client.js';
import { label, missingLabels } from './labels.js';

const out = document.getElementById('out');
const live = location.search.indexOf('live') !== -1;

function log(title, value) {
  out.textContent += '\n' + title + '\n' + JSON.stringify(value, null, 2) + '\n';
}
async function attempt(title, fn) {
  try { log(title, await fn()); }
  catch (e) { log(title + ' -> ERROR ' + e.status, e.errors || String(e)); }
}

(async function run() {
  if (live) {
    api.configure({ mode: 'live', baseUrl: 'http://localhost:4000/api', token: 'demo-token' });
  }
  log('Mode', live ? 'LIVE (real backend)' : 'MOCK');
  log('Missing labels (should be [])', missingLabels());
  log('Amharic label for read_aloud', label('support', 'read_aloud', 'am'));

  let jobs = [];
  await attempt('Jobs loaded', async function () {
    jobs = await api.getAllJobs();
    return jobs.map(function (j) { return { id: j.id, title: j.title, postedAt: j.postedAt }; });
  });

  await attempt('Create job with bad data (expect 400)', function () {
    return api.createJob({ title: '', employer: '', description: '', accommodations: ['bogus'] });
  });

  let learnerId = 'lrn_demo';
  if (live) {
    await attempt('Create learner', async function () {
      const created = await api.createLearner({
        name: 'Check Learner',
        contact: { type: 'phone', value: '0912345678' },
        idRoute: 'kebele', mode: 'standard', language: 'en'
      });
      learnerId = created.id;
      return created;
    });
  }

  await attempt('Get learner', function () { return api.getLearner(learnerId); });
  await attempt('Support before saving (expect 404)', function () { return api.getSupport(learnerId); });
  await attempt('Save support', function () { return api.saveSupport(learnerId, ['read_aloud', 'more_time']); });
  await attempt('Patch learner (add ID later)', function () { return api.patchLearner(learnerId, { idNumber: 'ABC123' }); });
  await attempt('Progress for unknown session (expect 404)', function () { return api.getProgress('no_such_session'); });

  if (jobs.length) {
    await attempt('Apply (no supportRequested in reply)', function () {
      return api.createApplication({ learnerId: learnerId, jobId: jobs[0].id, answers: { coverNote: 'Hello' }, supportRequested: true });
    });
  }
})();