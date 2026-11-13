/**
 * Inclusive Access Kit
 * Entry point bundled by esbuild into dist/inclusive-kit.js
 */

export const version = '0.0.1';

export { mount, unmount, openModal, closeModal, InclusiveKitInstance } from './mount.js';

import * as api from './api-client.js';
import * as vocabulary from './vocabulary.js';
import * as labels from './labels.js';
import * as readAloud from './features/read-aloud.js';
import * as voiceInput from './features/voice-input.js';
import * as jobFilter from './career/job-filter.js';
import * as jobPostingJsonLd from './career/jobposting-jsonld.js';
import { CareerGateway } from './career/job-list.js';
import { LearnerProfile } from './flows/profile.js';
import { startJobApplication } from './flows/job-apply.js';
import { renderEmployerForm } from './flows/employer-form.js';
import { startOnboardingFlow } from './flows/onboarding.js';
import { QuestionScreen } from './core/question-screen.js';
import { StepEngine } from './core/step-engine.js';

export {
  api,
  vocabulary,
  labels,
  readAloud,
  voiceInput,
  jobFilter,
  jobPostingJsonLd,
  CareerGateway,
  LearnerProfile,
  startJobApplication,
  renderEmployerForm,
  startOnboardingFlow,
  QuestionScreen,
  StepEngine
};
