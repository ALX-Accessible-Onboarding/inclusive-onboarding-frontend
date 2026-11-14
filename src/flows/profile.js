import { getLearner, patchLearner, getSupport, saveSupport } from '../api-client.js';
import { QuestionScreen } from '../core/question-screen.js';
import { validateName, validateContact, validateIdNumber } from '../core/validation.js';
import { SUPPORT_NEEDS, ID_ROUTES } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { getLearnerId, clearLearnerId } from '../core/learner-session.js';

/**
 * Tasks D1, D2: Profile page rendering and field editing reusing QuestionScreen.
 */
export class LearnerProfile {
  constructor(options) {
    this.container = options.container;
    this.learnerId = options.learnerId || 'lrn_demo';
    this.language = options.language || 'en';
    this.isSimpleMode = options.isSimpleMode || false;
    this.onProfileChange = options.onProfileChange || null;

    this.learner = null;
    this.supportRecord = null;
    this.loading = true;
    this.error = null;
    this.statusMessage = null;
  }

  async init() {
    this.loading = true;
    this.render();

    // Check if we have a saved real learner ID from backend onboarding
    const savedId = getLearnerId();
    if (savedId && (!this.learnerId || this.learnerId === 'lrn_demo')) {
      this.learnerId = savedId;
    }

    try {
      this.learner = await getLearner(this.learnerId);
    } catch (err) {
      if (err && (err.status === 404 || (err.errors && err.errors._ && err.errors._.includes('404')))) {
        clearLearnerId();
      }
      this.error = err.errors && err.errors._ ? err.errors._ : 'Could not load learner profile.';
      this.loading = false;
      this.render();
      return;
    }

    try {
      this.supportRecord = await getSupport(this.learnerId);
    } catch (err) {
      // 404 is normal if learner hasn't filled support needs yet
      this.supportRecord = { items: [] };
    }

    this.loading = false;
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    if (this.loading) {
      this.container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>Loading profile...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      this.container.innerHTML = `
        <div class="ik-error-card" role="alert">
          <p class="ik-error-msg">${this.error}</p>
          <button type="button" class="ik-btn ik-btn-secondary ik-retry-profile-btn">Retry</button>
        </div>
      `;
      this.container.querySelector('.ik-retry-profile-btn').addEventListener('click', () => this.init());
      return;
    }

    const lang = this.language;
    const lrn = this.learner || {};
    const supportItems = (this.supportRecord && Array.isArray(this.supportRecord.items)) ? this.supportRecord.items : [];

    const root = document.createElement('div');
    root.className = 'ik-profile-page';

    // Status announcement banner (e.g. after edit)
    if (this.statusMessage) {
      const banner = document.createElement('div');
      banner.className = 'ik-alert ik-alert-success';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.textContent = this.statusMessage;
      root.appendChild(banner);
      setTimeout(() => {
        this.statusMessage = null;
        if (banner.parentElement) banner.remove();
      }, 4000);
    }

    // Profile Header
    const header = document.createElement('div');
    header.className = 'ik-profile-header';
    header.innerHTML = `
      <div class="ik-profile-avatar" aria-hidden="true">👤</div>
      <div class="ik-profile-heading-group">
        <h1 class="ik-profile-title">${lrn.name || 'Learner Profile'}</h1>
        <p class="ik-profile-id-sub">ID: <code>${lrn.id}</code></p>
      </div>
    `;
    root.appendChild(header);

    // Profile Information Cards Container
    const grid = document.createElement('div');
    grid.className = 'ik-profile-sections-grid';

    // 1. Personal & Contact Info Card
    const personalCard = document.createElement('div');
    personalCard.className = 'ik-card ik-profile-card';
    personalCard.innerHTML = `
      <div class="ik-card-header">
        <h2 class="ik-card-title">${lang === 'am' ? 'የግል መረጃ እና አድራሻ' : 'Personal & Contact Information'}</h2>
      </div>
      <div class="ik-card-body">
        <div class="ik-field-row">
          <div class="ik-field-info">
            <span class="ik-field-label">${lang === 'am' ? 'ስም' : 'What should we call you?'}</span>
            <span class="ik-field-val"><strong>${lrn.name || 'Not provided'}</strong></span>
          </div>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-name-btn">
            ${t('edit', lang)}
          </button>
        </div>

        <div class="ik-field-row">
          <div class="ik-field-info">
            <span class="ik-field-label">${lang === 'am' ? 'ስልክ / ኢሜይል' : 'Contact Details'}</span>
            <span class="ik-field-val"><strong>${(lrn.contact && lrn.contact.value) || 'Not provided'}</strong> (${(lrn.contact && lrn.contact.type) || 'phone'})</span>
          </div>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-contact-btn">
            ${t('edit', lang)}
          </button>
        </div>
      </div>
    `;

    personalCard.querySelector('.ik-edit-name-btn').addEventListener('click', () => this.editName());
    personalCard.querySelector('.ik-edit-contact-btn').addEventListener('click', () => this.editContact());
    grid.appendChild(personalCard);

    // 2. Identification Status Card (D1: "Add my ID later")
    const idCard = document.createElement('div');
    idCard.className = 'ik-card ik-profile-card';

    let idStatusHtml = '';
    let isPendingPartner = lrn.idRoute === 'referral';
    let hasIdNumber = Boolean(lrn.idNumber);

    if (isPendingPartner) {
      idStatusHtml = `
        <div class="ik-callout ik-callout-warning">
          <span class="ik-badge ik-badge-warning">${t('idPendingReview', lang)}</span>
          <p class="ik-callout-text">
            ${lang === 'am'
              ? 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ ነው። ድጋፍ ሰጪ ቡድናችን ከእርስዎ ጋር ይገናኛል።'
              : 'Referral through community partner pending review. Your access is fully active in the meantime.'}
          </p>
        </div>
      `;
    } else if (hasIdNumber) {
      idStatusHtml = `
        <div class="ik-field-row">
          <div class="ik-field-info">
            <span class="ik-field-label">${lang === 'am' ? 'የሰነድ አይነት' : 'Document Route'}: <strong>${lrn.idRoute || 'Document'}</strong></span>
            <span class="ik-field-val">${lang === 'am' ? 'የመታወቂያ ቁጥር' : 'Document Number'}: <strong>${lrn.idNumber}</strong></span>
          </div>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-id-btn">
            ${t('edit', lang)}
          </button>
        </div>
      `;
    } else {
      idStatusHtml = `
        <div class="ik-callout ik-callout-info">
          <p class="ik-callout-text">
            ${lang === 'am' ? 'መታወቂያ አልተጨመረም። መታወቂያዎን አሁን ወይም ቆይተው ማከል ይችላሉ።' : 'No ID document is on file yet. You can add your ID now or at any time.'}
          </p>
          <button type="button" class="ik-btn ik-btn-primary ik-btn-sm ik-add-id-btn">
            + ${t('addIdLater', lang)}
          </button>
        </div>
      `;
    }

    idCard.innerHTML = `
      <div class="ik-card-header">
        <h2 class="ik-card-title">${lang === 'am' ? 'የመታወቂያ ሁኔታ' : 'Identification & Verification'}</h2>
      </div>
      <div class="ik-card-body">
        ${idStatusHtml}
      </div>
    `;

    const editIdBtn = idCard.querySelector('.ik-edit-id-btn');
    if (editIdBtn) editIdBtn.addEventListener('click', () => this.editIdNumber());
    const addIdBtn = idCard.querySelector('.ik-add-id-btn');
    if (addIdBtn) addIdBtn.addEventListener('click', () => this.editIdNumber());

    grid.appendChild(idCard);

    // 3. Support Needs Section (D1: Private badge + "No medical proof needed. Stored privately.")
    const supportCard = document.createElement('div');
    supportCard.className = 'ik-card ik-profile-card ik-support-needs-card';
    supportCard.innerHTML = `
      <div class="ik-card-header ik-support-header">
        <div class="ik-support-title-row">
          <h2 class="ik-card-title">${lang === 'am' ? 'የሚያስፈልገኝ ድጋፍ' : 'Support You Need'}</h2>
          <span class="ik-badge ik-badge-private">🔒 ${t('privateBadge', lang)}</span>
        </div>
        <p class="ik-privacy-notice">
          ${t('privateNotice', lang)}
          <br>
          <small class="ik-privacy-sub">
            ${lang === 'am'
              ? 'መረጃዎ ለስራ አሰሪዎች አይጋለጥም፤ ለአካታች ድጋፍ አስተባባሪዎች ብቻ ነው የሚታየው።'
              : 'Stored in an isolated support database. Employers cannot view this information.'}
          </small>
        </p>
      </div>
      <div class="ik-card-body">
        <div class="ik-support-chips-list">
          ${supportItems.length > 0 ? supportItems.map(item => `
            <span class="ik-badge ik-badge-support-item">
              ♿ ${label('support', item, lang)}
            </span>
          `).join('') : `
            <p class="ik-muted-text">
              ${lang === 'am' ? 'ምንም አይነት ድጋፍ አልተመዘገበም።' : 'No support accommodations requested yet.'}
            </p>
          `}
        </div>
        <div class="ik-support-card-footer">
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-support-btn">
            ${t('edit', lang)} ${lang === 'am' ? 'ድጋፍ' : 'Support Needs'}
          </button>
        </div>
      </div>
    `;

    supportCard.querySelector('.ik-edit-support-btn').addEventListener('click', () => this.editSupportNeeds());
    grid.appendChild(supportCard);

    // 4. Learning Preferences Card (Mode & Language)
    const prefCard = document.createElement('div');
    prefCard.className = 'ik-card ik-profile-card';
    prefCard.innerHTML = `
      <div class="ik-card-header">
        <h2 class="ik-card-title">${lang === 'am' ? 'የአጠቃቀም ምርጫዎች' : 'Interface & Learning Preferences'}</h2>
      </div>
      <div class="ik-card-body">
        <div class="ik-field-row">
          <div class="ik-field-info">
            <span class="ik-field-label">${lang === 'am' ? 'ቋንቋ' : 'Language'}</span>
            <span class="ik-field-val"><strong>${lrn.language === 'am' ? 'አማርኛ (Amharic)' : 'English'}</strong></span>
          </div>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-lang-btn">
            ${t('edit', lang)}
          </button>
        </div>

        <div class="ik-field-row">
          <div class="ik-field-info">
            <span class="ik-field-label">${lang === 'am' ? 'የአቀራረብ ሁነታ' : 'Reading / Learning Mode'}</span>
            <span class="ik-field-val"><strong>${lrn.mode === 'simple' ? 'Simple with icons' : 'Standard'}</strong></span>
          </div>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-edit-mode-btn">
            ${t('edit', lang)}
          </button>
        </div>
      </div>
    `;

    prefCard.querySelector('.ik-edit-lang-btn').addEventListener('click', () => this.editLanguage());
    prefCard.querySelector('.ik-edit-mode-btn').addEventListener('click', () => this.editMode());
    grid.appendChild(prefCard);

    root.appendChild(grid);
    this.container.appendChild(root);
  }

