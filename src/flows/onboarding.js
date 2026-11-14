import { StepEngine } from '../core/step-engine.js';
import { createLearner, saveSupport, createReferral } from '../api-client.js';
import { validateName, validateContact, validateIdNumber } from '../core/validation.js';
import { SUPPORT_NEEDS, ID_ROUTES } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { saveLearnerId } from '../core/learner-session.js';

/**
 * Builds the screens B1 to B10 configuration for the onboarding flow
 * localized dynamically for English or Amharic.
 */
export function getOnboardingScreens(lang = 'en') {
  const isAm = lang === 'am' || (typeof lang === 'string' && lang.startsWith('am'));

  return [
    // B1: Welcome
    {
      id: 'welcome_settings',
      required: true,
      title: isAm ? 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ' : 'Welcome to Savanna Accessible Learning',
      label: isAm ? 'እባክዎ እንዴት መቀጠል እንደሚፈልጉ ይምረጡ፡' : 'Please choose how you would like to proceed:',
      helpText: isAm ? 'የመረጡትን ቋንቋ እና የአቀራረብ ሁነታ ይምረጡ።' : 'Select your preferred language and reading mode.',
      inputType: 'radio',
      options: [
        { value: 'en_standard', label: 'English (Standard)', icon: '🌐' },
        { value: 'en_simple', label: 'English (Simple with icons)', icon: '🖼️' },
        { value: 'am_standard', label: 'አማርኛ (መደበኛ)', icon: '🇪🇹' },
        { value: 'am_simple', label: 'አማርኛ (ቀላል አቀራረብ ከምስሎች ጋር)', icon: '🇪🇹' }
      ],
      value: isAm ? 'am_standard' : 'en_standard',
      readAloudText: isAm
        ? 'እንኳን ወደ ሳቫና ተደራሽ የመማሪያ መድረክ በደህና መጡ። ለመጀመር እባክዎ ቋንቋዎን እና የአቀራረብ ሁነታዎን ይምረጡ።'
        : 'Welcome to Savanna Accessible Learning. Please choose your language and interface mode to get started.'
    },
    // B2: Name
    {
      id: 'name',
      required: true,
      title: isAm ? 'ምን ብለን እንጥራዎት?' : 'What should we call you?',
      label: isAm ? 'የእርስዎ ስም ወይም ቅጽል ስም (ግዴታ)፡' : 'Your name or nickname (required):',
      helpText: isAm ? 'የመጀመሪያ ስም ወይም ማንኛውንም ቅጽል ስም መጠቀም ይችላሉ። ምንም ጥብቅ ደንብ የለም።' : 'Feel free to use a nickname or any name you prefer. Minimum 2 characters.',
      inputType: 'text',
      voiceEnabled: true,
      validation: (val) => validateName(val, lang),
      readAloudText: isAm
        ? 'ምን ብለን እንጥራዎት? የመጀመሪያ ስምዎን ወይም ቅጽል ስምዎን ማስገባት ይችላሉ።'
        : 'What should we call you? You can use your first name or a nickname.'
    },
    // B3: Contact
    {
      id: 'contactValue',
      required: true,
      title: isAm ? 'እንዴት እናገኝዎት?' : 'How can we reach you?',
      label: isAm ? 'የስልክ ቁጥር (12 አሃዞች) ወይም የኢሜይል አድራሻ (ግዴታ)፡' : 'Phone number (12 digits) or Email address (required):',
      helpText: isAm ? 'እባክዎ ባለ 12 አሃዝ ስልክ ቁጥር (ለምሳሌ፡ 251912345678) ወይም ተገቢ የሆነ ኢሜይል ያስገቡ።' : 'Please enter a 12-digit phone number (e.g. 251912345678) or a valid email address.',
      placeholder: isAm ? '251912345678 ወይም name@example.com' : '251912345678 or name@example.com',
      inputType: 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact('auto', val, lang),
      readAloudText: isAm
        ? 'እንዴት እናገኝዎት? እባክዎ የስልክ ቁጥርዎን ወይም የኢሜይል አድራሻዎን ያስገቡ።'
        : 'How can we reach you? Please enter your phone number or email address.'
    },
    // B4: ID Route
    {
      id: 'idRoute',
      required: true,
      title: isAm ? 'የመታወቂያ ሰነድ መንገድ' : 'Identification document route',
      label: isAm ? 'መለያዎን እንዴት ማረጋገጥ እንደሚፈልጉ ይምረጡ (ግዴታ)፡' : 'Choose how you would like to verify your account (required):',
      helpText: isAm ? 'ሁሉም ሰው ተጋብዟል። ሰነድ ከሌለዎት በአጋር ድርጅት በኩል መረጋገጥ ይችላሉ።' : 'Everyone is welcome. If you do not have an official document, partner referral is available.',
      inputType: 'radio',
      value: 'kebele',
      options: [
        {
          value: 'kebele',
          label: isAm ? 'የቀበሌ መታወቂያ ካርድ' : 'Kebele ID Card',
          icon: '🪪',
          description: isAm ? 'ብሔራዊ የቀበሌ መታወቂያ ካርድ' : 'National Kebele identification card'
        },
        {
          value: 'passport',
          label: isAm ? 'ፓስፖርት' : 'Passport',
          icon: '🛂',
          description: isAm ? 'ተቀባይነት ያለው ፓስፖርት' : 'Valid national passport'
        },
        {
          value: 'refugee',
          label: isAm ? 'የስደተኞች መታወቂያ' : 'Refugee ID / UNHCR',
          icon: '📄',
          description: isAm ? 'ይፋዊ የስደተኞች ምዝገባ ሰነድ' : 'Official refugee registration document'
        },
        {
          value: 'other_document',
          label: isAm ? 'ሌላ የመንግስት ሰነድ' : 'Other Government Document',
          icon: '📋',
          description: isAm ? 'የተማሪ መታወቂያ፣ የመንጃ ፈቃድ፣ ወዘተ.' : 'Student ID, Driver license, etc.'
        },
        {
          value: 'referral',
          label: isAm ? 'ሰነድ የለኝም — በአጋር ድርጅት በኩል አረጋግጡኝ' : 'I do not have one — refer me through a partner',
          icon: '🤝',
          description: isAm ? 'ምንም እንቅፋት የለም። የማህበረሰብ አጋር ድርጅት ግምገማ።' : 'No dead end. Community partner review.'
        }
      ],
      readAloudText: isAm
        ? 'የመታወቂያ ሰነድ መንገድ። የቀበሌ መታወቂያ፣ ፓስፖርት፣ የስደተኞች መታወቂያ፣ ሌላ ሰነድ፣ ወይም በአጋር ድርጅት በኩል መረጋገጥን ይምረጡ።'
        : 'Identification document route. Choose Kebele ID, Passport, Refugee ID, Other document, or refer me through a community partner.'
    },
    // B5: ID Details (Conditional: only shown if document route chosen)
    {
      id: 'idNumber',
      title: isAm ? 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ' : 'Enter your ID document number',
      label: isAm ? 'የሰነድ ቁጥር (አሁን ማስገባት አማራጭ ነው)፡' : 'Document number (optional now):',
      helpText: isAm ? 'ለምሳሌ፡ 12345/AA። አሁን ዘለው ቆይተው ማስገባት ይችላሉ።' : 'For example: 12345/AA. You can also skip this and add it later.',
      placeholder: isAm ? 'ምሳሌ፡ 12345/AA' : 'e.g. 12345/AA',
      inputType: 'text',
      voiceEnabled: true,
      condition: (answers) => answers.idRoute && answers.idRoute !== 'referral',
      validation: (val, answers) => {
        const route = (answers && answers.idRoute) || 'kebele';
        return validateIdNumber(route, val, lang);
      },
      readAloudText: isAm
        ? 'የመታወቂያ ሰነድ ቁጥርዎን ያስገቡ። ለምሳሌ 12345/AA። መጻፍ ወይም በድምፅ መናገር ይችላሉ፣ ወይም ዘለው ቆይተው ማስገባት ይችላሉ።'
        : 'Enter your ID document number. For example: 12345/AA. You can type or speak it, or skip and add later.'
    },
    // B6: Referral (Conditional: only shown if referral chosen)
    {
      id: 'partnerReferral',
      required: true,
      title: isAm ? 'የአጋር ድርጅት ዝርዝሮች' : 'Partner Referral Details',
      label: isAm ? 'የአጋር ማህበረሰብ ድርጅትዎን ይምረጡ (ግዴታ)፡' : 'Select your community partner organization (required):',
      helpText: isAm ? 'ባህላዊ ሰነዶች የሌላቸውን ተማሪዎች ለማረጋገጥ ከአጋር ድርጅቶች ጋር እንሰራለን።' : 'We collaborate with community partners to verify learners without traditional documents.',
      inputType: 'radio',
      value: 'aaapd',
      options: [
        { value: 'aaapd', label: isAm ? 'የአካል ጉዳተኞች ማህበር (AAAPD)' : 'AAAPD (Addis Ababa Association of Persons with Disabilities)', icon: '🏢' },
        { value: 'ena', label: isAm ? 'የኢትዮጵያ ዓይነ ስውራን / መስማት የተሳናቸው ማህበር' : 'Ethiopian National Association of the Blind / Deaf', icon: '🤝' },
        { value: 'unhcr', label: isAm ? 'UNHCR / የስደተኞች ማህበረሰብ አጋር' : 'UNHCR / Refugee Community Partner', icon: '🌐' },
        { value: 'other_partner', label: isAm ? 'ሌላ የማህበረሰብ አጋር ድርጅት' : 'Other Community Partner', icon: '📍' }
      ],
      condition: (answers) => answers.idRoute === 'referral',
      readAloudText: isAm
        ? 'የአጋር ማህበረሰብ ድርጅትዎን ይምረጡ።'
        : 'Select your community partner organization to complete your referral.'
    },
    // B7: Learning Goals
    {
      id: 'goals',
      required: true,
      title: isAm ? 'የመማር ግቦችዎ ምንድን ናቸው?' : 'What are your learning goals?',
      label: isAm ? 'ሊያሳኩት የሚፈልጉትን ይምረጡ (ቢያንስ አንድ ይምረጡ)፡' : 'Select what you hope to achieve (choose at least one):',
      helpText: isAm ? 'ይህ ለእርስዎ ተስማሚ ኮርሶችን እና የሥራ እድሎችን እንድንጠቁም ይረዳናል።' : 'This helps us suggest the best courses and career tracks for you.',
      inputType: 'checkbox',
      options: [
        {
          value: 'virtual_assistant',
          label: isAm ? 'የርቀት ደንበኞች አገልግሎት ረዳት (VA)' : 'Virtual Assistant & Remote Work',
          icon: '💻',
          description: isAm ? 'የደንበኞች አገልግሎት፣ አስተዳደር፣ መርሐግብር' : 'Customer support, admin, scheduling'
        },
        {
          value: 'tech_skills',
          label: isAm ? 'ዲጂታል እና የቴክኖሎጂ ክህሎቶች' : 'Digital & Tech Skills',
          icon: '🚀',
          description: isAm ? 'የመረጃ ማስገቢያ፣ የኮምፒውተር መሰረታዊ እውቀት' : 'Data entry, computer fundamentals'
        },
        {
          value: 'career_jobs',
          label: isAm ? 'ተደራሽ የሥራ እድሎችን ማግኘት' : 'Find an Inclusive Job',
          icon: '💼',
          description: isAm ? 'ድጋፎችን ከሚያዘጋጁ አሰሪዎች ጋር መገናኘት' : 'Connect with employers offering accommodations'
        },
        {
          value: 'certification',
          label: isAm ? 'እውቅና ያለው ሰርተፍኬት ማግኘት' : 'Earn a Recognized Certificate',
          icon: '📜',
          description: isAm ? 'በአልኤክስ የተረጋገጠ የክህሎት ማረጋገጫ' : 'ALX accredited skills credential'
        }
      ],
      readAloudText: isAm
        ? 'የመማር ግቦችዎ ምንድን ናቸው? ሊያሳኩት የሚፈልጉትን ይምረጡ።'
        : 'What are your learning goals? Select what you hope to achieve.'
    },
    // B8: Support you need (Private)
    {
      id: 'supportNeeds',
      title: isAm ? 'የሚያስፈልግዎት ድጋፍ (የግል)' : 'Support you need (Private)',
      label: isAm ? 'የሚፈልጓቸውን የተደራሽነት ድጋፎች ሁሉ ይምረጡ (አማራጭ)፡' : 'Select all accessibility accommodations you would like (optional):',
      helpText: isAm ? 'ምንም የህክምና ማረጋገጫ አያስፈልግም። መረጃው በግል የተጠበቀ ነው።' : 'No medical proof needed. Stored privately and never shared with employers.',
      inputType: 'checkbox',
      options: SUPPORT_NEEDS.map(need => ({
        value: need,
        label: label('support', need, isAm ? 'am' : 'en'),
        icon: '♿'
      })),
      readAloudText: isAm
        ? 'የሚያስፈልግዎት ድጋፍ። የሚፈልጓቸውን የተደራሽነት ድጋፎች ይምረጡ። ምንም የህክምና ማረጋገጫ አያስፈልግም፣ መረጃውም በግል የተጠበቀ ነው።'
        : 'Support you need. Select any accessibility accommodations you would like. No medical proof is needed, and this is stored privately.'
    }
  ];
}

