import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, X, RotateCcw, Spinner } from '../components/Icons';
import PageShell from '../components/PageShell';
import QuizCard from '../components/QuizCard';
import type { Question } from '../lib/schema';
import { TRACKS, parseTrackId, type Track } from '../lib/tracks';
import { useAuth } from '../contexts/AuthContext';
import { arraysEqualAsSets } from '../lib/utils';

interface AiQuestion extends Question {
  style: string;
  scrumGuideSection: string;
  selfCritique: string;
  confidence: number;
}

const STYLE_LABELS: Record<string, string> = {
  'first-principles': 'First principles',
  'find-the-flaw': 'Find the flaw',
  'steel-manning': 'Steel-manning',
  counterfactual: 'Counterfactual',
  'devils-advocate': "Devil's advocate",
};

const STYLE_BLURBS: Record<string, string> = {
  'first-principles': 'Derive the rule from underlying goals.',
  'find-the-flaw': 'Spot what is broken in this scenario.',
  'steel-manning': "Engage the argument's strongest form.",
  counterfactual: 'Imagine the rule absent. What degrades?',
  'devils-advocate': 'Where the apparent exception is not actually one.',
};

const BUFFER_TARGET = 3;

export default function Ai() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = parseTrackId(cert);
  const { isLoggedIn, isPro, loading } = useAuth();
  if (!trackId) return <Navigate to="/" replace />;
  if (loading) return null;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: `/ai/${trackId}` }} replace />;
  }
  if (!isPro) {
    return <AiUpgradePrompt trackId={trackId} />;
  }
  const track = TRACKS[trackId];
  return <AiSession track={track} />;
}

function AiUpgradePrompt({ trackId }: { trackId: string }) {
  const navigate = useNavigate();
  return (
    <PageShell>
      <div className="mb-8 md:mb-10">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1 mb-5"
        >
          <ArrowLeft
            className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          Back to start
        </button>
        <div className="flex items-center gap-2">
          <div className="h-px w-10 bg-stone-700"></div>
          <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">
            AI mode · {trackId}
          </span>
        </div>
      </div>
      <div className="border border-stone-300 bg-white/60 p-8 md:p-12 max-w-2xl">
        <div className="inline-block text-[10px] uppercase tracking-[0.25em] px-2.5 py-1 bg-stone-900 text-stone-50 serif mb-5">
          Pro feature
        </div>
        <h1
          className="serif text-3xl md:text-4xl text-stone-900 mb-3 leading-tight"
          style={{ fontWeight: 500 }}
        >
          AI mode is <em className="italic">Pro only</em>
        </h1>
        <p className="text-stone-700 leading-relaxed mb-5">
          Live-generated questions that flip the test on its head — first-principles, find-the-flaw,
          steel-manning, counterfactuals. Designed to harden understanding by attacking it from
          angles the static bank never does.
        </p>
        <p className="text-sm text-stone-600 italic serif mb-7">
          Free tier covers Practice, Mock, Infinite, and full statistics. AI mode is the one Pro
          feature.
        </p>
        <button
          type="button"
          disabled
          className="inline-block bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest opacity-60 cursor-not-allowed serif"
          title="Stripe billing wiring up next"
        >
          Upgrade to Pro · coming soon
        </button>
      </div>
    </PageShell>
  );
}

