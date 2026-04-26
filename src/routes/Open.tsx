import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, X, RotateCcw, Spinner } from '../components/Icons';
import PageShell from '../components/PageShell';
import ProUpgradePrompt from '../components/ProUpgradePrompt';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TRACKS, parseTrackId, type Track } from '../lib/tracks';

interface OpenQuestion {
  topic: string;
  scrumGuideSection: string;
  q: string;
  referenceAnswer: string;
  rubricKeyPoints: string[];
}

interface GradeResult {
  verdict: 'correct' | 'partial' | 'incorrect';
  score: number;
  feedback: string;
  hitKeyPoints: string[];
  missedKeyPoints: string[];
}

export default function Open() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = parseTrackId(cert);
  const { isLoggedIn, isPro, loading } = useAuth();
  if (!trackId) return <Navigate to="/" replace />;
  if (loading) return null;
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: `/open/${trackId}` }} replace />;
  }
  if (!isPro) {
    return (
      <ProUpgradePrompt
        eyebrow={`Open response · ${trackId}`}
        title="Open response is"
        italic="Pro only"
        pitch="No multiple-choice options. Answer in your own words; the AI grades you against the Scrum Guide. Active recall is the most effective way to actually master Scrum — and the hardest. Reserved for Pro."
        fineprint="Free tier covers Practice, Mock, Infinite, and full statistics. AI mode and Open response are the two Pro features."
      />
    );
  }
  const track = TRACKS[trackId];
  return <OpenSession track={track} />;
}

type Stage = 'loading' | 'answering' | 'grading' | 'graded' | 'error';