/**
 * Screens B1 to B10 configuration for the onboarding flow.
 */
export function startOnboardingFlow(options) {
  const { container, initialLanguage = 'en', onComplete, onNavigateToJobs } = options;

  let currentLang = initialLanguage === 'am' || String(initialLanguage).startsWith('am') ? 'am' : 'en';
  let isSimpleMode = false;

  let screens = getOnboardingScreens(currentLang);

  const engine = new StepEngine({
    container: container,
    screens: screens,
    language: currentLang,
    isSimpleMode: isSimpleMode,
    sessionId: 'ik_onboarding_' + Date.now(),
    onComplete: async (answers) => {
      const selectedSetting = answers.welcome_settings || (currentLang === 'am' ? 'am_standard' : 'en_standard');
      const lang = selectedSetting.startsWith('am') ? 'am' : 'en';
      const mode = selectedSetting.endsWith('simple') ? 'simple' : 'standard';
      const isAm = lang === 'am';

      container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>${isAm ? 'ተደራሽ መገለጫዎን በመፍጠር ላይ...' : 'Creating your accessible profile...'}</p>
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
            <h2 class="ik-success-title">${isAm ? `እንኳን ደህና መጡ፣ ${learner.name}!` : `Welcome, ${learner.name}!`}</h2>
            <p class="ik-success-message">
              ${isAm
                ? `የእርስዎ ተደራሽ የመማሪያ መገለጫ ተፈጥሯል። ${learner.idRoute === 'referral' ? 'የአጋር ድርጅት ማረጋገጫ በመጠባበቅ ላይ ነው፣ ነገር ግን ወዲያውኑ ሁሉንም ኮርሶች እና ስራዎች ማግኘት ይችላሉ።' : 'የእርስዎ ማረጋገጫ ተመዝግቧል።'}`
                : `Your accessible learning profile has been created. ${learner.idRoute === 'referral' ? 'Your partner referral is pending review, but you have immediate access to all courses and jobs.' : 'Your verification is on file.'}`}
            </p>
            <div class="ik-callout ik-callout-private">
              <span class="ik-badge ik-badge-private">${t('privateBadge', lang)}</span>
              <p>${isAm ? 'የመረጧቸው የድጋፍ ፍላጎቶች በተለየ የተደራሽነት መዝገብ ውስጥ በግል ተቀምጠዋል።' : 'Your support preferences are stored in our isolated accommodations registry.'}</p>
            </div>
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-btn-go-jobs">
                💼 ${isAm ? 'ተደራሽ የሥራ እድሎችን ፈልግ' : 'Find Accessible Jobs'}
              </button>
              <button type="button" class="ik-btn ik-btn-secondary ik-btn-view-profile">
                👤 ${isAm ? 'መገለጫዬን ተመልከት' : 'View My Profile'}
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
        container.innerHTML = `
          <div class="ik-error-card" role="alert">
            <p class="ik-error-msg"><strong>${isAm ? 'ስህተት ተከስቷል፡' : 'Error creating profile:'}</strong> ${err.errors && err.errors._ ? err.errors._ : err.message}</p>
            <button type="button" class="ik-btn ik-btn-secondary ik-retry-onboarding">${isAm ? 'እንደገና ሞክር' : 'Retry'}</button>
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
      const nextLang = selected.startsWith('am') ? 'am' : 'en';
      if (nextLang !== engine.language) {
        engine.language = nextLang;
        engine.screens = getOnboardingScreens(nextLang);
      }
    }
    originalRender();
  };

  engine.render();
}
