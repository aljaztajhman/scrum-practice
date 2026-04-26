import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from './supabase';
import type { Question } from './schema';
import type { TrackId } from './tracks';

export type AttemptSource = 'practice' | 'mock' | 'infinite' | 'ai' | 'review';

/**
 * Returns a function that logs ONE attempt to Supabase.
 * No-op when the user is not logged in.
 */
export function useAttemptLogger(trackId: TrackId, source: AttemptSource) {
  const { user, isLoggedIn } = useAuth();
  return useCallback(
    async (question: Question, selected: number[], correct: boolean) => {
      if (!isLoggedIn || !user) return;
      const { error } = await supabase.from('attempts').insert({
        user_id: user.id,
        track_id: trackId,
        question_id: question.id,
        source,
        selected,
        correct,
        topic: question.topic,
        question_type: question.type,
      });
      if (error) console.error('logAttempt error:', error);
    },
    [user, isLoggedIn, trackId, source]
  );
}

/**
 * Returns a function that logs an array of attempts as a single batch insert.
 * Used by Mock to write all 80 attempts at once on finalize.
 */
export function useBatchAttemptLogger(trackId: TrackId, source: AttemptSource) {
  const { user, isLoggedIn } = useAuth();
  return useCallback(
    async (entries: Array<{ question: Question; selected: number[]; correct: boolean }>) => {
      if (!isLoggedIn || !user || entries.length === 0) return;
      const rows = entries.map((e) => ({
        user_id: user.id,
        track_id: trackId,
        question_id: e.question.id,
        source,
        selected: e.selected,
        correct: e.correct,
        topic: e.question.topic,
        question_type: e.question.type,
      }));
      const { error } = await supabase.from('attempts').insert(rows);
      if (error) console.error('logBatchAttempts error:', error);
    },
    [user, isLoggedIn, trackId, source]
  );
}

/**
 * Returns a function that logs a completed mock_sessions row.
 */
export function useMockSessionLogger(trackId: TrackId) {
  const { user, isLoggedIn } = useAuth();
  return useCallback(
    async (params: {
      questionCount: number;
      correctCount: number;
      durationMs: number;
      passed: boolean;
    }) => {
      if (!isLoggedIn || !user) return;
      const { error } = await supabase.from('mock_sessions').insert({
        user_id: user.id,
        track_id: trackId,
        question_count: params.questionCount,
        correct_count: params.correctCount,
        duration_ms: params.durationMs,
        passed: params.passed,
      });
      if (error) console.error('logMockSession error:', error);
    },
    [user, isLoggedIn, trackId]
  );
}
