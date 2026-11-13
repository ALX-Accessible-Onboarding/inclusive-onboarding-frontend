import { createJob } from '../api-client.js';
import { ACCOMMODATIONS } from '../vocabulary.js';
import { label, t } from '../labels.js';

/**
 * Task E4: Employer job posting form with accessibility accommodations checklist.
 * @param {Object} options
 * @param {HTMLElement} options.container
 * @param {string} options.language - 'en' or 'am'
 * @param {Function} options.onSuccess - callback(newJob)
 * @param {Function} options.onCancel - callback()
 */
export function renderEmployerForm(options) {
  const { container, language = 'en', onSuccess, onCancel } = options;

  container.innerHTML = `
    <div class="ik-employer-form-card">
      <div class="ik-form-header">
        <h2 class="ik-form-title">${language === 'am' ? 'አካታች የሥራ ማስታወቂያ ይለጥፉ' : 'Post an Inclusive Opportunity'}</h2>
        <p class="ik-form-subtitle">
          ${language === 'am'
            ? 'አካታች የስራ ቦታዎችን የሚያበረታቱ ድጋፎችን እና የስራውን ዝርዝር ያስገቡ።'
            : 'Detail the position and check off the accommodations your organization provides.'}
        </p>
      </div>

      <form class="ik-employer-form" novalidate>
        <div class="ik-form-group">
          <label for="ik_job_title" class="ik-label">
            ${language === 'am' ? 'የሥራው መጠሪያ' : 'Job Title'} <span class="ik-required">*</span>
          </label>
          <input type="text" id="ik_job_title" name="title" class="ik-input" placeholder="e.g. Remote VA - Customer Support" required>
          <p id="ik_job_title_err" class="ik-field-error ik-hidden" role="alert"></p>
        </div>

        <div class="ik-form-group">
          <label for="ik_job_employer" class="ik-label">
            ${language === 'am' ? 'የአሰሪው / የድርጅቱ ስም' : 'Employer / Organization Name'} <span class="ik-required">*</span>
          </label>
          <input type="text" id="ik_job_employer" name="employer" class="ik-input" placeholder="e.g. Acme Logistics" required>
          <p id="ik_job_employer_err" class="ik-field-error ik-hidden" role="alert"></p>
        </div>

        <div class="ik-form-group">
          <label for="ik_job_description" class="ik-label">
            ${language === 'am' ? 'የሥራው መግለጫ' : 'Job Description'} <span class="ik-required">*</span>
          </label>
          <textarea id="ik_job_description" name="description" rows="5" class="ik-textarea" placeholder="${
            language === 'am' ? 'ዋና ዋና ተግባራትን እና ሃላፊነቶችን ያብራሩ...' : 'Describe the responsibilities, work environment, and qualifications...'
          }" required></textarea>
          <p id="ik_job_description_err" class="ik-field-error ik-hidden" role="alert"></p>
        </div>

        <div class="ik-form-group">
          <fieldset class="ik-fieldset">
            <legend class="ik-legend">
              ${language === 'am' ? 'የሚሰጡት ድጋፎች እና አመቺ ሁኔታዎች' : 'Accommodations Provided by Employer'}
            </legend>
            <p class="ik-help-text">
              ${language === 'am'
                ? 'ድርጅትዎ ለሰራተኞች ወይም ለአመልካቾች የሚያዘጋጃቸውን ሁሉ ይምረጡ።'
                : 'Select all adjustments, accessible tools, and supportive work arrangements you support.'}
            </p>
            <div class="ik-accommodations-checkboxes ik-options-grid">
              ${ACCOMMODATIONS.map((acc, i) => `
                <div class="ik-option-card">
                  <input type="checkbox" id="ik_acc_${i}" name="accommodations" value="${acc}" class="ik-checkbox-input">
                  <label for="ik_acc_${i}" class="ik-option-label">
                    <strong>${label('accommodation', acc, language)}</strong>
                  </label>
                </div>
              `).join('')}
            </div>
            <p id="ik_job_acc_err" class="ik-field-error ik-hidden" role="alert"></p>
          </fieldset>
        </div>

        <div id="ik_form_general_err" class="ik-error-alert ik-hidden" role="alert"></div>

        <div class="ik-form-actions">
          ${onCancel ? `
            <button type="button" class="ik-btn ik-btn-secondary ik-cancel-btn">
              ${t('cancel', language)}
            </button>
          ` : ''}
          <button type="submit" class="ik-btn ik-btn-primary ik-submit-job-btn">
            ${t('submit', language)}
          </button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('.ik-employer-form');
  const titleInput = form.querySelector('#ik_job_title');
  const employerInput = form.querySelector('#ik_job_employer');
  const descInput = form.querySelector('#ik_job_description');

  if (onCancel) {
    const cancelBtn = form.querySelector('.ik-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
  }

  // Toggle styling on option card checkboxes
  form.querySelectorAll('.ik-option-card').forEach(card => {
    const cb = card.querySelector('input[type="checkbox"]');
    cb.addEventListener('change', () => {
      if (cb.checked) card.classList.add('ik-selected');
      else card.classList.remove('ik-selected');
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll('.ik-field-error').forEach(p => { p.textContent = ''; p.classList.add('ik-hidden'); });
    form.querySelectorAll('.ik-input, .ik-textarea').forEach(inp => inp.removeAttribute('aria-invalid'));
    const genErr = form.querySelector('#ik_form_general_err');
    genErr.textContent = '';
    genErr.classList.add('ik-hidden');

    const title = titleInput.value.trim();
    const employer = employerInput.value.trim();
    const description = descInput.value.trim();
    const selectedAccommodations = Array.from(form.querySelectorAll('input[name="accommodations"]:checked'))
      .map(cb => cb.value);

    let hasClientErrors = false;
    if (!title) {
      const err = form.querySelector('#ik_job_title_err');
      err.textContent = language === 'am' ? 'እባክዎ የስራውን መጠሪያ ያስገቡ።' : 'Please add a job title.';
      err.classList.remove('ik-hidden');
      titleInput.setAttribute('aria-invalid', 'true');
      hasClientErrors = true;
    }
    if (!employer) {
      const err = form.querySelector('#ik_job_employer_err');
      err.textContent = language === 'am' ? 'እባክዎ የአሰሪውን ስም ያስገቡ።' : 'Please add the employer name.';
      err.classList.remove('ik-hidden');
      employerInput.setAttribute('aria-invalid', 'true');
      hasClientErrors = true;
    }
    if (!description) {
      const err = form.querySelector('#ik_job_description_err');
      err.textContent = language === 'am' ? 'እባክዎ የስራውን መግለጫ ያስገቡ።' : 'Please describe the job.';
      err.classList.remove('ik-hidden');
      descInput.setAttribute('aria-invalid', 'true');
      hasClientErrors = true;
    }

    if (hasClientErrors) return;

    const submitBtn = form.querySelector('.ik-submit-job-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = t('submitting', language);

    try {
      const created = await createJob({
        title,
        employer,
        description,
        accommodations: selectedAccommodations
      });

      container.innerHTML = `
        <div class="ik-success-card" role="region" aria-live="polite">
          <div class="ik-success-icon" aria-hidden="true">✅</div>
          <h2 class="ik-success-title">${t('employerSuccess', language)}</h2>
          <p class="ik-success-message">
            <strong>${created.title}</strong> (${created.employer}) ${
              language === 'am' ? 'በስኬት ተመዝግቧል። አመልካቾች አሁን ሊያዩት እና ሊያመለክቱበት ይችላሉ።' : 'is now live. Job seekers can view accommodations and apply with voice or text.'
            }
          </p>
          <div class="ik-success-actions">
            <button type="button" class="ik-btn ik-btn-primary ik-view-all-jobs">
              ${language === 'am' ? 'ወደ ስራዎች ዝርዝር ሂድ' : 'View in Job Listings'}
            </button>
          </div>
        </div>
      `;

      container.querySelector('.ik-view-all-jobs').addEventListener('click', () => {
        if (onSuccess) onSuccess(created);
      });

    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = t('submit', language);

      if (err.errors) {
        Object.keys(err.errors).forEach(f => {
          const fieldErr = form.querySelector('#ik_job_' + f + '_err');
          if (fieldErr) {
            fieldErr.textContent = err.errors[f];
            fieldErr.classList.remove('ik-hidden');
          } else {
            genErr.textContent += (genErr.textContent ? '\n' : '') + err.errors[f];
            genErr.classList.remove('ik-hidden');
          }
        });
      } else {
        genErr.textContent = err.message || 'Could not post job.';
        genErr.classList.remove('ik-hidden');
      }
    }
  });
}
