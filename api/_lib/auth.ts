import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

/**
 * Verifies the Supabase JWT on a request and returns the user + an admin
 * Supabase client (using the service-role key, bypasses RLS).
 *
 * Returns null if the request is unauthenticated or the JWT is invalid.
 */
export async function authenticateRequest(
  req: VercelRequest
): Promise<{ user: User; supabaseAdmin: SupabaseClient } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error('authenticateRequest: missing Supabase env vars');
    return null;
  }

  const supabaseAdmin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, supabaseAdmin };
}

/**
 * Returns the user's profile row (admin-bypassed).
 */
export async function getProfile(supabaseAdmin: SupabaseClient, userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data as {
    id: string;
    email: string;
    tier: 'free' | 'pro' | 'admin';
    is_admin: boolean;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  };
}

export function requestOrigin(req: VercelRequest, fallback: string): string {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.length > 0) return origin;
  if (Array.isArray(origin) && origin[0]) return origin[0];
  const host = req.headers.host;
  if (typeof host === 'string' && host.length > 0) return `https://${host}`;
  return fallback;
}
