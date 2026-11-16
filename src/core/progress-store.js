import { saveProgress } from '../api-client.js';

const STORAGE_PREFIX = 'ik_progress_';

export function sanitizeDraftAnswers(answers) {
  if (!answers || typeof answers !== 'object') return {};
  const clean = Object.assign({}, answers);
  // Strictly omit all private fields (supportNeeds, idNumber, privateNotes)
  delete clean.supportNeeds;
  delete clean.support_needs;
  delete clean.idNumber;
  delete clean.id_number;
  delete clean.privateNotes;
  delete clean.private_notes;
  return clean;
}

export class ProgressStore {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.debounceTimer = null;
  }

  getLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + this.sessionId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.answers) {
        parsed.answers = sanitizeDraftAnswers(parsed.answers);
      }
      return parsed;
    } catch (e) {
      return null;
    }
  }

  saveLocal(data) {
    try {
      const sanitized = Object.assign({}, data);
      if (sanitized.answers) {
        sanitized.answers = sanitizeDraftAnswers(sanitized.answers);
      }
      localStorage.setItem(STORAGE_PREFIX + this.sessionId, JSON.stringify(sanitized));
    } catch (e) {}
  }

  clearLocal() {
    try {
      localStorage.removeItem(STORAGE_PREFIX + this.sessionId);
    } catch (e) {}
  }

  save(data) {
    this.saveLocal(data);

    // Debounced remote save (1000ms)
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      try {
        saveProgress({
          sessionId: this.sessionId,
          step: data.stepIndex || 0,
          answers: sanitizeDraftAnswers(data.answers || {})
        }).catch(() => {
          // Silent catch: network failure shouldn't disrupt the user
        });
      } catch (err) {}
    }, 1000);
  }
}
