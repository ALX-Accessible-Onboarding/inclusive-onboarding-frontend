import { StepEngine } from '../core/step-engine.js';
import { createApplication } from '../api-client.js';
import { t } from '../labels.js';
import { pickLang } from '../content-translations.js';

/**
 * Task E3: Job application flow reusing QuestionScreen and StepEngine.
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {Object} options.job - the job being applied for
 * @param {string} options.learnerId - current learner ID
 * @param {string} options.language - 'en' or 'am'
 * @param {boolean} options.isSimpleMode - whether simple mode is on
 * @param {Function} options.onSuccess - callback(appRecord)
 * @param {Function} options.onCancel - callback()
 */
export function startJobApplication(options) {
  const { container, job, learnerId, language = 'en', isSimpleMode = false, onSuccess, onCancel } = options;

  container.innerHTML = '';

  const flowHeader = document.createElement('div');
  flowHeader.className = 'ik-flow-header';
  flowHeader.innerHTML = `
    <button type="button" class="ik-btn ik-btn-secondary ik-btn-sm ik-back-to-jobs" aria-label="Cancel application and back to jobs">
      ← ${t('back', language)}
    </button>
    <div class="ik-apply-job-badge">
      <span class="ik-badge ik-badge-info">Applying to: <strong>${job.title}</strong> (${job.employer})</span>
    </div>
  `;
  container.appendChild(flowHeader);

  flowHeader.querySelector('.ik-back-to-jobs').addEventListener('click', () => {
    if (onCancel) onCancel();
  });

  const engineMount = document.createElement('div');
  engineMount.className = 'ik-step-engine-mount';
  container.appendChild(engineMount);

  const screens = [
    {
      id: 'coverNote',
      title: pickLang('Why are you interested in this role?', 'ለምን በዚህ ስራ ላይ ፍላጎት አሎት?', language),
      label: pickLang('Tell the employer why you are interested in this position.', 'ስለራስዎ እና ለስራው ያለዎትን ፍላጎት በጥቂቱ ይንገሩን።', language),
      helpText: pickLang('You can type or click the microphone to speak your response.', 'መጻፍ ወይም በድምፅ ማይክሮፎኑን ተጠቅመው መናገር ይችላሉ።', language),
      inputType: 'textarea',
      voiceEnabled: true,
      readAloudText: (pickLang('Why are you interested in this role?', 'ለምን በዚህ ስራ ላይ ፍላጎት አሎት?', language)) + ' ' +
                     (pickLang('Tell the employer why you are interested in this position.', 'ስለራስዎ እና ለስራው ያለዎትን ፍላጎት በጥቂቱ ይንገሩን።', language)),
      validation: (val) => {
        if (!val || !String(val).trim()) {
          return pickLang('Please provide a brief answer to introduce yourself.', 'እባክዎ መልስዎን ያስገቡ።', language);
        }
        return null;
      }
    },
    {
      id: 'interviewAccommodations',
      title: pickLang('Request interview support (optional)', 'የቃለ መጠይቅ ድጋፍ መጠየቅ', language),
      label: pickLang('Which accommodations would help you during the interview?', 'ለቃለ መጠይቁ ምን አይነት ድጋፍ ይፈልጋሉ?', language),
      helpText: pickLang('No medical proof needed. Stored privately and handled by inclusive coordinators.', 'ምንም የህክምና ማረጋገጫ አያስፈልግም። መረጃው በግል የተጠበቀ ነው።', language),
      inputType: 'checkbox',
      options: [
        {
          value: 'extra_interview_time',
          label: pickLang('Extra interview time', 'ለቃለ መጠይቅ ተጨማሪ ጊዜ', language),
          icon: '⏰',
          description: pickLang('More time to think and respond to interview questions', 'ጥያቄዎችን ለማሰብ እና ለመመለስ ተጨማሪ ጊዜ', language)
        },
        {
          value: 'sign_language_interpreter',
          label: pickLang('Sign language interpreter', 'የምልክት ቋንቋ አስተርጓሚ', language),
          icon: '👋',
          description: pickLang('Live interpreter support provided during the interview', 'በቃለ መጠይቁ ወቅት የምልክት ቋንቋ ድጋፍ', language)
        },
        {
          value: 'screen_reader_friendly',
          label: pickLang('Screen-reader friendly materials', 'ለስክሪን አንባቢ ተስማሚ ሰነዶች', language),
          icon: '💻',
          description: pickLang('Access questions and interview materials in accessible digital formats', 'ጥያቄዎችን በዲጂታል ቅርጸት ቀድሞ ማግኘት', language)
        },
        {
          value: 'quiet_environment',
          label: pickLang('Quiet environment / flexible schedule', 'ጸጥ ያለ አካባቢ ወይም ተለዋዋጭ ሰዓት', language),
          icon: '🧘',
          description: pickLang('Low-distraction interview setting', 'ያለ ጫጫታ የተረጋጋ ሁኔታ', language)
        },
        {
          value: 'other',
          label: pickLang('Other interview support', 'ሌላ ድጋፍ', language),
          icon: '♿',
          description: pickLang('Specify any other accommodation you might need', 'የሚፈልጉትን ሌላ ድጋፍ', language)
        }
      ]
    }
  ];

  const engine = new StepEngine({
    container: engineMount,
    screens: screens,
    language: language,
    isSimpleMode: isSimpleMode,
    sessionId: 'ik_job_apply_' + job.id + '_' + (learnerId || 'lrn_demo'),
    onComplete: async (answers) => {
      // Determine supportRequested boolean
      const accommodations = Array.isArray(answers.interviewAccommodations) ? answers.interviewAccommodations : [];
      const supportRequested = accommodations.length > 0;

      engineMount.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>${t('submitting', language)}</p>
        </div>
      `;

      try {
        const result = await createApplication({
          learnerId: learnerId || 'lrn_demo',
          jobId: job.id,
          answers: {
            coverNote: answers.coverNote || '',
            interviewAccommodations: accommodations
          },
          supportRequested: supportRequested
        });

        // Show application success screen
        container.innerHTML = `
          <div class="ik-success-card" role="region" aria-live="polite">
            <div class="ik-success-icon" aria-hidden="true">🎉</div>
            <h2 class="ik-success-title">${t('applicationSubmitted', language)}</h2>
            <p class="ik-success-message">
              ${language === 'am'
                ? `ለ <strong>${job.title}</strong> በ <strong>${job.employer}</strong> ያመለከቱት ማመልከቻ በተሳካ ሁኔታ ደርሷል።`
                : `Your application for <strong>${job.title}</strong> at <strong>${job.employer}</strong> was successfully submitted.`}
            </p>
            ${supportRequested ? `
              <div class="ik-callout ik-callout-private">
                <span class="ik-badge ik-badge-private">${t('privateBadge', language)}</span>
                <p>${pickLang('Your interview accommodation request was recorded privately and shared only with support coordinators. The employer does not see private medical or disability disclosures.', 'የጠየቁት የቃለ መጠይቅ ድጋፍ በግል ለድጋፍ አስተባባሪዎች ተላልፏል። አሰሪው የእርስዎን የጤና ሁኔታ አይመለከትም።', language)}</p>
              </div>
            ` : ''}
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-return-jobs-btn">
                ← ${pickLang('Return to Job Listings', 'ወደ ስራዎች ዝርዝር ተመለስ', language)}
              </button>
            </div>
          </div>
        `;

        container.querySelector('.ik-return-jobs-btn').addEventListener('click', () => {
          if (onSuccess) onSuccess(result);
        });

      } catch (err) {
        engineMount.innerHTML = `
          <div class="ik-error-card" role="alert">
            <p class="ik-error-msg"><strong>Error:</strong> ${err.errors && err.errors._ ? err.errors._ : (err.message || 'Could not submit application.')}</p>
            <button type="button" class="ik-btn ik-btn-secondary ik-retry-apply">Retry</button>
          </div>
        `;
        engineMount.querySelector('.ik-retry-apply').addEventListener('click', () => {
          startJobApplication(options);
        });
      }
    },
    onCancel: () => {
      if (onCancel) onCancel();
    }
  });

  engine.render();
}

