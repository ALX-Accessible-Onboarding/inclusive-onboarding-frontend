import { ACCOMMODATIONS, SUPPORT_NEEDS } from './vocabulary.js';

export class ApiError extends Error {
  constructor(status, errors) {
    super('API error ' + status);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || { _: 'Something went wrong. Please try again.' };
  }
}

const config = { mode: 'mock', baseUrl: 'http://localhost:4000/api', token: 'demo-token' };

// configure({ mode: 'live', baseUrl: '...', token: '...' })
export function configure(options) {
  Object.keys(options || {}).forEach(function (key) {
    if (options[key] !== undefined) config[key] = options[key];
  });
}

async function request(method, path, body) {
  const headers = { Authorization: 'Bearer ' + config.token };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(config.baseUrl + path, {
      method: method,
      headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (e) {
    throw new ApiError(0, { _: 'We could not reach the server. Please check your connection and try again.' });
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data && data.errors);
  return data;
}

/* ---------- mock mode: in-memory data that matches the API doc ---------- */
const db = {
  learners: {
    lrn_demo: {
      id: 'lrn_demo', name: 'Demo Learner',
      contact: { type: 'phone', value: '0912345678' },
      idRoute: 'kebele', idNumber: null, mode: 'standard', language: 'en',
      partnerRef: null, createdAt: '2026-11-12T09:00:00Z'
    }
  },
  support: {},
  progress: {},
  applications: [],
  jobs: [
    { id: 'job_1', title: 'Remote VA - Customer Support', employer: 'Acme Logistics',
      description: 'Answer customer questions by chat and email. Training is provided. You will work from home.',
      accommodations: ['read_aloud', 'flexible_hours'], postedAt: '2026-11-01T00:00:00Z' },
    { id: 'job_2', title: 'Data Entry Assistant', employer: 'Blue Nile Services',
      description: 'Enter records into a spreadsheet. Work is quiet and detailed. Screen readers are supported.',
      accommodations: ['screen_reader_friendly', 'extra_interview_time'], postedAt: '2026-11-03T00:00:00Z' },
    { id: 'job_3', title: 'Community Outreach Assistant', employer: 'Addis Community Trust',
      description: 'Help visit local groups and share information. An interpreter is available for meetings.',
      accommodations: ['sign_language_interpreter', 'voice_application', 'flexible_hours'], postedAt: '2026-11-05T00:00:00Z' },
    { id: 'job_4', title: 'Content Reviewer', employer: 'Sunrise Media',
      description: 'Read short articles and check them for mistakes.',
      accommodations: [], postedAt: '2026-11-07T00:00:00Z' }
  ]
};
let seq = 100;
const nextId = function (prefix) { seq += 1; return prefix + '_' + seq; };
const notFound = function () { return new ApiError(404, { _: 'We could not find that.' }); };
const now = function () { return new Date().toISOString(); };

// Wraps a mock handler: small delay (like a network) and returns a copy so callers cannot change the "database"
function mock(fn) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      try { resolve(JSON.parse(JSON.stringify(fn()))); } catch (e) { reject(e); }
    }, 150);
  });
}
const isLive = function () { return config.mode === 'live'; };
const enc = encodeURIComponent;

/* ---------- jobs ---------- */
export function getJobs(opts) {
  const limit = (opts && opts.limit) || 20;
  const offset = (opts && opts.offset) || 0;
  // Note: we deliberately do NOT send ?support=... so a learner's choices never reach the server.
  // Filter on the client instead.
  if (isLive()) return request('GET', '/jobs?limit=' + limit + '&offset=' + offset);
  return mock(function () {
    return { jobs: db.jobs.slice(offset, offset + limit), total: db.jobs.length };
  });
}

// Fetches every page (the server default is 20 per page) so the filter can run on the full list
export async function getAllJobs() {
  const jobs = [];
  let total = 0;
  do {
    const page = await getJobs({ limit: 50, offset: jobs.length });
    total = page.total;
    if (page.jobs.length === 0) break;
    page.jobs.forEach(function (job) { jobs.push(job); });
  } while (jobs.length < total);
  return jobs;
}

export function getJob(id) {
  if (isLive()) return request('GET', '/jobs/' + enc(id));
  return mock(function () {
    const job = db.jobs.find(function (j) { return j.id === id; });
    if (!job) throw notFound();
    return job;
  });
}

function validateJob(job) {
  const errors = {};
  if (!job.title || !job.title.trim()) errors.title = 'Please add a job title.';
  if (!job.employer || !job.employer.trim()) errors.employer = 'Please add the employer name.';
  if (!job.description || !job.description.trim()) errors.description = 'Please describe the job.';
  if (!Array.isArray(job.accommodations)) {
    errors.accommodations = 'Please choose from the list.';
  } else {
    job.accommodations.forEach(function (a, i) {
      if (ACCOMMODATIONS.indexOf(a) === -1) errors['accommodations.' + i] = 'Please choose from the list.';
    });
  }
  return errors;
}

