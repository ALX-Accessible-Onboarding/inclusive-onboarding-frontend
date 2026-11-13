import { QuestionScreen } from './question-screen.js';
import { ProgressStore } from './progress-store.js';
import { speak, isSpeaking, stopSpeaking } from '../features/read-aloud.js';

/**
 * StepEngine: manages sequential question screens, progress, and state.
 */
export class StepEngine {
  constructor(options) {
    this.container = options.container;
    this.screens = options.screens || []; // Array of screen configs or functions returning configs
    this.initialStep = options.initialStep || 0;
    this.initialAnswers = options.initialAnswers || {};
    this.sessionId = options.sessionId || 'ik_session_' + Date.now();
    this.language = options.language || 'en';
    this.isSimpleMode = options.isSimpleMode || false;
    this.autoRead = options.autoRead || false;
    this.onComplete = options.onComplete || (() => {});
    this.onCancel = options.onCancel || null;

    this.currentStep = this.initialStep;
    this.answers = Object.assign({}, this.initialAnswers);
    this.progressStore = new ProgressStore(this.sessionId);

    // Try restoring answers if available
    const saved = this.progressStore.getLocal();
    if (saved && saved.answers) {
      this.answers = Object.assign({}, saved.answers, this.answers);
      if (typeof saved.stepIndex === 'number' && options.resume) {
        this.currentStep = saved.stepIndex;
      }
    }

    this.activeScreenComponent = null;
  }

  getEffectiveScreens() {
    // Some screens may be conditional based on prior answers
    return this.screens.filter(screen => {
      if (typeof screen.condition === 'function') {
        return screen.condition(this.answers);
      }
      return true;
    });
  }

  render() {
    this.container.innerHTML = '';

    const effectiveScreens = this.getEffectiveScreens();
    if (this.currentStep >= effectiveScreens.length) {
      this.onComplete(this.answers);
      return;
    }

    const screenConfig = effectiveScreens[this.currentStep];
    const totalSteps = effectiveScreens.length;
    const stepNumber = this.currentStep + 1;

    // Progress Bar & Live Announcement
    const progressContainer = document.createElement('div');
    progressContainer.className = 'ik-step-progress-bar';

    const liveRegion = document.createElement('div');
    liveRegion.className = 'ik-sr-only';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.textContent = `Step ${stepNumber} of ${totalSteps}: ${screenConfig.title || screenConfig.label}`;
    progressContainer.appendChild(liveRegion);

    const progressText = document.createElement('div');
    progressText.className = 'ik-progress-text';
    progressText.innerHTML = `<span><strong>Step ${stepNumber} of ${totalSteps}</strong></span>`;
    progressContainer.appendChild(progressText);

    const meter = document.createElement('div');
    meter.className = 'ik-meter-track';
    const fill = document.createElement('div');
    fill.className = 'ik-meter-fill';
    fill.style.width = `${Math.round((stepNumber / totalSteps) * 100)}%`;
    meter.appendChild(fill);
    progressContainer.appendChild(meter);

    this.container.appendChild(progressContainer);

    // Screen component mount
    const screenMount = document.createElement('div');
    screenMount.className = 'ik-step-content';
    this.container.appendChild(screenMount);

    const currentVal = this.answers[screenConfig.id] !== undefined
      ? this.answers[screenConfig.id]
      : screenConfig.value;

    this.activeScreenComponent = new QuestionScreen({
      ...screenConfig,
      language: this.language,
      isSimpleMode: this.isSimpleMode,
      value: currentVal,
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === totalSteps - 1,
      onNext: (val) => {
        this.answers[screenConfig.id] = val;
        this.progressStore.save({
          stepIndex: this.currentStep + 1,
          answers: this.answers
        });

        if (this.currentStep < totalSteps - 1) {
          this.currentStep += 1;
          this.render();
        } else {
          this.onComplete(this.answers);
        }
      },
      onBack: (val) => {
        this.answers[screenConfig.id] = val;
        if (this.currentStep > 0) {
          this.currentStep -= 1;
          this.render();
        } else if (this.onCancel) {
          this.onCancel();
        }
      }
    });

    const screenEl = this.activeScreenComponent.render();
    screenMount.appendChild(screenEl);

    // Move focus to new step heading
    setTimeout(() => {
      this.activeScreenComponent.focus();
      // Auto-read if enabled
      if (this.autoRead) {
        const text = screenConfig.readAloudText || (screenConfig.title + '. ' + (screenConfig.helpText || ''));
        speak(text, { language: this.language });
      }
    }, 50);
  }

  destroy() {
    stopSpeaking();
    if (this.container) this.container.innerHTML = '';
  }
}
