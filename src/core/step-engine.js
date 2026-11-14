import { QuestionScreen } from './question-screen.js';
import { ProgressStore } from './progress-store.js';
import { speak, isSpeaking, stopSpeaking } from '../features/read-aloud.js';
import { translateToAmharic } from '../labels.js';

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
    this.onSaveDraft = options.onSaveDraft || null;
    this.onClearDraft = options.onClearDraft || null;
    this.draftRestored = Boolean(options.draftRestored);

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

  saveDraft() {
    const draftPayload = {
      answers: this.answers,
      stepIndex: this.currentStep,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };
    if (typeof this.onSaveDraft === 'function') {
      try { this.onSaveDraft(draftPayload); } catch (e) {}
    }
    this.progressStore.save({
      stepIndex: this.currentStep,
      answers: this.answers
    });
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

    // Draft Restored Banner (shown once if answers were restored from localStorage)
    if (this.draftRestored) {
      const isAm = this.language === 'am' || String(this.language).startsWith('am');
      const draftBanner = document.createElement('div');
      draftBanner.className = 'ik-draft-banner';
      draftBanner.setAttribute('role', 'status');
      draftBanner.setAttribute('aria-live', 'polite');
      draftBanner.innerHTML = `
        <span>📝 <strong>${isAm ? 'የተቀመጠው ረቂቅ መረጃዎ ተመልሷል' : 'Restored your draft answers'}</strong> (${isAm ? 'ደረጃ ' + stepNumber : 'Step ' + stepNumber})</span>
        <button type="button" class="ik-draft-banner-btn">${isAm ? 'አዲስ ጀምር' : 'Start over'}</button>
      `;
      draftBanner.querySelector('.ik-draft-banner-btn').addEventListener('click', () => {
        if (typeof this.onClearDraft === 'function') {
          this.onClearDraft();
        }
        this.answers = {};
        this.currentStep = 0;
        this.draftRestored = false;
        this.render();
      });
      this.container.appendChild(draftBanner);
    }

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

    // Dynamically adjust ID details screen based on selected idRoute
    let dynamicConfig = screenConfig;
    if (screenConfig.id === 'idNumber') {
      const route = this.answers.idRoute || 'kebele';
      const isAm = this.language === 'am' || String(this.language).startsWith('am');
      let placeholder = '12345/AA';
      let example = '12345/AA';
      if (route === 'passport') {
        placeholder = 'EP1234567';
        example = 'EP1234567';
      } else if (route === 'refugee') {
        placeholder = 'ETH-12345';
        example = 'ETH-12345';
      } else if (route === 'other_document') {
        placeholder = 'DOC-12345';
        example = 'DOC-12345';
      }
      dynamicConfig = Object.assign({}, screenConfig, {
        placeholder: placeholder,
        helpText: isAm
          ? `ለምሳሌ፡ ${example}። አሁን ዘለው ቆይተው ማስገባት ይችላሉ።`
          : `For example: ${example}. You can also skip this and add it later.`
      });
    }

    this.activeScreenComponent = new QuestionScreen({
      ...dynamicConfig,
      language: this.language,
      isSimpleMode: this.isSimpleMode,
      value: currentVal,
      answers: this.answers,
      isFirst: this.currentStep === 0,
      isLast: this.currentStep === totalSteps - 1,
      onChange: (val) => {
        this.answers[screenConfig.id] = val;
        this.saveDraft();
      },
      onNext: async (val) => {
        this.answers[screenConfig.id] = val;
        this.draftRestored = false;
        this.saveDraft();

        if (typeof screenConfig.onValidateAsync === 'function') {
          const nextBtn = this.activeScreenComponent && this.activeScreenComponent.element && this.activeScreenComponent.element.querySelector('.ik-btn-next');
          const originalText = nextBtn ? nextBtn.innerHTML : '';
          if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.innerHTML = '<span>⏳...</span>';
          }
          try {
            const proceed = await screenConfig.onValidateAsync(val, this.answers, this);
            if (proceed === false) {
              if (nextBtn) {
                nextBtn.disabled = false;
                nextBtn.innerHTML = originalText;
              }
              return;
            }
          } catch (e) {
            if (nextBtn) {
              nextBtn.disabled = false;
              nextBtn.innerHTML = originalText;
            }
          }
          if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.innerHTML = originalText;
          }
        }

        if (this.currentStep < totalSteps - 1) {
          this.currentStep += 1;
          this.render();
        } else {
          this.onComplete(this.answers);
        }
      },
      onBack: (val) => {
        this.answers[screenConfig.id] = val;
        this.draftRestored = false;
        this.saveDraft();
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
        let text = '';
        if (typeof screenConfig.readAloudText === 'function') {
          text = screenConfig.readAloudText(this.language);
        } else if (screenConfig.readAloudText && typeof screenConfig.readAloudText === 'object') {
          text = screenConfig.readAloudText[this.language] || screenConfig.readAloudText.en;
        } else if (screenConfig.readAloudText) {
          text = screenConfig.readAloudText;
        } else {
          text = (screenConfig.title || screenConfig.label || '') + '. ' + (screenConfig.helpText || '');
        }
        if (this.language === 'am' || this.language.startsWith('am')) {
          text = translateToAmharic(text);
        }
        speak(text, { language: this.language });
      }
    }, 50);
  }

  destroy() {
    stopSpeaking();
    if (this.container) this.container.innerHTML = '';
  }
}

