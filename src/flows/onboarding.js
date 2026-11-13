import { StepEngine } from '../core/step-engine.js';
import { createLearner, saveSupport, createReferral } from '../api-client.js';
import { validateName, validateContact } from '../core/validation.js';
import { SUPPORT_NEEDS, ID_ROUTES } from '../vocabulary.js';
import { label, t } from '../labels.js';

/**
 * Screens B1 to B10 configuration for the onboarding flow.
 */
export function startOnboardingFlow(options) {
  const { container, initialLanguage = 'en', onComplete, onNavigateToJobs } = options;

  let currentLang = initialLanguage;
  let isSimpleMode = false;

  const screens = [
    // B1: Welcome
    {
      id: 'welcome_settings',
      title: 'Welcome to Savanna Accessible Learning',
      label: 'Please choose how you would like to proceed:',
      helpText: 'Select your preferred language and reading mode.',
      inputType: 'radio',
      options: [
        { value: 'en_standard', label: 'English (Standard)', icon: '🌐' },
        { value: 'en_simple', label: 'English (Simple with icons)', icon: '🖼️' },
        { value: 'am_standard', label: 'አማርኛ (መደበኛ)', icon: '🇪🇹' },
        { value: 'am_simple', label: 'አማርኛ (ቀላል አቀራረብ ከምስሎች ጋር)', icon: '🇪🇹' }
      ],
      value: 'en_standard',
      readAloudText: 'Welcome to Savanna Accessible Learning. Please choose your language and interface mode to get started.'
    },
    // B2: Name
    {
      id: 'name',
      title: 'What should we call you?',
      label: 'Your name or nickname:',
      helpText: 'Feel free to use a nickname or any name you prefer. No strict format rules.',
      inputType: 'text',
      voiceEnabled: true,
      validation: validateName,
      readAloudText: 'What should we call you? You can use your first name or a nickname.'
    },
    // B3: Contact
    {
      id: 'contactValue',
      title: 'How can we reach you?',
      label: 'Phone number or Email address:',
      helpText: 'Please add your number, like 09 12 34 56 78, or an email.',
      inputType: 'tel',
      voiceEnabled: true,
      validation: (val) => validateContact('phone', val),
      readAloudText: 'How can we reach you? Please enter your phone number or email address.'
    },
    // B4: ID Route
    {
      id: 'idRoute',
      title: 'Identification document route',
      label: 'Choose how you would like to verify your account:',
      helpText: 'Everyone is welcome. If you do not have an official document, partner referral is available.',
      inputType: 'radio',
      value: 'kebele',
      options: [
        { value: 'kebele', label: 'Kebele ID Card', icon: '🪪', description: 'National Kebele identification card' },
        { value: 'passport', label: 'Passport', icon: '🛂', description: 'Valid national passport' },
        { value: 'refugee', label: 'Refugee ID / UNHCR', icon: '📄', description: 'Official refugee registration document' },
        { value: 'other_document', label: 'Other Government Document', icon: '📋', description: 'Student ID, Driver license, etc.' },
        { value: 'referral', label: 'I do not have one — refer me through a partner', icon: '🤝', description: 'No dead end. Community partner review.' }
      ],
      readAloudText: 'Identification document route. Choose Kebele ID, Passport, Refugee ID, Other document, or refer me through a community partner.'
    },
    // B5: ID Details (Conditional: only shown if document route chosen)
    {
      id: 'idNumber',
      title: 'Enter your ID document number',
      label: 'Document number (optional now):',
      helpText: 'For example: 12345/AA. You can also skip this and add it later.',
      inputType: 'text',
      voiceEnabled: true,
      condition: (answers) => answers.idRoute && answers.idRoute !== 'referral',
      readAloudText: 'Enter your ID document number. You can type or speak it, or skip and add later.'
    },
    // B6: Referral (Conditional: only shown if referral chosen)
    {
      id: 'partnerReferral',
      title: 'Partner Referral Details',
      label: 'Select your community partner organization:',
      helpText: 'We collaborate with community partners to verify learners without traditional documents.',
      inputType: 'radio',
      value: 'aaapd',
      options: [
        { value: 'aaapd', label: 'AAAPD (Addis Ababa Association of Persons with Disabilities)', icon: '🏢' },
        { value: 'ena', label: 'Ethiopian National Association of the Blind / Deaf', icon: '🤝' },
        { value: 'unhcr', label: 'UNHCR / Refugee Community Partner', icon: '🌐' },
        { value: 'other_partner', label: 'Other Community Partner', icon: '📍' }
      ],
      condition: (answers) => answers.idRoute === 'referral',
      readAloudText: 'Select your community partner organization to complete your referral.'
    },
    // B7: Learning Goals
    {
      id: 'goals',
      title: 'What are your learning goals?',
      label: 'Select what you hope to achieve:',
      helpText: 'This helps us suggest the best courses and career tracks for you.',
      inputType: 'checkbox',
      options: [
        { value: 'virtual_assistant', label: 'Virtual Assistant & Remote Work', icon: '💻', description: 'Customer support, admin, scheduling' },
        { value: 'tech_skills', label: 'Digital & Tech Skills', icon: '🚀', description: 'Data entry, computer fundamentals' },
        { value: 'career_jobs', label: 'Find an Inclusive Job', icon: '💼', description: 'Connect with employers offering accommodations' },
        { value: 'certification', label: 'Earn a Recognized Certificate', icon: '📜', description: 'ALX accredited skills credential' }
      ]
    },
    // B8: Support you need (Private)
    {
      id: 'supportNeeds',
      title: 'Support you need (Private)',
      label: 'Select all accessibility accommodations you would like:',
      helpText: 'No medical proof needed. Stored privately and never shared with employers.',
      inputType: 'checkbox',
      options: SUPPORT_NEEDS.map(need => ({
        value: need,
        label: label('support', need, 'en'),
        icon: '♿'
      })),
      readAloudText: 'Support you need. Select any accessibility accommodations you would like. No medical proof is needed, and this is stored privately.'
    }
  ];

  const engine = new StepEngine({
    container: container,
    screens: screens,
    language: currentLang,
    isSimpleMode: isSimpleMode,
    sessionId: 'ik_onboarding_' + Date.now(),
    onComplete: async (answers) => {
      container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>Creating your accessible profile...</p>
        </div>
      `;

      try {
        const selectedSetting = answers.welcome_settings || 'en_standard';
        const lang = selectedSetting.startsWith('am') ? 'am' : 'en';
        const mode = selectedSetting.endsWith('simple') ? 'simple' : 'standard';

        // 1. Create learner
        const learner = await createLearner({
          name: answers.name || 'Learner',
          contact: {
            type: answers.contactValue && answers.contactValue.includes('@') ? 'email' : 'phone',
            value: answers.contactValue || '0912345678'
          },
          idRoute: answers.idRoute || 'kebele',
          idNumber: answers.idNumber || null,
          mode: mode,
          language: lang,
          partnerRef: answers.partnerReferral || null
        });

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
            <h2 class="ik-success-title">Welcome, ${learner.name}!</h2>
            <p class="ik-success-message">
              Your accessible learning profile has been created.
              ${learner.idRoute === 'referral'
                ? 'Your partner referral is pending review, but you have immediate access to all courses and jobs.'
                : 'Your verification is on file.'}
            </p>
            <div class="ik-callout ik-callout-private">
              <span class="ik-badge ik-badge-private">Private</span>
              <p>Your support preferences are stored in our isolated accommodations registry.</p>
            </div>
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-btn-go-jobs">
                💼 Find Accessible Jobs
              </button>
              <button type="button" class="ik-btn ik-btn-secondary ik-btn-view-profile">
                👤 View My Profile
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
            <p class="ik-error-msg"><strong>Error creating profile:</strong> ${err.errors && err.errors._ ? err.errors._ : err.message}</p>
            <button type="button" class="ik-btn ik-btn-secondary ik-retry-onboarding">Retry</button>
          </div>
        `;
        container.querySelector('.ik-retry-onboarding').addEventListener('click', () => {
          startOnboardingFlow(options);
        });
      }
    }
  });

  engine.render();
}

