import { QuestionBankSchema, type Question } from './schema';
import psm1Raw from '../content/psm1.json';
import pspo1Raw from '../content/pspo1.json';

export interface Track {
  id: TrackId;
  title: string;
  subtitle: string;
  short: string;
  tagline: string;
  questions: Question[];
  topicAccent: Record<string, string>;
}

export type TrackId = 'PSM1' | 'PSPO1';

const TRACK_IDS: TrackId[] = ['PSM1', 'PSPO1'];

export function isTrackId(s: string | undefined): s is TrackId {
  return s !== undefined && (TRACK_IDS as string[]).includes(s);
}

/** Parse a URL cert param into a TrackId, or null if invalid. Case-insensitive. */
export function parseTrackId(cert: string | undefined): TrackId | null {
  const upper = cert?.toUpperCase();
  return isTrackId(upper) ? upper : null;
}

const PSM1_QUESTIONS = QuestionBankSchema.parse(psm1Raw);
const PSPO1_QUESTIONS = QuestionBankSchema.parse(pspo1Raw);

export const TRACKS: Record<TrackId, Track> = {
  PSM1: {
    id: 'PSM1',
    title: 'PSM I',
    subtitle: 'Professional Scrum Master I',
    short: 'Scrum Master',
    tagline: 'Built from the Scrum Guide 2020. Calibrated to how the real test reads.',
    questions: PSM1_QUESTIONS,
    topicAccent: {
      Accountabilities: 'bg-amber-100 text-amber-900 border-amber-300',
      Events: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      Artifacts: 'bg-sky-100 text-sky-900 border-sky-300',
      Commitments: 'bg-violet-100 text-violet-900 border-violet-300',
      'Scrum Team': 'bg-rose-100 text-rose-900 border-rose-300',
      'Values & Empiricism': 'bg-indigo-100 text-indigo-900 border-indigo-300',
      Scenarios: 'bg-stone-200 text-stone-800 border-stone-400',
    },
  },
  PSPO1: {
    id: 'PSPO1',
    title: 'PSPO I',
    subtitle: 'Professional Scrum Product Owner I',
    short: 'Product Owner',
    tagline: 'Built from the Scrum Guide 2020. Focused on the Product Owner accountability.',
    questions: PSPO1_QUESTIONS,
    topicAccent: {
      'PO Accountability': 'bg-amber-100 text-amber-900 border-amber-300',
      'Product Backlog': 'bg-sky-100 text-sky-900 border-sky-300',
      'Product Goal': 'bg-violet-100 text-violet-900 border-violet-300',
      Events: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      'Value & Stakeholders': 'bg-rose-100 text-rose-900 border-rose-300',
      'Release & Increment': 'bg-indigo-100 text-indigo-900 border-indigo-300',
      Scaling: 'bg-teal-100 text-teal-900 border-teal-300',
      'Scrum Theory': 'bg-stone-200 text-stone-800 border-stone-400',
    },
  },
};
