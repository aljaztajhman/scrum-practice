import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserMenu() {
  const { isLoggedIn, profile, user, session, signOut, isPro, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (loading) {
    return <div className="w-20 h-8" />;
  }

  if (!isLoggedIn) {
    return (
      <Link
        to="/login"
        className="inline-block text-xs uppercase tracking-widest serif border border-stone-500 px-3.5 py-1.5 text-stone-800 hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50 transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const email = profile?.email ?? user?.email ?? '';
  const initial = email[0]?.toUpperCase() ?? '?';
  const tierLabel = isAdmin ? 'Admin' : isPro ? 'Pro' : 'Free';
  const showManageSub = isPro && !isAdmin && !!profile?.stripe_customer_id;

  const handleManageSubscription = async () => {
    setBusy(true);
    setOpen(false);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const token = s?.access_token ?? session?.access_token;
      const res = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || 'Failed to open portal');
      window.location.href = body.url;
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not open subscription portal');
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="w-9 h-9 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center serif text-sm hover:bg-stone-800 ring-1 ring-stone-300 disabled:opacity-60"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-stone-300 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-stone-200">
            <div className="text-xs uppercase tracking-widest text-stone-500">Signed in as</div>
            <div className="text-sm text-stone-900 truncate">{email}</div>
            <div className="text-xs serif italic text-stone-600 mt-1">{tierLabel} tier</div>
          </div>
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100"
            onClick={() => { setOpen(false); navigate('/stats'); }}
          >
            My stats
          </button>
          {isAdmin && (
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100"
              onClick={() => { setOpen(false); navigate('/admin'); }}
            >
              Admin
            </button>
          )}
          {showManageSub && (
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100"
              onClick={handleManageSubscription}
            >
              Manage subscription
            </button>
          )}
          <button
            type="button"
            className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100 border-t border-stone-200"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate('/');
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
