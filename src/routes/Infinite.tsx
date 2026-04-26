import { useCallback, useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import ExitModal from '../components/ExitModal';
import { ArrowLeft, Check, X } from '../components/Icons';
import PageShell from '../components/PageShell';
import QuizCard from '../components/QuizCard';
import Results from '../components/Results';
import { useInfiniteQuiz } from '../lib/quiz-engine';
import { TRACKS, parseTrackId, type TrackId } from '../lib/tracks';

function scrollTop(smooth = false) { window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' }); }

export default function Infinite() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = parseTrackId(cert);
  const [sessionKey, setSessionKey] = useState(0);
  if (!trackId) return <Navigate to="/" replace />;
  const track = TRACKS[trackId];
  return <InfiniteSession key={sessionKey} track={track} onRestart={() => setSessionKey((k) => k + 1)} />;
}

function InfiniteSession({ track, onRestart }: { track: (typeof TRACKS)[TrackId]; onRestart: () => void }) {
  const navigate = useNavigate();
  const engine = useInfiniteQuiz(track.questions);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const requestExit = useCallback(() => {
    if (engine.answeredCount > 0) setShowExitConfirm(true);
    else navigate('/');
  }, [engine.answeredCount, navigate]);
  useEffect(() => { scrollTop(); }, [engine.history.length, engine.stage]);
  useEffect(() => {
    if (engine.stage !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (showExitConfirm) { if (e.key === 'Escape') setShowExitConfirm(false); return; }
      if (e.key === 'Escape') { e.preventDefault(); requestExit(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (engine.locked) engine.nextQuestion();
        else if (engine.canSubmit) engine.submitAnswer();
      } else if (/^[1-9]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (i < engine.current.options.length) { e.preventDefault(); engine.toggleOption(i); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, showExitConfirm, requestExit]);

  if (engine.stage === 'results') {
    const pool = engine.history.map((h) => h.question);
    const answers: Record<number, { selected: number[]; correct: boolean }> = {};
    engine.history.forEach((h, i) => { answers[i] = { selected: h.selected, correct: h.correct }; });
    return (
      <PageShell>
        <div className="mb-8 md:mb-10">
          <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1 mb-5">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Back to start
          </button>
          <div className="flex items-center gap-2">
            <div className="h-px w-10 bg-stone-700"></div>
            <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">Infinite session · {track.title}</span>
          </div>
        </div>
        <Results track={track} pool={pool} answers={answers} onRestart={() => navigate('/')} onRetrySame={onRestart} />
      </PageShell>
    );
  }

  const incorrect = engine.answeredCount - engine.correctCount;
  return (
    <PageShell>
      {showExitConfirm && <ExitModal answered={engine.answeredCount} total={engine.answeredCount} onCancel={() => setShowExitConfirm(false)} onConfirm={() => { setShowExitConfirm(false); engine.stopAndReview(); }} />}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button onClick={requestExit} className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Stop
          </button>
          <div className="flex items-center gap-2.5 md:gap-4 text-xs">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">{track.title} · Infinite</span>
            <span className="hidden md:inline text-stone-300">·</span>
            <span className="flex items-center gap-1 text-emerald-800"><Check className="w-3.5 h-3.5" strokeWidth={2.5} /><span className="tabular-nums font-medium">{engine.correctCount}</span></span>
            <span className="flex items-center gap-1 text-rose-800"><X className="w-3.5 h-3.5" strokeWidth={2.5} /><span className="tabular-nums font-medium">{incorrect}</span></span>
            <span className="text-stone-400">·</span>
            <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
              <span className="serif text-stone-900">{engine.answeredCount}</span><span className="text-stone-400"> answered</span>
            </span>
          </div>
        </div>
      </div>
      <QuizCard track={track} question={engine.current} selected={engine.selected} locked={engine.locked} canGoPrev={false} canSubmit={engine.canSubmit} isLastQuestion={false}
        onToggle={engine.toggleOption} onSubmit={engine.submitAnswer} onNext={engine.nextQuestion} onPrev={() => {}} />
    </PageShell>
  );
}
