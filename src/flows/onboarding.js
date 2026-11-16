import { StepEngine } from '../core/step-engine.js';
import { createLearner, saveSupport, createReferral, checkLearnerExists } from '../api-client.js';
import { validateName, validateContact, validateIdNumber } from '../core/validation.js';
import { sanitizeDraftAnswers } from '../core/progress-store.js';
import { SUPPORT_NEEDS } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { saveLearnerId } from '../core/learner-session.js';
import { h, btn } from '../core/dom.js';

const NEED_ICONS = { read_aloud: '🔊', larger_text: '🔍', voice_input: '🎤', more_time: '⏱️', sign_language: '🤟', other: '✨' };

export function getOnboardingScreens(lang = 'en', onAlreadyRegistered = null) {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));
  const L = (en, am) => isAm ? am : en;

  const idOptions = [
    { value: 'kebele', icon: '🪪', label: L('Kebele ID Card', 'የቀበሌ መታወቂያ') },
    { value: 'passport', icon: '🛂', label: L('Passport', 'ፓስፖርት') },
    { value: 'refugee', icon: '📄', label: L('Refugee ID / UNHCR', 'የስደተኞች መታወቂያ') },
    { value: 'other_document', icon: '📋', label: L('Other Document', 'ሌላ ሰነድ') },
    { value: 'referral', icon: '🤝', label: L('Partner Referral (No ID)', 'የአጋር ድርጅት ማረጋገጫ (መታወቂያ የለኝም)') }
  ];

  const partnerOptions = [
    { value: 'aaapd', icon: '🏢', label: L('AAAPD (Disability Assoc.)', 'የአካል ጉዳተኞች ማህበር (AAAPD)') },
    { value: 'ena', icon: '🤝', label: L('Ethiopian Blind/Deaf Assoc.', 'የኢትዮጵያ ዓይነ ስውራን/መስማት የተሳናቸው ማህበር') },
    { value: 'unhcr', icon: '🌐', label: L('UNHCR / Refugee Partner', 'UNHCR / የስደተኞች አጋር') },
    { value: 'other_partner', icon: '📍', label: L('Other Community Partner', 'ሌላ የማህበረሰብ አጋር') }
  ];

  const goalOptions = [
    { value: 'virtual_assistant', icon: '💻', label: L('Virtual Assistant & Remote Work', 'የርቀት ደንበኞች አገልግሎት ረዳት (VA)') },
    { value: 'tech_skills', icon: '🚀', label: L('Digital & Tech Skills', 'ዲጂታል እና የቴክኖሎጂ ክህሎቶች') },
    { value: 'career_jobs', icon: '💼', label: L('Find an Inclusive Job', 'ተደራሽ የሥራ እድሎችን ማግኘት') },
    { value: 'certification', icon: '📜', label: L('Earn a Certificate', 'ሰርተፍኬት ማግኘት') }
  ];

  const supportOptions = SUPPORT_NEEDS.map(n => ({
    value: n,
    icon: NEED_ICONS[n] || '♿',
    label: label('support', n, lang)
  }));

  return [
    {
      id: 'welcome_settings',
      required: true,
      title: L('Welcome to Savanna', 'እንኳን ወደ ሳቫና በደህና መጡ'),
      label: L('Choose language and mode:', 'ቋንቋ እና የአቀራረብ ሁነታ ይምረጡ፡'),
      helpText: L('Select preferred language.', 'የመረጡትን ቋንቋ ይምረጡ።'),
      inputType: 'radio',
      options: [
        { value: 'en_standard', icon: '🌐', label: 'English (Standard)' },
        { value: 'en_simple', icon: '🖼️', label: 'English (Simple + icons)' },
        { value: 'am_standard', icon: '🇪🇹', label: 'አማርኛ (መደበኛ)' },
        { value: 'am_simple', icon: '🇪🇹', label: 'አማርኛ (ቀላል + ምስሎች)' }
      ],
      value: isAm ? 'am_standard' : 'en_standard'
    },
    {
      id: 'name',
      required: true,
      title: L('What should we call you?', 'ምን ብለን እንጥራዎት?'),
      label: L('Your name or nickname (required):', 'የእርስዎ ስም ወይም ቅጽል ስም (ግዴታ)፡'),
      helpText: L('Nickname or full name. Minimum 2 characters.', 'የመጀመሪያ ስም ወይም ቅጽል ስም መጠቀም ይችላሉ።'),
      inputType: 'text',
      voiceEnabled: true,
      validation: (val) => validateName(val, lang)
    },
    {
      id: 'contactValue',
      required: true,
      title: L('How can we reach you?', 'እንዴት እናገኝዎት?'),
      label: L('Phone (10 digits starting 09/07) or Email:', 'ስልክ ቁጥር (09/07) ወይም ኢሜይል፡'),
      helpText: L('10-digit phone (09/07) or email address.', 'ባለ 10 አሃዝ ስልክ (09/07) ወይም ኢሜይል ያስገቡ።'),
      placeholder: L('0912345678 or name@example.com', '0912345678 ወይም name@example.com'),
      inputType: 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact('auto', val, lang),
      onValidateAsync: async (val, answers) => {
        if (typeof onAlreadyRegistered !== 'function') return true;
        const isEmail = val && val.includes('@');
        let contactDigits = String(val || '').trim();
        if (!isEmail) contactDigits = contactDigits.replace(/[^0-9]/g, '');
        const check = await checkLearnerExists({
          name: answers.name || '',
          contact: { type: isEmail ? 'email' : 'phone', value: contactDigits }
        });
        if (check && check.exists && check.existingId) {
          onAlreadyRegistered(check.existingId, answers.name || check.name);
          return false;
        }
        return true;
      }
    },
    {
      id: 'idRoute',
      required: true,
      title: L('ID Verification', 'የመታወቂያ ማረጋገጫ መንገድ'),
      label: L('Choose how to verify your account (required):', 'መለያዎን እንዴት ማረጋገጥ እንደሚፈልጉ ይምረጡ፡'),
      helpText: L('Partner referral is available if you do not have an ID.', 'ሰነድ ከሌለዎት በአጋር ድርጅት በኩል መረጋገጥ ይችላሉ።'),
      inputType: 'radio',
      value: 'kebele',
      options: idOptions
    },
    {
      id: 'idNumber',
      title: L('Enter ID Number', 'የመታወቂያ ቁጥር ያስገቡ'),
      label: L('Document number (optional now):', 'የሰነድ ቁጥር (አሁን ማስገባት አማራጭ ነው)፡'),
      helpText: L('e.g. 12345/AA. Can skip and add later.', 'ለምሳሌ፡ 12345/AA። ቆይተው ማስገባት ይችላሉ።'),
      placeholder: L('e.g. 12345/AA', 'ምሳሌ፡ 12345/AA'),
      inputType: 'text',
      voiceEnabled: true,
      condition: (answers) => answers.idRoute && answers.idRoute !== 'referral',
      validation: (val, answers) => validateIdNumber((answers && answers.idRoute) || 'kebele', val, lang)
    },
    {
      id: 'partnerReferral',
      required: true,
      title: L('Partner Referral', 'የአጋር ድርጅት ዝርዝሮች'),
      label: L('Select your partner organization (required):', 'የአጋር ድርጅትዎን ይምረጡ (ግዴታ)፡'),
      helpText: L('Partners verify learners without official documents.', 'አጋር ድርጅቶች ሰነድ የሌላቸውን ተማሪዎች ያረጋግጣሉ።'),
      inputType: 'radio',
      value: 'aaapd',
      options: partnerOptions,
      condition: (answers) => answers.idRoute === 'referral'
    },
    {
      id: 'goals',
      required: true,
      title: L('Learning Goals', 'የመማር ግቦችዎ'),
      label: L('Select what you hope to achieve:', 'ሊያሳኩት የሚፈልጉትን ይምረጡ፡'),
      helpText: L('Helps us suggest suitable courses.', 'ተስማሚ ኮርሶችን እንድንጠቁም ይረዳናል።'),
      inputType: 'checkbox',
      options: goalOptions
    },
    {
      id: 'supportNeeds',
      title: L('Support You Need', 'የሚያስፈልግዎት ድጋፍ'),
      label: L('Select accommodations that help you (optional):', 'የመማሪያ ድጋፍ አማራጮች (አማራጭ)፡'),
      helpText: L('Private. No medical proof required.', 'በሚስጥር የተጠበቀ። የህክምና ማረጋገጫ አያስፈልግም።'),
      inputType: 'checkbox',
      options: supportOptions
    },
    {
      id: 'review_confirm',
      title: L('Review & Confirm', 'መረጃዎን ያረጋግጡ'),
      label: L('Check your details before submitting:', 'እባክዎ መረጃዎን ይፈትሹ እና ያረጋግጡ፡'),
      helpText: L('You can edit your profile anytime later.', 'መገለጫዎን በማንኛውም ጊዜ ማስተካከል ይችላሉ።'),
      inputType: 'radio',
      options: [
        { value: 'confirm_ready', icon: '✅', label: L('Everything looks good — create my account', 'ሁሉም መረጃ ትክክል ነው — መለያዬን ፍጠር') }
      ],
      value: 'confirm_ready'
    }
  ];
}

