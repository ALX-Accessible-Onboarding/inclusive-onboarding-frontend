import { ACCOMMODATIONS, SUPPORT_NEEDS } from './vocabulary.js';
import { t, JOB_TRANSLATIONS } from './labels.js';

export class ApiError extends Error {
  constructor(status, errors) {
    super('API error ' + status);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors || { _: 'Something went wrong. Please try again.' };
  }
}

export const LIVE_BASE_URL = 'https://inclusive-onboarding-backend.onrender.com/api/v1';

const config = { mode: 'live', baseUrl: LIVE_BASE_URL, token: 'demo-token' };

let serverStatusCallback = null;

export function setStatusHandler(fn) {
  serverStatusCallback = fn;
}

function updateServerStatus(statusKey, isWaking = false) {
  if (typeof serverStatusCallback === 'function') {
    try { serverStatusCallback(statusKey, isWaking); } catch (e) {}
  }
  if (typeof document !== 'undefined') {
    const banner = document.querySelector('.ik-server-status');
    const liveRegion = document.querySelector('.ik-live-status');
    const rootLang = (document.querySelector('.ik-root') && document.querySelector('.ik-root').getAttribute('lang')) || 'en';
    const msg = statusKey ? t(statusKey, rootLang) : '';

    if (banner) {
      if (isWaking && msg) {
        banner.textContent = '⏳ ' + msg;
        banner.classList.remove('ik-hidden');
      } else {
        banner.classList.add('ik-hidden');
      }
    }
    if (liveRegion && msg) liveRegion.textContent = msg;
    try {
      window.dispatchEvent(new CustomEvent('ik:server-status', { detail: { statusKey, isWaking, message: msg } }));
    } catch (e) {}
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function configure(options) {
  Object.keys(options || {}).forEach(key => {
    if (options[key] !== undefined) config[key] = options[key];
  });
  if (config.baseUrl) {
    config.baseUrl = String(config.baseUrl).trim().replace(/\/+$/, '');
    if (config.baseUrl.endsWith('/api')) {
      config.baseUrl += '/v1';
    } else if (!config.baseUrl.includes('/api/v1')) {
      config.baseUrl += '/api/v1';
    }
  }
}

export async function request(method, path, body) {
  const url = config.baseUrl + path;
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let wakeTimer = null;
    let timeoutTimer = null;

    if (controller) {
      timeoutTimer = setTimeout(() => controller.abort(), 10000);
      wakeTimer = setTimeout(() => updateServerStatus('serverWaking', true), 3500);
    }

    try {
      const headers = { Authorization: 'Bearer ' + config.token };
      if (body !== undefined) headers['Content-Type'] = 'application/json';

      const res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      });

      if (wakeTimer) clearTimeout(wakeTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      updateServerStatus(null, false);

      let data = null;
      try { data = await res.json(); } catch (e) {}

      if (!res.ok) {
        const errors = (data && data.errors) || {};
        if (data && data.existingId) errors.existingId = data.existingId;
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          throw new ApiError(res.status, errors);
        }
        throw new ApiError(res.status, errors.length ? errors : { _: 'Server returned status ' + res.status });
      }
      return data;

    } catch (e) {
      if (wakeTimer) clearTimeout(wakeTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      lastError = e;

      if (e.status && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429) {
        updateServerStatus(null, false);
        throw e;
      }

      if (attempt < maxRetries) {
        updateServerStatus('serverWaking', true);
        await sleep(Math.min(1000 * Math.pow(2, attempt), 4000));
        continue;
      }
    }
  }

  updateServerStatus(null, false);
  const isTimeout = lastError && (lastError.name === 'AbortError' || lastError.status === 408);
  throw new ApiError(0, {
    _: isTimeout
      ? 'The connection timed out. Please check your connection and try again.'
      : 'We could not reach the server. Please check your connection and try again.',
    errorKey: isTimeout ? 'timeoutError' : 'networkError'
  });
}

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
  jobs: Object.entries(JOB_TRANSLATIONS).map(([id, t], idx) => ({
    id, title: t.title.en, employer: t.employer.en, description: t.description.en,
    accommodations: [
      ['read_aloud', 'flexible_hours'],
      ['screen_reader_friendly', 'extra_interview_time'],
      ['sign_language_interpreter', 'voice_application', 'flexible_hours'],
      []
    ][idx] || [],
    postedAt: `2026-11-0${idx * 2 + 1}T00:00:00Z`
  }))
};

