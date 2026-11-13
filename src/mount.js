import { configure } from './api-client.js';
import { startOnboardingFlow } from './flows/onboarding.js';
import { LearnerProfile } from './flows/profile.js';
import { CareerGateway } from './career/job-list.js';
import { renderEmployerForm } from './flows/employer-form.js';
import { t } from './labels.js';

let activeInstance = null;

export class InclusiveKitInstance {
  constructor(options) {
    this.options = Object.assign({
      element: null,
      apiBaseUrl: 'http://localhost:4000/api',
      language: 'en',
      theme: 'default',
      initialView: 'career', // 'onboarding' | 'profile' | 'career' | 'employer'
      learnerId: 'lrn_demo'
    }, options);

    if (typeof this.options.element === 'string') {
      this.targetElement = document.querySelector(this.options.element);
    } else {
      this.targetElement = this.options.element;
    }

    if (!this.targetElement) {
      throw new Error('[InclusiveKit] Target element not found');
    }

    if (this.options.apiBaseUrl) {
      configure({ baseUrl: this.options.apiBaseUrl });
    }

    this.currentView = this.options.initialView;
    this.language = this.options.language;
    this.learnerId = this.options.learnerId;
    this.isSimpleMode = false;
    this.root = null;
    this.contentContainer = null;
    this.activeChild = null;

    this.render();
  }

  setLanguage(lang) {
    this.language = lang;
    this.render();
  }

  setView(viewName) {
    this.currentView = viewName;
    this.renderView();
    this.updateNavTabs();
  }

  render() {
    this.targetElement.innerHTML = '';

    const root = document.createElement('div');
    root.id = 'inclusive-kit';
    root.className = 'ik-root';
    this.root = root;

    // Top Navigation & Accessibility Bar
    const navBar = document.createElement('header');
    navBar.className = 'ik-top-nav';
    navBar.setAttribute('role', 'banner');

    // Navigation Tabs
    const tabsContainer = document.createElement('nav');
    tabsContainer.className = 'ik-nav-tabs';
    tabsContainer.setAttribute('aria-label', 'Inclusive Kit Navigation');

    const views = [
      { id: 'career', label: t('career', this.language), icon: '💼' },
      { id: 'profile', label: t('profile', this.language), icon: '👤' },
      { id: 'onboarding', label: t('onboarding', this.language), icon: '✨' },
      { id: 'employer', label: t('employer', this.language), icon: '📝' }
    ];

    views.forEach(v => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ik-btn ik-nav-tab ' + (this.currentView === v.id ? 'ik-active' : '');
      btn.setAttribute('data-view', v.id);
      btn.setAttribute('aria-current', this.currentView === v.id ? 'page' : 'false');
      btn.innerHTML = `<span aria-hidden="true">${v.icon}</span> <span>${v.label}</span>`;
      btn.addEventListener('click', () => {
        this.setView(v.id);
      });
      tabsContainer.appendChild(btn);
    });

    navBar.appendChild(tabsContainer);

    // Accessibility Controls: Language toggle & Mode toggle
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'ik-nav-actions';

    // Language Toggle (EN / AM)
    const langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-lang-toggle';
    langBtn.setAttribute('aria-label', 'Switch language');
    langBtn.innerHTML = `<span aria-hidden="true">🌐</span> <span>${this.language === 'am' ? 'English' : 'አማርኛ'}</span>`;
    langBtn.addEventListener('click', () => {
      this.setLanguage(this.language === 'am' ? 'en' : 'am');
    });
    actionsContainer.appendChild(langBtn);

    // Simple Mode Toggle
    const modeBtn = document.createElement('button');
    modeBtn.type = 'button';
    modeBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-mode-toggle ' + (this.isSimpleMode ? 'ik-active' : '');
    modeBtn.setAttribute('aria-pressed', this.isSimpleMode ? 'true' : 'false');
    modeBtn.innerHTML = `<span aria-hidden="true">🖼️</span> <span>${this.isSimpleMode ? 'Standard text' : 'Simple + Icons'}</span>`;
    modeBtn.addEventListener('click', () => {
      this.isSimpleMode = !this.isSimpleMode;
      this.render();
    });
    actionsContainer.appendChild(modeBtn);

    navBar.appendChild(actionsContainer);
    root.appendChild(navBar);

    // View Content Container
    const content = document.createElement('main');
    content.className = 'ik-view-content';
    content.id = 'ik-view-content';
    this.contentContainer = content;
    root.appendChild(content);

    this.targetElement.appendChild(root);
    this.renderView();
  }

  updateNavTabs() {
    if (!this.root) return;
    this.root.querySelectorAll('.ik-nav-tab').forEach(tab => {
      const v = tab.getAttribute('data-view');
      if (v === this.currentView) {
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
    this.contentContainer.innerHTML = '';

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
      renderEmployerForm({
        container: this.contentContainer,
        language: this.language,
        onSuccess: () => this.setView('career'),
        onCancel: () => this.setView('career')
      });
    }
  }

  destroy() {
    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }
    this.root = null;
    this.contentContainer = null;
    this.activeChild = null;
  }
}

/**
 * Task A3: Entrypoint mount function
 */
export function mount(options) {
  if (activeInstance) {
    activeInstance.destroy();
  }
  activeInstance = new InclusiveKitInstance(options);
  return activeInstance;
}

export function unmount() {
  if (activeInstance) {
    activeInstance.destroy();
    activeInstance = null;
  }
}

/**
 * Modal mount for embedding cleanly on host static pages
 */
export function openModal(options = {}) {
  let modalMount = document.getElementById('ik-modal-host');
  if (!modalMount) {
    modalMount = document.createElement('div');
    modalMount.id = 'ik-modal-host';
    modalMount.className = 'ik-modal-backdrop';
    modalMount.setAttribute('role', 'dialog');
    modalMount.setAttribute('aria-modal', 'true');
    modalMount.setAttribute('aria-label', 'Inclusive Access Kit');

    const dialog = document.createElement('div');
    dialog.className = 'ik-modal-dialog';

    const header = document.createElement('div');
    header.className = 'ik-modal-header';
    header.innerHTML = `
      <h2 class="ik-modal-title">Savanna Accessible Access</h2>
      <button type="button" class="ik-btn ik-btn-icon ik-modal-close-btn" aria-label="Close dialog">✕</button>
    `;

    const body = document.createElement('div');
    body.className = 'ik-modal-body';
    body.id = 'ik-modal-mount-point';

    dialog.appendChild(header);
    dialog.appendChild(body);
    modalMount.appendChild(dialog);
    document.body.appendChild(modalMount);

    header.querySelector('.ik-modal-close-btn').addEventListener('click', () => {
      closeModal();
    });

    modalMount.addEventListener('click', (e) => {
      if (e.target === modalMount) closeModal();
    });

    // Close on Escape key
    const onKey = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        window.removeEventListener('keydown', onKey);
      }
    };
    window.addEventListener('keydown', onKey);
  }

  modalMount.style.display = 'flex';
  return mount({
    element: '#ik-modal-mount-point',
    initialView: options.initialView || 'career',
    language: options.language || 'en',
    learnerId: options.learnerId || 'lrn_demo'
  });
}

export function closeModal() {
  unmount();
  const modalMount = document.getElementById('ik-modal-host');
  if (modalMount) {
    modalMount.style.display = 'none';
  }
}

