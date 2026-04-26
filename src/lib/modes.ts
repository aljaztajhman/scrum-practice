import type { TrackId } from './tracks';

export type ModeId = 'practice' | 'mock' | 'infinite' | 'ai' | 'open';

export interface ModeDef {
  id: ModeId;
  title: string;
  italic: string;
  desc: string;
  path: (trackId: TrackId) => string;
  proOnly?: boolean;
  group: 'bank' | 'ai';
}

export const MODES: ModeDef[] = [
  {
    id: 'practice',
    title: 'Practice',
    italic: 'learn as you go',
    desc: 'Answer at your own pace. See the why after each question.',
    path: (t) => `/practice/${t}`,
    group: 'bank',
  },
  {
    id: 'mock',
    title: 'Mock exam',
    italic: 'the real thing',
    desc: '80 questions · 60 minutes · 85% to pass. Exam-faithful.',
    path: (t) => `/mock/${t}`,
    group: 'bank',
  },
  {
    id: 'infinite',
    title: 'Infinite',
    italic: 'until you stop',
    desc: 'Endless shuffled stream. Walk away whenever.',
    path: (t) => `/infinite/${t}`,
    group: 'bank',
  },
  {
    id: 'ai',
    title: 'AI mode',
    italic: 'a different angle',
    desc: 'Live AI-generated questions from unusual angles. Hardens understanding.',
    path: (t) => `/ai/${t}`,
    proOnly: true,
    group: 'ai',
  },
  {
    id: 'open',
    title: 'Open response',
    italic: 'free-form recall',
    desc: 'Free-text answers, AI-graded against the Scrum Guide. Active recall.',
    path: (t) => `/open/${t}`,
    proOnly: true,
    group: 'ai',
  },
];

export const MOCK_EXAM_DURATION_MS = 60 * 60 * 1000;
export const MOCK_EXAM_QUESTION_COUNT = 80;
export const PASS_THRESHOLD_PCT = 85;
