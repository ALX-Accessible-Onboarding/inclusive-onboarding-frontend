import { getLearner, patchLearner, getSupport, saveSupport } from '../api-client.js';
import { QuestionScreen } from '../core/question-screen.js';
import { validateName, validateContact, validateIdNumber } from '../core/validation.js';
import { SUPPORT_NEEDS } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { getLearnerId, clearLearnerId } from '../core/learner-session.js';
import { h, btn } from '../core/dom.js';

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
      this.error = (err.errors && err.errors._) ? err.errors._ : 'Could not load profile.';
      this.loading = false;
      this.render();
      return;
    }

    try {
      this.supportRecord = await getSupport(this.learnerId);
    } catch (err) {
      this.supportRecord = { items: [] };
    }

    this.loading = false;
    this.render();
  }

  render() {
    this.container.textContent = '';

    if (this.loading) {
      const loadDiv = h('div', 'ik-loading-indicator', null, [
        h('div', 'ik-spinner'),
        h('p', null, 'Loading profile...')
      ]);
      loadDiv.setAttribute('role', 'status');
      this.container.appendChild(loadDiv);
      return;
    }

    if (this.error) {
      const errCard = h('div', 'ik-error-card', null, [
        h('p', 'ik-error-msg', '⚠️ ' + this.error),
        btn('ik-btn ik-btn-secondary', 'Retry', () => this.init())
      ]);
      errCard.setAttribute('role', 'alert');
      this.container.appendChild(errCard);
      return;
    }

    const lang = this.language;
    const isAm = lang === 'am' || String(lang).startsWith('am');
    const lrn = this.learner || {};
    const supportItems = (this.supportRecord && Array.isArray(this.supportRecord.items)) ? this.supportRecord.items : [];

    const root = h('div', 'ik-profile-page');

    if (this.statusMessage) {
      const banner = h('div', 'ik-alert ik-alert-success', this.statusMessage);
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      root.appendChild(banner);
      setTimeout(() => {
        this.statusMessage = null;
        if (banner.parentElement) banner.remove();
      }, 4000);
    }

    const av = h('div', 'ik-profile-avatar', '👤');
    av.setAttribute('aria-hidden', 'true');

    const grp = h('div', 'ik-profile-heading-group', null, [
      h('h1', 'ik-profile-title', lrn.name || 'Learner Profile'),
      h('p', 'ik-profile-id-sub', 'ID: ' + (lrn.id || ''))
    ]);
    root.appendChild(h('div', 'ik-profile-header', null, [av, grp]));

    const grid = h('div', 'ik-profile-sections-grid');

    const makeCard = (titleText, bodyContent) => h('div', 'ik-card ik-profile-card', null, [
      h('div', 'ik-card-header', null, [h('h2', 'ik-card-title', titleText)]),
      h('div', 'ik-card-body', null, [bodyContent])
    ]);

    const makeRow = (lbl, val, onEdit) => h('div', 'ik-field-row', null, [
      h('div', 'ik-field-info', null, [
        h('span', 'ik-field-label', lbl),
        h('span', 'ik-field-val', null, [h('strong', null, val)])
      ]),
      btn('ik-btn ik-btn-secondary ik-btn-sm', t('edit', lang), onEdit)
    ]);

    // 1. Personal & Contact
    grid.appendChild(makeCard(isAm ? 'የግል መረጃ እና አድራሻ' : 'Personal & Contact Information', h('div', null, null, [
      makeRow(isAm ? 'ስም' : 'What should we call you?', lrn.name || 'Not provided', () => this.editName()),
      makeRow(isAm ? 'ስልክ / ኢሜይል' : 'Contact Details', (lrn.contact && lrn.contact.value) ? `${lrn.contact.value} (${lrn.contact.type || 'phone'})` : 'Not provided', () => this.editContact())
    ])));

    // 2. ID Status Card
    const idBody = h('div');
    if (lrn.idRoute === 'referral') {
      idBody.appendChild(h('div', 'ik-callout ik-callout-warning', null, [
        h('span', 'ik-badge ik-badge-warning', t('idPendingReview', lang)),
        h('p', 'ik-callout-text', isAm ? 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ ነው።' : 'Referral through partner pending review.')
      ]));
    } else if (lrn.idNumber) {
      idBody.appendChild(makeRow(isAm ? 'የመታወቂያ ቁጥር' : 'Document Number', `${lrn.idRoute || 'kebele'}: ${lrn.idNumber}`, () => this.editIdNumber()));
    } else {
      idBody.appendChild(h('div', 'ik-callout ik-callout-info', null, [
        h('p', 'ik-callout-text', isAm ? 'መታወቂያ አልተጨመረም። ቆይተው ማከል ይችላሉ።' : 'No ID document is on file yet.'),
        btn('ik-btn ik-btn-primary ik-btn-sm', '+ ' + t('addIdLater', lang), () => this.editIdNumber())
      ]));
    }
    grid.appendChild(makeCard(isAm ? 'የመታወቂያ ሁኔታ' : 'Identification & Verification', idBody));

    // 3. Support Needs Card
    const chipList = h('div', 'ik-support-chips-list');
    if (supportItems.length > 0) {
      supportItems.forEach(item => {
        chipList.appendChild(h('span', 'ik-badge ik-badge-support-item', '♿ ' + label('support', item, lang)));
      });
    } else {
      chipList.appendChild(h('p', 'ik-muted-text', isAm ? 'ምንም አይነት ድጋፍ አልተመዘገበም።' : 'No support accommodations requested yet.'));
    }
    grid.appendChild(makeCard(isAm ? 'የሚያስፈልገኝ ድጋፍ' : 'Support You Need', h('div', null, null, [
      chipList,
      h('div', 'ik-support-card-footer', null, [
        btn('ik-btn ik-btn-secondary ik-btn-sm', t('edit', lang) + ' ' + (isAm ? 'ድጋፍ' : 'Support Needs'), () => this.editSupportNeeds())
      ])
    ])));

    // 4. Learning Preferences
    grid.appendChild(makeCard(isAm ? 'የአጠቃቀም ምርጫዎች' : 'Interface & Learning Preferences', h('div', null, null, [
      makeRow(isAm ? 'ቋንቋ' : 'Language', lrn.language === 'am' ? 'አማርኛ (Amharic)' : 'English', () => this.editLanguage()),
      makeRow(isAm ? 'የአቀራረብ ሁነታ' : 'Reading / Learning Mode', lrn.mode === 'simple' ? 'Simple with icons' : 'Standard', () => this.editMode())
    ])));

    root.appendChild(grid);
    this.container.appendChild(root);
  }

  renderEditScreen(config, onSave) {
    this.container.textContent = '';
    const cancelBtn = btn('ik-btn ik-btn-secondary ik-btn-sm ik-back-to-profile', '← ' + t('cancel', this.language), () => this.render());
    const questionMount = h('div', 'ik-edit-question-mount');
    this.container.appendChild(h('div', 'ik-edit-field-wrapper', null, [cancelBtn, questionMount]));

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
          qs.showError((err.errors && err.errors._) ? err.errors._ : (err.message || 'Could not update.'));
        }
      },
      onBack: () => this.render()
    });

    questionMount.appendChild(qs.render());
    setTimeout(() => qs.focus(), 50);
  }

  editName() {
    this.renderEditScreen({
      id: 'name',
      title: this.language === 'am' ? 'ምን ብለን እንጥራዎት?' : 'What should we call you?',
      label: this.language === 'am' ? 'የመጀመሪያ ስም ወይም ቅጽል ስም' : 'First name or nickname',
      value: this.learner.name || '',
      inputType: 'text',
      voiceEnabled: true,
      validation: validateName
    }, async (val) => {
      this.learner = await patchLearner(this.learnerId, { name: val });
    });
  }

  editContact() {
    const currentVal = (this.learner.contact && this.learner.contact.value) || '';
    const currentType = (this.learner.contact && this.learner.contact.type) || 'phone';
    this.renderEditScreen({
      id: 'contact',
      title: this.language === 'am' ? 'የመገናኛ አድራሻ' : 'Contact Information',
      label: currentType === 'email'
        ? (this.language === 'am' ? 'የኢሜይል አድራሻዎን ያስገቡ' : 'Email address')
        : (this.language === 'am' ? 'ባለ 10 አሃዝ ስልክ ቁጥር ያስገቡ' : '10-digit phone number'),
      value: currentVal,
      inputType: currentType === 'email' ? 'email' : 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact(currentType, val, this.language)
    }, async (val) => {
      const cleanVal = currentType === 'phone' ? String(val).replace(/[^0-9]/g, '') : String(val).trim();
      this.learner = await patchLearner(this.learnerId, {
        contact: { type: currentType, value: cleanVal }
      });
    });
  }

  editIdNumber() {
    this.renderEditScreen({
      id: 'idNumber',
      title: this.language === 'am' ? 'የመታወቂያ ቁጥር ያክሉ' : 'Add ID Document',
      label: this.language === 'am' ? 'የመታወቂያ ሰነድ ቁጥር' : 'ID document number',
      value: this.learner.idNumber || '',
      inputType: 'text',
      voiceEnabled: true,
      validation: (val) => validateIdNumber(this.learner.idRoute, val)
    }, async (val) => {
      this.learner = await patchLearner(this.learnerId, {
        idNumber: val ? String(val).trim() : null
      });
    });
  }

  editSupportNeeds() {
    const currentItems = (this.supportRecord && Array.isArray(this.supportRecord.items)) ? this.supportRecord.items : [];
    this.renderEditScreen({
      id: 'supportNeeds',
      title: this.language === 'am' ? 'የሚያስፈልገኝ ድጋፍ' : 'Support You Need',
      label: this.language === 'am' ? 'የሚያስፈልጉዎትን ድጋፎች ይምረጡ' : 'Select all accommodations that help you',
      value: currentItems,
      inputType: 'checkbox',
      options: SUPPORT_NEEDS.map(need => ({
        value: need,
        label: label('support', need, this.language),
        icon: '♿'
      }))
    }, async (val) => {
      this.supportRecord = await saveSupport(this.learnerId, val);
    });
  }

  editLanguage() {
    this.renderEditScreen({
      id: 'language',
      title: this.language === 'am' ? 'ቋንቋ ይምረጡ' : 'Select Language',
      label: 'Language',
      value: this.learner.language || 'en',
      inputType: 'radio',
      options: [
        { value: 'en', label: 'English', icon: '🌐' },
        { value: 'am', label: 'አማርኛ (Amharic)', icon: '🇪🇹' }
      ]
    }, async (val) => {
      this.language = val;
      this.learner = await patchLearner(this.learnerId, { language: val });
    });
  }

  editMode() {
    this.renderEditScreen({
      id: 'mode',
      title: this.language === 'am' ? 'የአቀራረብ ሁነታ' : 'Learning Mode',
      label: 'Learning Mode',
      value: this.learner.mode || 'standard',
      inputType: 'radio',
      options: [
        { value: 'standard', label: 'Standard', icon: '📄' },
        { value: 'simple', label: 'Simple with icons', icon: '🖼️' }
      ]
    }, async (val) => {
      this.isSimpleMode = val === 'simple';
      this.learner = await patchLearner(this.learnerId, { mode: val });
    });
  }
}
