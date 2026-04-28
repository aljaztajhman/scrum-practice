import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, X, RotateCcw, Spinner } from '../components/Icons';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import ProUpgradePrompt from '../components/ProUpgradePrompt';
import QuizCard from '../components/QuizCard';
import type { Question } from '../lib/schema';
import { TRACKS, parseTrackId, type Track, type TrackId } from '../lib/tracks';
import { useAuth } from '../contexts/AuthContext';
import { arraysEqualAsSets } from '../lib/utils';

interface AiQuestion extends Question {
  style: string;
  scrumGuideSection: string;
  selfCritique: string;
  confidence: number;
  difficulty?: Difficulty;
}

type Difficulty = 'easy' | 'medium' | 'scrum-master';

const CERT_MASTERY_LABEL: Record<TrackId, string> = {
  PSM1: 'Professional Scrum Master',
  PSPO1: 'Professional Scrum Product Owner',
};

function difficultyLabel(d: Difficulty, cert: TrackId): string {
  if (d === 'easy') return 'Easy';
  if (d === 'medium') return 'Medium';
  return CERT_MASTERY_LABEL[cert];
}

const DIFFICULTY_BLURBS: Record<Difficulty, string> = {
  easy: 'Recognition-level. Plausible-but-clearly-wrong distractors.',
  medium: 'Standard exam depth. Plausible distractors, real applied thinking.',
  'scrum-master': 'Calibrated to pass the live exam at >90%. Mastery-level distractors.',
};

const DIFFICULTY_DETAILS: Record<Difficulty, string> = {
  easy: 'A learner with one careful read of the Scrum Guide should answer correctly. Short scenarios, no edge cases.',
  medium: 'Requires applied understanding, not just recall. Distractors reflect partial truths a shallow learner would pick.',
  'scrum-master': 'Nuanced multi-clause scenarios. At least one distractor is a "common misinterpretation" — what many practitioners would defend. The correct answer is Scrum-Guide-strict.',
};

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
const FETCH_TIMEOUT_MS = 45000;

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
    return (
      <ProUpgradePrompt
        eyebrow={`AI mode · ${trackId}`}
        title="AI mode is"
        italic="Pro only"
        pitch="Live-generated questions that flip the test on its head — first-principles, find-the-flaw, steel-manning, counterfactuals. Designed to harden understanding by attacking it from angles the static bank never does."
        fineprint="Free tier covers Practice, Mock, Infinite, and full statistics. AI mode and Open response are the two Pro features."
      />
    );
  }
  const track = TRACKS[trackId];
  return <AiSession track={track} />;
}

