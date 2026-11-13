# Savanna Inclusive Access Kit — Demo Script & Verification Guide

This guide walks through the rehearsal and demonstration of all **Dev 2** deliverables (Profile, Career Gateway, JSON-LD, Employer Form, and wiring into the three frozen Savanna static pages).

---

## 1. Quick Verification & Build

Run the following commands in `inclusive-onboarding-frontend`:

```bash
# 1. Run unit tests verifying Dev 2 functionality
npm test

# 2. Build the production IIFE bundle
npm run build

# 3. Serve the local dev harness
npm run serve
# Or open index.html directly in your browser
```

---

## 2. Testing the Three Frozen Savanna Pages

The three pages are located in `Savanna-static-pages/pages/`:
1. `concept-with-navigation.html` (Curriculum navigation page)
2. `homepage-v1-paced.html` (Paced learner dashboard)
3. `homepage-v1-self-paced.html` (Self-paced learner dashboard)

### Rehearsal Steps:
1. Open any of the three pages in Chrome / Edge (e.g. `file:///C:/Users/HP/projects/Savanna-static-pages/pages/concept-with-navigation.html`).
2. Notice the **Accessible onboarding** button in the left sidebar navigation:
   - Icon: Universal Access (`fa-universal-access`) in high-contrast Savanna primary blue (`#0045f5`).
   - Accessible touch target (>44×44px).
3. Click **Accessible onboarding**:
   - The modal overlay dialog opens smoothly (`role="dialog"`, `aria-modal="true"`).
   - Focus is trapped accessibly inside the dialog; pressing <kbd>Esc</kbd> or clicking the backdrop closes it cleanly.

---

## 3. Demo Rehearsal Script

### A. Profile Page (Task D1 & D2)
1. **Navigate to "My Profile" tab**:
   - Displays learner data: Name, Contact information, and ID status.
   - **ID Status**: If no document number is on file, displays `+ Add my ID later` button. If referral route was selected, shows `Partner referral pending review` callout.
   - **Private Support Needs section**:
     - Prominently displays the `🔒 Private` badge with notice: *"Stored privately. No medical proof needed. Employers cannot view this information."*
     - Shows chips for active accommodations (e.g., `♿ Read to me`, `♿ More time`).
2. **Reusing the Question-Screen Engine for Edits (D2)**:
   - Click **Edit** next to Name:
     - Renders a focused single-question screen with heading, label, mic button, and input.
     - Click 🎤 **Speak answer** or type a new name.
     - Click **Save**; the profile updates and announces *"Field updated successfully!"* via `aria-live="polite"`.
   - Click **Edit** next to Support Needs:
     - Check/uncheck accommodations from the vocabulary.
     - Saves to the isolated support database (`/learners/:id/support`).

### B. Career Gateway & Support Filter (Task E1, E2, E5)
1. **Navigate to "Career Gateway" tab**:
   - Displays cards for open opportunities (Remote VA, Data Entry Assistant, Community Outreach, etc.).
2. **Client-Side Support Filter (E1 - Privacy Critical)**:
   - Under *"Support I need (filtered on your device)"*, click on accommodation chips:
     - E.g. Click **Read to me** or **Sign language**.
     - Notice the jobs list filters instantaneously on the client via set intersection.
     - **No network request is sent with the learner's disability/support choices**, preventing discrimination and preserving privacy.
3. **Read-Aloud Support (E2)**:
   - Click the 🔊 **Read to me** button on any job card.
   - The card highlights and reads aloud the title, employer, accommodations, and job description via `SpeechSynthesis`.
   - Click again to stop.
4. **Plain-Language Summary Toggle (E2)**:
   - Click **📖 Plain-language summary**.
   - The job description toggles into simplified, easy-to-read bullet points (work from home, training provided, key responsibilities, and accommodations).
5. **Schema.org JobPosting JSON-LD (E5 - Level 3 Win)**:
   - Inspect any job card element in Chrome DevTools:
   - Notice the `<script type="application/ld+json">` containing structured data with `@context: "https://schema.org/"`, `@type: "JobPosting"`, `title`, `description`, `hiringOrganization`, and `accessibilitySummary`.

### C. Job Application Flow (Task E3)
1. On any job card, click **Apply Now**:
   - Reuses the question-screen engine.
   - **Question 1**: "Why are you interested in this role?" (voice-enabled answer).
   - **Question 2**: "Request interview support (optional)" with checklist of accommodations (extra interview time, sign language interpreter, screen-reader materials).
   - Shows private callout: *"No medical proof needed. Handled privately with inclusive coordinators."*
2. Click **Submit**:
   - Stores application via `createApplication`.
   - Displays success confirmation card with next steps.

### D. Employer Job Posting Form (Task E4)
1. Click **Post a Job** (+ button in header):
   - Accessible form for inclusive employers to post opportunities.
   - Includes Title, Employer name, Description, and Accommodations checklist.
   - Validates fields with plain-language error alerts.
   - Submits to `createJob` and immediately makes the position available in the Career Gateway.

---

## 4. Accessibility Checklist Verified
- [x] All touch targets $\ge 44 \times 44\text{ px}$.
- [x] 3px high-contrast visible focus ring on all interactive elements.
- [x] Proper `<label for>`, `<fieldset>`, and `<legend>` associations.
- [x] `aria-live="polite"` on progress updates and search count announcements.
- [x] `role="alert"` on validation error messages.
- [x] Plain-language error handling.
- [x] Amharic & English bilingual support for all labels, buttons, and prompts.
- [x] Complete isolation of sensitive disability/support data from public employer views.
