import { stopSpeaking } from '../features/read-aloud.js';
import { startVoiceRecognition, isVoiceSupported } from '../features/voice-input.js';
import { t } from '../labels.js';

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

    this.currentValue = this.config.value !== undefined
      ? this.config.value
      : (this.config.inputType === 'checkbox' ? [] : '');
    this.error = null;
    this.isListening = false;
    this.activeRecognition = null;
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

    const header = document.createElement('div');
    header.className = 'ik-question-header';
    const heading = document.createElement('h2');
    heading.id = qId + '_heading';
    heading.className = 'ik-question-heading';
    heading.setAttribute('tabindex', '-1');
    heading.textContent = this.config.title || this.config.label;
    header.appendChild(heading);
    el.appendChild(header);

    if (this.config.helpText) {
      const help = document.createElement('p');
      help.id = helpId;
      help.className = 'ik-help-text';
      help.textContent = this.config.helpText;
      el.appendChild(help);
    }

    const inputArea = document.createElement('div');
    inputArea.className = 'ik-input-area';
    let inputField = null;

    if (this.config.voiceEnabled && isVoiceSupported() && (this.config.inputType === 'text' || this.config.inputType === 'textarea')) {
      const voiceBar = document.createElement('div');
      voiceBar.className = 'ik-voice-bar';

      const micBtn = document.createElement('button');
      micBtn.type = 'button';
      micBtn.className = 'ik-btn ik-btn-mic';
      micBtn.setAttribute('aria-label', t('micStart', lang));
      micBtn.innerHTML = `<span class="ik-mic-icon" aria-hidden="true">🎤</span> <span>${t('micStart', lang)}</span>`;

      const voiceConfirm = document.createElement('div');
      voiceConfirm.className = 'ik-voice-confirm-box ik-hidden';
      voiceConfirm.setAttribute('role', 'region');
      voiceConfirm.setAttribute('aria-live', 'polite');

      micBtn.addEventListener('click', () => {
        if (this.isListening) {
          if (this.activeRecognition) {
            this.activeRecognition.stop();
            this.activeRecognition = null;
          }
          this.isListening = false;
          micBtn.classList.remove('ik-listening');
          micBtn.querySelector('span:last-child').textContent = t('micStart', lang);
          this.clearError();
        } else {
          this.clearError();
          stopSpeaking();
          this.isListening = true;
          micBtn.classList.add('ik-listening');
          micBtn.querySelector('span:last-child').textContent = t('micListening', lang);

          this.activeRecognition = startVoiceRecognition({
            language: lang,
            onResult: (transcript) => {
              if (inputField) {
                inputField.value = transcript;
                this.currentValue = transcript;
                this.clearError();
                if (typeof this.config.onChange === 'function') this.config.onChange(this.currentValue);
              }
              voiceConfirm.textContent = '';
              const promptP = document.createElement('p');
              promptP.className = 'ik-voice-prompt';
              const strongPrompt = document.createElement('strong');
              strongPrompt.textContent = t('micConfirm', lang);
              promptP.appendChild(strongPrompt);
              voiceConfirm.appendChild(promptP);

              const previewDiv = document.createElement('div');
              previewDiv.className = 'ik-voice-preview';
              previewDiv.textContent = `"${transcript}"`;
              voiceConfirm.appendChild(previewDiv);

              const actionsDiv = document.createElement('div');
              actionsDiv.className = 'ik-voice-actions';

              const acceptBtn = document.createElement('button');
              acceptBtn.type = 'button';
              acceptBtn.className = 'ik-btn ik-btn-primary ik-btn-sm ik-voice-accept';
              acceptBtn.textContent = t('confirm', lang);

              const retryBtn = document.createElement('button');
              retryBtn.type = 'button';
              retryBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-voice-retry';
              retryBtn.textContent = t('edit', lang);

              actionsDiv.appendChild(acceptBtn);
              actionsDiv.appendChild(retryBtn);
              voiceConfirm.appendChild(actionsDiv);
              voiceConfirm.classList.remove('ik-hidden');

              const closePrompt = () => {
                voiceConfirm.classList.add('ik-hidden');
                if (inputField) inputField.focus();
              };
              acceptBtn.addEventListener('click', closePrompt);
              retryBtn.addEventListener('click', closePrompt);
            },
            onError: (err, code) => {
              this.isListening = false;
              micBtn.classList.remove('ik-listening');
              micBtn.querySelector('span:last-child').textContent = t('micStart', lang);
              if (code !== 'aborted') this.showError(err, false);
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
      voiceBar.appendChild(voiceConfirm);
      inputArea.appendChild(voiceBar);
    }

    if (this.config.inputType === 'text' || this.config.inputType === 'tel' || this.config.inputType === 'email' || this.config.inputType === 'textarea') {
      const lbl = document.createElement('label');
      lbl.className = 'ik-label';
      lbl.setAttribute('for', qId + '_input');
      lbl.textContent = this.config.label;
      inputArea.appendChild(lbl);

      const isArea = this.config.inputType === 'textarea';
      inputField = document.createElement(isArea ? 'textarea' : 'input');
      inputField.id = qId + '_input';
      if (!isArea) inputField.type = this.config.inputType;
      else inputField.rows = 4;
      inputField.className = isArea ? 'ik-textarea' : 'ik-input';
      inputField.value = this.currentValue || '';
      inputField.placeholder = this.config.placeholder || '';
      if (this.config.helpText) inputField.setAttribute('aria-describedby', helpId);

      const isPhone = this.config.inputType === 'tel' || this.config.id === 'contactValue';
      if (isPhone) inputField.setAttribute('autocomplete', 'tel');

      inputField.addEventListener('input', (e) => {
        let val = e.target.value;
        if (isPhone && !val.includes('@')) {
          const digits = val.replace(/[^0-9]/g, '');
          if (digits.length > 10) {
            val = digits.slice(0, 10);
            inputField.value = val;
          }
        }
        this.currentValue = val;
        this.clearError();
        if (typeof this.config.onChange === 'function') this.config.onChange(this.currentValue);
      });

      inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isArea) {
          e.preventDefault();
          stopSpeaking();
          if (this.validate()) this.config.onNext(this.currentValue);
        }
      });
      inputArea.appendChild(inputField);

    } else if (this.config.inputType === 'radio' || this.config.inputType === 'checkbox') {
      const isRadio = this.config.inputType === 'radio';
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'ik-fieldset';
      const legend = document.createElement('legend');
      legend.className = 'ik-legend';
      legend.textContent = this.config.label;
      fieldset.appendChild(legend);

      const grid = document.createElement('div');
      grid.className = 'ik-options-grid';
      const selectedSet = isRadio ? null : new Set(Array.isArray(this.currentValue) ? this.currentValue : []);

      (this.config.options || []).forEach((opt, idx) => {
        const optId = `${qId}_opt_${idx}`;
        const isSelected = isRadio ? this.currentValue === opt.value : selectedSet.has(opt.value);

        const card = document.createElement('div');
        card.className = 'ik-option-card' + (isSelected ? ' ik-selected' : '');

        const input = document.createElement('input');
        input.type = isRadio ? 'radio' : 'checkbox';
        input.id = optId;
        input.value = opt.value;
        input.checked = isSelected;
        input.className = isRadio ? 'ik-radio-input' : 'ik-checkbox-input';
        if (isRadio) input.name = qId + '_radio';

        input.addEventListener('change', (e) => {
          if (isRadio) {
            this.currentValue = opt.value;
            grid.querySelectorAll('.ik-option-card').forEach(c => c.classList.remove('ik-selected'));
            card.classList.add('ik-selected');
          } else {
            if (e.target.checked) {
              selectedSet.add(opt.value);
              card.classList.add('ik-selected');
            } else {
              selectedSet.delete(opt.value);
              card.classList.remove('ik-selected');
            }
            this.currentValue = Array.from(selectedSet);
          }
          this.clearError();
          if (typeof this.config.onChange === 'function') this.config.onChange(this.currentValue);
        });

        const optLabel = document.createElement('label');
        optLabel.setAttribute('for', optId);
        optLabel.className = 'ik-option-label';

        if (opt.icon) {
          const spIcon = document.createElement('span');
          spIcon.className = 'ik-opt-icon';
          spIcon.setAttribute('aria-hidden', 'true');
          spIcon.textContent = opt.icon;
          optLabel.appendChild(spIcon);
          optLabel.appendChild(document.createTextNode(' '));
        }

        const spText = document.createElement('span');
        spText.className = 'ik-opt-text';
        const strng = document.createElement('strong');
        strng.textContent = opt.label;
        spText.appendChild(strng);
        optLabel.appendChild(spText);

        if (opt.description) {
          const spDesc = document.createElement('span');
          spDesc.className = 'ik-opt-desc';
          spDesc.textContent = opt.description;
          optLabel.appendChild(spDesc);
        }

        card.appendChild(input);
        card.appendChild(optLabel);
        grid.appendChild(card);
      });

      fieldset.appendChild(grid);
      inputArea.appendChild(fieldset);
    }

    el.appendChild(inputArea);

    const errorP = document.createElement('p');
    errorP.id = errorId;
    errorP.className = 'ik-error-alert ik-hidden';
    errorP.setAttribute('role', 'alert');
    errorP.setAttribute('aria-live', 'assertive');
    el.appendChild(errorP);

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
      if (this.validate()) this.config.onNext(this.currentValue);
    });
    navBar.appendChild(nextBtn);

    el.appendChild(navBar);
    this.element = el;
    return el;
  }

  showError(message, markInvalid = true) {
    this.error = message;
    if (this.element) {
      const errEl = this.element.querySelector('.ik-error-alert');
      if (errEl) {
        const lang = this.config.language;
        const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));
        const prefix = isAm ? 'ስህተት፡ ' : 'Error: ';
        let text = String(message || '');
        if (!text.includes('Error:') && !text.includes('ስህተት፡') && !text.includes('⚠️')) {
          text = `⚠️ ${prefix}${text}`;
        } else if (!text.includes('⚠️')) {
          text = `⚠️ ${text}`;
        }
        errEl.textContent = text;
        errEl.classList.remove('ik-hidden');
      }
      if (markInvalid) {
        const input = this.element.querySelector('input, textarea, [type="radio"], [type="checkbox"]');
        if (input) {
          input.setAttribute('aria-invalid', 'true');
          input.focus();
        }
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
      if (heading) heading.focus();
      else {
        const input = this.element.querySelector('input, textarea, button');
        if (input) input.focus();
      }
    }
  }

  destroy() {
    if (this.activeRecognition) {
      try { this.activeRecognition.abort(); } catch (e) {}
      this.activeRecognition = null;
    }
    this.isListening = false;
  }
}
