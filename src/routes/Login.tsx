import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/Icons';

type Mode = 'signin' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { signInWithEmail, signUpWithEmail, signInWithGoogle, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (isLoggedIn) {
    return <Navigate to={from} replace />;
  }

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const fn = mode === 'signin' ? signInWithEmail : signUpWithEmail;
    const { error: err } = await fn(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (mode === 'signin') {
      navigate(from, { replace: true });
    } else {
      setInfo('Account created — signing you in.');
      // Auth state listener will navigate automatically once profile is loaded.
      setTimeout(() => navigate(from, { replace: true }), 600);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    const { error: err } = await signInWithGoogle();
    if (err) {
      setBusy(false);
      setError(err);
    }
    // On success, browser redirects to Google and back to '/'
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Account"
        title={mode === 'signin' ? 'Sign in' : 'Create account'}
        italic={mode === 'signin' ? 'pick up where you left off' : 'so your stats stick'}
        tagline="You can practice without an account, but stats and progress need one."
        backTo="/"
      />
      <div className="space-y-6 max-w-md">
        <div className="flex border-b border-stone-300">
          <button
            type="button"
            className={`px-5 py-3 serif text-base ${
              mode === 'signin'
                ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            onClick={() => {
              setMode('signin');
              setError(null);
              setInfo(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`px-5 py-3 serif text-base ${
              mode === 'signup'
                ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                : 'text-stone-500 hover:text-stone-700'
            }`}
            onClick={() => {
              setMode('signup');
              setError(null);
              setInfo(null);
            }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-stone-600">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-stone-400 bg-white/60 px-3 py-2 focus:outline-none focus:border-stone-900"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-stone-600">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-stone-400 bg-white/60 px-3 py-2 focus:outline-none focus:border-stone-900"
              disabled={busy}
            />
          </label>
          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-300 px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-300 px-3 py-2">
              {info}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-stone-900 text-stone-50 py-3 serif text-base hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy && <Spinner className="w-4 h-4" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-stone-500">
          <div className="flex-1 h-px bg-stone-300" />
          <span className="text-xs uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-stone-300" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full border border-stone-400 bg-white/60 hover:border-stone-900 hover:bg-white/80 py-3 serif text-base flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GoogleIcon />
          Continue with Google
        </button>
      </div>
    </PageShell>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
