import { getAllJobs } from '../api-client.js';
import { filterJobsBySupport } from './job-filter.js';
import { injectJobPostingJsonLd } from './jobposting-jsonld.js';
import { SUPPORT_NEEDS } from '../vocabulary.js';
import { label, t, getLocalizedJob } from '../labels.js';
import { speak, stopSpeaking, isSpeechSupported } from '../features/read-aloud.js';
import { startJobApplication } from '../flows/job-apply.js';
import { h, btn } from '../core/dom.js';

function formatCacheTime(ts, lang) {
  try {
    return new Date(ts).toLocaleTimeString(lang === 'am' ? 'am-ET' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return new Date(ts).toLocaleTimeString();
  }
}

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
    this.speakingJobId = null;
    this.loading = true;
    this.error = null;
    this.isOfflineCache = false;
    this.cachedTime = null;
    this._onlineBound = null;
  }

  async init() {
    this.loading = true;
    this.render();
    try {
      this.jobs = await getAllJobs();
      this.isOfflineCache = Boolean(this.jobs._fromCache);
      this.cachedTime = this.jobs._cachedTime || (this.isOfflineCache ? Date.now() : null);
      this.loading = false;
      this.error = null;
    } catch (err) {
      try {
        const raw = localStorage.getItem('ik_cached_jobs');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.jobs) && parsed.jobs.length > 0) {
            this.jobs = parsed.jobs;
            this.isOfflineCache = true;
            this.cachedTime = parsed.timestamp;
            this.loading = false;
            this.error = null;
            this.render();
            this.attachOnlineListener();
            return;
          }
        }
      } catch (e) {}

      this.loading = false;
      this.error = (err.errors && err.errors._) ? err.errors._ : t('loadError', this.language);
    }
    this.render();
    this.attachOnlineListener();
  }

  attachOnlineListener() {
    if (this._onlineBound) return;
    this._onlineBound = () => {
      if (this.isOfflineCache || this.error) this.init();
    };
    window.addEventListener('online', this._onlineBound);
  }

  getFilteredJobs() {
    let result = filterJobsBySupport(this.jobs, this.selectedNeeds);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(j => {
        const loc = getLocalizedJob(j, this.language);
        return (
          (loc.title && loc.title.toLowerCase().includes(q)) ||
          (loc.employer && loc.employer.toLowerCase().includes(q)) ||
          (loc.description && loc.description.toLowerCase().includes(q)) ||
          (j.title && j.title.toLowerCase().includes(q)) ||
          (j.employer && j.employer.toLowerCase().includes(q)) ||
          (j.description && j.description.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }

  getPlainLanguageSummary(job) {
    const isAm = this.language === 'am' || String(this.language).startsWith('am');
    const loc = getLocalizedJob(job, this.language);

    if (Array.isArray(job.plainSummary) && job.plainSummary.length) return job.plainSummary;
    if (typeof job.plainSummary === 'string' && job.plainSummary.trim()) return [job.plainSummary.trim()];

    const lines = [];
    const desc = ((job.description || '') + ' ' + (loc.description || '')).toLowerCase();

    if (desc.includes('home') || desc.includes('remote') || desc.includes('ከቤት') || desc.includes('ርቀት')) {
      lines.push('🏠 ' + t('workFromHome', this.language));
    }
    if (desc.includes('training') || desc.includes('ስልጠና')) {
      lines.push('📚 ' + t('trainingProvided', this.language));
    }

    const sentences = (loc.description || '').split(/[.።\n]/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) lines.push('📌 ' + sentences[0].trim() + (isAm ? '።' : '.'));

    if (job.accommodations && job.accommodations.length) {
      const accs = job.accommodations.map(a => label('accommodation', a, this.language)).join(isAm ? '፣ ' : ', ');
      lines.push('♿ ' + t('accommodationsAvailable', this.language) + ' ' + accs);
    }
    return lines;
  }

  render() {
    this.container.textContent = '';
    const root = h('div', 'ik-career-gateway');

    const header = h('div', 'ik-gateway-header', null, [
      h('div', 'ik-gateway-title-group', null, [
        h('h2', 'ik-gateway-title', t('career', this.language)),
        h('p', 'ik-gateway-subtitle', this.language === 'am'
          ? 'አካታች የስራ እድሎችን ያግኙ። ድጋፍን ለመምረጥ የሚጠቀሙት ማጣሪያ በመሳሪያዎ ላይ ብቻ የሚቀመጥ ሲሆን ሚስጥራዊነቱ የተጠበቀ ነው።'
          : 'Find jobs with accommodations built-in. Filtering by your needed support stays on your device and is never shared.')
      ]),
      this.onPostJobClick ? h('div', 'ik-gateway-header-actions', null, [
        btn('ik-btn ik-btn-secondary ik-btn-post-job', '+ ' + t('employer', this.language), this.onPostJobClick)
      ]) : null
    ]);
    root.appendChild(header);

    if (this.isOfflineCache && this.cachedTime) {
      const banner = h('div', 'ik-alert ik-offline-cache-banner', `📁 ${t('showingSavedJobs', this.language)} ${formatCacheTime(this.cachedTime, this.language)} (${t('offlineNotice', this.language)})`);
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      root.appendChild(banner);
    }

    // Filter Bar
    const filterSection = h('section', 'ik-filter-section');
    filterSection.setAttribute('aria-label', t('filterBySupport', this.language));

    const fHeader = h('div', 'ik-filter-heading-row', null, [
      h('h2', 'ik-filter-heading', null, [h('span', null, '🛡️ '), document.createTextNode(t('filterBySupport', this.language))]),
      h('span', 'ik-badge ik-badge-private', t('privateBadge', this.language))
    ]);
    filterSection.appendChild(fHeader);

    const filterChips = h('div', 'ik-filter-chips');

    const clearBtn = btn('ik-btn ik-btn-link ik-clear-filter-btn', t('clearFilters', this.language), () => {
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
    clearBtn.hidden = this.selectedNeeds.length === 0;

    SUPPORT_NEEDS.forEach(need => {
      const isSelected = this.selectedNeeds.includes(need);
      const iconSpan = h('span', 'ik-chip-icon', isSelected ? '✓' : '+');
      iconSpan.setAttribute('aria-hidden', 'true');

      const chip = btn('ik-filter-chip' + (isSelected ? ' ik-chip-active' : ''), null, () => {
        if (this.selectedNeeds.includes(need)) {
          this.selectedNeeds = this.selectedNeeds.filter(n => n !== need);
        } else {
          this.selectedNeeds.push(need);
        }
        const active = this.selectedNeeds.includes(need);
        chip.classList.toggle('ik-chip-active', active);
        chip.setAttribute('aria-pressed', active ? 'true' : 'false');
        iconSpan.textContent = active ? '✓' : '+';
        clearBtn.hidden = this.selectedNeeds.length === 0;
        this.currentPage = 1;
        this.updateJobList(root);
      });
      chip.setAttribute('data-need', need);
      chip.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      chip.appendChild(iconSpan);
      chip.appendChild(document.createTextNode(' ' + label('support', need, this.language)));
      filterChips.appendChild(chip);
    });

    filterChips.appendChild(clearBtn);
    filterSection.appendChild(filterChips);
    root.appendChild(filterSection);

    // Controls Row
    const searchInput = h('input', 'ik-input ik-search-input');
    searchInput.type = 'search';
    searchInput.placeholder = this.language === 'am' ? 'ስራዎችን በስም ወይም በድርጅት ፈልግ...' : 'Search jobs by title or company...';
    searchInput.value = this.searchQuery;
    searchInput.setAttribute('aria-label', searchInput.placeholder);
    searchInput.addEventListener('input', e => {
      this.searchQuery = e.target.value;
      this.currentPage = 1;
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.updateJobList(root), 250);
    });

    const plainTextSpan = h('span', null, this.plainLanguageMode ? t('standardView', this.language) : t('plainLanguageSummary', this.language));
    const plainBtn = btn('ik-btn ik-btn-secondary ik-plain-toggle-btn' + (this.plainLanguageMode ? ' ik-active' : ''), null, () => {
      this.plainLanguageMode = !this.plainLanguageMode;
      plainBtn.classList.toggle('ik-active', this.plainLanguageMode);
      plainBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
      plainTextSpan.textContent = this.plainLanguageMode ? t('standardView', this.language) : t('plainLanguageSummary', this.language);
      this.updateJobList(root);
    });
    plainBtn.setAttribute('aria-pressed', this.plainLanguageMode ? 'true' : 'false');
    plainBtn.appendChild(h('span', null, '📖 '));
    plainBtn.appendChild(plainTextSpan);

    root.appendChild(h('div', 'ik-controls-row', null, [searchInput, plainBtn]));

    const listContainer = h('div', 'ik-job-list-container');
    root.appendChild(listContainer);

    this.container.appendChild(root);
    this.updateJobList(root);
  }

  updateJobList(root) {
    const container = root.querySelector('.ik-job-list-container');
    if (!container) return;
    container.textContent = '';

    if (this.loading) {
      const loadDiv = h('div', 'ik-loading-indicator', null, [
        h('div', 'ik-spinner'),
        h('p', null, this.language === 'am' ? 'ተደራሽ የስራ እድሎችን በመጫን ላይ...' : 'Loading accessible opportunities...')
      ]);
      loadDiv.setAttribute('role', 'status');
      container.appendChild(loadDiv);
      return;
    }

    if (this.error) {
      const errCard = h('div', 'ik-error-card', null, [
        h('p', 'ik-error-msg', '⚠️ ' + this.error),
        btn('ik-btn ik-btn-secondary ik-retry-btn', this.language === 'am' ? 'እንደገና ሞክር' : 'Retry', () => this.init())
      ]);
      errCard.setAttribute('role', 'alert');
      container.appendChild(errCard);
      return;
    }

    const filtered = this.getFilteredJobs();
    const isAm = this.language === 'am' || String(this.language).startsWith('am');
    const totalJobs = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalJobs / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalJobs);
    const pageJobs = filtered.slice(startIndex, endIndex);

    const countBar = h('div', 'ik-results-count-bar', null, [
      h('p', 'ik-results-count', totalJobs > this.pageSize
        ? (isAm ? `${startIndex + 1}–${endIndex} ከ ${totalJobs} (ገጽ ${this.currentPage}/${totalPages})` : `Showing ${startIndex + 1}–${endIndex} of ${totalJobs} (Page ${this.currentPage}/${totalPages})`)
        : (isAm ? `${totalJobs} ስራዎች ተገኝተዋል` : `${totalJobs} jobs available`))
    ]);
    countBar.setAttribute('aria-live', 'polite');
    container.appendChild(countBar);

    if (filtered.length === 0) {
      const empty = h('div', 'ik-empty-state-card', null, [
        h('p', 'ik-empty-icon', '🔍'),
        h('p', 'ik-empty-text', t('noJobsFound', this.language)),
        btn('ik-btn ik-btn-secondary ik-reset-filter-btn', isAm ? 'ሁሉንም ስራዎች አሳይ' : 'Show all jobs without filter', () => {
          this.selectedNeeds = [];
          this.searchQuery = '';
          this.render();
        })
      ]);
      container.appendChild(empty);
      return;
    }

    const grid = h('div', 'ik-jobs-grid');

    pageJobs.forEach(job => {
      const loc = getLocalizedJob(job, this.language);
      const card = h('article', 'ik-job-card');
      card.setAttribute('data-job-id', job.id);
      injectJobPostingJsonLd(card, loc, this.language);

      const h3 = h('h3', 'ik-job-title', loc.title);
      h3.id = `ik_job_title_${job.id}`;
      const titleGroup = h('div', 'ik-job-title-group', null, [h3, h('p', 'ik-job-employer', loc.employer)]);

      let readBtn = null;
      if (isSpeechSupported()) {
        const readLabel = h('span', 'ik-btn-label', this.speakingJobId === job.id ? t('stopReading', this.language) : t('readAloud', this.language));
        readBtn = btn('ik-btn ik-btn-icon ik-job-read-btn' + (this.speakingJobId === job.id ? ' ik-speaking' : ''), null, () => {
          if (this.speakingJobId === job.id) {
            stopSpeaking();
            this.speakingJobId = null;
            readBtn.classList.remove('ik-speaking');
            readLabel.textContent = t('readAloud', this.language);
          } else {
            stopSpeaking();
            this.speakingJobId = job.id;
            grid.querySelectorAll('.ik-job-read-btn').forEach(b => {
              b.classList.remove('ik-speaking');
              const l = b.querySelector('.ik-btn-label');
              if (l) l.textContent = t('readAloud', this.language);
            });
            readBtn.classList.add('ik-speaking');
            readLabel.textContent = t('stopReading', this.language);

            const speechText = isAm
              ? `${loc.title} በ ${loc.employer}። የሥራው ዝርዝር፡ ${loc.description}`
              : `${loc.title} at ${loc.employer}. Description: ${loc.description}`;

            speak(speechText, {
              language: this.language,
              onEnd: () => {
                this.speakingJobId = null;
                readBtn.classList.remove('ik-speaking');
                readLabel.textContent = t('readAloud', this.language);
              }
            });
          }
        });
        readBtn.setAttribute('aria-label', `${t('readAloud', this.language)}: ${loc.title}`);
        readBtn.appendChild(h('span', null, '🔊 '));
        readBtn.appendChild(readLabel);
      }

      card.appendChild(h('div', 'ik-job-card-header', null, [titleGroup, readBtn]));

      if (job.accommodations && job.accommodations.length) {
        const ulAcc = h('ul', 'ik-job-accommodations', null, job.accommodations.map(a =>
          h('li', 'ik-badge ik-badge-accommodation', '✓ ' + label('accommodation', a, this.language))
        ));
        ulAcc.setAttribute('role', 'list');
        card.appendChild(ulAcc);
      }

      let descChild = null;
      if (this.plainLanguageMode) {
        const sum = this.getPlainLanguageSummary(loc);
        descChild = h('ul', 'ik-plain-summary-list', null, sum.map(s => h('li', null, s)));
      } else {
        descChild = h('p', 'ik-job-desc-text', loc.description || '');
      }
      card.appendChild(h('div', 'ik-job-desc-area', null, [descChild]));

      const applyBtn = btn('ik-btn ik-btn-primary ik-apply-btn', t('apply', this.language), () => {
        stopSpeaking();
        if (this.onApplyClick) this.onApplyClick(job);
        else {
          startJobApplication({
            container: this.container,
            job: loc,
            learnerId: this.learnerId,
            language: this.language,
            isSimpleMode: this.isSimpleMode,
            onSuccess: () => this.init(),
            onCancel: () => this.render()
          });
        }
      });
      applyBtn.setAttribute('aria-describedby', `ik_job_title_${job.id}`);
      card.appendChild(h('div', 'ik-job-card-footer', null, [applyBtn]));

      grid.appendChild(card);
    });

    container.appendChild(grid);

    // Pagination
    if (totalPages > 1) {
      const nav = h('nav', 'ik-pagination');
      nav.setAttribute('aria-label', isAm ? 'የስራ ገጾች ማውጫ' : 'Jobs pagination');

      const goToPage = (p) => {
        this.currentPage = p;
        this.updateJobList(root);
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };

      const prev = btn('ik-btn ik-btn-secondary ik-pagination-prev', '← ' + (isAm ? 'ቀዳሚ' : 'Previous'), () => {
        if (this.currentPage > 1) goToPage(this.currentPage - 1);
      });
      prev.disabled = this.currentPage === 1;
      prev.setAttribute('aria-disabled', this.currentPage === 1 ? 'true' : 'false');
      if (this.currentPage === 1) prev.title = t('disabledReasonFirstPage', this.language);
      nav.appendChild(prev);

      const pages = h('div', 'ik-pagination-pages');
      for (let p = 1; p <= totalPages; p++) {
        const isCur = p === this.currentPage;
        const pBtn = btn('ik-btn ik-pagination-number' + (isCur ? ' ik-page-active' : ''), String(p), () => {
          if (this.currentPage !== p) goToPage(p);
        });
        pBtn.setAttribute('aria-label', isAm ? `ገጽ ${p}` : `Page ${p}`);
        if (isCur) pBtn.setAttribute('aria-current', 'page');
        pages.appendChild(pBtn);
      }
      nav.appendChild(pages);

      const next = btn('ik-btn ik-btn-secondary ik-pagination-next', (isAm ? 'ቀጣይ' : 'Next') + ' →', () => {
        if (this.currentPage < totalPages) goToPage(this.currentPage + 1);
      });
      next.disabled = this.currentPage === totalPages;
      next.setAttribute('aria-disabled', this.currentPage === totalPages ? 'true' : 'false');
      if (this.currentPage === totalPages) next.title = t('disabledReasonLastPage', this.language);
      nav.appendChild(next);

      container.appendChild(nav);
    }
  }

  destroy() {
    if (this._onlineBound) window.removeEventListener('online', this._onlineBound);
    clearTimeout(this.searchTimer);
    stopSpeaking();
  }
}