  /* =========================================================================
     Task D2: Reuse question-screen engine for edits (one field per screen)
     ========================================================================= */

  renderEditScreen(config, onSave) {
    this.container.innerHTML = '';

    const editWrapper = document.createElement('div');
    editWrapper.className = 'ik-edit-field-wrapper';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'ik-btn ik-btn-secondary ik-btn-sm ik-back-to-profile';
    cancelBtn.innerHTML = `← ${t('cancel', this.language)}`;
    cancelBtn.addEventListener('click', () => this.render());
    editWrapper.appendChild(cancelBtn);

    const questionMount = document.createElement('div');
    questionMount.className = 'ik-edit-question-mount';
    editWrapper.appendChild(questionMount);

    this.container.appendChild(editWrapper);

    const qs = new QuestionScreen({
      ...config,
      language: this.language,
      isSimpleMode: this.isSimpleMode,
      nextLabel: t('save', this.language),
      isFirst: true,
      isLast: true,
      onNext: async (val) => {
        try {
          await onSave(val);
          this.statusMessage = this.language === 'am' ? 'መረጃው በተሳካ ሁኔታ ተሻሽሏል!' : 'Field updated successfully!';
          if (this.onProfileChange) this.onProfileChange(this.learner);
          this.init();
        } catch (err) {
          qs.showError(err.errors && err.errors._ ? err.errors._ : (err.message || 'Could not update.'));
        }
      },
      onBack: () => this.render()
    });

    const el = qs.render();
    questionMount.appendChild(el);
    setTimeout(() => qs.focus(), 50);
  }

