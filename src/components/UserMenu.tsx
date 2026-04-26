import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function UserMenu() {
  const { isLoggedIn, profile, user, signOut, isPro, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (loading) {
    return <div className="w-8 h-8" />;
  }

  if (!isLoggedIn) {
    return (
      <Link
        to="/login"
        className="text-sm serif text-stone-700 hover:text-stone-900 underline-offset-2 hover:underline"
      >
        Sign in
      </Link>
    );
  }

  const email = profile?.email ?? user?.email ?? '';
  const initial = email[0]?.toUpperCase() ?? '?';
  const tierLabel = isAdmin ? 'Admin' : isPro ? 'Pro' : 'Free';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-stone-900 text-stone-50 flex items-center justify-center serif text-sm hover:bg-stone-800"
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
            onClick={() => {
              setOpen(false);
              navigate('/stats');
            }}
          >
            My stats
          </button>
          {isAdmin && (
            <button
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-stone-100"
              onClick={() => {
                setOpen(false);
                navigate('/admin');
              }}
            >
              Admin
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
