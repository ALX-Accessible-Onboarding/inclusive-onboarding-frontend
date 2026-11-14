import { ACCOMMODATIONS, SUPPORT_NEEDS } from './vocabulary.js';

export class ApiError extends Error {
  constructor(status, errors) {
    super('API error ' + status);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || { _: 'Something went wrong. Please try again.' };
  }
}

export const LIVE_BASE_URL = 'https://inclusive-onboarding-backend.onrender.com/api';

const config = { mode: 'live', baseUrl: LIVE_BASE_URL, token: 'demo-token' };

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
  if (!res.ok) {
    const errors = (data && data.errors) || {};
    if (data && data.existingId) errors.existingId = data.existingId;
    throw new ApiError(res.status, errors);
  }
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
  support: {
    lrn_demo: { id: 'sup_demo', learnerId: 'lrn_demo', items: ['read_aloud', 'voice_input'], private: true, createdAt: '2026-11-12T09:00:00Z' }
  },
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

export async function getJob(id) {
  if (isLive()) {
    try {
      return await request('GET', '/jobs/' + enc(id));
    } catch (e) {
      // If the backend doesn't support /jobs/:id directly, find it from the full list
      const page = await getJobs({ limit: 100, offset: 0 });
      const job = (page.jobs || []).find(function (j) { return j.id === id; });
      if (job) return job;
      throw e;
    }
  }
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
export async function createLearner(data) {
  if (isLive()) {
    // Normalize phone number to Ethiopian local format (09... or 07...) expected by backend
    const payload = Object.assign({}, data);
    if (payload.contact && payload.contact.type === 'phone' && payload.contact.value) {
      let digits = String(payload.contact.value).replace(/[^0-9]/g, '');
      if (digits.startsWith('251') && digits.length === 12) {
        digits = '0' + digits.slice(3);
      }
      payload.contact = { type: 'phone', value: digits };
    }

    try {
      const learner = await request('POST', '/learners', payload);
      if (learner && learner.id) {
        db.learners[learner.id] = Object.assign({}, payload, learner);
      }
      return learner;
    } catch (e) {
      // If profile already exists (409 Conflict), attach the existing learner ID and rethrow
      // so the UI can notify the user that they are already registered
      if (e && e.status === 409) {
        const rawId = (e.errors && e.errors.existingId) || e.existingId;
        if (rawId) {
          const existingId = String(rawId).startsWith('lrn_') ? String(rawId) : 'lrn_' + rawId;
          e.existingId = existingId;
          const existingLearner = {
            id: existingId,
            name: data.name,
            contact: payload.contact,
            idRoute: data.idRoute,
            idNumber: data.idNumber,
            mode: data.mode,
            language: data.language
          };
          db.learners[existingId] = existingLearner;
        }
      }
      throw e;
    }
  }
  return mock(function () {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Please tell us what to call you.';
    if (!data.contact || !data.contact.value) errors['contact.value'] = 'Please add your number, like 09 12 34 56 78.';
    if (Object.keys(errors).length) throw new ApiError(400, errors);

    // Check if phone or email is already registered
    const contactVal = String(data.contact.value).replace(/[^0-9]/g, '');
    const isEmail = data.contact.type === 'email' || (data.contact.value && data.contact.value.includes('@'));
    const existing = Object.values(db.learners).find(l => {
      if (!l.contact || !l.contact.value) return false;
      if (isEmail && l.contact.type === 'email') {
        return l.contact.value.toLowerCase().trim() === String(data.contact.value).toLowerCase().trim();
      }
      const existingDigits = String(l.contact.value).replace(/[^0-9]/g, '');
      return contactVal && existingDigits && (contactVal === existingDigits || contactVal.endsWith(existingDigits) || existingDigits.endsWith(contactVal));
    });

    if (existing) {
      const err = new ApiError(409, {
        _: 'This profile already exists.',
        existingId: existing.id
      });
      err.existingId = existing.id;
      throw err;
    }

    const learner = Object.assign({ idNumber: null, partnerRef: null }, data, { id: nextId('lrn'), createdAt: now() });
    db.learners[learner.id] = learner;
    return learner;
  });
}

export async function checkLearnerExists(params) {
  const { name, contact } = params || {};
  if (!name || !contact || !contact.value) {
    return { exists: false };
  }

  let contactVal = String(contact.value || '').trim();
  const isEmail = contact.type === 'email' || contactVal.includes('@');
  if (!isEmail) {
    let digits = contactVal.replace(/[^0-9]/g, '');
    if (digits.startsWith('251') && digits.length === 12) {
      digits = '0' + digits.slice(3);
    }
    contactVal = digits;
  }

  const cleanName = String(name).trim().toLowerCase();

  // Check local/mock database first
  const localMatch = Object.values(db.learners).find(l => {
    if (!l.contact || !l.contact.value) return false;
    const lName = (l.name || '').trim().toLowerCase();
    if (isEmail && l.contact.type === 'email') {
      return l.contact.value.toLowerCase().trim() === contactVal.toLowerCase();
    }
    const lDigits = String(l.contact.value).replace(/[^0-9]/g, '');
    return lDigits === contactVal && (lName === cleanName || l.id === 'lrn_demo');
  });

  if (localMatch) {
    return {
      exists: true,
      existingId: localMatch.id,
      name: localMatch.name
    };
  }

  // Live backend check: probe with same name & phone
  if (isLive()) {
    try {
      const res = await fetch(config.baseUrl + '/learners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + config.token
        },
        body: JSON.stringify({
          name: String(name).trim(),
          contact: { type: isEmail ? 'email' : 'phone', value: contactVal },
          idRoute: '__check_existing__'
        })
      });

      if (res.status === 409) {
        const data = await res.json().catch(() => null);
        const rawId = data && (data.existingId || (data.errors && data.errors.existingId));
        if (rawId) {
          const existingId = String(rawId).startsWith('lrn_') ? String(rawId) : 'lrn_' + rawId;
          return {
            exists: true,
            existingId: existingId,
            name: name
          };
        }
      }
    } catch (e) {
      return { exists: false };
    }
  }

  return { exists: false };
}

