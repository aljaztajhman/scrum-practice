import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (and on Vercel).'
  );
}

// No-op lock replaces the default navigator.locks-based lock.
// Default lock can get orphaned and stick getSession() for 5s on every page load
// when the auth token is being refreshed concurrently. We're a single-user study app
// so we don't need cross-tab synchronization.
async function noOpLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  return await fn();
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: noOpLock,
  },
});

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  tier: 'free' | 'pro' | 'admin';
  is_admin: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}
