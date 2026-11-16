import { StepEngine } from '../core/step-engine.js';
import { createJob } from '../api-client.js';
import { ACCOMMODATIONS } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { h, btn } from '../core/dom.js';

const ACCOMMODATION_ICONS = {
  read_aloud: '🔊',
  flexible_hours: '⏰',
  screen_reader_friendly: '💻',
  voice_application: '🎤',
  extra_interview_time: '⏳',
  sign_language_interpreter: '👋',
  other: '♿'
};

export function renderEmployerForm(options) {
  const { container, language = 'en', isSimpleMode = false, onSuccess, onCancel } = options;

  container.textContent = '';
  const isAm = language === 'am' || String(language).toLowerCase().startsWith('am');

  const backBtn = onCancel
    ? btn('ik-btn ik-btn-secondary ik-btn-sm ik-back-to-jobs', '← ' + t('back', language), onCancel)
    : h('div');

  const badgeSpan = h('span', 'ik-badge ik-badge-info', isAm ? '📝 አካታች የሥራ ማስታወቂያ መለጠፊያ' : '📝 Post an Opportunity');
  const badgeDiv = h('div', 'ik-apply-job-badge', null, [badgeSpan]);
  container.appendChild(h('div', 'ik-flow-header', null, [backBtn, badgeDiv]));

  const engineMount = h('div', 'ik-step-engine-mount');
  container.appendChild(engineMount);

  const screens = [
    {
      id: 'title',
      title: isAm ? 'የሥራው መጠሪያ' : 'Job Title',
      label: isAm ? 'የሥራ መደቡ ስም ምንድን ነው?' : 'What is the job title or role name?',
      helpText: isAm ? 'ምሳሌ፡ የርቀት ደንበኞች አገልግሎት ረዳት። መናገር ወይም መጻፍ ይችላሉ።' : 'e.g. Remote VA - Customer Support. You can type or speak.',
      inputType: 'text',
      required: true,
      voiceEnabled: true,
      placeholder: isAm ? 'ምሳሌ፡ የርቀት ደንበኞች አገልግሎት ረዳት' : 'e.g. Remote VA - Customer Support',
      validation: (val) => (!val || String(val).trim().length < 2) ? (isAm ? 'እባክዎ ትክክለኛ የስራ መጠሪያ ያስገቡ (ቢያንስ 2 ፊደላት)።' : 'Please provide a valid job title (at least 2 characters).') : null
    },
    {
      id: 'employer',
      title: isAm ? 'የአሰሪው / የድርጅቱ ስም' : 'Employer / Organization Name',
      label: isAm ? 'የድርጅቱ ወይም የአሰሪው ስም ማን ነው?' : 'What is your organization or company name?',
      helpText: isAm ? 'ምሳሌ፡ አክሜ ሎጂስቲክስ።' : 'e.g. Acme Logistics.',
      inputType: 'text',
      required: true,
      voiceEnabled: true,
      placeholder: isAm ? 'ምሳሌ፡ አክሜ ሎጂስቲክስ' : 'e.g. Acme Logistics',
      validation: (val) => (!val || String(val).trim().length < 2) ? (isAm ? 'እባክዎ የአሰሪውን ወይም የድርጅቱን ስም ያስገቡ።' : 'Please provide your organization or employer name.') : null
    },
    {
      id: 'description',
      title: isAm ? 'የሥራው መግለጫ' : 'Job Description',
      label: isAm ? 'ዋና ዋና ተግባራትን እና የሥራውን ሁኔታ ያብራሩ።' : 'Describe responsibilities and work environment.',
      helpText: isAm ? 'ዋና ተግባራትን፣ ስልጠናን ወይም ከቤት የመስራት ሁኔታን ይጥቀሱ።' : 'Explain responsibilities, training, and remote status.',
      inputType: 'textarea',
      required: true,
      voiceEnabled: true,
      placeholder: isAm ? 'ዋና ተግባራትን ያብራሩ...' : 'Describe responsibilities and qualifications...',
      validation: (val) => (!val || String(val).trim().length < 5) ? (isAm ? 'እባክዎ ዝርዝር የስራ መግለጫ ያስገቡ (ቢያንስ 5 ፊደላት)።' : 'Please provide a brief job description (at least 5 characters).') : null
    },
    {
      id: 'accommodations',
      title: isAm ? 'የሚሰጡት ድጋፎች' : 'Accommodations Provided',
      label: isAm ? 'ድርጅትዎ የሚያዘጋጃቸውን ሁሉ ይምረጡ።' : 'Select accommodations your workplace provides:',
      helpText: isAm ? 'የሚያዘጋጇቸውን ድጋፎች ይምረጡ።' : 'Select all adjustments you offer.',
      inputType: 'checkbox',
      required: false,
      options: ACCOMMODATIONS.map(acc => ({
        value: acc,
        label: label('accommodation', acc, language),
        icon: ACCOMMODATION_ICONS[acc] || '♿'
      }))
    }
  ];

  const engine = new StepEngine({
    container: engineMount,
    screens,
    language,
    isSimpleMode,
    sessionId: 'ik_employer_post_draft',
    onComplete: async (answers) => {
      engineMount.textContent = '';
      const loadDiv = h('div', 'ik-loading-indicator', null, [
        h('div', 'ik-spinner'),
        h('p', null, isAm ? 'ስራውን በመለጠፍ ላይ...' : 'Posting opportunity...')
      ]);
      engineMount.appendChild(loadDiv);

      try {
        const payload = {
          title: String(answers.title || '').trim(),
          employer: String(answers.employer || '').trim(),
          description: String(answers.description || '').trim(),
          accommodations: Array.isArray(answers.accommodations) ? answers.accommodations : []
        };
        const created = await createJob(payload);

        container.textContent = '';
        const successCard = h('div', 'ik-success-card', null, [
          h('div', 'ik-success-icon', '🎉'),
          h('h2', 'ik-success-title', t('employerSuccess', language)),
          h('p', 'ik-success-message', isAm
            ? `"${created.title}" የተባለው ስራ በተሳካ ሁኔታ ተለጠፈ። አመልካቾች አሁን ማመልከት ይችላሉ።`
            : `"${created.title}" has been posted successfully. Learners can now discover and apply.`),
          h('div', 'ik-success-actions', null, [
            btn('ik-btn ik-btn-primary ik-return-gateway-btn', isAm ? 'ወደ ስራዎች ዝርዝር ሂድ' : 'View in Career Gateway', () => {
              if (onSuccess) onSuccess(created);
            })
          ])
        ]);
        container.appendChild(successCard);

      } catch (err) {
        engineMount.textContent = '';
        const errMsg = (err.errors && err.errors._) ? err.errors._ : (err.message || 'Failed to post job.');
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
