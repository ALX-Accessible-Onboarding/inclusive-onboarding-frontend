import { StepEngine } from '../core/step-engine.js';
import { createJob } from '../api-client.js';
import { ACCOMMODATIONS } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { pickLang } from '../content-translations.js';

/**
 * Task E4: Employer job posting flow with one question per screen using StepEngine.
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {string} options.language - 'en', 'am', 'so', 'om', 'ti'
 * @param {boolean} options.isSimpleMode - whether simple mode is on
 * @param {Function} options.onSuccess - callback(newJob)
 * @param {Function} options.onCancel - callback()
 */
export function renderEmployerForm(options) {
  const { container, language = 'en', isSimpleMode = false, onSuccess, onCancel } = options;

  container.innerHTML = '';

  const flowHeader = document.createElement('div');
  flowHeader.className = 'ik-flow-header ik-employer-flow-header';
  flowHeader.innerHTML = `
    ${onCancel ? `
      <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-back-to-jobs" aria-label="${t('cancel', language)}">
        ← ${t('cancel', language)}
      </button>
    ` : ''}
    <div class="ik-form-header" style="margin-bottom: 0;">
      <h2 class="ik-form-title" style="margin: 0; font-size: 1.25rem;">
        📝 ${pickLang('Post an Inclusive Opportunity', 'አካታች የሥራ ማስታወቂያ ይለጥፉ', language)}
      </h2>
      <p class="ik-form-subtitle" style="margin: 0.25rem 0 0; font-size: 0.9rem; color: #4b5563;">
        ${pickLang('Detail the position and check off the accommodations your organization provides.', 'አካታች የስራ ቦታዎችን የሚያበረታቱ ድጋፎችን እና የስራውን ዝርዝር ያስገቡ።', language)}
      </p>
    </div>
  `;
  container.appendChild(flowHeader);

  if (onCancel) {
    const cancelBtn = flowHeader.querySelector('.ik-back-to-jobs');
    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
  }

  const engineMount = document.createElement('div');
  engineMount.className = 'ik-step-engine-mount';
  container.appendChild(engineMount);

  const screens = [
    // Step 1: Job Title
    {
      id: 'title',
      title: pickLang('Job Title', 'የሥራው መጠሪያ', language),
      label: pickLang('What is the title of the position? (required)', 'የሥራው መጠሪያ ምንድን ነው? (ግዴታ)', language),
      helpText: pickLang('For example: Remote VA - Customer Support or Data Entry Assistant.', 'ለምሳሌ፡ የርቀት ደንበኞች አገልግሎት ረዳት ወይም የመረጃ ማስገቢያ ረዳት።', language),
      placeholder: pickLang('e.g. Remote VA - Customer Support', 'ለምሳሌ፡ የርቀት ደንበኞች አገልግሎት ረዳት', language),
      inputType: 'text',
      voiceEnabled: true,
      required: true,
      validation: (val) => {
        if (!val || !String(val).trim()) {
          return pickLang('Please add a job title.', 'እባክዎ የስራውን መጠሪያ ያስገቡ።', language);
        }
        return null;
      },
      readAloudText: pickLang('Job Title. What is the title of the position?', 'የሥራው መጠሪያ። የሥራው መጠሪያ ምንድን ነው?', language)
    },

    // Step 2: Employer Name
    {
      id: 'employer',
      title: pickLang('Employer / Organization Name', 'የአሰሪው / የድርጅቱ ስም', language),
      label: pickLang('What is your organization or company name? (required)', 'የድርጅትዎ ወይም የኩባንያዎ ስም ማን ይባላል? (ግዴታ)', language),
      helpText: pickLang('This name will be displayed on the job posting for applicants.', 'ይህ ስም ለአመልካቾች በሥራ ማስታወቂያው ላይ ይታያል።', language),
      placeholder: pickLang('e.g. Acme Logistics', 'ለምሳሌ፡ አክሜ ሎጂስቲክስ', language),
      inputType: 'text',
      voiceEnabled: true,
      required: true,
      validation: (val) => {
        if (!val || !String(val).trim()) {
          return pickLang('Please add the employer name.', 'እባክዎ የአሰሪውን ስም ያስገቡ።', language);
        }
        return null;
      },
      readAloudText: pickLang('Employer Name. What is your organization or company name?', 'የአሰሪው ስም። የድርጅትዎ ወይም የኩባንያዎ ስም ማን ይባላል?', language)
    },

    // Step 3: Job Description
    {
      id: 'description',
      title: pickLang('Job Description', 'የሥራው መግለጫ', language),
      label: pickLang('Describe the responsibilities and qualifications (required):', 'ዋና ዋና ተግባራትን፣ ኃላፊነቶችን እና መመዘኛዎችን ያብራሩ (ግዴታ)፡', language),
      helpText: pickLang('Detail the day-to-day tasks, work arrangement (e.g. remote / in-person), and training provided.', 'የዕለት ተዕለት ተግባራትን፣ የሥራውን ሁኔታ (የርቀት ወይም በአካል) እና የሚሰጠውን ስልጠና በዝርዝር ያብራሩ።', language),
      placeholder: pickLang('Describe the responsibilities, work environment, and qualifications...', 'ዋና ዋና ተግባራትን እና ሃላፊነቶችን ያብራሩ...', language),
      inputType: 'textarea',
      voiceEnabled: true,
      required: true,
      validation: (val) => {
        if (!val || !String(val).trim()) {
          return pickLang('Please describe the job.', 'እባክዎ የስራውን መግለጫ ያስገቡ።', language);
        }
        return null;
      },
      readAloudText: pickLang('Job Description. Describe the responsibilities and qualifications for this role.', 'የሥራው መግለጫ። ለዚህ ሥራ የሚያስፈልጉትን ኃላፊነቶች እና መመዘኛዎች ያብራሩ።', language)
    },

    // Step 4: Accommodations Provided
    {
      id: 'accommodations',
      title: pickLang('Accommodations Provided by Employer', 'የሚሰጡት ድጋፎች እና አመቺ ሁኔታዎች', language),
      label: pickLang('Select all adjustments, accessible tools, and supportive work arrangements you support.', 'ድርጅትዎ ለሰራተኞች ወይም ለአመልካቾች የሚያዘጋጃቸውን ሁሉ ይምረጡ።', language),
      helpText: pickLang('Select all accommodations and supportive options provided by your organization.', 'ድርጅትዎ የሚያቀርባቸውን የተደራሽነት ድጋፎች ይምረጡ።', language),
      inputType: 'checkbox',
      required: false,
      options: ACCOMMODATIONS.map(acc => ({
        value: acc,
        label: label('accommodation', acc, language),
        icon: '♿'
      })),
      readAloudText: pickLang('Accommodations Provided. Select all adjustments and supportive work arrangements you support.', 'የሚሰጡት ድጋፎች። ድርጅትዎ ለሰራተኞች የሚያዘጋጃቸውን ድጋፎች ይምረጡ።', language)
    }
  ];

  const engine = new StepEngine({
    container: engineMount,
    screens: screens,
    language: language,
    isSimpleMode: isSimpleMode,
    sessionId: 'ik_employer_session',
    onCancel: onCancel || null,
    onComplete: async (answers) => {
      container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>${pickLang('Publishing your inclusive job opportunity...', 'አካታች የሥራ ማስታወቂያዎን በመለጠፍ ላይ...', language)}</p>
        </div>
      `;

      try {
        const created = await createJob({
          title: String(answers.title || '').trim(),
          employer: String(answers.employer || '').trim(),
          description: String(answers.description || '').trim(),
          accommodations: Array.isArray(answers.accommodations) ? answers.accommodations : []
        });

        container.innerHTML = `
          <div class="ik-success-card" role="region" aria-live="polite">
            <div class="ik-success-icon" aria-hidden="true">✅</div>
            <h2 class="ik-success-title">${t('employerSuccess', language)}</h2>
            <p class="ik-success-message">
              <strong>${created.title}</strong> (${created.employer}) ${
                pickLang('is now live. Job seekers can view accommodations and apply with voice or text.', 'በስኬት ተመዝግቧል። አመልካቾች አሁን ሊያዩት እና ሊያመለክቱበት ይችላሉ።', language)
              }
            </p>
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-view-all-jobs">
                💼 ${pickLang('View in Job Listings', 'ወደ ስራዎች ዝርዝር ሂድ', language)}
              </button>
            </div>
          </div>
        `;

        container.querySelector('.ik-view-all-jobs').addEventListener('click', () => {
          if (onSuccess) onSuccess(created);
        });

      } catch (err) {
        let errorMsg = err.message || 'Could not post job.';
        if (err.errors) {
          if (typeof err.errors === 'string') {
            errorMsg = err.errors;
          } else if (typeof err.errors === 'object') {
            const firstErr = Object.values(err.errors)[0];
            if (firstErr) errorMsg = firstErr;
          }
        }
        container.innerHTML = `
          <div class="ik-error-card" role="alert">
            <p class="ik-error-msg"><strong>${pickLang('Error posting job:', 'ስራውን በመለጠፍ ላይ ስህተት ተከስቷል፡', language)}</strong> ${errorMsg}</p>
            <button type="button" class="ik-btn ik-btn-secondary ik-retry-employer">${pickLang('Try again', 'እንደገና ሞክር', language)}</button>
          </div>
        `;
        container.querySelector('.ik-retry-employer').addEventListener('click', () => {
          renderEmployerForm(options);
        });
      }
    }
  });

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
