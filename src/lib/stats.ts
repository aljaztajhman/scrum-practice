import type { TrackId } from './tracks';

export interface AttemptRow {
  id: string;
  user_id: string;
  track_id: TrackId;
  question_id: number;
  source: string;
  selected: number[];
  correct: boolean;
  topic: string | null;
  question_type: string | null;
  answered_at: string;
}

export interface MockSessionRow {
  id: string;
  user_id: string;
  track_id: TrackId;
  question_count: number;
  correct_count: number;
  duration_ms: number;
  passed: boolean;
  completed_at: string;
}

export interface Overview {
  total: number;
  correct: number;
  accuracyPct: number;
  lastActiveDate: string | null;
}

export function computeOverview(attempts: AttemptRow[]): Overview {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.correct).length;
  const accuracyPct = total === 0 ? 0 : Math.round((correct / total) * 1000) / 10;
  const lastActiveDate = attempts[0]?.answered_at ?? null;
  return { total, correct, accuracyPct, lastActiveDate };
}

export interface TopicStat {
  topic: string;
  total: number;
  correct: number;
  accuracyPct: number;
}

export function computeTopicBreakdown(attempts: AttemptRow[]): TopicStat[] {
  const byTopic = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const topic = a.topic ?? 'Unknown';
    const cur = byTopic.get(topic) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.correct) cur.correct++;
    byTopic.set(topic, cur);
  }
  return Array.from(byTopic.entries())
    .map(([topic, { total, correct }]) => ({
      topic,
      total,
      correct,
      accuracyPct: total === 0 ? 0 : Math.round((correct / total) * 1000) / 10,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface WeekStat {
  weekStart: string;
  weekLabel: string;
  total: number;
  correct: number;
  accuracyPct: number;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeWeeklyTrend(attempts: AttemptRow[], weeks = 12): WeekStat[] {
  const byWeek = new Map<string, { total: number; correct: number }>();
  for (const a of attempts) {
    const monday = getMonday(new Date(a.answered_at));
    const key = monday.toISOString().slice(0, 10);
    const cur = byWeek.get(key) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.correct) cur.correct++;
    byWeek.set(key, cur);
  }
  const now = new Date();
  const result: WeekStat[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const monday = getMonday(d);
    const key = monday.toISOString().slice(0, 10);
    const cur = byWeek.get(key) ?? { total: 0, correct: 0 };
    result.push({
      weekStart: key,
      weekLabel: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: cur.total,
      correct: cur.correct,
      accuracyPct: cur.total === 0 ? 0 : Math.round((cur.correct / cur.total) * 1000) / 10,
    });
  }
  return result;
}

export interface StreakStats {
  current: number;
  longest: number;
  totalDaysActive: number;
}

export function computeStreaks(attempts: AttemptRow[]): StreakStats {
  if (attempts.length === 0) return { current: 0, longest: 0, totalDaysActive: 0 };
  const days = new Set<string>();
  for (const a of attempts) {
    const d = new Date(a.answered_at);
    d.setHours(0, 0, 0, 0);
    days.add(d.toISOString().slice(0, 10));
  }
  const sortedDays = Array.from(days).sort();

  // Longest streak
  let longest = 1;
  let cur = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]!);
    const curD = new Date(sortedDays[i]!);
    const diffDays = Math.round((curD.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      cur++;
      longest = Math.max(longest, cur);
    } else {
      cur = 1;
    }
  }

  // Current streak (consecutive days back from today, allowing today to be missing)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let current = 0;
  let i = 0;
  // If today has no activity, allow stepping back one day before counting
  while (true) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (days.has(key)) {
      current++;
    } else if (i === 0) {
      // No activity today — that's OK, see if yesterday counts
      i++;
      continue;
    } else {
      break;
    }
    i++;
  }

  return {
    current,
    longest,
    totalDaysActive: days.size,
  };
}

export interface WeakQuestion {
  questionId: number;
  topic: string;
  total: number;
  correct: number;
  accuracyPct: number;
}

export function computeWeakQuestions(attempts: AttemptRow[], minAttempts = 2): WeakQuestion[] {
  const byQ = new Map<number, { total: number; correct: number; topic: string }>();
  for (const a of attempts) {
    const cur = byQ.get(a.question_id) ?? { total: 0, correct: 0, topic: a.topic ?? 'Unknown' };
    cur.total++;
    if (a.correct) cur.correct++;
    byQ.set(a.question_id, cur);
  }
  return Array.from(byQ.entries())
    .filter(([, v]) => v.total >= minAttempts)
    .map(([qid, v]) => ({
      questionId: qid,
      topic: v.topic,
      total: v.total,
      correct: v.correct,
      accuracyPct: Math.round((v.correct / v.total) * 1000) / 10,
    }))
    .filter((q) => q.accuracyPct < 60)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .slice(0, 20);
}
