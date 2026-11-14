# Accessibility testing checklist — ALX judging gate

Target: WCAG 2.2 AA. This checklist is a test plan, not a declaration of conformance.

## Automated

- [ ] Run axe DevTools on each main view and resolve all serious/critical findings.
- [ ] Run Lighthouse accessibility checks and investigate reported failures.
- [ ] Re-run after fixes; retain the report or screenshots for the team.

## Keyboard only

- [ ] Complete welcome, onboarding, profile, career/job list and application flows without a pointer.
- [ ] Tab and Shift+Tab follow a logical order.
- [ ] Every interactive control has a visible focus indicator.
- [ ] Enter/Space activate native buttons and controls.
- [ ] Dialogs can be closed with Escape and focus is not lost behind an open dialog.
- [ ] No keyboard trap exists.

## Screen readers

- [ ] NVDA: complete the main learner journey; use Tab, H (headings), and F (form controls).
- [ ] Every field and button has an accessible name.
- [ ] Validation errors are announced and associated with their fields.
- [ ] Progress and success updates are announced without unexpectedly moving focus.
- [ ] TalkBack: repeat the journey inside the actual Android WebView.
- [ ] Verify Amharic content is declared with `lang="am"` and test an Amharic speech voice where the device provides one.

## Visual and responsive

- [ ] At 400% browser zoom, content reflows without horizontal page scrolling for ordinary content.
- [ ] Text can be enlarged without clipping or overlap.
- [ ] Contrast meets WCAG 2.2 AA for text, controls, and focus indicators.
- [ ] Controls have at least 44×44 CSS-pixel touch targets where practical; no essential action is too small.
- [ ] Reduced-motion preference is respected.
- [ ] Forced-colors/high-contrast mode keeps controls and focus visible.

## Media and timing

- [ ] Every instructional video has captions and a transcript.
- [ ] Any time limit can be extended, adjusted, or turned off unless essential.
- [ ] No CAPTCHA/login puzzle is the only way to authenticate.

## Co-design

- [ ] Test with a person with a disability and record barriers and fixes.
- [ ] Re-test the changed journey after co-design feedback.

## Language

- [ ] English and Amharic strings are reviewed for accuracy and consistency.
- [ ] The correct `lang` attribute is applied to dynamically changed language content.
- [ ] Voice input/read-aloud support is advertised only for languages/devices where it has been tested; typing remains available.
