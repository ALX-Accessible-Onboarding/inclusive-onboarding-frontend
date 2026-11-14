# Dev 1 handoff — frontend1

This working copy starts from the team's `frontend2` source archive and preserves Dev 2's existing modules. Dev 1 changes are limited to accessibility hardening, language metadata, responsive/reflow styles, and documentation.

## Files changed by Dev 1

- `src/mount.js`: normalizes the interface language to `en` or `am`, declares `lang` and `dir` on the mounted application root, gives the navigation landmark a localized accessible name, and uses `aria-current="page"` only on the active navigation button.
- `src/styles/ik-components.css`: adds scoped reflow safeguards, flexible navigation and option grids, 44px minimum button targets, mobile modal sizing, reduced-motion support, and forced-colors focus styling.
- `README.md`: documents the existing build, mount API, language behavior, and backend mock/live-mode boundary.
- `ACCESSIBILITY-TESTING.md`: provides the ALX judging-day manual and automated test checklist.

## Existing Dev 2 files preserved

The existing onboarding flow, question screen, step engine, validation, profile, career gateway, employer form, voice input, read-aloud, API client, package manifest, lockfile, and esbuild setup are retained. They were not rewritten by this handoff.

## Before merging into the team repository

1. Confirm with Dev 2 that this `frontend2` snapshot is still the latest source and ask her to review the Dev 1 diff.
2. Make sure `frontend1` is based on the same current project files before copying/merging. Do not overwrite newer teammate commits.
3. Resolve any conflicts in GitHub rather than replacing the whole repository blindly.
4. Install dependencies with `npm install`.
5. Run `npm test` and `npm run build`.
6. Test the real journey with keyboard only, NVDA, TalkBack inside the target WebView, 400% zoom, axe DevTools, and a co-designer.
7. Confirm Amharic wording with a fluent reviewer and verify the actual Amharic speech voice on target Android devices.

## Not claimed as complete

This handoff does not claim WCAG 2.2 AA conformance. Automated and manual assistive-technology testing must still be completed on the target browsers/devices. The existing Amharic translations are marked as draft in the source and require native-speaker review. Backend live integration also remains subject to Dev 3's confirmed API contract and authentication requirements.
