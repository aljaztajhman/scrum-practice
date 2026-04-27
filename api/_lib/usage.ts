/**
 * Per-user generation cap.
 *
 * Counts uncached LLM calls per user over a rolling window. Returns 402-style
 * cap-exceeded result when the user is over their monthly quota. Admins are
 * always exempt.
 *
 * SAFETY: if the `ai_generations` table is missing or DB errors out, we ALLOW
 * the request — never block a paying user on infrastructure problems.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './events.js';

// Pro tier monthly cap on uncached LLM generations (cache hits don't count).
export const PRO_MONTHLY_CAP = 200;
export const WINDOW_DAYS = 30;

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  resetInDays: number;
}

/**
 * Returns whether the user is below their monthly cap.
 * On DB error, returns allowed=true (fail open).
 */
export async function checkUserCap(
  supabaseAdmin: SupabaseClient,
  userId: string,
  isAdmin: boolean
): Promise<UsageCheckResult> {
  if (isAdmin) {
    return { allowed: true, used: 0, limit: Number.POSITIVE_INFINITY, resetInDays: 0 };
  }
  try {
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabaseAdmin
      .from('ai_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cached', false)
      .gte('created_at', since);
    if (error) {
      reportError(error, { endpoint: 'usage:check', user_id: userId, reason: 'select_failed' });
      // Fail open
      return { allowed: true, used: 0, limit: PRO_MONTHLY_CAP, resetInDays: WINDOW_DAYS };
    }
    const used = count ?? 0;
    return {
      allowed: used < PRO_MONTHLY_CAP,
      used,
      limit: PRO_MONTHLY_CAP,
      resetInDays: WINDOW_DAYS,
    };
  } catch (e) {
    reportError(e, { endpoint: 'usage:check', user_id: userId, reason: 'unexpected' });
    return { allowed: true, used: 0, limit: PRO_MONTHLY_CAP, resetInDays: WINDOW_DAYS };
  }
}

export interface RecordOpts {
  userId: string;
  endpoint: 'generate-question' | 'generate-open-question' | 'grade-open-answer';
  cached: boolean;
  cert?: string | null;
  difficulty?: string | null;
  style?: string | null;
}

/**
 * Records a single generation event. NEVER throws.
 */
export async function recordGeneration(
  supabaseAdmin: SupabaseClient,
  opts: RecordOpts
): Promise<void> {
  try {
    const row = {
      user_id: opts.userId,
      endpoint: opts.endpoint,
      cached: opts.cached,
      cert: opts.cert ?? null,
      difficulty: opts.difficulty ?? null,
      style: opts.style ?? null,
    };
    const { error } = await supabaseAdmin.from('ai_generations').insert(row);
    if (error) {
      reportError(error, {
        endpoint: 'usage:record',
        user_id: opts.userId,
        reason: 'insert_failed',
      });
    }
  } catch (e) {
    reportError(e, { endpoint: 'usage:record', user_id: opts.userId, reason: 'unexpected' });
  }
}
