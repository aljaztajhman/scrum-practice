import type { TrackId } from './tracks';

export type ModeId = 'practice' | 'mock' | 'drill' | 'infinite' | 'hardcore';

export interface ModeDef {
  id: ModeId;
  title: string;
  italic: string;
  desc: string;
  path: (trackId: TrackId) => string;
}

export const MODES: ModeDef[] = [
  {
    id: 'practice',
    title: 'Practice',
    italic: 'learn as you go',
    desc: 'Answer at your own pace. See the why after every question. Pick 10, 30, or the full 80.',
    path: (t) => `/practice/${t}`,
  },
  {
    id: 'mock',
    title: 'Mock exam',
    italic: 'the real thing',
    desc: 'Exam-faithful: 80 questions · 60 minutes · 85% to pass · no feedback until the end. Flag and review before submitting.',
    path: (t) => `/mock/${t}`,
  },
  {
    id: 'drill',
    title: 'Topic drill',
    italic: 'one area at a time',
    desc: 'Pick a topic — Accountabilities, Events, Artifacts, Scenarios — and grind it until you own it.',
    path: (t) => `/drill/${t}`,
  },
  {
    id: 'infinite',
    title: 'Infinite',
    italic: 'until you stop',
    desc: 'Endless shuffled stream. Running accuracy counter. Walk away whenever you want.',
    path: (t) => `/infinite/${t}`,
  },
  {
    id: 'hardcore',
    title: 'Hardcore',
    italic: 'ten questions that hurt',
    desc: 'Ten scenario-heavy questions where three of four options sound right. Tests judgment under competing Scrum principles, not memorization. For when you think you really know it.',
    path: (t) => `/hardcore/${t}`,
  },
];

export const MOCK_EXAM_DURATION_MS = 60 * 60 * 1000; // 60 minutes
export const MOCK_EXAM_QUESTION_COUNT = 80;
export const PASS_THRESHOLD_PCT = 85;
