import type { TrackId } from './tracks';

export type ModeId = 'practice' | 'mock' | 'infinite' | 'ai' | 'open';

export interface ModeDef {
  id: ModeId;
  title: string;
  italic: string;
  desc: string;
  path: (trackId: TrackId) => string;
  proOnly?: boolean;
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
    id: 'infinite',
    title: 'Infinite',
    italic: 'until you stop',
    desc: 'Endless shuffled stream from the question bank. Running accuracy counter. Walk away whenever you want.',
    path: (t) => `/infinite/${t}`,
  },
  {
    id: 'ai',
    title: 'AI mode',
    italic: 'a different angle',
    desc: 'Live-generated questions that flip the test on its head — first-principles, find-the-flaw, steel-manning, counterfactuals. Not exam-style. Designed to harden understanding by attacking it from angles practice never does.',
    path: (t) => `/ai/${t}`,
    proOnly: true,
  },
  {
    id: 'open',
    title: 'Open response',
    italic: 'free-form recall',
    desc: 'No options. Type your answer in your own words. AI grades it against the Scrum Guide. Active recall — the hardest and most effective way to study.',
    path: (t) => `/open/${t}`,
    proOnly: true,
  },
];

export const MOCK_EXAM_DURATION_MS = 60 * 60 * 1000;
export const MOCK_EXAM_QUESTION_COUNT = 80;
export const PASS_THRESHOLD_PCT = 85;
