import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Spinner } from './Icons';
import PageShell from './PageShell';
import { supabase } from '../lib/supabase';

interface Props {
  // Eyebrow context, e.g. "AI mode · PSM1"
  eyebrow: string;
  // Headline, e.g. "AI mode is Pro only"
  title: string;
  italic: string;
  // Body paragraphs
  pitch: string;
  fineprint?: string;
}

export default function ProUpgradePrompt({ eyebrow, title, italic, pitch, fineprint }: Props) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || 'Could not start checkout');
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upgrade failed');
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-8 md:mb-10">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1 mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          Back to start
        </button>
        <div className="flex items-center gap-2">
          <div className="h-px w-10 bg-stone-700"></div>
          <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">{eyebrow}</span>
        </div>
      </div>
      <div className="border border-stone-300 bg-white/60 p-8 md:p-12 max-w-2xl">
        <div className="inline-block text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 bg-stone-900 text-stone-50 serif mb-5">
          Pro feature
        </div>
        <h1 className="serif text-3xl md:text-4xl text-stone-900 mb-3 leading-tight" style={{ fontWeight: 500 }}>
          {title} <em className="italic">{italic}</em>
        </h1>
        <p className="text-stone-700 leading-relaxed mb-5">{pitch}</p>
        {fineprint && (
          <p className="text-sm text-stone-600 italic serif mb-7">{fineprint}</p>
        )}
        <div className="text-stone-900 mb-5">
          <span className="serif text-3xl tabular-nums" style={{ fontWeight: 500 }}>€9.99</span>
          <span className="serif italic text-stone-600 ml-2">/ month</span>
          <span className="text-xs text-stone-500 ml-3 uppercase tracking-widest">cancel anytime</span>
        </div>
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-300 px-3 py-2 mb-4">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-stone-800 disabled:opacity-60 serif"
        >
          {busy && <Spinner className="w-4 h-4" />}
          {busy ? 'Opening checkout…' : 'Upgrade to Pro'}
        </button>
      </div>
    </PageShell>
  );
}
