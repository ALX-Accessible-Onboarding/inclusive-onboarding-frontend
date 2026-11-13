import { saveProgress } from '../api-client.js';

const STORAGE_PREFIX = 'ik_progress_';

export class ProgressStore {
  constructor(sessionId = 'default') {
    this.sessionId = sessionId;
    this.debounceTimer = null;
  }

  getLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + this.sessionId);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveLocal(data) {
    try {
      localStorage.setItem(STORAGE_PREFIX + this.sessionId, JSON.stringify(data));
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
          answers: data.answers || {}
        }).catch(() => {
          // Silent catch: network failure shouldn't disrupt the user
        });
      } catch (err) {}
    }, 1000);
  }
}
