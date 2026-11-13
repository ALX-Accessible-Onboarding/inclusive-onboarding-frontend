// Low-literacy mode support: plain wording, icons paired with clear labels, and auto-read toggle

export const ICONS = {
  name: '👤',
  phone: '📱',
  email: '✉️',
  id: '🪪',
  partner: '🤝',
  goal: '🎯',
  support: '♿',
  check: '✅',
  edit: '✏️',
  sound: '🔊',
  mic: '🎤',
  job: '💼',
  clock: '⏰',
  screenReader: '💻',
  hands: '👋',
  heart: '💛',
  home: '🏠',
  arrowRight: '➡️',
  arrowLeft: '⬅️'
};

export class LowLiteracyManager {
  constructor(initialMode = 'standard') {
    this.mode = initialMode; // 'standard' | 'simple'
    this.autoRead = false;
    this.listeners = [];
  }

  setMode(newMode) {
    if (this.mode !== newMode) {
      this.mode = newMode;
      this.notify();
    }
  }

  isSimpleMode() {
    return this.mode === 'simple';
  }

  toggleMode() {
    this.setMode(this.mode === 'simple' ? 'standard' : 'simple');
  }

  setAutoRead(enabled) {
    this.autoRead = Boolean(enabled);
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }
}

