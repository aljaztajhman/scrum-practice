/**
 * Event/error reporting interface. Today: console.error. Next session: swap
 * implementation to Sentry by replacing the body of these two functions.
 *
 * Sentry installation steps for next session:
 *   npm install @sentry/node
 *   Set SENTRY_DSN env var in Vercel
 *   Replace bodies below with Sentry.captureException + Sentry.captureMessage
 */

export interface EventTags {
  endpoint?: string;
  user_id?: string;
  cert?: string;
  difficulty?: string;
  style?: string;
  attempt?: number;
  reason?: string;
}

export function reportError(err: unknown, tags: EventTags = {}): void {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error('[event:error]', { msg, stack, ...tags });
}

export function reportMessage(message: string, tags: EventTags = {}): void {
  console.log('[event:message]', { message, ...tags });
}
