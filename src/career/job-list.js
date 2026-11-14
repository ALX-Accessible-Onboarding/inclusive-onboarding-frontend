import { getAllJobs } from '../api-client.js';
import { filterJobsBySupport } from './job-filter.js';
import { injectJobPostingJsonLd } from './jobposting-jsonld.js';
import { SUPPORT_NEEDS } from '../vocabulary.js';
import { label, t, getLocalizedJob } from '../labels.js';
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
    this.pageSize = options.pageSize || 5;
    this.currentPage = 1;

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
      result = result.filter(j => {
        const localized = getLocalizedJob(j, this.language);
        return (
          (localized.title && localized.title.toLowerCase().includes(q)) ||
          (localized.employer && localized.employer.toLowerCase().includes(q)) ||
          (localized.description && localized.description.toLowerCase().includes(q)) ||
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.employer && j.employer.toLowerCase().includes(q)) ||
          (j.description && j.description.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }

  getPlainLanguageSummary(job) {
    const isAm = this.language === 'am' || (typeof this.language === 'string' && this.language.startsWith('am'));
    const localized = getLocalizedJob(job, this.language);

    // Prefer a summary written by the employer/backend.
    if (Array.isArray(job.plainSummary) && job.plainSummary.length) return job.plainSummary;
    if (typeof job.plainSummary === 'string' && job.plainSummary.trim()) return [job.plainSummary.trim()];

    const lines = [];
    const origDesc = (job.description || '').toLowerCase();
    const locDesc = (localized.description || '').toLowerCase();

    if (origDesc.includes('home') || origDesc.includes('remote') || locDesc.includes('ከቤት') || locDesc.includes('ርቀት')) {
      lines.push(isAm ? '🏠 ሥራው ከቤት የሚሰራ ነው (የርቀት ሥራ)።' : '🏠 Work from home (Remote).');
    }
    if (origDesc.includes('training') || locDesc.includes('ስልጠና')) {
      lines.push(isAm ? '📚 ስልጠና ይሰጣል።' : '📚 Training is provided.');
    }

    const sentences = (localized.description || '').split(/[.።\n]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      lines.push('📌 ' + sentences[0].trim() + (isAm ? '።' : '.'));
    }

    if (job.accommodations && job.accommodations.length) {
      const accLabels = job.accommodations.map(a => label('accommodation', a, this.language)).join(isAm ? '፣ ' : ', ');
      lines.push((isAm ? '♿ የተዘጋጁ ድጋፎች፡ ' : '♿ Accommodations available: ') + accLabels);
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
        // Update this chip in place so keyboard focus is not destroyed
        const active = this.selectedNeeds.includes(need);
        chip.classList.toggle('ik-chip-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        icon.textContent = active ? '✓' : '+';
        clearBtn.hidden = this.selectedNeeds.length === 0;
        this.currentPage = 1;
        this.updateJobList(root);
      });

      filterChips.appendChild(chip);
    });

    clearBtn.addEventListener('click', () => {
      this.selectedNeeds = [];
      filterChips.querySelectorAll('.ik-filter-chip').forEach(c => {
        c.classList.remove('ik-chip-active');
        c.setAttribute('aria-pressed', 'false');
        const icon = c.querySelector('.ik-chip-icon');
        if (icon) icon.textContent = '+';
      });
      clearBtn.hidden = true;
      this.currentPage = 1;
      this.updateJobList(root);
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
      this.currentPage = 1;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.updateJobList(root), 250);
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
      plainToggleBtn.classList.toggle('ik-active', this.plainLanguageMode);
      plainToggleBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
      plainToggleBtn.querySelector('span:last-child').textContent =
        this.plainLanguageMode ? t('standardView', this.language) : t('plainLanguageSummary', this.language);
      this.updateJobList(root);
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
          <p>${this.language === 'am' ? 'ተደራሽ የስራ እድሎችን በመጫን ላይ...' : 'Loading accessible opportunities...'}</p>
        </div>
      `;
      return;
    }

    if (this.error) {
      container.innerHTML = `
        <div class="ik-error-card" role="alert">
          <p class="ik-error-msg">${this.error}</p>
          <button type="button" class="ik-btn ik-btn-secondary ik-retry-btn">${this.language === 'am' ? 'እንደገና ሞክር' : 'Retry'}</button>
        </div>
      `;
      container.querySelector('.ik-retry-btn').addEventListener('click', () => this.init());
      return;
    }

    const filtered = this.getFilteredJobs();
    const isAm = this.language === 'am' || (typeof this.language === 'string' && this.language.startsWith('am'));
    const totalJobs = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalJobs / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalJobs);
    const pageJobs = filtered.slice(startIndex, endIndex);

    // Results count bar
    const countBar = document.createElement('div');
    countBar.className = 'ik-results-count-bar';
    countBar.setAttribute('aria-live', 'polite');
    const countInfo = totalJobs > this.pageSize
      ? (isAm
        ? `ከ <strong>${totalJobs}</strong> ስራዎች ውስጥ ከ <strong>${startIndex + 1}–${endIndex}</strong> በማሳየት ላይ (ገጽ ${this.currentPage} ከ ${totalPages})`
        : `Showing <strong>${startIndex + 1}–${endIndex}</strong> of <strong>${totalJobs}</strong> accessible positions (Page ${this.currentPage} of ${totalPages})`)
      : (isAm
        ? `<strong>${totalJobs}</strong> የሚስማሙ የስራ እድሎች ተገኝተዋል`
        : `<strong>${totalJobs}</strong> accessible positions match your selection`);
    countBar.innerHTML = `<p class="ik-results-count">${countInfo}</p>`;
    container.appendChild(countBar);

    if (filtered.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'ik-empty-state-card';
      emptyState.innerHTML = `
        <p class="ik-empty-icon" aria-hidden="true">🔍</p>
        <p class="ik-empty-text">${t('noJobsFound', this.language)}</p>
        <button type="button" class="ik-btn ik-btn-secondary ik-reset-filter-btn">
          ${isAm ? 'ሁሉንም ስራዎች አሳይ' : 'Show all jobs without filter'}
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

    pageJobs.forEach(job => {
      // Localize job content according to active language (Amharic or English)
      const localizedJob = getLocalizedJob(job, this.language);

      const card = document.createElement('article');
      card.className = 'ik-job-card';
      card.setAttribute('data-job-id', job.id);

      // Task E5: Inject Schema.org JobPosting JSON-LD
      injectJobPostingJsonLd(card, localizedJob, this.language);

      // Card Header
      const cardHeader = document.createElement('div');
      cardHeader.className = 'ik-job-card-header';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'ik-job-title-group';

      const title = document.createElement('h3');
      title.id = 'ik_job_title_' + job.id;
      title.className = 'ik-job-title';
      title.textContent = localizedJob.title;
      titleGroup.appendChild(title);

      const employer = document.createElement('p');
      employer.className = 'ik-job-employer';
      employer.textContent = localizedJob.employer;
      titleGroup.appendChild(employer);

      cardHeader.appendChild(titleGroup);

      // Task E2: Read-aloud button per job card with strict language consistency
      if (isSpeechSupported()) {
        const readBtn = document.createElement('button');
        readBtn.type = 'button';
        readBtn.className = 'ik-btn ik-btn-icon ik-job-read-btn ' + (this.currentlySpeakingJobId === job.id ? 'ik-speaking' : '');
        readBtn.setAttribute('aria-label', `${t('readAloud', this.language)}: ${localizedJob.title} ${t('at', this.language)} ${localizedJob.employer}`);
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

            // Construct spoken text ENTIRELY in the target language (Amharic or English)
            let speechText;
            if (isAm) {
              const accText = (job.accommodations || []).map(a => label('accommodation', a, 'am')).join('፣ ');
              const desc = this.plainLanguageMode
                ? this.getPlainLanguageSummary(localizedJob).join('። ')
                : localizedJob.description;
              speechText = `${localizedJob.title} በ ${localizedJob.employer}። ${accText ? `የተዘጋጁ ድጋፎች፡ ${accText}። ` : ''}የሥራው ዝርዝር፡ ${desc}`;
            } else {
              const accText = (job.accommodations || []).map(a => label('accommodation', a, 'en')).join(', ');
              const desc = this.plainLanguageMode
                ? this.getPlainLanguageSummary(localizedJob).join('. ')
                : localizedJob.description;
              speechText = `${localizedJob.title} at ${localizedJob.employer}. ${accText ? `Accommodations provided: ${accText}. ` : ''}Description: ${desc}`;
            }

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
        const plainSummary = this.getPlainLanguageSummary(localizedJob);
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
        p.textContent = localizedJob.description;
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
            job: localizedJob,
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

    // Pagination Controls
    if (totalPages > 1) {
      const paginationNav = document.createElement('nav');
      paginationNav.className = 'ik-pagination';
      paginationNav.setAttribute('aria-label', isAm ? 'የስራ ገጾች ማውጫ' : 'Jobs pagination');

      // Previous page button
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'ik-btn ik-btn-secondary ik-pagination-prev';
      prevBtn.disabled = this.currentPage === 1;
      prevBtn.setAttribute('aria-disabled', this.currentPage === 1 ? 'true' : 'false');
      prevBtn.innerHTML = `← <span>${isAm ? 'ቀዳሚ' : 'Previous'}</span>`;
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.updateJobList(root);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      paginationNav.appendChild(prevBtn);

      // Page numbers
      const pagesList = document.createElement('div');
      pagesList.className = 'ik-pagination-pages';

      for (let p = 1; p <= totalPages; p++) {
        const isCurrent = p === this.currentPage;
        const pageBtn = document.createElement('button');
        pageBtn.type = 'button';
        pageBtn.className = 'ik-btn ik-pagination-number' + (isCurrent ? ' ik-page-active' : '');
        pageBtn.textContent = String(p);
        pageBtn.setAttribute('aria-label', isAm ? `ገጽ ${p}` : `Page ${p}`);
        if (isCurrent) {
          pageBtn.setAttribute('aria-current', 'page');
        }
        pageBtn.addEventListener('click', () => {
          if (this.currentPage !== p) {
            this.currentPage = p;
            this.updateJobList(root);
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        pagesList.appendChild(pageBtn);
      }
      paginationNav.appendChild(pagesList);

      // Next page button
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'ik-btn ik-btn-secondary ik-pagination-next';
      nextBtn.disabled = this.currentPage === totalPages;
      nextBtn.setAttribute('aria-disabled', this.currentPage === totalPages ? 'true' : 'false');
      nextBtn.innerHTML = `<span>${isAm ? 'ቀጣይ' : 'Next'}</span> →`;
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.updateJobList(root);
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      paginationNav.appendChild(nextBtn);

      container.appendChild(paginationNav);
    }
  }

  destroy() {
    clearTimeout(this.searchTimer);
    stopSpeaking();
  }
}
