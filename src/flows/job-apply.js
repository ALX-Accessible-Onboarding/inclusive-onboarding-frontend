import { StepEngine } from '../core/step-engine.js';
import { createApplication } from '../api-client.js';
import { label, t } from '../labels.js';
import { h, btn } from '../core/dom.js';

export function startJobApplication(options) {
  const { container, job, learnerId, language = 'en', isSimpleMode = false, onSuccess, onCancel } = options;

  container.textContent = '';
  const isAm = language === 'am' || String(language).toLowerCase().startsWith('am');

  const backBtn = btn('ik-btn ik-btn-secondary ik-btn-sm ik-back-to-jobs', '← ' + t('back', language), () => {
    if (onCancel) onCancel();
  });
  const badgeSpan = h('span', 'ik-badge ik-badge-info', 'Applying to: ' + job.title + ' (' + job.employer + ')');
  const badgeDiv = h('div', 'ik-apply-job-badge', null, [badgeSpan]);
  container.appendChild(h('div', 'ik-flow-header', null, [backBtn, badgeDiv]));

  const engineMount = h('div', 'ik-step-engine-mount');
  container.appendChild(engineMount);

  const accOptions = [
    { value: 'extra_interview_time', icon: '⏰' },
    { value: 'sign_language_interpreter', icon: '👋' },
    { value: 'screen_reader_friendly', icon: '💻' },
    { value: 'flexible_hours', icon: '🧘' },
    { value: 'other', icon: '♿' }
  ].map(o => ({
    value: o.value,
    icon: o.icon,
    label: label('accommodation', o.value, language)
  }));

  const screens = [
    {
      id: 'coverNote',
      title: isAm ? 'ለምን በዚህ ስራ ላይ ፍላጎት አሎት?' : 'Why are you interested in this role?',
      label: isAm ? 'ስለራስዎ እና ለስራው ያለዎትን ፍላጎት ይንገሩን።' : 'Tell the employer why you are interested.',
      helpText: isAm ? 'መጻፍ ወይም በድምፅ ማይክሮፎኑን ተጠቅመው መናገር ይችላሉ።' : 'You can type or speak your response.',
      inputType: 'textarea',
      voiceEnabled: true,
      validation: (val) => (!val || !String(val).trim()) ? (isAm ? 'እባክዎ መልስዎን ያስገቡ።' : 'Please provide a brief answer.') : null
    },
    {
      id: 'interviewAccommodations',
      title: isAm ? 'የቃለ መጠይቅ ድጋፍ መጠየቅ' : 'Request interview support (optional)',
      label: isAm ? 'ለቃለ መጠይቁ ምን አይነት ድጋፍ ይፈልጋሉ?' : 'Accommodations that help you during interview:',
      helpText: isAm ? 'በግል የተጠበቀ ነው። የህክምና ማረጋገጫ አያስፈልግም።' : 'Stored privately. No medical proof needed.',
      inputType: 'checkbox',
      options: accOptions
    }
  ];

  const engine = new StepEngine({
    container: engineMount,
    screens,
    language,
    isSimpleMode,
    sessionId: 'ik_job_apply_' + job.id + '_' + (learnerId || 'lrn_demo'),
    onComplete: async (answers) => {
      const accommodations = Array.isArray(answers.interviewAccommodations) ? answers.interviewAccommodations : [];
      const supportRequested = accommodations.length > 0;

      engineMount.textContent = '';
      const loadDiv = h('div', 'ik-loading-indicator', null, [
        h('div', 'ik-spinner'),
        h('p', null, t('submitting', language))
      ]);
      loadDiv.setAttribute('role', 'status');
      engineMount.appendChild(loadDiv);

      try {
        const result = await createApplication({
          learnerId: learnerId || 'lrn_demo',
          jobId: job.id,
          answers: {
            coverNote: answers.coverNote || '',
            interviewAccommodations: accommodations
          },
          supportRequested
        });

        container.textContent = '';
        const successCard = h('div', 'ik-success-card', null, [
          h('div', 'ik-success-icon', '🎉'),
          h('h2', 'ik-success-title', t('applicationSubmitted', language)),
          h('p', 'ik-success-message', isAm
            ? `ለ ${job.title} በ ${job.employer} ያመለከቱት ማመልከቻ በተሳካ ሁኔታ ደርሷል።`
            : `Your application for ${job.title} at ${job.employer} was successfully submitted.`)
        ]);
        successCard.setAttribute('role', 'region');
        successCard.setAttribute('aria-live', 'polite');

        if (supportRequested) {
          successCard.appendChild(h('div', 'ik-callout ik-callout-private', null, [
            h('span', 'ik-badge ik-badge-private', t('privateBadge', language)),
            h('p', null, isAm
              ? 'የጠየቁት የቃለ መጠይቅ ድጋፍ በግል ለድጋፍ አስተባባሪዎች ተላልፏል። አሰሪው የእርስዎን የጤና ሁኔታ አይመለከትም።'
              : 'Your interview accommodation request was recorded privately and shared only with support coordinators.')
          ]));
        }

        const retBtn = btn('ik-btn ik-btn-primary ik-return-jobs-btn', '← ' + (isAm ? 'ወደ ስራዎች ዝርዝር ተመለስ' : 'Return to Job Listings'), () => {
          if (onSuccess) onSuccess(result);
        });
        successCard.appendChild(h('div', 'ik-success-actions', null, [retBtn]));
        container.appendChild(successCard);

      } catch (err) {
        engineMount.textContent = '';
        const errMsg = (err.errors && err.errors._) ? err.errors._ : (err.message || 'Submission failed');
        const errCard = h('div', 'ik-error-card', null, [
          h('p', 'ik-error-msg', '⚠️ ' + errMsg),
          btn('ik-btn ik-btn-primary', t('tryAgain', language), () => engine.render())
        ]);
        errCard.setAttribute('role', 'alert');
        engineMount.appendChild(errCard);
      }
    }
  });

  engine.render();
}
