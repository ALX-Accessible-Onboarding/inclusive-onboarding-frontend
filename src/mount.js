import { VoiceAssistant } from './features/voice-assistant.js';
import { configure } from './api-client.js';
import { startOnboardingFlow } from './flows/onboarding.js';
import { LearnerProfile } from './flows/profile.js';
import { CareerGateway } from './career/job-list.js';
import { renderEmployerForm } from './flows/employer-form.js';
import { t } from './labels.js';
import { getLearnerId } from './core/learner-session.js';
import { stopSpeaking, configureVoice } from './features/read-aloud.js';

let activeInstance = null; // the kit on the page
let modalInstance = null;  // the kit inside the modal

export function isLowDataMode() {
  if (typeof navigator === 'undefined') return false;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return false;
  return Boolean(conn.saveData || (conn.effectiveType && conn.effectiveType.includes('2g')));
}

function stopSpeech() {
  stopSpeaking();
}

function setIconLabel(button, icon, text, textLang) {
  const iconSpan = document.createElement('span');
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent = icon;
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  if (textLang) textSpan.setAttribute('lang', textLang);
  button.textContent = '';
  button.appendChild(iconSpan);
  button.appendChild(document.createTextNode(' '));
  button.appendChild(textSpan);
}

export class InclusiveKitInstance {
  constructor(options) {
    this.options = Object.assign({
      element: null,
      apiBaseUrl: 'https://inclusive-onboarding-backend.onrender.com/api/v1',
      mode: 'live',
      token: 'demo-token',
      language: 'en',
      theme: 'default',
      initialView: 'career',
      learnerId: 'lrn_demo',
      voiceApiUrl: '/api/voice/speak',
      autoVoiceGuide: false
    }, options);

    this.targetElement = typeof this.options.element === 'string'
      ? document.querySelector(this.options.element)
      : this.options.element;

    if (!this.targetElement) {
      throw new Error('[InclusiveKit] Target element not found');
    }

    configure({
      baseUrl: this.options.apiBaseUrl,
      mode: this.options.mode,
      token: this.options.token
    });

    const storedLearnerId = getLearnerId() || (() => {
      try { return localStorage.getItem('inclusive_learner_id') || localStorage.getItem('ik_current_learner_id'); } catch (e) { return null; }
    })();

    this.currentView = this.options.initialView;
    this.language = this.options.language;
    this.learnerId = this.options.learnerId && this.options.learnerId !== 'lrn_demo'
      ? this.options.learnerId
      : (storedLearnerId || 'lrn_demo');
    this.isSimpleMode = false;
    this.root = null;
    this.contentContainer = null;
    this.activeChild = null;

    configureVoice({ endpoint: this.options.voiceApiUrl });
    const self = this;
    this.voiceAssistant = new VoiceAssistant({
      getLanguage: function () { return self.language; },
      getContent: function () { return self.contentContainer; },
      setView: function (viewName) { self.setView(viewName); },
      getView: function () { return self.currentView; },
      getRoot: function () { return self.root; }
    });
    this.render();
    if (this.options.autoVoiceGuide && this.voiceAssistant) {
      this.voiceAssistant.maybeAutoStartGuide();
    }
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.voiceAssistant) this.voiceAssistant.cancelPending();
    this.render();
    this.focusControl('.ik-lang-toggle');
  }

  setView(viewName) {
    this.currentView = viewName;
    this.renderView();
    this.updateNavTabs();
    this.focusContentHeading();
    if (this.voiceAssistant) this.voiceAssistant.onViewChanged(viewName);
  }

  startVoiceGuide() {
    return this.voiceAssistant ? this.voiceAssistant.startGuide() : false;
  }

  focusControl(selector) {
    const control = this.root && this.root.querySelector(selector);
    if (control) control.focus();
  }

  focusContentHeading() {
    const heading = this.contentContainer && this.contentContainer.querySelector('h1, h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
  }

  destroyChild() {
    if (this.activeChild && typeof this.activeChild.destroy === 'function') {
      this.activeChild.destroy();
    }
    this.activeChild = null;
    stopSpeech();
  }

  render() {
    if (this.voiceAssistant) this.voiceAssistant.cancelPending();
    this.destroyChild();
    this.targetElement.textContent = '';

    const root = document.createElement('div');
    root.className = 'ik-root';
    if (isLowDataMode()) {
      root.classList.add('ik-save-data');
    }
    root.setAttribute('lang', this.language);
    this.root = root;

    // Render server wake-up notification banner (visible when backend cold starts)
    const serverStatusBanner = document.createElement('div');
    serverStatusBanner.className = 'ik-server-status ik-hidden';
    serverStatusBanner.setAttribute('role', 'status');
    serverStatusBanner.setAttribute('aria-live', 'polite');
    root.appendChild(serverStatusBanner);

    // Live status region for screen-reader announcements
    const liveStatus = document.createElement('div');
    liveStatus.className = 'ik-live-status ik-sr-only';
    liveStatus.setAttribute('role', 'status');
    liveStatus.setAttribute('aria-live', 'polite');
    root.appendChild(liveStatus);

    // Top Navigation Bar
    const navBar = document.createElement('div');
    navBar.className = 'ik-top-nav';

    const tabsContainer = document.createElement('nav');
    tabsContainer.className = 'ik-nav-tabs';
    tabsContainer.setAttribute('aria-label', t('nav_label', this.language));

    const views = [
      { id: 'career', label: t('career', this.language), icon: '💼' },
      { id: 'profile', label: t('profile', this.language), icon: '👤' },
      { id: 'onboarding', label: t('onboarding', this.language), icon: '✨' },
      { id: 'employer', label: t('employer', this.language), icon: '📝' }
    ];

    views.forEach((v) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ik-btn ik-nav-tab' + (this.currentView === v.id ? ' ik-active' : '');
      btn.setAttribute('data-view', v.id);
      if (this.currentView === v.id) btn.setAttribute('aria-current', 'page');
      setIconLabel(btn, v.icon, v.label);
      btn.addEventListener('click', () => this.setView(v.id));
      tabsContainer.appendChild(btn);
    });
    navBar.appendChild(tabsContainer);

    const actions = document.createElement('div');
    actions.className = 'ik-nav-actions';

    // Language toggle
    const targetLang = this.language === 'am' ? 'en' : 'am';
    const langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-lang-toggle';
    setIconLabel(langBtn, '🌐', targetLang === 'am' ? 'አማርኛ' : 'English', targetLang);
    langBtn.addEventListener('click', () => this.setLanguage(targetLang));
    actions.appendChild(langBtn);

    // Mode toggle with visible text cue
    const modeBtn = document.createElement('button');
    modeBtn.type = 'button';
    modeBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-mode-toggle' + (this.isSimpleMode ? ' ik-active' : '');
    modeBtn.setAttribute('aria-pressed', this.isSimpleMode ? 'true' : 'false');
    const modeText = t('mode_label', this.language) + ' ' + (this.isSimpleMode ? t('toggleOn', this.language) : t('toggleOff', this.language));
    setIconLabel(modeBtn, '🖼️', modeText);
    modeBtn.addEventListener('click', () => {
      this.isSimpleMode = !this.isSimpleMode;
      this.render();
      this.focusControl('.ik-mode-toggle');
    });
    actions.appendChild(modeBtn);

    // Voice assistant controls (Read this page / Stop / Voice commands).
    // Native buttons, same .ik-btn styles and focus ring as the rest of
    // the nav; no layout or colour changes.
    if (this.voiceAssistant) this.voiceAssistant.renderControls(actions);

    navBar.appendChild(actions);
    root.appendChild(navBar);

    const content = document.createElement('div');
    content.className = 'ik-view-content';
    this.contentContainer = content;
    root.appendChild(content);

    this.targetElement.appendChild(root);
    this.renderView();
    if (this.voiceAssistant) this.voiceAssistant.renderStatus(root);
  }

  updateNavTabs() {
    if (!this.root) return;
    this.root.querySelectorAll('.ik-nav-tab').forEach((tab) => {
      if (tab.getAttribute('data-view') === this.currentView) {
        tab.classList.add('ik-active');
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.classList.remove('ik-active');
        tab.removeAttribute('aria-current');
      }
    });
  }

  renderView() {
    if (!this.contentContainer) return;
    this.destroyChild();
    this.contentContainer.textContent = '';

    if (this.currentView === 'career') {
      const gateway = new CareerGateway({
        container: this.contentContainer,
        learnerId: this.learnerId,
        language: this.language,
        isSimpleMode: this.isSimpleMode,
        onPostJobClick: () => this.setView('employer')
      });
      gateway.init();
      this.activeChild = gateway;

    } else if (this.currentView === 'profile') {
      const profile = new LearnerProfile({
        container: this.contentContainer,
        learnerId: this.learnerId,
        language: this.language,
        isSimpleMode: this.isSimpleMode,
        onProfileChange: (updated) => {
          this.learnerId = updated.id;
          if (updated.language) this.language = updated.language;
          if (updated.mode) this.isSimpleMode = updated.mode === 'simple';
        }
      });
      profile.init();
      this.activeChild = profile;

    } else if (this.currentView === 'onboarding') {
      startOnboardingFlow({
        container: this.contentContainer,
        initialLanguage: this.language,
        onComplete: (learner) => {
          this.learnerId = learner.id;
          this.language = learner.language || this.language;
          this.isSimpleMode = learner.mode === 'simple';
          this.setView('profile');
        },
        onNavigateToJobs: (learner) => {
          this.learnerId = learner.id;
          this.language = learner.language || this.language;
          this.setView('career');
        }
      });

    } else if (this.currentView === 'employer') {
      this.activeChild = renderEmployerForm({
        container: this.contentContainer,
        language: this.language,
        isSimpleMode: this.isSimpleMode,
        onSuccess: () => this.setView('career'),
        onCancel: () => this.setView('career')
      });
    }
  }

  destroy() {
    if (this.voiceAssistant) this.voiceAssistant.destroy();
    this.destroyChild();
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
    this.root = null;
    this.contentContainer = null;
  }
}