function AiSession({ track }: { track: Track }) {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<AiQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const queueRef = useRef<AiQuestion[]>([]);
  const inFlight = useRef(0);
  const consecutiveErrors = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchOne = useCallback(async () => {
    inFlight.current++;
    try {
      const res = await fetch(`/api/generate-question?cert=${track.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!isMounted.current) return;
      const q: AiQuestion = {
        id: Math.floor(Math.random() * 1e9),
        type: data.type,
        topic: data.topic,
        q: data.q,
        options: data.options,
        correct: data.correct,
        why: data.why,
        style: data.style,
        scrumGuideSection: data.scrumGuideSection,
        selfCritique: data.selfCritique,
        confidence: data.confidence,
      };
      setQueue((prev) => [...prev, q]);
      consecutiveErrors.current = 0;
      setError(null);
    } catch (e) {
      consecutiveErrors.current++;
      if (
        consecutiveErrors.current >= 3 &&
        queueRef.current.length === 0 &&
        isMounted.current
      ) {
        setError(e instanceof Error ? e.message : 'Generation failed');
      }
    } finally {
      inFlight.current--;
      if (isMounted.current && !error) {
        topUp();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id]);

  const topUp = useCallback(() => {
    if (error) return;
    const need = BUFFER_TARGET - queueRef.current.length - inFlight.current;
    for (let i = 0; i < need; i++) {
      void fetchOne();
    }
  }, [error, fetchOne]);

  useEffect(() => {
    if (!error) topUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const current = queue[0] ?? null;
  const isLoadingFirst = !current && !error;
  const isPrefetching = queue.length > 1;

  const onToggle = (i: number) => {
    if (locked || !current) return;
    setSelected((prev) =>
      current.type === 'multi'
        ? prev.includes(i)
          ? prev.filter((x) => x !== i)
          : [...prev, i]
        : [i]
    );
  };

  const onSubmit = () => {
    if (!current || selected.length === 0 || locked) return;
    const isCorrect = arraysEqualAsSets(selected, current.correct);
    setLocked(true);
    setStats((s) => ({
      answered: s.answered + 1,
      correct: s.correct + (isCorrect ? 1 : 0),
    }));
  };

  const onNext = () => {
    setQueue((prev) => prev.slice(1));
    setSelected([]);
    setLocked(false);
    setTimeout(topUp, 0);
  };

  const onTryAgain = () => {
    consecutiveErrors.current = 0;
    setError(null);
  };

  const incorrect = stats.answered - stats.correct;

  return (
    <PageShell
      footer={
        <p className="text-xs text-stone-500 serif italic">
          AI-generated · grounded in the Scrum Guide 2020 · drift can happen, flag anything that
          looks wrong.
        </p>
      }
    >
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1"
          >
            <ArrowLeft
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
            Back to start
          </button>
          <div className="flex items-center gap-2.5 md:gap-4 text-xs">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {track.title} · AI
            </span>
            <span className="hidden md:inline text-stone-300">·</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{stats.correct}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-800">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{incorrect}</span>
            </span>
            <span className="text-stone-400">·</span>
            <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
              <span className="serif text-stone-900">{stats.answered}</span>
              <span className="text-stone-400"> answered</span>
            </span>
            {isPrefetching && (
              <>
                <span className="text-stone-400">·</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 tabular-nums">
                  +{queue.length - 1} ready
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {isLoadingFirst && (
        <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-12 md:p-16 paper text-center">
          <Spinner className="w-10 h-10 mx-auto mb-5 text-stone-700" strokeWidth={1.8} />
          <p
            className="serif italic text-2xl md:text-3xl text-stone-700 mb-2"
            style={{ fontWeight: 400 }}
          >
            Composing a question…
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            One moment, the model is thinking
          </p>
        </div>
      )}

      {error && (
        <div className="border border-rose-300 bg-rose-50/60 p-8 md:p-10">
          <p className="serif italic text-xl text-rose-900 mb-3" style={{ fontWeight: 400 }}>
            That one did not land.
          </p>
          <p className="text-sm text-stone-700 leading-relaxed mb-6">{error}</p>
          <button
            onClick={onTryAgain}
            className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /> Try again
          </button>
        </div>
      )}

      {current && !error && (
        <>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
                Style ·{' '}
              </span>
              <span
                className="serif italic text-base md:text-lg text-stone-800"
                style={{ fontWeight: 500 }}
              >
                {STYLE_LABELS[current.style] || current.style}
              </span>
            </div>
            <span className="text-xs text-stone-500 italic hidden sm:inline">
              {STYLE_BLURBS[current.style]}
            </span>
          </div>
          <QuizCard
            track={track}
            question={current}
            selected={selected}
            locked={locked}
            canGoPrev={false}
            canSubmit={selected.length > 0}
            isLastQuestion={false}
            onToggle={onToggle}
            onSubmit={onSubmit}
            onNext={onNext}
            onPrev={() => {}}
          />

          {locked && (
            <div className="mt-5 border border-stone-300 bg-white/40 p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-2">
                Self-critique · the strongest argument against the marked answer
              </p>
              <p className="text-sm text-stone-700 leading-relaxed serif italic">
                {current.selfCritique}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                Grounded in · {current.scrumGuideSection}
              </p>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
