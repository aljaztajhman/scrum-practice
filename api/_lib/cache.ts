/**
 * Question generation cache.
 *
 * Strategy: opportunistic. With probability CACHE_HIT_PROBABILITY, we attempt
 * to serve a previously generated + validated question from `ai_cache`
 * (filtered by cert/mode/difficulty and excluding recently-seen topics). On
 * miss we fall through to the LLM. After a successful generation we write the
 * validated payload into `ai_cache` for future re-serving.
 *
 * SAFETY: every DB op is wrapped in try/catch so a missing table or RLS error
 * never blocks a user from getting a fresh question. Cache is best-effort.
 *
 * `prompt_version` is bumped manually whenever the generation prompt changes
 * so older cached questions stop being served.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './events.js';

// Bump this any time the generation prompt changes. Older cached rows are
// silently ignored so we don't serve outdated questions.
export const PROMPT_VERSION = 2;

// Probability of attempting a cache read on a generation request.
// Higher = lower cost, more repeats. Tune over time.
export const CACHE_HIT_PROBABILITY = 0.4;

// Minimum cache rows of a given (mode,cert,difficulty) tuple before we'll
// even attempt to serve from cache. Below this the user is much better off
// getting a fresh generation than seeing the same handful of questions.
export const MIN_CACHE_POOL_SIZE = 8;

export type CacheMode = 'mc' | 'open';

export interface CacheKey {
  mode: CacheMode;
  cert: 'PSM1' | 'PSPO1';
  difficulty?: string | null;
  style?: string | null;
  topicSeed?: string | null;
  promptVersion?: number;
}

export interface CacheLookupOpts extends CacheKey {
  excludeTopics?: string[];
}

interface CacheRow {
  id: string;
  payload: unknown;
  topic: string | null;
}

/**
 * Try to serve a cached question. Returns null on miss, error, or random skip.
 * NEVER throws — failures fall through to fresh generation.
 */
export async function tryServeFromCache(
  supabaseAdmin: SupabaseClient,
  opts: CacheLookupOpts
): Promise<{ payload: unknown; cacheId: string } | null> {
  // Random skip — even when cache exists we sometimes regenerate to keep
  // variety high.
  if (Math.random() > CACHE_HIT_PROBABILITY) return null;

  const promptVersion = opts.promptVersion ?? PROMPT_VERSION;

  try {
    let q = supabaseAdmin
      .from('ai_cache')
      .select('id, payload, topic')
      .eq('mode', opts.mode)
      .eq('cert', opts.cert)
      .eq('prompt_version', promptVersion);

    if (opts.difficulty) q = q.eq('difficulty', opts.difficulty);

    // Cap how many rows we pull back. We pick a random one client-side.
    const { data, error } = await q.limit(50);
    if (error) {
      reportError(error, { endpoint: 'cache:read', reason: 'select_failed' });
      return null;
    }
    if (!data || data.length < MIN_CACHE_POOL_SIZE) return null;

    const exclude = new Set(
      (opts.excludeTopics ?? [])
        .map((t) => t.toLowerCase().trim())
        .filter((s) => s.length > 0)
    );
    const candidates = (data as CacheRow[]).filter((r) => {
      const topic = (r.topic ?? '').toLowerCase().trim();
      if (!topic) return true;
      // Exclude if any "recent topic" overlaps with this row's topic label.
      for (const ex of exclude) {
        if (ex.length > 4 && (topic.includes(ex) || ex.includes(topic))) return false;
      }
      return true;
    });

    if (candidates.length === 0) return null;
    const pick = candidates[Math.floor(Math.random() * candidates.length)] as CacheRow;
    return { payload: pick.payload, cacheId: pick.id };
  } catch (e) {
    reportError(e, { endpoint: 'cache:read', reason: 'unexpected' });
    return null;
  }
}

export interface CacheWriteOpts extends CacheKey {
  topic: string | null;
  payload: unknown;
  userId?: string | null;
}

/**
 * Write a validated payload into the cache. NEVER throws.
 */
export async function cacheQuestion(
  supabaseAdmin: SupabaseClient,
  opts: CacheWriteOpts
): Promise<void> {
  try {
    const row = {
      mode: opts.mode,
      cert: opts.cert,
      difficulty: opts.difficulty ?? null,
      style: opts.style ?? null,
      topic_seed: opts.topicSeed ?? null,
      topic: opts.topic ?? null,
      prompt_version: opts.promptVersion ?? PROMPT_VERSION,
      payload: opts.payload,
      created_by: opts.userId ?? null,
    };
    const { error } = await supabaseAdmin.from('ai_cache').insert(row);
    if (error) {
      reportError(error, { endpoint: 'cache:write', reason: 'insert_failed' });
    }
  } catch (e) {
    reportError(e, { endpoint: 'cache:write', reason: 'unexpected' });
  }
}
