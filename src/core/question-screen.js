import { speak, stopSpeaking, isSpeaking, isSpeechSupported } from '../features/read-aloud.js';
import { startVoiceRecognition, isVoiceSupported } from '../features/voice-input.js';
import { t, translateToAmharic } from '../labels.js';

/**
 * Reusable single question screen component.
 * Config: {
 *   id: string,
 *   title: string,
 *   label: string,
 *   helpText?: string,
 *   inputType: 'text' | 'textarea' | 'radio' | 'checkbox' | 'select',
 *   options?: Array<{ value: string, label: string, icon?: string, description?: string }>,
 *   voiceEnabled?: boolean,
 *   readAloudText?: string,
 *   validation?: Function,
 *   value?: any,
 *   language?: string,
 *   isSimpleMode?: boolean,
 *   onNext: Function,
 *   onBack?: Function,
 *   isFirst?: boolean,
 *   isLast?: boolean,
 *   nextLabel?: string,
 *   backLabel?: string
 * }
 */
export class QuestionScreen {
  constructor(config) {
    this.config = Object.assign({
      inputType: 'text',
      voiceEnabled: false,
      language: 'en',
      isSimpleMode: false,
      options: [],
      isFirst: false,
      isLast: false
    }, config);

    this.currentValue = this.config.value !== undefined ? this.config.value : (this.config.inputType === 'checkbox' ? [] : '');
    this.error = null;
    this.isListening = false;
    this.activeRecognition = null;
    this.voiceReviewPending = false;
    this.pendingTranscript = '';
    this.isSpeakingNow = false;
    this.element = null;
  }