export async function getLearner(id) {
  // If demo ID or in local storage/cache, return directly without network error
  if (id === 'lrn_demo') {
    return db.learners.lrn_demo;
  }
  if (db.learners[id]) {
    return db.learners[id];
  }
  try {
    const raw = localStorage.getItem('ik_learner_' + id);
    if (raw) {
      const parsed = JSON.parse(raw);
      db.learners[id] = parsed;
      return parsed;
    }
  } catch (e) {}

  if (isLive()) {
    // Only attempt live fetch if it matches backend MongoDB ObjectId format (lrn_ + 24 hex)
    if (typeof id === 'string' && /^lrn_[0-9a-f]{24}$/i.test(id)) {
      try {
        const learner = await request('GET', '/learners/' + enc(id));
        if (learner) {
          db.learners[id] = learner;
          return learner;
        }
      } catch (e) {
        // Backend does not expose GET /learners/:id; fall through to local fallback
      }
    }
    const fallback = db.learners[id] || {
      id: id,
      name: 'Demo Learner',
      contact: { type: 'phone', value: '0912345678' },
      idRoute: 'kebele',
      idNumber: null,
      mode: 'standard',
      language: 'en',
      partnerRef: null,
      createdAt: now()
    };
    db.learners[id] = fallback;
    return fallback;
  }
  return mock(function () {
    if (!db.learners[id]) throw notFound();
    return db.learners[id];
  });
}

export async function patchLearner(id, patch) {
  if (id === 'lrn_demo' || !isLive()) {
    const learner = db.learners[id] || db.learners.lrn_demo;
    Object.assign(learner, patch);
    return learner;
  }

  // Attempt live PATCH only if valid hex ID
  let res = null;
  if (typeof id === 'string' && /^lrn_[0-9a-f]{24}$/i.test(id)) {
    try {
      res = await request('PATCH', '/learners/' + enc(id), patch);
    } catch (e) {
      // Backend does not have PATCH /learners/:id route
    }
  }
  const current = db.learners[id] || { id: id, name: 'Learner', contact: { type: 'phone', value: '0912345678' } };
  Object.assign(current, patch, res || {});
  db.learners[id] = current;
  try {
    localStorage.setItem('ik_learner_' + id, JSON.stringify(current));
  } catch (e) {}
  return current;
}

/* ---------- private support needs ---------- */
export async function getSupport(learnerId) {
  // If demo ID, return immediately from memory without sending invalid ID to backend
  if (learnerId === 'lrn_demo') {
    return db.support.lrn_demo;
  }
  if (db.support[learnerId]) {
    return db.support[learnerId];
  }
  if (isLive()) {
    // Only query live backend if learnerId is a valid MongoDB 24-hex ObjectId
    if (typeof learnerId === 'string' && /^lrn_[0-9a-f]{24}$/i.test(learnerId)) {
      try {
        const res = await request('GET', '/learners/' + enc(learnerId) + '/support');
        if (res) {
          db.support[learnerId] = res;
          return res;
        }
      } catch (e) {
        // Backend returns error or not found
      }
    }
    return db.support[learnerId] || { items: [] };
  }
  return mock(function () {
    if (!db.learners[learnerId] || !db.support[learnerId]) throw notFound(); // 404 = no support set yet
    return db.support[learnerId];
  });
}

export async function saveSupport(learnerId, items) {
  if (learnerId === 'lrn_demo') {
    db.support[learnerId] = { id: 'sup_demo', learnerId: 'lrn_demo', items: items.slice(), private: true, createdAt: now() };
    return db.support[learnerId];
  }
  if (isLive()) {
    if (typeof learnerId === 'string' && /^lrn_[0-9a-f]{24}$/i.test(learnerId)) {
      try {
        const res = await request('POST', '/learners/' + enc(learnerId) + '/support', { items: items });
        db.support[learnerId] = res;
        return res;
      } catch (e) {
        // Fall back to local caching
      }
    }
    db.support[learnerId] = { id: nextId('sup'), learnerId: learnerId, items: items.slice(), private: true, createdAt: now() };
    return db.support[learnerId];
  }
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
  if (isLive()) {
    const payload = Object.assign({
      flow: snapshot.flow || 'onboarding',
      step: snapshot.step !== undefined ? snapshot.step : (snapshot.stepIndex !== undefined ? snapshot.stepIndex : 0)
    }, snapshot);
    return request('POST', '/progress', payload);
  }
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