function AiSession({ track }: { track: Track }) {
  const navigate = useNavigate();
  const { session: authSession } = useAuth();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [queue, setQueue] = useState<AiQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const queueRef = useRef<AiQuestion[]>([]);
  const inFlight = useRef(0);
  const consecutiveErrors = useRef(0);
  const isMounted = useRef(true);
  const abortControllers = useRef<Set<AbortController>>(new Set());
  const recentTopics = useRef<string[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      for (const ctrl of abortControllers.current) {
        try { ctrl.abort(); } catch { /* noop */ }
      }
      abortControllers.current.clear();
    };
  }, []);

  const fetchOne = useCallback(async (forDifficulty: Difficulty) => {
    inFlight.current++;
    const ctrl = new AbortController();
    abortControllers.current.add(ctrl);
    const timeoutId = setTimeout(() => {
      try { ctrl.abort(); } catch { /* noop */ }
    }, FETCH_TIMEOUT_MS);
    try {
      const token = authSession?.access_token;
      if (!token) throw new Error('Not signed in — please sign in again.');
      const recentParam = recentTopics.current.length
        ? `&recent=${encodeURIComponent(recentTopics.current.join('|'))}`
        : '';
      const res = await fetch(
        `/api/generate-question?cert=${track.id}&difficulty=${forDifficulty}${recentParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 402) {
          const used = typeof body.used === 'number' ? body.used : 0;
          const limit = typeof body.limit === 'number' ? body.limit : 200;
          const days = typeof body.resetInDays === 'number' ? body.resetInDays : 30;
          throw new Error(
            `You've reached your monthly AI generation limit (${used}/${limit}). It resets in ${days} days. Cached questions are unaffected.`
          );
        }
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      if (!isMounted.current) return;
      // Skip if difficulty has changed since this request was started.
      if (forDifficulty !== difficulty) return;
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
        difficulty: data.difficulty ?? forDifficulty,
      };
      // Track recent topic labels (last 5) for the next request's exclude list.
      if (data.topic) {
        recentTopics.current = [data.topic, ...recentTopics.current].slice(0, 5);
      }
      setQueue((prev) => [...prev, q]);
      consecutiveErrors.current = 0;
      setError(null);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      consecutiveErrors.current++;
      if (consecutiveErrors.current >= 3 && queueRef.current.length === 0 && isMounted.current) {
        setError(e instanceof Error ? e.message : 'Generation failed');
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllers.current.delete(ctrl);
      inFlight.current--;
      if (isMounted.current && !error && difficulty) {
        topUp();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.id, difficulty, authSession]);

  const topUp = useCallback(() => {
    if (error || !difficulty) return;
    const need = BUFFER_TARGET - queueRef.current.length - inFlight.current;
    for (let i = 0; i < need; i++) void fetchOne(difficulty);
  }, [error, difficulty, fetchOne]);

  useEffect(() => {
    if (!error && difficulty) topUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, difficulty]);

  // Tab-resume recovery: if the user was on another tab and the browser
  // throttled or killed our in-flight requests, top-up again on visibility
  // change so the queue refills cleanly without requiring a manual refresh.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      if (!isMounted.current || !difficulty || error) return;
      // If we have nothing queued and nothing in-flight, kick the queue.
      if (queueRef.current.length === 0 && inFlight.current === 0) {
        topUp();
      }
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [difficulty, error, topUp]);

  const startWith = (d: Difficulty) => {
    recentTopics.current = [];
    setDifficulty(d);
  };

  const changeDifficulty = (next: Difficulty) => {
    if (next === difficulty) return;
    // Abort all in-flight, clear queue, reset stats-of-the-current-question only.
    for (const ctrl of abortControllers.current) {
      try { ctrl.abort(); } catch { /* noop */ }
    }
    abortControllers.current.clear();
    inFlight.current = 0;
    consecutiveErrors.current = 0;
    setQueue([]);
    setSelected([]);
    setLocked(false);
    setError(null);
    recentTopics.current = [];
    setDifficulty(next);
  };

  const current = queue[0] ?? null;
  const isLoadingFirst = !!difficulty && !current && !error;
  const isPrefetching = queue.length > 1;

  const onToggle = (i: number) => {
    if (locked || !current) return;
    setSelected((prev) =>
      current.type === 'multi'
        ? prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
        : [i]
    );
  };

  const onSubmit = () => {
    if (!current || selected.length === 0 || locked) return;
    const isCorrect = arraysEqualAsSets(selected, current.correct);
    setLocked(true);
    setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
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

  // ===== INTRO SCREEN — pick difficulty before generating =====
  if (!difficulty) {
    return (
      <PageShell>
        <PageHeader
          eyebrow={`${track.title} · AI mode`}
          title="AI"
          italic="mode"
          tagline="Live-generated multiple-choice questions. Five reflective styles. Pick a difficulty to begin."
          backTo="/"
        />
        <div className="space-y-4">
          {(['easy', 'medium', 'scrum-master'] as const).map((d) => (
            <button
              key={d}
              onClick={() => startWith(d)}
              className="group w-full text-left border border-stone-400 bg-white/50 hover:border-stone-900 hover:bg-white/80 transition-all duration-200 p-5 md:p-6"
            >
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <div className="serif text-2xl md:text-3xl leading-tight text-stone-900" style={{ fontWeight: 500 }}>
                    {difficultyLabel(d, track.id)}
                  </div>
                  <div className="serif italic text-sm md:text-base text-stone-600 mt-0.5" style={{ fontWeight: 400 }}>
                    {DIFFICULTY_BLURBS[d]}
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1 mt-2"
                  strokeWidth={2}
                />
              </div>
              <p className="text-sm text-stone-700 leading-relaxed">{DIFFICULTY_DETAILS[d]}</p>
            </button>
          ))}
        </div>
      </PageShell>
    );
  }

  const incorrect = stats.answered - stats.correct;

  return (
    <PageShell
      footer={
        <p className="text-xs text-stone-500 serif italic">
          AI-generated · grounded in the Scrum Guide 2020 · drift can happen, flag anything that looks wrong.
        </p>
      }
    >
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Back to start
          </button>
          <div className="flex items-center gap-2.5 md:gap-4 text-xs">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">{track.title} · AI</span>
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

        {/* Difficulty tabs — visible during quiz */}
        <div className="border-b border-stone-300">
          <div className="flex items-end gap-0">
            {(['easy', 'medium', 'scrum-master'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => changeDifficulty(d)}
                disabled={isLoadingFirst}
                className={`px-4 md:px-5 py-2.5 serif text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                  difficulty === d
                    ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                title={DIFFICULTY_BLURBS[d]}
              >
                {difficultyLabel(d, track.id)}
              </button>
            ))}
            <div className="ml-auto text-[10px] uppercase tracking-[0.2em] text-stone-500 italic serif pb-3 hidden sm:block">
              {DIFFICULTY_BLURBS[difficulty]}
            </div>
          </div>
        </div>
      </div>

      {isLoadingFirst && (
        <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-12 md:p-16 paper text-center">
          <Spinner className="w-10 h-10 mx-auto mb-5 text-stone-700" strokeWidth={1.8} />
          <p className="serif italic text-2xl md:text-3xl text-stone-700 mb-2" style={{ fontWeight: 400 }}>
            Composing {/^[aeiou]/i.test(difficultyLabel(difficulty, track.id)) ? 'an' : 'a'} {difficultyLabel(difficulty, track.id).toLowerCase()} question…
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">One moment, the model is thinking</p>
        </div>
      )}

      {error && (
        <div className="border border-rose-300 bg-rose-50/60 p-8 md:p-10">
          <p className="serif italic text-xl text-rose-900 mb-3" style={{ fontWeight: 400 }}>That one did not land.</p>
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
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Style · </span>
              <span className="serif italic text-base md:text-lg text-stone-800" style={{ fontWeight: 500 }}>
                {STYLE_LABELS[current.style] || current.style}
              </span>
            </div>
            <span className="text-xs text-stone-500 italic hidden sm:inline">{STYLE_BLURBS[current.style]}</span>
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
              <p className="text-sm text-stone-700 leading-relaxed serif italic">{current.selfCritique}</p>
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