  render() {
    const el = document.createElement('div');
    el.className = 'ik-question-screen';
    el.setAttribute('data-question-id', this.config.id);

    const lang = this.config.language;
    const qId = 'ik_q_' + this.config.id;
    const errorId = qId + '_err';
    const helpId = qId + '_help';

    // Header section with Title and Accessible Read-Aloud button
    const header = document.createElement('div');
    header.className = 'ik-question-header';

    const heading = document.createElement('h2');
    heading.id = qId + '_heading';
    heading.className = 'ik-question-heading';
    heading.setAttribute('tabindex', '-1');
    heading.textContent = this.config.title || this.config.label;
    header.appendChild(heading);

    // Read Aloud button
    if (isSpeechSupported()) {
      const readBtn = document.createElement('button');
      readBtn.type = 'button';
      readBtn.className = 'ik-btn ik-btn-icon ik-btn-read-aloud';
      readBtn.setAttribute('aria-label', t('readAloud', lang) + ': ' + (this.config.title || this.config.label));
      readBtn.innerHTML = '<span aria-hidden="true">🔊</span> <span class="ik-btn-label">' + t('readAloud', lang) + '</span>';
      readBtn.addEventListener('click', () => {
        if (this.isSpeakingNow) {
          stopSpeaking();
          this.isSpeakingNow = false;
          readBtn.classList.remove('ik-speaking');
        } else {
          let textToRead = '';
          if (typeof this.config.readAloudText === 'function') {
            textToRead = this.config.readAloudText(lang);
          } else if (this.config.readAloudText && typeof this.config.readAloudText === 'object') {
            textToRead = this.config.readAloudText[lang] || this.config.readAloudText.en;
          } else if (this.config.readAloudText) {
            textToRead = this.config.readAloudText;
          } else {
            textToRead = (this.config.title || this.config.label || '') + '. ' + (this.config.helpText || '');
          }

          // Strict language consistency check:
          // If language is Amharic, ensure textToRead is in Amharic
          if (lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'))) {
            textToRead = translateToAmharic(textToRead);
          }

          this.isSpeakingNow = true;
          readBtn.classList.add('ik-speaking');
          speak(textToRead, {
            language: lang,
            onEnd: () => {
              this.isSpeakingNow = false;
              readBtn.classList.remove('ik-speaking');
            }
          });
        }
      });
      header.appendChild(readBtn);
    }
    el.appendChild(header);

    // Help Text (if present)
    if (this.config.helpText) {
      const help = document.createElement('p');
      help.id = helpId;
      help.className = 'ik-help-text';
      help.textContent = this.config.helpText;
      el.appendChild(help);
    }

    // Input Control Area
    const inputArea = document.createElement('div');
    inputArea.className = 'ik-input-area';

    // Voice recognition bar (if voice is enabled)
    let micBtn = null;
    let voiceConfirmBox = null;

    if (this.config.voiceEnabled && isVoiceSupported() && (this.config.inputType === 'text' || this.config.inputType === 'textarea')) {
      const voiceBar = document.createElement('div');
      voiceBar.className = 'ik-voice-bar';

      micBtn = document.createElement('button');
      micBtn.type = 'button';
      micBtn.className = 'ik-btn ik-btn-mic';
      micBtn.setAttribute('aria-label', t('micStart', lang));
      micBtn.innerHTML = '<span class="ik-mic-icon" aria-hidden="true">🎤</span> <span>' + t('micStart', lang) + '</span>';

      voiceConfirmBox = document.createElement('div');
      voiceConfirmBox.className = 'ik-voice-confirm-box ik-hidden';
      voiceConfirmBox.setAttribute('role', 'region');
      voiceConfirmBox.setAttribute('aria-live', 'polite');

      micBtn.addEventListener('click', () => {
        if (this.isListening) {
          if (this.activeRecognition) this.activeRecognition.stop();
          this.isListening = false;
          micBtn.classList.remove('ik-listening');
          micBtn.querySelector('span:last-child').textContent = t('micStart', lang);
        } else {
          stopSpeaking();
          this.isListening = true;
          micBtn.classList.add('ik-listening');
          micBtn.querySelector('span:last-child').textContent = t('micListening', lang);

          this.activeRecognition = startVoiceRecognition({
            language: lang,
            onResult: (transcript) => {
              this.pendingTranscript = transcript;
              this.voiceReviewPending = true;
              voiceConfirmBox.innerHTML = `
                <p class="ik-voice-prompt"><strong>${t('micConfirm', lang)}</strong></p>
                <div class="ik-voice-preview">"${transcript}"</div>
                <div class="ik-voice-actions">
                  <button type="button" class="ik-btn ik-btn-primary ik-btn-sm ik-voice-accept">${t('confirm', lang)}</button>
                  <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-voice-retry">${t('edit', lang)}</button>
                </div>
              `;
              voiceConfirmBox.classList.remove('ik-hidden');

              voiceConfirmBox.querySelector('.ik-voice-accept').addEventListener('click', () => {
                inputField.value = transcript;
                this.currentValue = transcript;
                voiceConfirmBox.classList.add('ik-hidden');
                this.voiceReviewPending = false;
                inputField.focus();
              });

              voiceConfirmBox.querySelector('.ik-voice-retry').addEventListener('click', () => {
                inputField.value = transcript;
                this.currentValue = transcript;
                voiceConfirmBox.classList.add('ik-hidden');
                this.voiceReviewPending = false;
                inputField.focus();
              });
            },
            onError: (err) => {
              this.showError(err);
              this.isListening = false;
              micBtn.classList.remove('ik-listening');
              micBtn.querySelector('span:last-child').textContent = t('micStart', lang);
            },
            onEnd: () => {
              this.isListening = false;
              micBtn.classList.remove('ik-listening');
              micBtn.querySelector('span:last-child').textContent = t('micStart', lang);
            }
          });
        }
      });

      voiceBar.appendChild(micBtn);
      voiceBar.appendChild(voiceConfirmBox);
      inputArea.appendChild(voiceBar);
    }

    // Render specific input types
    let inputField = null;

    if (this.config.inputType === 'text' || this.config.inputType === 'tel' || this.config.inputType === 'email') {
      const label = document.createElement('label');
      label.className = 'ik-label';
      label.setAttribute('for', qId + '_input');
      label.textContent = this.config.label;
      inputArea.appendChild(label);

      inputField = document.createElement('input');
      inputField.id = qId + '_input';
      inputField.type = this.config.inputType;
      inputField.className = 'ik-input';
      inputField.value = this.currentValue || '';
      inputField.placeholder = this.config.placeholder || '';
      if (this.config.helpText) inputField.setAttribute('aria-describedby', helpId);

      // Restrict phone input to 10 digits
      const isPhoneField = this.config.inputType === 'tel' || this.config.id === 'contactValue';
      if (isPhoneField) {
        inputField.setAttribute('autocomplete', 'tel');
      }

      inputField.addEventListener('input', (e) => {
        let val = e.target.value;
        // If typing phone digits without '@', limit strictly to 10 digits
        if (isPhoneField && !val.includes('@')) {
          const digits = val.replace(/[^0-9]/g, '');
          if (digits.length > 10) {
            val = digits.slice(0, 10);
            inputField.value = val;
          }
        }
        this.currentValue = val;
        this.clearError();
        if (typeof this.config.onChange === 'function') {
          this.config.onChange(this.currentValue);
        }
      });

      // Submit step on Enter key if valid
      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          stopSpeaking();
          if (this.validate()) {
            this.config.onNext(this.currentValue);
          }
        }
      });
      inputArea.appendChild(inputField);

    } else if (this.config.inputType === 'textarea') {
      const label = document.createElement('label');
      label.className = 'ik-label';
      label.setAttribute('for', qId + '_input');
      label.textContent = this.config.label;
      inputArea.appendChild(label);

      inputField = document.createElement('textarea');
      inputField.id = qId + '_input';
      inputField.className = 'ik-textarea';
      inputField.rows = 4;
      inputField.value = this.currentValue || '';
      inputField.placeholder = this.config.placeholder || '';
      if (this.config.helpText) inputField.setAttribute('aria-describedby', helpId);

      inputField.addEventListener('input', (e) => {
        this.currentValue = e.target.value;
        this.clearError();
        if (typeof this.config.onChange === 'function') {
          this.config.onChange(this.currentValue);
        }
      });
      inputArea.appendChild(inputField);

    } else if (this.config.inputType === 'radio') {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'ik-fieldset';
      const legend = document.createElement('legend');
      legend.className = 'ik-legend';
      legend.textContent = this.config.label;
      fieldset.appendChild(legend);

      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'ik-options-grid';

      (this.config.options || []).forEach((opt, idx) => {
        const optionId = qId + '_opt_' + idx;
        const optWrapper = document.createElement('div');
        optWrapper.className = 'ik-option-card ' + (this.currentValue === opt.value ? 'ik-selected' : '');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = qId + '_radio';
        radio.id = optionId;
        radio.value = opt.value;
        radio.checked = this.currentValue === opt.value;
        radio.className = 'ik-radio-input';

        radio.addEventListener('change', () => {
          this.currentValue = opt.value;
          this.clearError();
          fieldset.querySelectorAll('.ik-option-card').forEach(c => c.classList.remove('ik-selected'));
          optWrapper.classList.add('ik-selected');
          if (typeof this.config.onChange === 'function') {
            this.config.onChange(this.currentValue);
          }
        });

        const optLabel = document.createElement('label');
        optLabel.setAttribute('for', optionId);
        optLabel.className = 'ik-option-label';

        let innerHTML = '';
        if (opt.icon) {
          innerHTML += `<span class="ik-opt-icon" aria-hidden="true">${opt.icon}</span> `;
        }
        innerHTML += `<span class="ik-opt-text"><strong>${opt.label}</strong></span>`;
        if (opt.description) {
          innerHTML += `<span class="ik-opt-desc">${opt.description}</span>`;
        }
        optLabel.innerHTML = innerHTML;

        optWrapper.appendChild(radio);
        optWrapper.appendChild(optLabel);
        optionsContainer.appendChild(optWrapper);
      });

      fieldset.appendChild(optionsContainer);
      inputArea.appendChild(fieldset);

    } else if (this.config.inputType === 'checkbox') {
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'ik-fieldset';
      const legend = document.createElement('legend');
      legend.className = 'ik-legend';
      legend.textContent = this.config.label;
      fieldset.appendChild(legend);

      const optionsContainer = document.createElement('div');
      optionsContainer.className = 'ik-options-grid';

      const selectedSet = new Set(Array.isArray(this.currentValue) ? this.currentValue : []);

      (this.config.options || []).forEach((opt, idx) => {
        const optionId = qId + '_chk_' + idx;
        const optWrapper = document.createElement('div');
        const isChecked = selectedSet.has(opt.value);
        optWrapper.className = 'ik-option-card ' + (isChecked ? 'ik-selected' : '');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = optionId;
        checkbox.value = opt.value;
        checkbox.checked = isChecked;
        checkbox.className = 'ik-checkbox-input';

        checkbox.addEventListener('change', (e) => {
          if (e.target.checked) {
            selectedSet.add(opt.value);
            optWrapper.classList.add('ik-selected');
          } else {
            selectedSet.delete(opt.value);
            optWrapper.classList.remove('ik-selected');
          }
          this.currentValue = Array.from(selectedSet);
          this.clearError();
          if (typeof this.config.onChange === 'function') {
            this.config.onChange(this.currentValue);
          }
        });

        const optLabel = document.createElement('label');
        optLabel.setAttribute('for', optionId);
        optLabel.className = 'ik-option-label';

        let innerHTML = '';
        if (opt.icon) {
          innerHTML += `<span class="ik-opt-icon" aria-hidden="true">${opt.icon}</span> `;
        }
        innerHTML += `<span class="ik-opt-text"><strong>${opt.label}</strong></span>`;
        if (opt.description) {
          innerHTML += `<span class="ik-opt-desc">${opt.description}</span>`;
        }
        optLabel.innerHTML = innerHTML;

        optWrapper.appendChild(checkbox);
        optWrapper.appendChild(optLabel);
        optionsContainer.appendChild(optWrapper);
      });

      fieldset.appendChild(optionsContainer);
      inputArea.appendChild(fieldset);
    }

    el.appendChild(inputArea);

    // Error Alert Box
    const errorP = document.createElement('p');
    errorP.id = errorId;
    errorP.className = 'ik-error-alert ik-hidden';
    errorP.setAttribute('role', 'alert');
    errorP.setAttribute('aria-live', 'assertive');
    el.appendChild(errorP);

    // Navigation buttons bar: Back and Next
    const navBar = document.createElement('div');
    navBar.className = 'ik-nav-bar';

    if (!this.config.isFirst && this.config.onBack) {
      const backBtn = document.createElement('button');
      backBtn.type = 'button';
      backBtn.className = 'ik-btn ik-btn-secondary ik-btn-back';
      backBtn.textContent = this.config.backLabel || t('back', lang);
      backBtn.addEventListener('click', () => {
        stopSpeaking();
        this.config.onBack(this.currentValue);
      });
      navBar.appendChild(backBtn);
    }

    // Explicit "Skip and add later" button for optional steps like idNumber
    if (this.config.allowSkip || this.config.id === 'idNumber') {
      const skipBtn = document.createElement('button');
      skipBtn.type = 'button';
      skipBtn.className = 'ik-btn ik-btn-secondary ik-btn-skip';
      skipBtn.textContent = lang === 'am' ? 'ዘልለው ይለፉ' : 'Skip and add later';
      skipBtn.addEventListener('click', () => {
        stopSpeaking();
        this.currentValue = '';
        this.clearError();
        this.config.onNext('');
      });
      navBar.appendChild(skipBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'ik-btn ik-btn-primary ik-btn-next';
    nextBtn.textContent = this.config.nextLabel || (this.config.isLast ? t('submit', lang) : t('next', lang));
    nextBtn.addEventListener('click', () => {
      stopSpeaking();
      if (this.validate()) {
        this.config.onNext(this.currentValue);
      }
    });
    navBar.appendChild(nextBtn);

    el.appendChild(navBar);

    this.element = el;
    return el;
  }

  showError(message) {
    this.error = message;
    if (this.element) {
      const errEl = this.element.querySelector('.ik-error-alert');
      if (errEl) {
        errEl.textContent = message;
        errEl.classList.remove('ik-hidden');
      }
      const input = this.element.querySelector('input, textarea, [type="radio"], [type="checkbox"]');
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    }
  }

  clearError() {
    this.error = null;
    if (this.element) {
      const errEl = this.element.querySelector('.ik-error-alert');
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.add('ik-hidden');
      }
      const inputs = this.element.querySelectorAll('input, textarea');
      inputs.forEach(input => input.removeAttribute('aria-invalid'));
    }
  }

  validate() {
    const lang = this.config.language;
    const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));

    // Check required constraints so user cannot pass without answering required steps
    if (this.config.required) {
      if (this.config.inputType === 'checkbox') {
        if (!Array.isArray(this.currentValue) || this.currentValue.length === 0) {
          this.showError(isAm ? 'እባክዎ ለመቀጠል ቢያንስ አንድ አማራጭ ይምረጡ።' : 'Please select at least one option to continue.');
          return false;
        }
      } else if (this.config.inputType === 'radio') {
        if (!this.currentValue) {
          this.showError(isAm ? 'እባክዎ ለመቀጠል አንዱን ይምረጡ።' : 'Please choose an option to continue.');
          return false;
        }
      } else if (this.currentValue === undefined || this.currentValue === null || !String(this.currentValue).trim()) {
        this.showError(isAm ? 'ይህ ጥያቄ መመለስ አለበት። እባክዎ መልስዎን ያስገቡ።' : 'This question is required. Please provide an answer.');
        return false;
      }
    }

    if (typeof this.config.validation === 'function') {
      const err = this.config.validation(this.currentValue, this.config.answers || {});
      if (err) {
        this.showError(err);
        return false;
      }
    }
    this.clearError();
    return true;
  }

  focus() {
    if (this.element) {
      const heading = this.element.querySelector('.ik-question-heading');
      if (heading) {
        heading.focus();
      } else {
        const input = this.element.querySelector('input, textarea, button');
        if (input) input.focus();
      }
    }
  }
}