export function mount(options) {
  if (activeInstance) activeInstance.destroy();
  activeInstance = new InclusiveKitInstance(options);
  return activeInstance;
}

export function unmount() {
  if (activeInstance) {
    activeInstance.destroy();
    activeInstance = null;
  }
}

export function openModal(options = {}) {
  if (document.querySelector('dialog.ik-modal-dialog')) return modalInstance;

  const page = activeInstance;
  const lang = options.language || (page && page.language) || 'en';
  const opener = document.activeElement;

  const dialog = document.createElement('dialog');
  dialog.className = 'ik-modal-dialog';
  dialog.setAttribute('lang', lang);
  dialog.setAttribute('aria-labelledby', 'ik-modal-title');

  const header = document.createElement('div');
  header.className = 'ik-modal-header';
  const title = document.createElement('h2');
  title.id = 'ik-modal-title';
  title.className = 'ik-modal-title';
  title.textContent = t('modal_title', lang);
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'ik-btn ik-btn-icon ik-modal-close-btn';
  closeBtn.setAttribute('aria-label', t('close', lang));
  closeBtn.textContent = '✕';
  header.appendChild(title);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'ik-modal-body';

  dialog.appendChild(header);
  dialog.appendChild(body);

  let instance = null;

  dialog.addEventListener('close', function () {
    if (instance) instance.destroy();
    if (modalInstance === instance) modalInstance = null;
    dialog.remove();
    if (opener && typeof opener.focus === 'function') opener.focus();
  });
  closeBtn.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (e) {
    if (e.target === dialog) dialog.close();
  });

  document.body.appendChild(dialog);
  dialog.showModal();

  instance = new InclusiveKitInstance(Object.assign({}, page ? page.options : {}, {
    element: body,
    initialView: options.initialView || 'career',
    language: lang,
    learnerId: options.learnerId || (page && page.learnerId) || 'lrn_demo'
  }));
  modalInstance = instance;
  return instance;
}

export function closeModal() {
  const dialog = document.querySelector('dialog.ik-modal-dialog');
  if (dialog && dialog.open) dialog.close();
}