export function createJob(job) {
  if (isLive()) return request('POST', '/jobs', job);
  return mock(function () {
    const errors = validateJob(job);
    if (Object.keys(errors).length) throw new ApiError(400, errors);
    const created = {
      id: nextId('job'), title: job.title.trim(), employer: job.employer.trim(),
      description: job.description.trim(), accommodations: job.accommodations.slice(), postedAt: now()
    };
    db.jobs.unshift(created);
    return created;
  });
}

/* ---------- learners ---------- */
export function createLearner(data) {
  if (isLive()) return request('POST', '/learners', data);
  return mock(function () {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Please tell us what to call you.';
    if (!data.contact || !data.contact.value) errors['contact.value'] = 'Please add your number, like 09 12 34 56 78.';
    if (Object.keys(errors).length) throw new ApiError(400, errors);
    const learner = Object.assign({ idNumber: null, partnerRef: null }, data, { id: nextId('lrn'), createdAt: now() });
    db.learners[learner.id] = learner;
    return learner;
  });
}

export function getLearner(id) {
  if (isLive()) return request('GET', '/learners/' + enc(id));
  return mock(function () {
    if (!db.learners[id]) throw notFound();
    return db.learners[id];
  });
}

export function patchLearner(id, patch) {
  if (isLive()) return request('PATCH', '/learners/' + enc(id), patch);
  return mock(function () {
    const learner = db.learners[id];
    if (!learner) throw notFound();
    if ('name' in patch && !String(patch.name || '').trim()) {
      throw new ApiError(400, { name: 'Please tell us what to call you.' });
    }
    ['name', 'contact', 'idRoute', 'idNumber', 'mode', 'language', 'partnerRef'].forEach(function (key) {
      if (key in patch) learner[key] = patch[key];
    });
    return learner;
  });
}

/* ---------- private support needs ---------- */
export function getSupport(learnerId) {
  if (isLive()) return request('GET', '/learners/' + enc(learnerId) + '/support');
  return mock(function () {
    if (!db.learners[learnerId] || !db.support[learnerId]) throw notFound(); // 404 = no support set yet
    return db.support[learnerId];
  });
}

export function saveSupport(learnerId, items) {
  if (isLive()) return request('POST', '/learners/' + enc(learnerId) + '/support', { items: items });
  return mock(function () {
    if (!db.learners[learnerId]) throw notFound();
    const errors = {};
    (items || []).forEach(function (item, i) {
      if (SUPPORT_NEEDS.indexOf(item) === -1) errors['items.' + i] = 'Please choose from the list.';
    });
    if (Object.keys(errors).length) throw new ApiError(400, errors);
    // Mock replaces the old record. Confirm with the backend dev that POST does the same.
    db.support[learnerId] = { id: nextId('sup'), learnerId: learnerId, items: items.slice(), private: true, createdAt: now() };
    return db.support[learnerId];
  });
}

/* ---------- applications ---------- */
export function createApplication(data) {
  if (isLive()) return request('POST', '/applications', data);
  return mock(function () {
    if (!db.learners[data.learnerId] || !db.jobs.some(function (j) { return j.id === data.jobId; })) throw notFound();
    if (typeof data.supportRequested !== 'boolean') {
      throw new ApiError(400, { supportRequested: 'Please choose yes or no.' });
    }
    // supportRequested is stored but never returned (employer-facing shape omits it)
    db.applications.push(Object.assign({}, data, { id: nextId('app') }));
    return { id: nextId('app'), learnerId: data.learnerId, jobId: data.jobId,
             answers: data.answers || {}, status: 'submitted', createdAt: now() };
  });
}

/* ---------- referrals and progress (used by the sign-up flow) ---------- */
export function createReferral(data) {
  if (isLive()) return request('POST', '/referrals', data);
  return mock(function () {
    if (!db.learners[data.learnerId]) throw notFound();
    return { id: nextId('ref'), learnerId: data.learnerId, partner: data.partner,
             contactPreference: data.contactPreference, status: 'pending', createdAt: now() };
  });
}

export function saveProgress(snapshot) {
  if (isLive()) return request('POST', '/progress', snapshot);
  return mock(function () {
    db.progress[snapshot.sessionId] = Object.assign({ id: nextId('prog'), updatedAt: now() }, snapshot);
    return db.progress[snapshot.sessionId];
  });
}

export function getProgress(sessionId) {
  if (isLive()) return request('GET', '/progress/' + enc(sessionId)); // 404 = start from step 0
  return mock(function () {
    if (!db.progress[sessionId]) throw notFound();
    return db.progress[sessionId];
  });
}