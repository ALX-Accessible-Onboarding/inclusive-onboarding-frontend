/**
 * Task E5: JSON-LD <script type="application/ld+json"> with @type: JobPosting on each job card.
 * Enables search engine accessibility and indexing for inclusive employment.
 */
import { label } from '../labels.js';

export function createJobPostingJsonLd(job, lang = 'en') {
  const accommodationsText = (job.accommodations || [])
    .map(acc => label('accommodation', acc, lang))
    .join(', ');

  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    'title': job.title,
    'description': job.description + (accommodationsText ? `\nAccommodations provided: ${accommodationsText}` : ''),
    'datePosted': job.postedAt || new Date().toISOString(),
    'hiringOrganization': {
      '@type': 'Organization',
      'name': job.employer
    },
    'jobLocation': {
      '@type': 'Place',
      'address': {
        '@type': 'PostalAddress',
        'addressCountry': 'ET'
      }
    },
    'employmentType': 'FULL_TIME',
    'jobLocationType': 'TELECOMMUTE',
    'identifier': {
      '@type': 'PropertyValue',
      'name': job.employer,
      'value': job.id
    },
    'accessibilitySummary': accommodationsText || 'Inclusive employer'
  };
}

export function injectJobPostingJsonLd(container, job, lang = 'en') {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(createJobPostingJsonLd(job, lang), null, 2);
  container.appendChild(script);
  return script;
}
