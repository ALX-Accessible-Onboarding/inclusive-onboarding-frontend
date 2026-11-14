# ALX Accessible Onboarding Frontend

Reusable learner onboarding, profile management and career gateway for ALX Hackathon Track 1.

## Project rules

- Vanilla JavaScript (ES2019) bundled with the existing esbuild configuration.
- Do not replace the team's package manifest or build setup.
- Keep styles scoped to `#inclusive-kit`, `#inclusive-kit-mount` or `.ik-` selectors.
- Supported interface languages: English (`en`) and Amharic (`am`).
- The Savanna static-pages repository is a host/design reference; this repository contains the integration kit.

## Local development

```bash
npm install
npm run build
npm test
```

Open `index.html` through a local static server. The build writes `dist/inclusive-kit.js` and `dist/ik-base.css`.

## Mounting

```html
<div id="inclusive-kit-mount"></div>
<script src="dist/inclusive-kit.js"></script>
<script>
  InclusiveKit.mount({
    element: '#inclusive-kit-mount',
    language: 'en',
    theme: 'default',
    initialView: 'onboarding'
  });
</script>
```

The mount root declares `lang="en"` or `lang="am"` for assistive technology. The kit does not set the language of the surrounding Savanna page.

## Backend integration

The API client currently defaults to mock mode for safe local development. Before a live integration test, the team must configure the API client with `mode: 'live'` and the backend's API base URL, then confirm request/response schemas with the backend developer. Do not put secrets or private tokens in browser code. See the backend's Swagger page for the current contract.

## Accessibility

See [ACCESSIBILITY-TESTING.md](./ACCESSIBILITY-TESTING.md) for the keyboard, NVDA, TalkBack, 400% zoom and automated test checklist. WCAG 2.2 AA is the target; this README does not claim conformance until manual and co-design testing is complete.