  editName() {
    this.renderEditScreen({
      id: 'name',
      title: this.language === 'am' ? 'ምን ብለን እንጥራዎት?' : 'What should we call you?',
      label: this.language === 'am' ? 'የመጀመሪያ ስም ወይም ቅጽል ስም ማስገባት ይችላሉ።' : 'First name or nickname is completely fine.',
      value: this.learner.name || '',
      inputType: 'text',
      voiceEnabled: true,
      validation: validateName
    }, async (val) => {
      const updated = await patchLearner(this.learnerId, { name: val });
      this.learner = updated;
    });
  }

  editContact() {
    const currentVal = (this.learner.contact && this.learner.contact.value) || '';
    const currentType = (this.learner.contact && this.learner.contact.type) || 'phone';

    this.renderEditScreen({
      id: 'contact',
      title: this.language === 'am' ? 'የመገናኛ አድራሻ' : 'Contact Information',
      label: currentType === 'email'
        ? (this.language === 'am' ? 'የኢሜይል አድራሻዎን ያስገቡ' : 'Please enter your email address')
        : (this.language === 'am' ? 'ባለ 12 አሃዝ የስልክ ቁጥርዎን ያስገቡ (ለምሳሌ፡ 251912345678)' : 'Please enter your 12-digit phone number (e.g. 251912345678)'),
      value: currentVal,
      inputType: currentType === 'email' ? 'email' : 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact(currentType, val, this.language)
    }, async (val) => {
      const cleanVal = currentType === 'phone' ? String(val).replace(/[^0-9]/g, '') : String(val).trim();
      const updated = await patchLearner(this.learnerId, {
        contact: { type: currentType, value: cleanVal }
      });
      this.learner = updated;
    });
  }

