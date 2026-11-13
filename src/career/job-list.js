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
      this.error = err.errors && err.errors._ ? err.errors._ : 'Could not load jobs.';
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
    // Generate simple, structured bullet points from description
    const lines = [];
    if (job.description.toLowerCase().includes('home') || job.description.toLowerCase().includes('remote')) {
      lines.push(this.language === 'am' ? '🏠 ስራው ከቤት የሚሰራ ነው (Remote)' : '🏠 Work from home (Remote).');
    }
    if (job.description.toLowerCase().includes('training')) {
      lines.push(this.language === 'am' ? '📚 ስልጠና ይሰጣል' : '📚 Training is provided.');
    }
    // Extract first two sentences
    const sentences = job.description.split('.').filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      lines.push('📌 ' + sentences[0].trim() + '.');
    }
    if (job.accommodations && job.accommodations.length > 0) {
      const accLabels = job.accommodations.map(a => label('accommodation', a, this.language)).join(', ');
      lines.push(this.language === 'am' ? '♿ የተዘጋጁ ድጋፎች፡ ' + accLabels : '♿ Accommodations available: ' + accLabels);
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
        <h1 class="ik-gateway-title">${t('career', this.language)}</h1>
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

    SUPPORT_NEEDS.forEach(need => {
      const isSelected = this.selectedNeeds.includes(need);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ik-filter-chip ' + (isSelected ? 'ik-chip-active' : '');
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      chip.innerHTML = `
        <span class="ik-chip-icon" aria-hidden="true">${isSelected ? '✓' : '+'}</span>
        <span class="ik-chip-text">${label('support', need, this.language)}</span>
      `;

      chip.addEventListener('click', () => {
        if (this.selectedNeeds.includes(need)) {
          this.selectedNeeds = this.selectedNeeds.filter(n => n !== need);
        } else {
          this.selectedNeeds.push(need);
        }
        this.render();
      });

      filterChips.appendChild(chip);
    });

    if (this.selectedNeeds.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'ik-btn ik-btn-link ik-clear-filter-btn';
      clearBtn.textContent = this.language === 'am' ? 'ሁሉንም ማጣሪያዎች አጽዳ' : 'Clear all filters';
      clearBtn.addEventListener('click', () => {
        this.selectedNeeds = [];
        this.render();
      });
      filterChips.appendChild(clearBtn);
    }

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
      this.updateJobList(root);
    });
    controlsRow.appendChild(searchInput);

    // Plain Language Toggle
    const plainToggleBtn = document.createElement('button');
    plainToggleBtn.type = 'button';
    plainToggleBtn.className = 'ik-btn ik-btn-secondary ik-plain-toggle-btn ' + (this.plainLanguageMode ? 'ik-active' : '');
    plainToggleBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
    plainToggleBtn.innerHTML = `
      <span aria-hidden="true">📖</span>
      <span>${this.plainLanguageMode ? t('standardView', this.language) : t('plainLanguageSummary', this.language)}</span>
    `;
    plainToggleBtn.addEventListener('click', () => {
      this.plainLanguageMode = !this.plainLanguageMode;
      this.render();
    });
    controlsRow.appendChild(plainToggleBtn);

    root.appendChild(controlsRow);

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
      container.innerHTML = `
        <div class="ik-loading-indicator" role="status">
          <div class="ik-spinner"></div>
          <p>Loading accessible opportunities...</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="ik-error-card" role="alert">
          <p class="ik-error-msg">${this.error}</p>
          <button type="button" class="ik-btn ik-btn-secondary ik-retry-btn">Retry</button>
        </div>
      `;
      container.querySelector('.ik-retry-btn').addEventListener('click', () => this.init());
      return;
    }

    const filtered = this.getFilteredJobs();

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
        const accContainer = document.createElement('div');
        accContainer.className = 'ik-job-accommodations';
        accContainer.setAttribute('aria-label', 'Accommodations provided for this role');

        job.accommodations.forEach(acc => {
          const badge = document.createElement('span');
          badge.className = 'ik-badge ik-badge-accommodation';
          badge.textContent = '✓ ' + label('accommodation', acc, this.language);
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
      applyBtn.setAttribute('aria-label', `${t('apply', this.language)} for ${job.title} at ${job.employer}`);

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
}
