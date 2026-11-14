import { getAllJobs } from '../api-client.js';
import { filterJobsBySupport } from './job-filter.js';
import { injectJobPostingJsonLd } from './jobposting-jsonld.js';
import { SUPPORT_NEEDS } from '../vocabulary.js';
import { label, t } from '../labels.js';
import { speak, stopSpeaking, isSpeaking, isSpeechSupported } from '../features/read-aloud.js';
import { startJobApplication } from '../flows/job-apply.js';

/**
 * Tasks E1, E2, E5: Career Gateway Job List component.
 */
export class CareerGateway {
  constructor(options) {
    this.container = options.container;
    this.learnerId = options.learnerId || 'lrn_demo';
    this.language = options.language || 'en';
    this.isSimpleMode = options.isSimpleMode || false;
    this.onApplyClick = options.onApplyClick || null;
    this.onPostJobClick = options.onPostJobClick || null;

    this.jobs = [];
    this.selectedNeeds = [];
    this.searchQuery = '';
    this.plainLanguageMode = false;
    this.currentlySpeakingJobId = null;
    this.loading = true;
    this.error = null;
  }

  async init() {
    this.loading = true;
    this.render();
    try {
      this.jobs = await getAllJobs();
      this.loading = false;
      this.error = null;
    } catch (err) {
      this.loading = false;
      this.error = err.errors && err.errors._ ? err.errors._ : t('loadError', this.language);
    }
    this.render();
  }

