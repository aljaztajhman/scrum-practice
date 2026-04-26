import type { Question } from './schema';
import type { TrackId } from './tracks';
import type { AttemptRow } from './stats';

/**
 * Build the review queue for a given track.
 *
 * Rules:
 * - For each question the user has answered, sort attempts newest-first.
 * - If the last 2 attempts are both correct → mastered, exclude from queue.
 * - Otherwise if there's any miss in history → include in queue.
 * - Rank by: most-recent-miss first, tie-break by total miss count.
 *
 * Returns Question objects (looked up from the bank) in priority order.
 */
export function buildReviewQueue(
  attempts: AttemptRow[],
  trackId: TrackId,
  bankQuestions: Question[]
): Question[] {
  // Filter to current track only
  const trackAttempts = attempts.filter((a) => a.track_id === trackId);
  if (trackAttempts.length === 0) return [];

  // Group by question_id
  const byQuestion = new Map<number, AttemptRow[]>();
  for (const a of trackAttempts) {
    const arr = byQuestion.get(a.question_id);
    if (arr) arr.push(a);
    else byQuestion.set(a.question_id, [a]);
  }

  // Score each candidate
  interface Candidate {
    questionId: number;
    lastMissTs: number;
    missCount: number;
  }
  const candidates: Candidate[] = [];

  for (const [qId, atts] of byQuestion) {
    // Newest first
    atts.sort(
      (a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime()
    );

    // Mastered? Last 2 correct in a row
    if (atts.length >= 2 && atts[0]!.correct && atts[1]!.correct) continue;

    // Find most recent miss
    const lastMiss = atts.find((a) => !a.correct);
    if (!lastMiss) continue; // never missed

    candidates.push({
      questionId: qId,
      lastMissTs: new Date(lastMiss.answered_at).getTime(),
      missCount: atts.filter((a) => !a.correct).length,
    });
  }

  // Most recent miss first; ties broken by miss count desc
  candidates.sort((a, b) => {
    if (b.lastMissTs !== a.lastMissTs) return b.lastMissTs - a.lastMissTs;
    return b.missCount - a.missCount;
  });

  // Map back to Question objects from the bank
  const bankMap = new Map(bankQuestions.map((q) => [q.id, q]));
  const result: Question[] = [];
  for (const c of candidates) {
    const q = bankMap.get(c.questionId);
    if (q) result.push(q);
  }
  return result;
}

/**
 * Quick count of how many questions are currently in the review queue
 * for a given track. Used by the Home tile badge.
 */
export function countReviewQueue(
  attempts: AttemptRow[],
  trackId: TrackId,
  bankQuestions: Question[]
): number {
  return buildReviewQueue(attempts, trackId, bankQuestions).length;
}
