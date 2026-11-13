import { StepEngine } from '../core/step-engine.js';
import { createApplication } from '../api-client.js';
import { t } from '../labels.js';

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
      title: language === 'am' ? 'ለምን በዚህ ስራ ላይ ፍላጎት አሎት?' : 'Why are you interested in this role?',
      label: language === 'am' ? 'ስለራስዎ እና ለስራው ያለዎትን ፍላጎት በጥቂቱ ይንገሩን።' : 'Tell the employer why you are interested in this position.',
      helpText: language === 'am' ? 'መጻፍ ወይም በድምፅ ማይክሮፎኑን ተጠቅመው መናገር ይችላሉ።' : 'You can type or click the microphone to speak your response.',
      inputType: 'textarea',
      voiceEnabled: true,
      readAloudText: (language === 'am' ? 'ለምን በዚህ ስራ ላይ ፍላጎት አሎት?' : 'Why are you interested in this role?') + ' ' +
                     (language === 'am' ? 'ስለራስዎ እና ለስራው ያለዎትን ፍላጎት በጥቂቱ ይንገሩን።' : 'Tell the employer why you are interested in this position.'),
      validation: (val) => {
        if (!val || !String(val).trim()) {
          return language === 'am' ? 'እባክዎ መልስዎን ያስገቡ።' : 'Please provide a brief answer to introduce yourself.';
        }
        return null;
      }
    },
    {
      id: 'interviewAccommodations',
      title: language === 'am' ? 'የቃለ መጠይቅ ድጋፍ መጠየቅ' : 'Request interview support (optional)',
      label: language === 'am' ? 'ለቃለ መጠይቁ ምን አይነት ድጋፍ ይፈልጋሉ?' : 'Which accommodations would help you during the interview?',
      helpText: language === 'am' ? 'ምንም የህክምና ማረጋገጫ አያስፈልግም። መረጃው በግል የተጠበቀ ነው።' : 'No medical proof needed. Stored privately and handled by inclusive coordinators.',
      inputType: 'checkbox',
      options: [
        {
          value: 'extra_interview_time',
          label: language === 'am' ? 'ለቃለ መጠይቅ ተጨማሪ ጊዜ' : 'Extra interview time',
          icon: '⏰',
          description: language === 'am' ? 'ጥያቄዎችን ለማሰብ እና ለመመለስ ተጨማሪ ጊዜ' : 'More time to think and respond to interview questions'
        },
        {
          value: 'sign_language_interpreter',
          label: language === 'am' ? 'የምልክት ቋንቋ አስተርጓሚ' : 'Sign language interpreter',
          icon: '👋',
          description: language === 'am' ? 'በቃለ መጠይቁ ወቅት የምልክት ቋንቋ ድጋፍ' : 'Live interpreter support provided during the interview'
        },
        {
          value: 'screen_reader_friendly',
          label: language === 'am' ? 'ለስክሪን አንባቢ ተስማሚ ሰነዶች' : 'Screen-reader friendly materials',
          icon: '💻',
          description: language === 'am' ? 'ጥያቄዎችን በዲጂታል ቅርጸት ቀድሞ ማግኘት' : 'Access questions and interview materials in accessible digital formats'
        },
        {
          value: 'quiet_environment',
          label: language === 'am' ? 'ጸጥ ያለ አካባቢ ወይም ተለዋዋጭ ሰዓት' : 'Quiet environment / flexible schedule',
          icon: '🧘',
          description: language === 'am' ? 'ያለ ጫጫታ የተረጋጋ ሁኔታ' : 'Low-distraction interview setting'
        },
        {
          value: 'other',
          label: language === 'am' ? 'ሌላ ድጋፍ' : 'Other interview support',
          icon: '♿',
          description: language === 'am' ? 'የሚፈልጉትን ሌላ ድጋፍ' : 'Specify any other accommodation you might need'
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
                <p>${language === 'am'
                  ? 'የጠየቁት የቃለ መጠይቅ ድጋፍ በግል ለድጋፍ አስተባባሪዎች ተላልፏል። አሰሪው የእርስዎን የጤና ሁኔታ አይመለከትም።'
                  : 'Your interview accommodation request was recorded privately and shared only with support coordinators. The employer does not see private medical or disability disclosures.'}</p>
              </div>
            ` : ''}
            <div class="ik-success-actions">
              <button type="button" class="ik-btn ik-btn-primary ik-return-jobs-btn">
                ← ${language === 'am' ? 'ወደ ስራዎች ዝርዝር ተመለስ' : 'Return to Job Listings'}
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