let seq = 100;
const nextId = p => `${p}_${++seq}`;
const notFound = () => new ApiError(404, { _: 'We could not find that.' });
const now = () => new Date().toISOString();
const mock = fn => new Promise((res, rej) => setTimeout(() => {
  try { res(JSON.parse(JSON.stringify(fn()))); } catch (e) { rej(e); }
}, 20));

const isLive = () => config.mode === 'live';
const enc = encodeURIComponent;

export function getJobs(opts) {
  const limit = (opts && opts.limit) || 20;
  const offset = (opts && opts.offset) || 0;
  if (isLive()) return request('GET', `/jobs?limit=${limit}&offset=${offset}`);
  return mock(() => ({ jobs: db.jobs.slice(offset, offset + limit), total: db.jobs.length }));
}

export async function getAllJobs() {
  if (isLive()) {
    try {
      const jobs = [];
      let total = 0;
      do {
        const page = await getJobs({ limit: 50, offset: jobs.length });
        total = page.total;
        if (!page.jobs || page.jobs.length === 0) break;
        page.jobs.forEach(j => jobs.push(j));
      } while (jobs.length < total);

      try {
        localStorage.setItem('ik_cached_jobs', JSON.stringify({ jobs, timestamp: Date.now() }));
      } catch (e) {}
      return jobs;
    } catch (err) {
      try {
        const raw = localStorage.getItem('ik_cached_jobs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
            parsed.jobs._fromCache = true;
            parsed.jobs._cachedTime = parsed.timestamp;
            return parsed.jobs;
          }
        }
      } catch (e) {}
      throw err;
    }
  }
  return mock(() => db.jobs.slice());
}

export async function getJob(id) {
  if (isLive()) {
    try {
      return await request('GET', '/jobs/' + enc(id));
    } catch (e) {
      const page = await getJobs({ limit: 100, offset: 0 });
      const job = (page.jobs || []).find(j => j.id === id);
      if (job) return job;
      throw e;
    }
  }
  return mock(() => {
    const job = db.jobs.find(j => j.id === id);
    if (!job) throw notFound();
    return job;
  });
}

export function createJob(job) {
  if (isLive()) return request('POST', '/jobs', job);
  return mock(() => {
    const errors = {};
    if (!job.title || !job.title.trim()) errors.title = 'Please add a job title.';
    if (!job.employer || !job.employer.trim()) errors.employer = 'Please add the employer name.';
    if (!job.description || !job.description.trim()) errors.description = 'Please describe the job.';
    if (!Array.isArray(job.accommodations)) errors.accommodations = 'Please choose from the list.';
    if (Object.keys(errors).length) throw new ApiError(400, errors);
    const created = {
      id: nextId('job'), title: job.title.trim(), employer: job.employer.trim(),
      description: job.description.trim(), accommodations: (job.accommodations || []).slice(), postedAt: now()
    };
    db.jobs.unshift(created);
    return created;
  });
}