const DRAFT_KEY = 'ik_onboarding_draft';

export function startOnboardingFlow(options) {
  const container = options.container;
  const initialLang = options.initialLanguage || 'en';
  const onComplete = options.onComplete || null;
  const onNavigateToJobs = options.onNavigateToJobs || null;

  let savedDraft = null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) savedDraft = JSON.parse(raw);
  } catch (e) {}

  const initialAnswers = (savedDraft && savedDraft.answers) ? sanitizeDraftAnswers(savedDraft.answers) : {};

  function renderAlreadyRegistered(existingId, learnerName) {
    container.textContent = '';
    const isAm = engine.language === 'am' || String(engine.language).startsWith('am');
    const safeName = learnerName || (isAm ? 'ተማሪ' : 'Learner');
    const safeId = existingId || 'lrn_demo';

    const card = h('div', 'ik-already-registered-card', null, [
      h('div', 'ik-already-badge', null, [
        h('span', 'ik-badge ik-badge-info', 'ℹ️ ' + (isAm ? 'ቀድሞ የተመዘገበ መለያ' : 'Existing Profile Found'))
      ]),
      h('h2', 'ik-already-title', isAm ? `እንኳን ደህና መጡ፣ ${safeName}!` : `Welcome back, ${safeName}!`),
      h('p', 'ik-already-message', isAm
        ? 'በዚህ ስልክ ቁጥር ወይም ኢሜይል የተመዘገበ መለያ አግኝተናል። እንደገና መመዝገብ አያስፈልግዎትም!'
        : 'We found an existing profile with your contact details. You do not need to register again!'),
      h('div', 'ik-already-actions', null, [
        btn('ik-btn ik-btn-primary ik-btn-existing-jobs', isAm ? '💼 ወደ ተደራሽ የስራ እድሎች ሂድ' : '💼 Go to Career Gateway', () => {
          saveLearnerId(safeId);
          if (onNavigateToJobs) onNavigateToJobs({ id: safeId, name: safeName, language: engine.language });
        }),
        btn('ik-btn ik-btn-secondary ik-btn-existing-profile', isAm ? '👤 መገለጫዬን ክፈት' : '👤 View My Profile', () => {
          saveLearnerId(safeId);
          if (onComplete) onComplete({ id: safeId, name: safeName, language: engine.language });
        })
      ])
    ]);
    card.setAttribute('role', 'region');
    card.setAttribute('aria-live', 'polite');
    container.appendChild(card);
  }

  const engine = new StepEngine({
    container,
    screens: getOnboardingScreens(initialLang, renderAlreadyRegistered),
    initialAnswers,
    draftRestored: Boolean(savedDraft && Object.keys(initialAnswers).length > 0),
    language: initialLang,
    onSaveDraft: (draft) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          answers: sanitizeDraftAnswers(draft.answers),
          timestamp: Date.now()
        }));
      } catch (e) {}
    },
    onClearDraft: () => {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    },
    onComplete: async (answers) => {
      async function submitRegistration(currentAnswers) {
        const selectedMode = currentAnswers.welcome_settings || 'en_standard';
        const lang = selectedMode.startsWith('am') ? 'am' : 'en';
        const isAm = lang === 'am';
        const mode = selectedMode.includes('simple') ? 'simple' : 'standard';

        container.textContent = '';
        const loadingDiv = h('div', 'ik-loading-indicator', null, [
          h('div', 'ik-spinner'),
          h('p', null, isAm ? 'መለያዎን በመፍጠር ላይ...' : 'Creating your accessible profile...')
        ]);
        loadingDiv.setAttribute('role', 'status');
        container.appendChild(loadingDiv);

        try {
          const contactValue = currentAnswers.contactValue ? String(currentAnswers.contactValue).trim() : '';
          const isEmailContact = contactValue.includes('@');

          const learner = await createLearner({
            name: (currentAnswers.name || '').trim(),
            contact: {
              type: isEmailContact ? 'email' : 'phone',
              value: contactValue
            },
            idRoute: currentAnswers.idRoute || 'kebele',
            idNumber: currentAnswers.idNumber ? String(currentAnswers.idNumber).trim() : null,
            mode,
            language: lang,
            partnerRef: currentAnswers.partnerReferral || null
          });

          try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
          saveLearnerId(learner.id);
          try {
            localStorage.setItem('inclusive_learner_id', learner.id);
            localStorage.setItem('ik_current_learner_id', learner.id);
            localStorage.setItem('ik_learner_' + learner.id, JSON.stringify(learner));
          } catch (e) {}

          if (currentAnswers.supportNeeds && Array.isArray(currentAnswers.supportNeeds) && currentAnswers.supportNeeds.length > 0) {
            await saveSupport(learner.id, currentAnswers.supportNeeds);
          }

          if (currentAnswers.idRoute === 'referral') {
            await createReferral({
              learnerId: learner.id,
              partner: currentAnswers.partnerReferral || 'aaapd',
              contactPreference: 'phone'
            });
          }

          container.textContent = '';
          const successCard = h('div', 'ik-success-card', null, [
            h('div', 'ik-success-icon', '🎉'),
            h('h2', 'ik-success-title', isAm ? `እንኳን ደህና መጡ፣ ${learner.name}!` : `Welcome, ${learner.name}!`),
            h('p', 'ik-success-message', isAm
              ? `የእርስዎ ተደራሽ የመማሪያ መገለጫ ተፈጥሯል። ${learner.idRoute === 'referral' ? 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ ነው፣ ነገር ግን ወዲያውኑ ሁሉንም ኮርሶች እና ስራዎች ማግኘት ይችላሉ።' : 'የእርስዎ ማረጋገጫ ተመዝግቧል።'}`
              : `Your accessible learning profile has been created. ${learner.idRoute === 'referral' ? 'Your partner referral is pending review, but you have immediate access to all courses and jobs.' : 'Your verification is on file.'}`),
            h('div', 'ik-callout ik-callout-private', null, [
              h('span', 'ik-badge ik-badge-private', t('privateBadge', lang)),
              h('p', null, isAm ? 'የመረጧቸው የድጋፍ ፍላጎቶች በተለየ የተደራሽነት መዝገብ ውስጥ በግል ተቀምጠዋል።' : 'Your support preferences are stored in our isolated accommodations registry.')
            ]),
            h('div', 'ik-success-actions', null, [
              btn('ik-btn ik-btn-primary ik-btn-go-jobs', '💼 ' + (isAm ? 'ተደራሽ የሥራ እድሎችን ፈልግ' : 'Find Accessible Jobs'), () => {
                if (onNavigateToJobs) onNavigateToJobs(learner);
              }),
              btn('ik-btn ik-btn-secondary ik-btn-view-profile', '👤 ' + (isAm ? 'መገለጫዬን ተመልከት' : 'View My Profile'), () => {
                if (onComplete) onComplete(learner);
              })
            ])
          ]);
          successCard.setAttribute('role', 'region');
          successCard.setAttribute('aria-live', 'polite');
          container.appendChild(successCard);

        } catch (err) {
          const isDuplicate = err.status === 409 ||
            (err.errors && err.errors._ && /already exists|already registered|ተመዝግበዋል/i.test(err.errors._));

          if (isDuplicate) {
            const rawExistingId = err.existingId || (err.errors && err.errors.existingId);
            renderAlreadyRegistered(rawExistingId, currentAnswers.name);
            return;
          }

          let errorMsg = err.message || 'Something went wrong';
          if (err.errors) {
            if (typeof err.errors === 'string') errorMsg = err.errors;
            else if (err.errors._) errorMsg = err.errors._;
            else if (typeof err.errors === 'object') {
              const firstErr = Object.values(err.errors)[0];
              if (firstErr) errorMsg = firstErr;
            }
          }

          try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify({
              answers: sanitizeDraftAnswers(currentAnswers),
              timestamp: Date.now()
            }));
          } catch (e) {}

          container.textContent = '';
          const errP = h('p', 'ik-error-msg', null, [
            h('strong', null, isAm ? 'ስህተት ተከስቷል፡ ' : 'Error creating profile: '),
            document.createTextNode(errorMsg)
          ]);

          const retryBtn = btn('ik-btn ik-btn-primary ik-retry-onboarding', isAm ? 'እንደገና ሞክር' : 'Try again');
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (isOffline) {
            retryBtn.disabled = true;
            retryBtn.title = isAm ? 'ኢንተርኔት ሲመለስ በራሱ ይሰራል' : 'Will enable automatically when internet is restored';
          }

          const errorCard = h('div', 'ik-error-card', null, [errP, retryBtn]);
          errorCard.setAttribute('role', 'alert');

          const onOnline = () => {
            retryBtn.disabled = false;
            retryBtn.removeAttribute('title');
            const notice = h('div', 'ik-alert ik-alert-success', isAm ? '🌐 ግንኙነት ተመልሷል! አሁን "እንደገና ሞክር" የሚለውን መጫን ይችላሉ።' : '🌐 Internet connection restored! You can now click "Try again".');
            notice.setAttribute('role', 'status');
            errorCard.insertBefore(notice, retryBtn);
            window.removeEventListener('online', onOnline);
          };
          window.addEventListener('online', onOnline);

          retryBtn.addEventListener('click', () => {
            window.removeEventListener('online', onOnline);
            submitRegistration(currentAnswers);
          });

          container.appendChild(errorCard);
        }
      }

      await submitRegistration(answers);
    }
  });

  const originalRender = engine.render.bind(engine);
  engine.render = function () {
    const selected = engine.answers.welcome_settings;
    if (selected) {
      const nextLang = selected.startsWith('am') ? 'am' : 'en';
      if (nextLang !== engine.language) {
        engine.language = nextLang;
        engine.screens = getOnboardingScreens(nextLang, renderAlreadyRegistered);
      }
    }
    originalRender();
  };

  engine.render();
}
