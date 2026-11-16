import { StepEngine } from '../core/step-engine.js';
import { createLearner, saveSupport, createReferral, checkLearnerExists } from '../api-client.js';
import { validateName, validateContact, validateIdNumber } from '../core/validation.js';
import { SUPPORT_NEEDS, ID_ROUTES } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { saveLearnerId } from '../core/learner-session.js';
import { sanitizeDraftAnswers } from '../core/progress-store.js';
import { pickLang, baseLang, langFromSetting, fillPattern } from '../content-translations.js';

/**
 * Builds the screens B1 to B10 configuration for the onboarding flow
 * localized dynamically for English or Amharic.
 */
export function getOnboardingScreens(lang = 'en', onAlreadyRegistered = null) {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));
  const langBase = baseLang(lang);

  return [
    // B1: Welcome
    {
      id: 'welcome_settings',
      required: true,
      title: pickLang('Welcome to Savanna Accessible Learning', 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ', lang),
      label: pickLang('Please choose how you would like to proceed:', 'እባክዎ እንዴት መቀጠል እንደሚፈልጉ ይምረጡ፡', lang),
      helpText: pickLang('Select your preferred language and reading mode.', 'የመረጡትን ቋንቋ እና የአቀራረብ ሁነታ ይምረጡ።', lang),
      inputType: 'radio',
      options: [
        { value: 'en_standard', label: 'English (Standard)', icon: '🌐' },
        { value: 'en_simple', label: 'English (Simple with icons)', icon: '🖼️' },
        { value: 'am_standard', label: 'አማርኛ (መደበኛ)', icon: '🇪🇹' },
        { value: 'am_simple', label: 'አማርኛ (ቀላል አቀራረብ ከምስሎች ጋር)', icon: '🇪🇹' },
        { value: 'so_standard', label: 'Af-Soomaali (Standard)', icon: '🇸🇴' },
        { value: 'om_standard', label: 'Afaan Oromoo (Standard)', icon: '🇪🇹' },
        { value: 'ti_standard', label: 'ትግርኛ (Standard)', icon: '🇪🇹' }
      ],
      value: langBase + '_standard',
      readAloudText: pickLang('Welcome to Savanna Accessible Learning. Please choose your language and interface mode to get started.', 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ። ለመጀመር እባክዎ ቋንቋዎን እና የአቀራረብ ሁነታዎን ይምረጡ።', lang)
    },
    // B2: Name
    {
      id: 'name',
      required: true,
      title: pickLang('What should we call you?', 'ምን ብለን እንጥራዎት?', lang),
      label: pickLang('Your name or nickname (required):', 'የእርስዎ ስም ወይም ቅጽል ስም (ግዴታ)፡', lang),
      helpText: pickLang('Feel free to use a nickname or any name you prefer. Minimum 2 characters.', 'የመጀመሪያ ስም ወይም ማንኛውንም ቅጽል ስም መጠቀም ይችላሉ። ምንም ጥብቅ ደንብ የለም።', lang),
      inputType: 'text',
      voiceEnabled: true,
      validation: (val) => validateName(val, lang),
      readAloudText: pickLang('What should we call you? You can use your first name or a nickname.', 'ምን ብለን እንጥራዎት? የመጀመሪያ ስምዎን ወይም ቅጽል ስምዎን ማስገባት ይችላሉ።', lang)
    },
    // B3: Contact
    {
      id: 'contactValue',
      required: true,
      title: pickLang('How can we reach you?', 'እንዴት እናገኝዎት?', lang),
      label: pickLang('Phone number (10 digits starting with 09 or 07) or Email address (required):', 'የስልክ ቁጥር (10 አሃዞች - 09 ወይም 07) ወይም የኢሜይል አድራሻ (ግዴታ)፡', lang),
      helpText: pickLang('Please enter a 10-digit phone number starting with 09 or 07 (e.g. 0912345678) or a valid email address.', 'እባክዎ በ 09 ወይም 07 የሚጀምር ባለ 10 አሃዝ ስልክ ቁጥር (ለምሳሌ፡ 0912345678) ወይም ተገቢ የሆነ ኢሜይል ያስገቡ።', lang),
      placeholder: pickLang('0912345678 or name@example.com', '0912345678 ወይም name@example.com', lang),
      inputType: 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact('auto', val, lang),
      readAloudText: pickLang('How can we reach you? Please enter your 10-digit phone number starting with 09 or 07, or your email address.', 'እንዴት እናገኝዎት? እባክዎ በ 09 ወይም 07 የሚጀምር ባለ 10 አሃዝ የስልክ ቁጥርዎን ወይም የኢሜይል አድራሻዎን ያስገቡ።', lang),
      onValidateAsync: async (val, answers) => {
        if (typeof onAlreadyRegistered !== 'function') return true;
        const isEmail = val && val.includes('@');
        let contactDigits = String(val || '').trim();
        if (!isEmail) {
          contactDigits = contactDigits.replace(/[^0-9]/g, '');
        }
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
    // B4: ID Route
    {
      id: 'idRoute',
      required: true,
      title: pickLang('Identification document route', 'የመታወቂያ ሰነድ መንገድ', lang),
      label: pickLang('Choose how you would like to verify your account (required):', 'መለያዎን እንዴት ማረጋገጥ እንደሚፈልጉ ይምረጡ (ግዴታ)፡', lang),
      helpText: pickLang('Everyone is welcome. If you do not have an official document, partner referral is available.', 'ሁሉም ሰው ተጋብዟል። ሰነድ ከሌለዎት በአጋር ድርጅት በኩል መረጋገጥ ይችላሉ።', lang),
      inputType: 'radio',
      value: 'kebele',
      options: [
        {
          value: 'kebele',
          label: pickLang('Kebele ID Card', 'የቀበሌ መታወቂያ ካርድ', lang),
          icon: '🪪',
          description: pickLang('National Kebele identification card', 'ብሔራዊ የቀበሌ መታወቂያ ካርድ', lang)
        },
        {
          value: 'passport',
          label: pickLang('Passport', 'ፓስፖርት', lang),
          icon: '🛂',
          description: pickLang('Valid national passport', 'ተቀባይነት ያለው ፓስፖርት', lang)
        },
        {
          value: 'refugee',
          label: pickLang('Refugee ID / UNHCR', 'የስደተኞች መታወቂያ', lang),
          icon: '📄',
          description: pickLang('Official refugee registration document', 'ይፋዊ የስደተኞች ምዝገባ ሰነድ', lang)
        },
        {
          value: 'other_document',
          label: pickLang('Other Government Document', 'ሌላ የመንግስት ሰነድ', lang),
          icon: '📋',
          description: pickLang('Student ID, Driver license, etc.', 'የተማሪ መታወቂያ፣ የመንጃ ፈቃድ፣ ወዘተ.', lang)
        },
        {
          value: 'referral',
          label: pickLang('I do not have one — refer me through a partner', 'ሰነድ የለኝም — በአጋር ድርጅት በኩል አረጋግጡኝ', lang),
          icon: '🤝',
          description: pickLang('No dead end. Community partner review.', 'ምንም እንቅፋት የለም። የማህበረሰብ አጋር ድርጅት ግምገማ።', lang)
        }
      ],
      readAloudText: pickLang('Identification document route. Choose Kebele ID, Passport, Refugee ID, Other document, or refer me through a community partner.', 'የመታወቂያ ሰነድ መንገድ። የቀበሌ መታወቂያ፣ ፓስፖርት፣ የስደተኞች መታወቂያ፣ ሌላ ሰነድ፣ ወይም በአጋር ድርጅት በኩል መረጋገጥን ይምረጡ።', lang)
    },
    // B5: ID Details (Conditional: only shown if document route chosen)
    {
      id: 'idNumber',
      title: pickLang('Enter your ID document number', 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ', lang),
      label: pickLang('Document number (optional now):', 'የሰነድ ቁጥር (አሁን ማስገባት አማራጭ ነው)፡', lang),
      helpText: pickLang('For example: 12345/AA. You can also skip this and add it later.', 'ለምሳሌ፡ 12345/AA። አሁን ዘለው ቆይተው ማስገባት ይችላሉ።', lang),
      placeholder: pickLang('e.g. 12345/AA', 'ምሳሌ፡ 12345/AA', lang),
      inputType: 'text',
      voiceEnabled: true,
      condition: (answers) => answers.idRoute && answers.idRoute !== 'referral',
      validation: (val, answers) => {
        const route = (answers && answers.idRoute) || 'kebele';
        return validateIdNumber(route, val, lang);
      },
      readAloudText: pickLang('Enter your ID document number. For example: 12345/AA. You can type or speak it, or skip and add later.', 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ። ለምሳሌ 12345/AA። መጻፍ ወይም በድምፅ መናገር ይችላሉ፣ ወይም ዘለው ቆይተው ማስገባት ይችላሉ።', lang)
    },
    // B6: Referral (Conditional: only shown if referral chosen)
    {
      id: 'partnerReferral',
      required: true,
      title: pickLang('Partner Referral Details', 'የአጋር ድርጅት ዝርዝሮች', lang),
      label: pickLang('Select your community partner organization (required):', 'የአጋር ማህበረሰብ ድርጅትዎን ይምረጡ (ግዴታ)፡', lang),
      helpText: pickLang('We collaborate with community partners to verify learners without traditional documents.', 'ባህላዊ ሰነዶች የሌላቸውን ተማሪዎች ለማረጋገጥ ከአጋር ድርጅቶች ጋር እንሰራለን።', lang),
      inputType: 'radio',
      value: 'aaapd',
      options: [
        { value: 'aaapd', label: pickLang('AAAPD (Addis Ababa Association of Persons with Disabilities)', 'የአካል ጉዳተኞች ማህበር (AAAPD)', lang), icon: '🏢' },
        { value: 'ena', label: pickLang('Ethiopian National Association of the Blind / Deaf', 'የኢትዮጵያ ዓይነ ስውራን / መስማት የተሳናቸው ማህበር', lang), icon: '🤝' },
        { value: 'unhcr', label: pickLang('UNHCR / Refugee Community Partner', 'UNHCR / የስደተኞች ማህበረሰብ አጋር', lang), icon: '🌐' },
        { value: 'other_partner', label: pickLang('Other Community Partner', 'ሌላ የማህበረሰብ አጋር ድርጅት', lang), icon: '📍' }
      ],
      condition: (answers) => answers.idRoute === 'referral',
      readAloudText: pickLang('Select your community partner organization to complete your referral.', 'የአጋር ማህበረሰብ ድርጅትዎን ይምረጡ።', lang)
    },
    // B7: Learning Goals
    {
      id: 'goals',
      required: true,
      title: pickLang('What are your learning goals?', 'የመማር ግቦችዎ ምንድን ናቸው?', lang),
      label: pickLang('Select what you hope to achieve (choose at least one):', 'ሊያሳኩት የሚፈልጉትን ይምረጡ (ቢያንስ አንድ ይምረጡ)፡', lang),
      helpText: pickLang('This helps us suggest the best courses and career tracks for you.', 'ይህ ለእርስዎ ተስማሚ ኮርሶችን እና የሥራ እድሎችን እንድንጠቁም ይረዳናል።', lang),
      inputType: 'checkbox',
      options: [
        {
          value: 'virtual_assistant',
          label: pickLang('Virtual Assistant & Remote Work', 'የርቀት ደንበኞች አገልግሎት ረዳት (VA)', lang),
          icon: '💻',
          description: pickLang('Customer support, admin, scheduling', 'የደንበኞች አገልግሎት፣ አስተዳደር፣ መርሐግብር', lang)
        },
        {
          value: 'tech_skills',
          label: pickLang('Digital & Tech Skills', 'ዲጂታል እና የቴክኖሎጂ ክህሎቶች', lang),
          icon: '🚀',
          description: pickLang('Data entry, computer fundamentals', 'የመረጃ ማስገቢያ፣ የኮምፒውተር መሰረታዊ እውቀት', lang)
        },
        {
          value: 'career_jobs',
          label: pickLang('Find an Inclusive Job', 'ተደራሽ የሥራ እድሎችን ማግኘት', lang),
          icon: '💼',
          description: pickLang('Connect with employers offering accommodations', 'ድጋፎችን ከሚያዘጋጁ አሰሪዎች ጋር መገናኘት', lang)
        },
        {
          value: 'certification',
          label: pickLang('Earn a Recognized Certificate', 'እውቅና ያለው ሰርተፍኬት ማግኘት', lang),
          icon: '📜',
          description: pickLang('ALX accredited skills credential', 'በአልኤክስ የተረጋገጠ የክህሎት ማረጋገጫ', lang)
        }
      ],
      readAloudText: pickLang('What are your learning goals? Select what you hope to achieve.', 'የመማር ግቦችዎ ምንድን ናቸው? ሊያሳኩት የሚፈልጉትን ይምረጡ።', lang)
    },
    // B8: Support you need (Private)
    {
      id: 'supportNeeds',
      title: pickLang('Support you need (Private)', 'የሚያስፈልግዎት ድጋፍ (የግል)', lang),
      label: pickLang('Select all accessibility accommodations you would like (optional):', 'የሚፈልጓቸውን የተደራሽነት ድጋፎች ሁሉ ይምረጡ (አማራጭ)፡', lang),
      helpText: pickLang('No medical proof needed. Stored privately and never shared with employers.', 'ምንም የህክምና ማረጋገጫ አያስፈልግም። መረጃው በግል የተጠበቀ ነው።', lang),
      inputType: 'checkbox',
      options: SUPPORT_NEEDS.map(need => ({
        value: need,
        label: label('support', need, lang),
        icon: '♿'
      })),
      readAloudText: pickLang('Support you need. Select any accessibility accommodations you would like. No medical proof is needed, and this is stored privately.', 'የሚያስፈልግዎት ድጋፍ። የሚፈልጓቸውን የተደራሽነት ድጋፎች ይምረጡ። ምንም የህክምና ማረጋገጫ አያስፈልግም፣ መረጃውም በግል የተጠበቀ ነው።', lang)
    }
  ];
}

/**
 * Screens B1 to B10 configuration for the onboarding flow.
 */
export function startOnboardingFlow(options) {
  const { container, initialLanguage = 'en', onComplete, onNavigateToJobs } = options;

  let currentLang = langFromSetting(initialLanguage);
  let isSimpleMode = Boolean(options.isSimpleMode);

  // Restore draft answers if available (for refresh or connection drop)
  const DRAFT_KEY = 'ik_onboarding_draft';
  let draftAnswers = {};
  let draftStep = 0;
  let hasRestoredDraft = false;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.answers && Object.keys(parsed.answers).length > 0) {
        draftAnswers = parsed.answers;
        draftStep = typeof parsed.stepIndex === 'number' ? parsed.stepIndex : 0;
        hasRestoredDraft = true;

        if (options.initialLanguage) {
          const optLang = langFromSetting(options.initialLanguage);
          currentLang = optLang;
          if (draftAnswers.welcome_settings) {
            const wasSimple = String(draftAnswers.welcome_settings).endsWith('simple');
            isSimpleMode = options.isSimpleMode !== undefined ? Boolean(options.isSimpleMode) : wasSimple;
            draftAnswers.welcome_settings = optLang + (isSimpleMode ? '_simple' : '_standard');
          }
        } else if (draftAnswers.welcome_settings) {
          currentLang = langFromSetting(draftAnswers.welcome_settings);
          isSimpleMode = String(draftAnswers.welcome_settings).endsWith('simple');
          if (typeof options.onLanguageChange === 'function') {
            options.onLanguageChange(currentLang, isSimpleMode);
          }
        }
      }
    }
  } catch (e) {}

  function renderAlreadyRegistered(existingId, name) {
    const rawId = existingId || getLearnerId() || 'lrn_demo';
    const finalId = String(rawId).startsWith('lrn_') ? String(rawId) : 'lrn_' + rawId;
    saveLearnerId(finalId);
    try {
      localStorage.setItem('inclusive_learner_id', finalId);
      localStorage.setItem('ik_current_learner_id', finalId);
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}

    const isAm = currentLang === 'am';
    const learnerObj = { id: finalId, name: name || 'Learner' };

    container.innerHTML = `
      <div class="ik-card ik-already-registered-card" role="region" aria-live="polite">
        <div class="ik-already-badge">
          <span class="ik-badge ik-badge-info">ℹ️ ${pickLang('Existing Profile', 'የተመዘገበ መለያ', currentLang)}</span>
        </div>
        <h2 class="ik-already-title">${pickLang('You are already registered!', 'አስቀድመው ተመዝግበዋል!', currentLang)}</h2>
        <p class="ik-already-message">
          ${pickLang('An account with this name and phone number is already registered. You do not need to fill the rest of the form; you can proceed directly to your profile or explore accessible jobs.', 'በዚህ ስም እና ስልክ ቁጥር የተመዘገበ መለያ አስቀድሞ አለ። ቀሪውን መረጃ እንደገና መሙላት አያስፈልግዎትም፤ በቀጥታ ወደ መገለጫዎ ወይም ወደ ክፍት የሥራ ቦታዎች መሄድ ይችላሉ።', currentLang)}
        </p>
        <div class="ik-already-actions">
          <button type="button" class="ik-btn ik-btn-primary ik-btn-go-profile">
            👤 ${pickLang('View My Profile', 'መገለጫዬን ተመልከት', currentLang)}
          </button>
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-go-jobs">
            💼 ${pickLang('Find Accessible Jobs', 'ተደራሽ ስራዎችን ፈልግ', currentLang)}
          </button>
          <button type="button" class="ik-btn ik-btn-outline ik-btn-start-over">
            ${pickLang('Try with different details', 'በሌላ መረጃ ሞክር', currentLang)}
          </button>
        </div>
      </div>
    `;

    container.querySelector('.ik-btn-go-profile').addEventListener('click', () => {
      if (onComplete) onComplete(learnerObj);
    });
    container.querySelector('.ik-btn-go-jobs').addEventListener('click', () => {
      if (onNavigateToJobs) onNavigateToJobs(learnerObj);
    });
    container.querySelector('.ik-btn-start-over').addEventListener('click', () => {
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      startOnboardingFlow(options);
    });
  }

  let screens = getOnboardingScreens(currentLang, renderAlreadyRegistered);

  const engine = new StepEngine({
    container: container,
    screens: screens,
    language: currentLang,
    isSimpleMode: isSimpleMode,
    initialAnswers: draftAnswers,
    initialStep: draftStep,
    draftRestored: hasRestoredDraft,
    sessionId: 'ik_onboarding_session',
    onSaveDraft: (draft) => {
      try {
        const cleanAnswers = sanitizeDraftAnswers(draft.answers || draft);
        localStorage.setItem(DRAFT_KEY, JSON.stringify(Object.assign({}, draft, { answers: cleanAnswers })));
      } catch (e) {}
    },
    onClearDraft: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {}
    },
    onAnswerChange: (screenId, val) => {
      if (screenId === 'welcome_settings' && val) {
        const nextLang = langFromSetting(val);
        const isSimple = String(val).endsWith('simple');
        if (nextLang !== currentLang || isSimple !== isSimpleMode) {
          currentLang = nextLang;
          isSimpleMode = isSimple;
          engine.language = nextLang;
          engine.isSimpleMode = isSimple;
          engine.screens = getOnboardingScreens(nextLang, renderAlreadyRegistered);
          if (typeof options.onLanguageChange === 'function') {
            options.onLanguageChange(nextLang, isSimple);
          }
          engine.render();
        }
      }
    },
    onComplete: async (answers) => {
      const selectedSetting = answers.welcome_settings || (baseLang(currentLang) + '_standard');
      const lang = langFromSetting(selectedSetting);
      const mode = selectedSetting.endsWith('simple') ? 'simple' : 'standard';
      const isAm = lang === 'am';

      container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>${pickLang('Creating your accessible profile...', 'ተደራሽ መገለጫዎን በመፍጠር ላይ...', lang)}</p>
        </div>
      `;

      try {
        // 1. Create learner with user's validated answers (no dummy defaults)
        const isEmailContact = answers.contactValue && answers.contactValue.includes('@');
        let contactValue = String(answers.contactValue || '').trim();
        if (!isEmailContact) {
          contactValue = contactValue.replace(/[^0-9]/g, '');
        }

        const learner = await createLearner({
          name: (answers.name || '').trim(),
          contact: {
            type: isEmailContact ? 'email' : 'phone',
            value: contactValue
          },
          idRoute: answers.idRoute || 'kebele',
          idNumber: answers.idNumber ? String(answers.idNumber).trim() : null,
          mode: mode,
          language: lang,
          partnerRef: answers.partnerReferral || null
        });

        // Registration successful - clean up the draft
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}

        // Save real lrn_... ID to browser's local storage (requested by backend team)
        saveLearnerId(learner.id);
        try {
          localStorage.setItem('inclusive_learner_id', learner.id);
          localStorage.setItem('ik_current_learner_id', learner.id);
          localStorage.setItem('ik_learner_' + learner.id, JSON.stringify(learner));
        } catch (e) {}

        // 2. Save private support needs if selected
        if (answers.supportNeeds && Array.isArray(answers.supportNeeds) && answers.supportNeeds.length > 0) {
          await saveSupport(learner.id, answers.supportNeeds);
        }

        // 3. Save referral if chosen
        if (answers.idRoute === 'referral') {
          await createReferral({
            learnerId: learner.id,
            partner: answers.partnerReferral || 'aaapd',
            contactPreference: 'phone'
          });
        }

        // B10: Done Confirmation Screen
        container.innerHTML = `
          <div class="ik-success-card" role="region" aria-live="polite">
            <div class="ik-success-icon" aria-hidden="true">🎉</div>
            <h2 class="ik-success-title">${fillPattern(pickLang('Welcome, {name}!', 'እንኳን ደህና መጡ፣ {name}!', lang), { name: learner.name })}</h2>
            <p class="ik-success-message">
              ${isAm
                ? `የእርስዎ ተደራሽ የመማሪያ መገለጫ ተፈጥሯል። ${learner.idRoute === 'referral' ? 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ ነው፣ ነገር ግን ወዲያውኑ ሁሉንም ኮርሶች እና ስራዎች ማግኘት ይችላሉ።' : 'የእርስዎ ማረጋገጫ ተመዝግቧል።'}`
                : `Your accessible learning profile has been created. ${learner.idRoute === 'referral' ? 'Your partner referral is pending review, but you have immediate access to all courses and jobs.' : 'Your verification is on file.'}`}
            </p>
            <div class="ik-callout ik-callout-private">
              <span class="ik-badge ik-badge-private">${t('privateBadge', lang)}</span>
              <p>${pickLang('Your support preferences are stored in our isolated accommodations registry.', 'የመረጧቸው የድጋፍ ፍላጎቶች በተለየ የተደራሽነት መዝገብ ውስጥ በግል ተቀምጠዋል።', lang)}</p>
            </div>
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-btn-go-jobs">
                💼 ${pickLang('Find Accessible Jobs', 'ተደራሽ የሥራ እድሎችን ፈልግ', lang)}
              </button>
              <button type="button" class="ik-btn ik-btn-secondary ik-btn-view-profile">
                👤 ${pickLang('View My Profile', 'መገለጫዬን ተመልከት', lang)}
              </button>
            </div>
          </div>
        `;

        container.querySelector('.ik-btn-go-jobs').addEventListener('click', () => {
          if (onNavigateToJobs) onNavigateToJobs(learner);
        });

        container.querySelector('.ik-btn-view-profile').addEventListener('click', () => {
          if (onComplete) onComplete(learner);
        });

      } catch (err) {
        // Check if user is already registered (409 Conflict)
        const isDuplicate = err.status === 409 ||
          (err.errors && err.errors._ && /already exists|already registered|ተመዝግበዋል/i.test(err.errors._));

        if (isDuplicate) {
          const rawExistingId = err.existingId || (err.errors && err.errors.existingId);
          renderAlreadyRegistered(rawExistingId, answers.name);
          return;
        }

        let errorMsg = err.message || 'Something went wrong';
        if (err.errors) {
          if (typeof err.errors === 'string') {
            errorMsg = err.errors;
          } else if (err.errors._) {
            errorMsg = err.errors._;
          } else if (typeof err.errors === 'object') {
            const firstErr = Object.values(err.errors)[0];
            if (firstErr) errorMsg = firstErr;
          }
        }
        container.innerHTML = `
          <div class="ik-error-card" role="alert">
            <p class="ik-error-msg"><strong>${pickLang('Error creating profile:', 'ስህተት ተከስቷል፡', lang)}</strong> ${errorMsg}</p>
            <button type="button" class="ik-btn ik-btn-secondary ik-retry-onboarding">${pickLang('Retry', 'እንደገና ሞክር', lang)}</button>
          </div>
        `;
        container.querySelector('.ik-retry-onboarding').addEventListener('click', () => {
          startOnboardingFlow(options);
        });
      }
    }
  });

  // Watch for language changes on the welcome screen
  const originalRender = engine.render.bind(engine);
  engine.render = function () {
    const selected = engine.answers.welcome_settings;
    if (selected) {
      const nextLang = langFromSetting(selected);
      const isSimple = String(selected).endsWith('simple');
      if (nextLang !== engine.language || isSimple !== engine.isSimpleMode) {
        engine.language = nextLang;
        engine.isSimpleMode = isSimple;
        engine.screens = getOnboardingScreens(nextLang, renderAlreadyRegistered);
        if (typeof options.onLanguageChange === 'function') {
          options.onLanguageChange(nextLang, isSimple);
        }
      }
    }
    originalRender();
  };

  engine.render();
  return {
    engine: engine,
    destroy: () => {
      if (engine && typeof engine.destroy === 'function') {
        engine.destroy();
      }
    }
  };
}