function OpenSession({ track }: { track: Track }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('loading');
  const [question, setQuestion] = useState<OpenQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ answered: 0, correct: 0, partial: 0 });
  const isMounted = useRef(true);
  const abortControllers = useRef<Set<AbortController>>(new Set());

  useEffect(() => {
    return () => {
      isMounted.current = false;
      for (const c of abortControllers.current) {
        try { c.abort(); } catch { /* noop */ }
      }
      abortControllers.current.clear();
    };
  }, []);

  const fetchQuestion = useCallback(async () => {
    setStage('loading');
    setError(null);
    setQuestion(null);
    setUserAnswer('');
    setGrade(null);
    const ctrl = new AbortController();
    abortControllers.current.add(ctrl);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch(`/api/generate-open-question?cert=${track.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = (await res.json()) as OpenQuestion;
      if (!isMounted.current) return;
      setQuestion(data);
      setStage('answering');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (!isMounted.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load question');
      setStage('error');
    } finally {
      abortControllers.current.delete(ctrl);
    }
  }, [track.id]);

  useEffect(() => {
    void fetchQuestion();
  }, [fetchQuestion]);

  const submitAnswer = async () => {
    if (!question || stage !== 'answering' || userAnswer.trim().length < 3) return;
    setStage('grading');
    setError(null);
    const ctrl = new AbortController();
    abortControllers.current.add(ctrl);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch('/api/grade-open-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          q: question.q,
          referenceAnswer: question.referenceAnswer,
          rubricKeyPoints: question.rubricKeyPoints,
          scrumGuideSection: question.scrumGuideSection,
          userAnswer: userAnswer.trim(),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = (await res.json()) as GradeResult;
      if (!isMounted.current) return;
      setGrade(data);
      setStats((s) => ({
        answered: s.answered + 1,
        correct: s.correct + (data.verdict === 'correct' ? 1 : 0),
        partial: s.partial + (data.verdict === 'partial' ? 1 : 0),
      }));
      setStage('graded');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      if (!isMounted.current) return;
      setError(e instanceof Error ? e.message : 'Grading failed');
      setStage('answering');
    } finally {
      abortControllers.current.delete(ctrl);
    }
  };

  const verdictColor =
    grade?.verdict === 'correct'
      ? 'border-emerald-700 bg-emerald-50/60'
      : grade?.verdict === 'partial'
      ? 'border-amber-600 bg-amber-50/60'
      : 'border-rose-700 bg-rose-50/60';

  const verdictLabel =
    grade?.verdict === 'correct' ? 'Correct' : grade?.verdict === 'partial' ? 'Partial credit' : 'Incorrect';

  return (
    <PageShell
      footer={
        <p className="text-xs text-stone-500 serif italic">
          AI-graded · grounded in Scrum Guide 2020 · the AI can be wrong, trust the reference answer.
        </p>
      }
    >
      {/* Header */}
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
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {track.title} · Open response
            </span>
            <span className="hidden md:inline text-stone-300">·</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{stats.correct}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="tabular-nums font-medium">~{stats.partial}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-800">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{stats.answered - stats.correct - stats.partial}</span>
            </span>
            <span className="text-stone-400">·</span>
            <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
              <span className="serif text-stone-900">{stats.answered}</span>
              <span className="text-stone-400"> answered</span>
            </span>
          </div>
        </div>
      </div>

      {stage === 'loading' && (
        <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-12 md:p-16 paper text-center">
          <Spinner className="w-10 h-10 mx-auto mb-5 text-stone-700" strokeWidth={1.8} />
          <p className="serif italic text-2xl md:text-3xl text-stone-700 mb-2" style={{ fontWeight: 400 }}>
            Composing a question…
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            One moment, the model is thinking
          </p>
        </div>
      )}

      {stage === 'error' && error && (
        <div className="border border-rose-300 bg-rose-50/60 p-8 md:p-10">
          <p className="serif italic text-xl text-rose-900 mb-3" style={{ fontWeight: 400 }}>
            That one did not land.
          </p>
          <p className="text-sm text-stone-700 leading-relaxed mb-6">{error}</p>
          <button
            onClick={() => void fetchQuestion()}
            className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /> Try again
          </button>
        </div>
      )}

      {question && (stage === 'answering' || stage === 'grading' || stage === 'graded') && (
        <div className="space-y-5">
          {/* Question card */}
          <div className="border border-stone-300 bg-white/60 p-6 md:p-8">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
                {question.topic}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400">
                {question.scrumGuideSection}
              </span>
            </div>
            <p className="serif text-xl md:text-2xl text-stone-900 leading-relaxed" style={{ fontWeight: 500 }}>
              {question.q}
            </p>
          </div>

          {/* Answer area */}
          {(stage === 'answering' || stage === 'grading') && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-stone-600 mb-2 block">
                  Your answer
                </span>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={stage === 'grading'}
                  rows={8}
                  maxLength={4000}
                  placeholder="Type your answer in your own words. Aim for 50-150 words."
                  className="w-full border border-stone-400 bg-white/60 px-4 py-3 serif text-base leading-relaxed focus:outline-none focus:border-stone-900 disabled:opacity-60 resize-y"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      void submitAnswer();
                    }
                  }}
                />
              </label>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-stone-500 tabular-nums">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words ·{' '}
                  <span className="hidden sm:inline">
                    <kbd className="px-1.5 py-0.5 border border-stone-400 text-[10px]">⌘</kbd>+
                    <kbd className="px-1.5 py-0.5 border border-stone-400 text-[10px]">Enter</kbd> to submit
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void submitAnswer()}
                  disabled={stage === 'grading' || userAnswer.trim().length < 3}
                  className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-stone-800 disabled:opacity-60 transition-colors"
                >
                  {stage === 'grading' && <Spinner className="w-4 h-4" />}
                  {stage === 'grading' ? 'Grading…' : 'Submit answer'}
                </button>
              </div>
            </div>
          )}

          {/* Verdict */}
          {stage === 'graded' && grade && (
            <div className="space-y-5">
              <div className={`border-l-4 ${verdictColor} p-5 md:p-6`}>
                <div className="flex items-baseline justify-between mb-3 gap-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-stone-700">{verdictLabel}</span>
                  <span className="serif text-2xl text-stone-900 tabular-nums" style={{ fontWeight: 500 }}>
                    {grade.score}<span className="text-stone-500 text-base">/10</span>
                  </span>
                </div>
                <p className="serif italic text-stone-800 leading-relaxed" style={{ fontWeight: 400 }}>
                  {grade.feedback}
                </p>
              </div>

              {grade.hitKeyPoints.length > 0 && (
                <div className="border border-stone-300 bg-white/40 p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-800 mb-3">
                    What you got right
                  </p>
                  <ul className="space-y-1 text-sm text-stone-800">
                    {grade.hitKeyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-1 text-emerald-700 flex-shrink-0" strokeWidth={2.5} />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {grade.missedKeyPoints.length > 0 && (
                <div className="border border-stone-300 bg-white/40 p-5">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-rose-800 mb-3">
                    What you missed
                  </p>
                  <ul className="space-y-1 text-sm text-stone-800">
                    {grade.missedKeyPoints.map((kp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <X className="w-3.5 h-3.5 mt-1 text-rose-700 flex-shrink-0" strokeWidth={2.5} />
                        <span>{kp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Reference answer */}
              <div className="border border-stone-300 bg-stone-50/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3">
                  Reference answer · grounded in {question.scrumGuideSection}
                </p>
                <p className="serif italic text-stone-800 leading-relaxed text-sm" style={{ fontWeight: 400 }}>
                  {question.referenceAnswer}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchQuestion()}
                className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-stone-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /> Next question
              </button>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