export async function createLearner(data) {
  if (isLive()) {
    const payload = Object.assign({}, data);
    if (payload.contact && payload.contact.type === 'phone' && payload.contact.value) {
      let digits = String(payload.contact.value).replace(/[^0-9]/g, '');
      if (digits.startsWith('251') && digits.length === 12) digits = '0' + digits.slice(3);
      payload.contact = { type: 'phone', value: digits };
    }

    try {
      const learner = await request('POST', '/learners', payload);
      if (learner && learner.id) db.learners[learner.id] = Object.assign({}, payload, learner);
      return learner;
    } catch (e) {
      if (e && e.status === 409) {
        const rawId = (e.errors && e.errors.existingId) || e.existingId;
        if (rawId) {
          const existingId = String(rawId).startsWith('lrn_') ? String(rawId) : 'lrn_' + rawId;
          e.existingId = existingId;
          db.learners[existingId] = Object.assign({ id: existingId }, payload);
        }
      }
      throw e;
    }
  }
  return mock(() => {
    const errors = {};
    if (!data.name || !data.name.trim()) errors.name = 'Please tell us what to call you.';
    if (!data.contact || !data.contact.value) errors['contact.value'] = 'Please add your number, like 09 12 34 56 78.';
    if (Object.keys(errors).length) throw new ApiError(400, errors);

    const contactVal = String(data.contact.value).replace(/[^0-9]/g, '');
    const isEmail = data.contact.type === 'email' || (data.contact.value && data.contact.value.includes('@'));
    const existing = Object.values(db.learners).find(l => {
      if (!l.contact || !l.contact.value) return false;
      if (isEmail && l.contact.type === 'email') return l.contact.value.toLowerCase().trim() === String(data.contact.value).toLowerCase().trim();
      const exDigits = String(l.contact.value).replace(/[^0-9]/g, '');
      return contactVal && exDigits && (contactVal === exDigits || contactVal.endsWith(exDigits) || exDigits.endsWith(contactVal));
    });

    if (existing) {
      const err = new ApiError(409, { _: 'This profile already exists.', existingId: existing.id });
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
  if (!name || !contact || !contact.value) return { exists: false };

  let contactVal = String(contact.value || '').trim();
  const isEmail = contact.type === 'email' || contactVal.includes('@');
  if (!isEmail) {
    let digits = contactVal.replace(/[^0-9]/g, '');
    if (digits.startsWith('251') && digits.length === 12) digits = '0' + digits.slice(3);
    contactVal = digits;
  }

  const cleanName = String(name).trim().toLowerCase();
  const localMatch = Object.values(db.learners).find(l => {
    if (!l.contact || !l.contact.value) return false;
    const lName = (l.name || '').trim().toLowerCase();
    if (isEmail && l.contact.type === 'email') return l.contact.value.toLowerCase().trim() === contactVal.toLowerCase();
    const lDigits = String(l.contact.value).replace(/[^0-9]/g, '');
    return lDigits === contactVal && (lName === cleanName || l.id === 'lrn_demo');
  });

  if (localMatch) return { exists: true, existingId: localMatch.id, name: localMatch.name };

  if (isLive()) {
    try {
      await request('POST', '/learners', {
        name: String(name).trim(),
        contact: { type: isEmail ? 'email' : 'phone', value: contactVal },
        idRoute: '__check_existing__'
      });
    } catch (e) {
      if (e && e.status === 409) {
        const rawId = (e.errors && e.errors.existingId) || e.existingId;
        if (rawId) {
          const existingId = String(rawId).startsWith('lrn_') ? String(rawId) : 'lrn_' + rawId;
          return { exists: true, existingId, name };
        }
      }
    }
  }
  return { exists: false };
}

export async function getLearner(id) {
  if (id === 'lrn_demo') return db.learners.lrn_demo;
  if (db.learners[id]) return db.learners[id];

  try {
    const raw = localStorage.getItem('ik_learner_' + id);
    if (raw) {
      const parsed = JSON.parse(raw);
      db.learners[id] = parsed;
      return parsed;
    }
  } catch (e) {}

  if (isLive()) {
    if (typeof id === 'string' && /^lrn_[0-9a-f]{24}$/i.test(id)) {
      try {
        const learner = await request('GET', '/learners/' + enc(id));
        if (learner) {
          db.learners[id] = learner;
          return learner;
        }
      } catch (e) {}
    }
    const fallback = db.learners[id] || {
      id, name: 'Demo Learner',
      contact: { type: 'phone', value: '0912345678' },
      idRoute: 'kebele', idNumber: null, mode: 'standard', language: 'en',
      partnerRef: null, createdAt: now()
    };
    db.learners[id] = fallback;
    return fallback;
  }

  return mock(() => {
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

  let res = null;
  if (typeof id === 'string' && /^lrn_[0-9a-f]{24}$/i.test(id)) {
    try { res = await request('PATCH', '/learners/' + enc(id), patch); } catch (e) {}
  }
  const current = db.learners[id] || { id, name: 'Learner', contact: { type: 'phone', value: '0912345678' } };
  Object.assign(current, patch, res || {});
  db.learners[id] = current;
  try { localStorage.setItem('ik_learner_' + id, JSON.stringify(current)); } catch (e) {}
  return current;
}

export async function getSupport(learnerId) {
  if (learnerId === 'lrn_demo') return db.support.lrn_demo;
  if (db.support[learnerId]) return db.support[learnerId];

  if (isLive()) {
    if (typeof learnerId === 'string' && /^lrn_[0-9a-f]{24}$/i.test(learnerId)) {
      try {
        const res = await request('GET', '/learners/' + enc(learnerId) + '/support');
        if (res) {
          db.support[learnerId] = res;
          return res;
        }
      } catch (e) {}
    }
    return db.support[learnerId] || { items: [] };
  }
  return mock(() => {
    if (!db.learners[learnerId] || !db.support[learnerId]) throw notFound();
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
        const res = await request('POST', '/learners/' + enc(learnerId) + '/support', { items });
        db.support[learnerId] = res;
        return res;
      } catch (e) {}
    }
    db.support[learnerId] = { id: nextId('sup'), learnerId, items: items.slice(), private: true, createdAt: now() };
    return db.support[learnerId];
  }

  return mock(() => {
    if (!db.learners[learnerId]) throw notFound();
    const errors = {};
    (items || []).forEach((item, i) => {
      if (SUPPORT_NEEDS.indexOf(item) === -1) errors['items.' + i] = 'Please choose from the list.';
    });
    if (Object.keys(errors).length) throw new ApiError(400, errors);
    db.support[learnerId] = { id: nextId('sup'), learnerId, items: items.slice(), private: true, createdAt: now() };
    return db.support[learnerId];
  });
}

export function createApplication(data) {
  if (isLive()) return request('POST', '/applications', data);
  return mock(() => {
    if (!db.learners[data.learnerId] || !db.jobs.some(j => j.id === data.jobId)) throw notFound();
    if (typeof data.supportRequested !== 'boolean') {
      throw new ApiError(400, { supportRequested: 'Please choose yes or no.' });
    }
    const created = Object.assign({}, data, { id: nextId('app'), status: 'submitted', createdAt: now() });
    db.applications.push(created);
    return created;
  });
}

export function createReferral(data) {
  if (isLive()) return request('POST', '/referrals', data);
  return mock(() => {
    if (!db.learners[data.learnerId]) throw notFound();
    return {
      id: nextId('ref'), learnerId: data.learnerId, partner: data.partner,
      contactPreference: data.contactPreference, status: 'pending', createdAt: now()
    };
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
  return mock(() => {
    db.progress[snapshot.sessionId] = Object.assign({ id: nextId('prog'), updatedAt: now() }, snapshot);
    return db.progress[snapshot.sessionId];
  });
}

export function getProgress(sessionId) {
  if (isLive()) return request('GET', '/progress/' + enc(sessionId));
  return mock(() => {
    if (!db.progress[sessionId]) throw notFound();
    return db.progress[sessionId];
  });
}

export function getMode() { return config.mode; }
