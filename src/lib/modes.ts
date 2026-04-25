import type { LocalizedString } from './schema';
import type { TrackId } from './tracks';

export type ModeId = 'practice' | 'mock' | 'drill' | 'infinite' | 'hardcore';

export interface ModeDef {
  id: ModeId;
  title: LocalizedString;
  italic: LocalizedString;
  desc: LocalizedString;
  path: (trackId: TrackId) => string;
}

export const MODES: ModeDef[] = [
  {
    id: 'practice',
    title: { en: 'Practice', sl: 'Vadba' },
    italic: { en: 'learn as you go', sl: 'uči se sproti' },
    desc: {
      en: 'Answer at your own pace. See the why after every question. Pick 10, 30, or the full 80.',
      sl: 'Odgovarjaj v svojem tempu. Po vsakem vprašanju vidiš zakaj. Izberi 10, 30 ali vseh 80.',
    },
    path: (t) => `/practice/${t}`,
  },
  {
    id: 'mock',
    title: { en: 'Mock exam', sl: 'Vadbeni izpit' },
    italic: { en: 'the real thing', sl: 'kot pravi izpit' },
    desc: {
      en: 'Exam-faithful: 80 questions · 60 minutes · 85% to pass · no feedback until the end. Flag and review before submitting.',
      sl: 'Kot pravi izpit: 80 vprašanj · 60 minut · 85 % za prehod · brez razlag do konca. Označuj in preglej pred oddajo.',
    },
    path: (t) => `/mock/${t}`,
  },
  {
    id: 'drill',
    title: { en: 'Topic drill', sl: 'Vadba teme' },
    italic: { en: 'one area at a time', sl: 'eno področje naenkrat' },
    desc: {
      en: 'Pick a topic — Accountabilities, Events, Artifacts, Scenarios — and grind it until you own it.',
      sl: 'Izberi temo — odgovornosti, dogodki, artefakti, scenariji — in vadi do obvladovanja.',
    },
    path: (t) => `/drill/${t}`,
  },
  {
    id: 'infinite',
    title: { en: 'Infinite', sl: 'Neskončno' },
    italic: { en: 'until you stop', sl: 'dokler ne ustaviš' },
    desc: {
      en: 'Endless shuffled stream. Running accuracy counter. Walk away whenever you want.',
      sl: 'Neskončen mešan tok vprašanj. Tekoč števec točnosti. Ustavi se, ko hočeš.',
    },
    path: (t) => `/infinite/${t}`,
  },
  {
    id: 'hardcore',
    title: { en: 'Hardcore', sl: 'Hardcore' },
    italic: { en: 'ten questions that hurt', sl: 'deset bolečih vprašanj' },
    desc: {
      en: 'Ten scenario-heavy questions where three of four options sound right. Tests judgment under competing Scrum principles, not memorization. For when you think you really know it.',
      sl: 'Deset scenarijev, kjer tri od štirih možnosti zveni pravilno. Preizkuša presojo med tekmujočimi Scrum načeli, ne pomnjenja. Za ko misliš, da res znaš.',
    },
    path: (t) => `/hardcore/${t}`,
  },
];

export const MOCK_EXAM_DURATION_MS = 60 * 60 * 1000;
export const MOCK_EXAM_QUESTION_COUNT = 80;
export const PASS_THRESHOLD_PCT = 85;
