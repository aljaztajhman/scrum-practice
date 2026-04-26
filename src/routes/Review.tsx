import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import SequentialRunner from '../components/SequentialRunner';
import { Spinner } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TRACKS, parseTrackId } from '../lib/tracks';
import { buildReviewQueue } from '../lib/review-queue';
import type { AttemptRow } from '../lib/stats';
import type { Question } from '../lib/schema';

export default function Review() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = parseTrackId(cert);
  const { isLoggedIn, loading: authLoading, user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [pool, setPool] = useState<Question[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !trackId) return;
    let cancelled = false;
    setError(null);
    supabase
      .from('attempts')
      .select('*')
      .eq('track_id', trackId)
      .order('answered_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          setError(err.message);
          return;
        }
        const rows = (data ?? []) as AttemptRow[];
        setAttempts(rows);
        if (trackId) {
          const track = TRACKS[trackId];
          // Snapshot the pool at session start so the queue doesn't shift mid-session
          setPool(buildReviewQueue(rows, trackId, track.questions));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, trackId, sessionKey]);

  if (authLoading) return null;
  if (!trackId) return <Navigate to="/" replace />;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: `/review/${trackId}` }} replace />;
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Review"
          title="Review"
          italic="something went wrong"
          tagline={error}
          backTo="/"
        />
      </PageShell>
    );
  }

  if (attempts === null || pool === null) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={`${TRACKS[trackId].title} · Review`}
          title="Review"
          italic="loading"
          tagline="Pulling your weak spots."
          backTo="/"
        />
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8 text-stone-500" />
        </div>
      </PageShell>
    );
  }

  if (pool.length === 0) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={`${TRACKS[trackId].title} · Review`}
          title="Nothing to review"
          italic="yet"
          tagline="Once you miss a question or two, they'll start showing up here. Try Practice or Mock to seed the queue."
          backTo="/"
        />
        <div className="border border-stone-300 bg-white/40 p-8 max-w-xl">
          <p className="serif italic text-stone-700 text-lg" style={{ fontWeight: 400 }}>
            A question leaves this queue once you answer it correctly twice in a row. So the queue
            is empty either because you have not missed anything yet, or because you have already
            mastered everything you have seen.
          </p>
        </div>
      </PageShell>
    );
  }

  const track = TRACKS[trackId];

  return (
    <PageShell>
      <SequentialRunner
        key={sessionKey}
        track={track}
        pool={pool}
        source="review"
        onExitPath="/"
        onRestart={() => setSessionKey((k) => k + 1)}
        onChangeConfig={() => navigate('/')}
      />
    </PageShell>
  );
}