  getFilteredJobs() {
    let result = filterJobsBySupport(this.jobs, this.selectedNeeds);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(j =>
        (j.title && j.title.toLowerCase().includes(q)) ||
        (j.employer && j.employer.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q))
      );
    }
    return result;
  }

    getPlainLanguageSummary(job) {
    // Prefer a summary written by the employer/backend. Never guess facts from keywords.
    if (Array.isArray(job.plainSummary) && job.plainSummary.length) return job.plainSummary;
    if (typeof job.plainSummary === 'string' && job.plainSummary.trim()) return [job.plainSummary.trim()];

    const lines = [];
    const first = (job.description || '').trim().split(/\.\s|\n/)[0].replace(/\.$/, '');
    if (first) lines.push(first + '.');
    if (job.accommodations && job.accommodations.length) {
      const accLabels = job.accommodations.map(a => label('accommodation', a, this.language)).join(', ');
      lines.push(t('accommodationsAvailable', this.language) + ' ' + accLabels);
    }
    return lines;
  }

  render() {
    this.container.innerHTML = '';

    const root = document.createElement('div');
    root.className = 'ik-career-gateway';

    // Header with Title & "Post a Job" action
    const header = document.createElement('div');
    header.className = 'ik-gateway-header';
    header.innerHTML = `
      <div class="ik-gateway-title-group">
        <h2 class="ik-gateway-title">${t('career', this.language)}</h2>
        <p class="ik-gateway-subtitle">
          ${this.language === 'am'
            ? 'አካታች የስራ እድሎችን ያግኙ። ድጋፍን ለመምረጥ የሚጠቀሙት ማጣሪያ በመሳሪያዎ ላይ ብቻ የሚቀመጥ ሲሆን ሚስጥራዊነቱ የተጠበቀ ነው።'
            : 'Find jobs with accommodations built-in. Filtering by your needed support stays on your device and is never shared.'}
        </p>
      </div>
      <div class="ik-gateway-header-actions">
        ${this.onPostJobClick ? `
          <button type="button" class="ik-btn ik-btn-secondary ik-btn-post-job">
            + ${t('employer', this.language)}
          </button>
        ` : ''}
      </div>
    `;

    if (this.onPostJobClick) {
      header.querySelector('.ik-btn-post-job').addEventListener('click', this.onPostJobClick);
    }
    root.appendChild(header);

    // Filter Bar: Support I Need (Client-Side Filter)
    const filterSection = document.createElement('section');
    filterSection.className = 'ik-filter-section';
    filterSection.setAttribute('aria-label', t('filterBySupport', this.language));

    const filterHeading = document.createElement('div');
    filterHeading.className = 'ik-filter-heading-row';
    filterHeading.innerHTML = `
      <h2 class="ik-filter-heading">
        <span aria-hidden="true">🛡️</span> ${t('filterBySupport', this.language)}
      </h2>
      <span class="ik-badge ik-badge-private">${t('privateBadge', this.language)}</span>
    `;
    filterSection.appendChild(filterHeading);

        const filterChips = document.createElement('div');
    filterChips.className = 'ik-filter-chips';

    // The clear button always exists; it is only hidden when there is nothing to clear
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ik-btn ik-btn-link ik-clear-filter-btn';
    clearBtn.textContent = t('clearFilters', this.language);
    clearBtn.hidden = this.selectedNeeds.length === 0;

    SUPPORT_NEEDS.forEach(need => {
      const isSelected = this.selectedNeeds.includes(need);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ik-filter-chip ' + (isSelected ? 'ik-chip-active' : '');
      chip.setAttribute('data-need', need);
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      const icon = document.createElement('span');
      icon.className = 'ik-chip-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = isSelected ? '✓' : '+';
      const text = document.createElement('span');
      text.className = 'ik-chip-text';
      text.textContent = label('support', need, this.language);
      chip.appendChild(icon);
      chip.appendChild(text);

      chip.addEventListener('click', () => {
        if (this.selectedNeeds.includes(need)) {
          this.selectedNeeds = this.selectedNeeds.filter(n => n !== need);
        } else {
          this.selectedNeeds.push(need);
        }
        // Update this chip in place: keyboard focus stays on it and the live region keeps working
        const on = this.selectedNeeds.includes(need);
        chip.classList.toggle('ik-chip-active', on);
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        icon.textContent = on ? '✓' : '+';
        clearBtn.hidden = this.selectedNeeds.length === 0;
        this.updateJobList(root);
      });
      filterChips.appendChild(chip);
    });

    clearBtn.addEventListener('click', () => {
      this.selectedNeeds = [];
      filterChips.querySelectorAll('.ik-filter-chip').forEach(chip => {
        chip.classList.remove('ik-chip-active');
        chip.setAttribute('aria-pressed', 'false');
        chip.querySelector('.ik-chip-icon').textContent = '+';
      });
      clearBtn.hidden = true;
      this.updateJobList(root);
      const first = filterChips.querySelector('.ik-filter-chip');
      if (first) first.focus(); // the button the user just pressed has disappeared
    });
    filterChips.appendChild(clearBtn);

    filterSection.appendChild(filterChips);
    root.appendChild(filterSection);

    // Controls Row: Search Input + Plain Language Summary Toggle
    const controlsRow = document.createElement('div');
    controlsRow.className = 'ik-controls-row';

    const searchInput = document.createElement('input');
    searchInput.type = 'search';
    searchInput.className = 'ik-input ik-search-input';
    searchInput.placeholder = this.language === 'am' ? 'ስራዎችን በስም ወይም በድርጅት ፈልግ...' : 'Search jobs by title or company...';
    searchInput.value = this.searchQuery;
    searchInput.setAttribute('aria-label', searchInput.placeholder);
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.updateJobList(root), 300);
    });
    controlsRow.appendChild(searchInput);

    // Plain Language Toggle
       const plainToggleBtn = document.createElement('button');
    plainToggleBtn.type = 'button';
    plainToggleBtn.className = 'ik-btn ik-btn-secondary ik-plain-toggle-btn ' + (this.plainLanguageMode ? 'ik-active' : '');
    plainToggleBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
    const plainIcon = document.createElement('span');
    plainIcon.setAttribute('aria-hidden', 'true');
    plainIcon.textContent = '📖 ';
    const plainText = document.createElement('span');
    plainText.textContent = t('plainLanguageSummary', this.language); // stable label; aria-pressed announces the state
    plainToggleBtn.appendChild(plainIcon);
    plainToggleBtn.appendChild(plainText);
    plainToggleBtn.addEventListener('click', () => {
      this.plainLanguageMode = !this.plainLanguageMode;
      plainToggleBtn.classList.toggle('ik-active', this.plainLanguageMode);
      plainToggleBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
      this.updateJobList(root);
    });
    controlsRow.appendChild(plainToggleBtn);
    root.appendChild(controlsRow);

        // A live region must exist before its text changes, or screen readers may stay silent
    const status = document.createElement('p');
    status.className = 'ik-results-count';
    status.setAttribute('role', 'status');
    this.statusEl = status;
    root.appendChild(status);
    // Main JobList Container
    const jobListContainer = document.createElement('div');
    jobListContainer.className = 'ik-job-list-container';
    root.appendChild(jobListContainer);

    this.container.appendChild(root);
    this.updateJobList(root);
  }

  updateJobList(root) {
    const container = root.querySelector('.ik-job-list-container');
    if (!container) return;
    container.innerHTML = '';

    if (this.loading) {
      this.statusEl.textContent = t('loadingJobs', this.language);
      return;
    }

    if (this.error) {
      this.statusEl.textContent = '';
      const errCard = document.createElement('div');
      errCard.className = 'ik-error-card';
      errCard.setAttribute('role', 'alert');
      const msg = document.createElement('p');
      msg.className = 'ik-error-msg';
      msg.textContent = this.error; // textContent: the message comes from the server
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'ik-btn ik-btn-secondary ik-retry-btn';
      retry.textContent = t('retry', this.language);
      retry.addEventListener('click', () => this.init());
      errCard.appendChild(msg);
      errCard.appendChild(retry);
      container.appendChild(errCard);
      return;
    }

    const filtered = this.getFilteredJobs();

    // Announced politely by the persistent role="status" element
    const narrowed = this.selectedNeeds.length > 0 || this.searchQuery.trim() !== '';
    if (filtered.length === 1) {
      this.statusEl.textContent = t('resultsOne', this.language);
    } else {
      this.statusEl.textContent = t(narrowed ? 'resultsMatch' : 'resultsAll', this.language)
        .replace('{n}', filtered.length);
    }
    // Results count bar
    const countBar = document.createElement('div');
    countBar.className = 'ik-results-count-bar';
    countBar.setAttribute('aria-live', 'polite');
    countBar.innerHTML = `
      <p class="ik-results-count">
        <strong>${filtered.length}</strong> ${
          this.language === 'am' ? 'የሚስማሙ የስራ እድሎች ተገኝተዋል' : 'accessible positions match your selection'
        }
      </p>
    `;
    container.appendChild(countBar);

    if (filtered.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'ik-empty-state-card';
      emptyState.innerHTML = `
        <p class="ik-empty-icon" aria-hidden="true">🔍</p>
        <p class="ik-empty-text">${t('noJobsFound', this.language)}</p>
        <button type="button" class="ik-btn ik-btn-secondary ik-reset-filter-btn">
          ${this.language === 'am' ? 'ሁሉንም ስራዎች አሳይ' : 'Show all jobs without filter'}
        </button>
      `;
      emptyState.querySelector('.ik-reset-filter-btn').addEventListener('click', () => {
        this.selectedNeeds = [];
        this.searchQuery = '';
        this.render();
      });
      container.appendChild(emptyState);
      return;
    }

    // Grid of cards
    const grid = document.createElement('div');
    grid.className = 'ik-jobs-grid';

    filtered.forEach(job => {
      const card = document.createElement('article');
      card.className = 'ik-job-card';
      card.setAttribute('data-job-id', job.id);

      // Task E5: Inject Schema.org JobPosting JSON-LD
      injectJobPostingJsonLd(card, job, this.language);

      // Card Header
      const cardHeader = document.createElement('div');
      cardHeader.className = 'ik-job-card-header';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'ik-job-title-group';

      const title = document.createElement('h3');
      title.className = 'ik-job-title';
      title.textContent = job.title;
      titleGroup.appendChild(title);

      const employer = document.createElement('p');
      employer.className = 'ik-job-employer';
      employer.textContent = job.employer;
      titleGroup.appendChild(employer);

      cardHeader.appendChild(titleGroup);

      // Task E2: Read-aloud button per job card
      if (isSpeechSupported()) {
        const readBtn = document.createElement('button');
        readBtn.type = 'button';
        readBtn.className = 'ik-btn ik-btn-icon ik-job-read-btn ' + (this.currentlySpeakingJobId === job.id ? 'ik-speaking' : '');
        readBtn.setAttribute('aria-label', `${t('readAloud', this.language)}: ${job.title} at ${job.employer}`);
        readBtn.innerHTML = `
          <span aria-hidden="true">🔊</span>
          <span class="ik-btn-label">${this.currentlySpeakingJobId === job.id ? t('stopReading', this.language) : t('readAloud', this.language)}</span>
        `;

        readBtn.addEventListener('click', () => {
          if (this.currentlySpeakingJobId === job.id) {
            stopSpeaking();
            this.currentlySpeakingJobId = null;
            readBtn.classList.remove('ik-speaking');
            readBtn.querySelector('.ik-btn-label').textContent = t('readAloud', this.language);
          } else {
            stopSpeaking();
            this.currentlySpeakingJobId = job.id;
            grid.querySelectorAll('.ik-job-read-btn').forEach(b => {
              b.classList.remove('ik-speaking');
              b.querySelector('.ik-btn-label').textContent = t('readAloud', this.language);
            });
            readBtn.classList.add('ik-speaking');
            readBtn.querySelector('.ik-btn-label').textContent = t('stopReading', this.language);

            const accText = (job.accommodations || []).map(a => label('accommodation', a, this.language)).join(', ');
            const speechText = `${job.title} at ${job.employer}. Accommodations provided: ${accText || 'standard accommodations'}. Description: ${job.description}`;

            speak(speechText, {
              language: this.language,
              onEnd: () => {
                this.currentlySpeakingJobId = null;
                readBtn.classList.remove('ik-speaking');
                readBtn.querySelector('.ik-btn-label').textContent = t('readAloud', this.language);
              }
            });
          }
        });

        cardHeader.appendChild(readBtn);
      }

      card.appendChild(cardHeader);

      // Accommodations Tags
      if (job.accommodations && job.accommodations.length > 0) {
        const accContainer = document.createElement('ul');
        accContainer.className = 'ik-job-accommodations';
        accContainer.setAttribute('role', 'list');
        accContainer.setAttribute('aria-label', t('accommodationsAvailable', this.language));
        job.accommodations.forEach(acc => {
          const badge = document.createElement('li');
          badge.className = 'ik-badge ik-badge-accommodation';
          const mark = document.createElement('span');
          mark.setAttribute('aria-hidden', 'true');
          mark.textContent = '✓ ';
          badge.appendChild(mark);
          badge.appendChild(document.createTextNode(label('accommodation', acc, this.language)));
          accContainer.appendChild(badge);
        });
        card.appendChild(accContainer);
      }
      // Description / Plain language summary
      const descArea = document.createElement('div');
      descArea.className = 'ik-job-desc-area';

      if (this.plainLanguageMode) {
        const plainSummary = this.getPlainLanguageSummary(job);
        const list = document.createElement('ul');
        list.className = 'ik-plain-summary-list';
        plainSummary.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          list.appendChild(li);
        });
        descArea.appendChild(list);
      } else {
        const p = document.createElement('p');
        p.className = 'ik-job-desc-text';
        p.textContent = job.description;
        descArea.appendChild(p);
      }

      card.appendChild(descArea);

      // Card Footer with "Apply" button
      const cardFooter = document.createElement('div');
      cardFooter.className = 'ik-job-card-footer';

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'ik-btn ik-btn-primary ik-apply-btn';
      applyBtn.textContent = t('apply', this.language);
      applyBtn.setAttribute('aria-describedby', title.id);

      applyBtn.addEventListener('click', () => {
        stopSpeaking();
        if (this.onApplyClick) {
          this.onApplyClick(job);
        } else {
          // Open job application flow in-place
          startJobApplication({
            container: this.container,
            job: job,
            learnerId: this.learnerId,
            language: this.language,
            isSimpleMode: this.isSimpleMode,
            onSuccess: () => this.init(),
            onCancel: () => this.render()
          });
        }
      });

      cardFooter.appendChild(applyBtn);
      card.appendChild(cardFooter);

      grid.appendChild(card);
    });

    container.appendChild(grid);
  }
    destroy() {
    clearTimeout(this.searchTimer);
    stopSpeaking();
  }
}