  editIdNumber() {
    this.renderEditScreen({
      id: 'idNumber',
      title: this.language === 'am' ? 'የመታወቂያ ቁጥርዎን ያክሉ' : 'Add or Update ID Document',
      label: this.language === 'am' ? 'የቀበሌ፣ ፓስፖርት ወይም ሌላ መታወቂያ ቁጥር' : 'Kebele, Passport, or Refugee ID document number',
      helpText: this.language === 'am' ? 'መታወቂያዎን አሁን ማከል ወይም ቆይተው ማስገባት ይችላሉ።' : 'You can enter your document number now or update it later.',
      value: this.learner.idNumber || '',
      inputType: 'text',
      voiceEnabled: true,
      validation: (val) => validateIdNumber(this.learner.idRoute, val)
    }, async (val) => {
      const updated = await patchLearner(this.learnerId, {
        idNumber: val ? String(val).trim() : null
      });
      this.learner = updated;
    });
  }

  editSupportNeeds() {
    const currentItems = (this.supportRecord && Array.isArray(this.supportRecord.items))
      ? this.supportRecord.items
      : [];

    const options = SUPPORT_NEEDS.map(need => ({
      value: need,
      label: label('support', need, this.language),
      icon: '♿'
    }));

    this.renderEditScreen({
      id: 'supportNeeds',
      title: this.language === 'am' ? 'የሚያስፈልገኝ ድጋፍ ማስተካከል' : 'Update Support You Need',
      label: this.language === 'am' ? 'የሚያስፈልጉዎትን ድጋፎች ይምረጡ' : 'Select all accommodations that help you learn and apply',
      helpText: t('privateNotice', this.language),
      value: currentItems,
      inputType: 'checkbox',
      options: options
    }, async (val) => {
      const updated = await saveSupport(this.learnerId, val);
      this.supportRecord = updated;
    });
  }

  editLanguage() {
    this.renderEditScreen({
      id: 'language',
      title: this.language === 'am' ? 'ቋንቋ ይምረጡ' : 'Select Language',
      label: 'Interface Language',
      value: this.learner.language || 'en',
      inputType: 'radio',
      options: [
        { value: 'en', label: 'English', icon: '🌐' },
        { value: 'am', label: 'አማርኛ (Amharic)', icon: '🇪🇹' }
      ]
    }, async (val) => {
      this.language = val;
      const updated = await patchLearner(this.learnerId, { language: val });
      this.learner = updated;
    });
  }

  editMode() {
    this.renderEditScreen({
      id: 'mode',
      title: this.language === 'am' ? 'የአቀራረብ ሁነታ ይምረጡ' : 'Select Reading / Learning Mode',
      label: 'Learning Mode',
      value: this.learner.mode || 'standard',
      inputType: 'radio',
      options: [
        {
          value: 'standard',
          label: 'Standard',
          icon: '📄',
          description: this.language === 'am' ? 'መደበኛ የጽሑፍ አቀራረብ' : 'Standard detailed layout'
        },
        {
          value: 'simple',
          label: 'Simple with icons',
          icon: '🖼️',
          description: this.language === 'am' ? 'ቀላል አገላለጽ ከምስሎች ጋር' : 'Plain language and descriptive visual icons'
        }
      ]
    }, async (val) => {
      this.isSimpleMode = val === 'simple';
      const updated = await patchLearner(this.learnerId, { mode: val });
      this.learner = updated;
    });
  }
}

