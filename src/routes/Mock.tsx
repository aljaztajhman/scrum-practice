import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import ExitModal from '../components/ExitModal';
import { ArrowLeft } from '../components/Icons';
import MockNavigator from '../components/MockNavigator';
import MockQuizCard from '../components/MockQuizCard';
import MockReview from '../components/MockReview';
import MockTimer from '../components/MockTimer';
import PageShell from '../components/PageShell';
import Results from '../components/Results';
import { formatDuration, useMockExam } from '../lib/quiz-engine';
import { MOCK_EXAM_DURATION_MS, MOCK_EXAM_QUESTION_COUNT } from '../lib/modes';
import { TRACKS, type TrackId } from '../lib/tracks';
import { shuffle } from '../lib/utils';

function scrollTop() { window.scrollTo({ top: 0, behavior: 'instant' }); }

export default function Mock() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];
  const [sessionKey, setSessionKey] = useState(0);
  if (!track) return <Navigate to="/" replace />;
  return <MockSession key={sessionKey} track={track} onRestart={() => setSessionKey((k) => k + 1)} />;
}

function MockSession({ track, onRestart }: { track: (typeof TRACKS)[TrackId]; onRestart: () => void }) {
  const navigate = useNavigate();
  const pool = useMemo(() => shuffle(track.questions).slice(0, MOCK_EXAM_QUESTION_COUNT), [track.questions]);
  const engine = useMockExam(pool, MOCK_EXAM_DURATION_MS);
  const [stage, setStage] = useState<'quiz' | 'review'>('quiz');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const requestExit = useCallback(() => {
    if (engine.answeredCount > 0 && !engine.finished) setShowExitConfirm(true);
    else navigate('/');
  }, [engine.answeredCount, engine.finished, navigate]);

  useEffect(() => { scrollTop(); }, [engine.idx, stage, engine.finished]);

  useEffect(() => {
    if (engine.finished) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (showExitConfirm) { if (e.key === 'Escape') setShowExitConfirm(false); return; }
      if (stage === 'review') { if (e.key === 'Escape') setStage('quiz'); return; }
      if (e.key === 'Escape') { e.preventDefault(); requestExit(); }
      else if (e.key === 'ArrowLeft' && engine.idx > 0) { e.preventDefault(); engine.goPrev(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (engine.idx < engine.pool.length - 1) engine.goNext(); else setStage('review'); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); engine.toggleFlag(); }
      else if (/^[1-9]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (engine.current && i < engine.current.options.length) { e.preventDefault(); engine.toggleOption(i); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, stage, showExitConfirm, requestExit]);

  if (engine.finished && engine.finalAnswers) {
    return (
      <PageShell>
        <div className="mb-8 md:mb-10">
          <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1 mb-5">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
            Back to start
          </button>
          <div className="flex items-center gap-2">
            <div className="h-px w-10 bg-stone-700"></div>
            <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">Mock exam results · {track.title}</span>
          </div>
        </div>
        <Results track={track} pool={engine.pool} answers={engine.finalAnswers} onRestart={() => navigate('/')} onRetrySame={onRestart} />
      </PageShell>
    );
  }

  const commonHeader = (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button onClick={requestExit} className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1" aria-label="Exit mock exam">
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          Exit
        </button>
        <div className="flex items-center gap-3 md:gap-4 text-xs">
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">{track.title} · Mock</span>
          <span className="hidden md:inline text-stone-300">·</span>
          <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
            <span className="serif text-stone-900">{engine.answeredCount}</span><span className="text-stone-400">/{engine.pool.length} answered</span>
          </span>
          {engine.flaggedCount > 0 && (
            <>
              <span className="text-stone-400">·</span>
              <span className="uppercase tracking-[0.15em] text-amber-800 tabular-nums">{engine.flaggedCount} flagged</span>
            </>
          )}
          <span className="text-stone-400">·</span>
          <span className="text-base md:text-lg"><MockTimer remainingMs={engine.remainingMs} /></span>
        </div>
      </div>
      <div className="h-0.5 bg-stone-300 relative overflow-hidden" role="progressbar" aria-valuenow={engine.answeredCount} aria-valuemin={0} aria-valuemax={engine.pool.length}>
        <div className="absolute inset-y-0 left-0 bg-stone-900 transition-all duration-500" style={{ width: `${(engine.answeredCount / engine.pool.length) * 100}%` }} />
      </div>
    </div>
  );

  if (stage === 'review') {
    return (
      <PageShell footer={<p className="hidden md:block text-[11px] text-stone-500 tracking-wide"><kbd>esc</kbd> keep going</p>}>
        {showExitConfirm && <ExitModal answered={engine.answeredCount} total={engine.pool.length} onCancel={() => setShowExitConfirm(false)} onConfirm={() => navigate('/')} />}
        {commonHeader}
        <MockReview pool={engine.pool} selections={engine.selections} flagged={engine.flagged} remainingLabel={formatDuration(engine.remainingMs)}
          onJumpTo={(i) => { engine.goTo(i); setStage('quiz'); }} onSubmit={() => engine.finish()} onResume={() => setStage('quiz')} />
      </PageShell>
    );
  }
  if (!engine.current) return null;
  return (
    <PageShell footer={<p className="hidden md:block text-[11px] text-stone-500 tracking-wide"><kbd>1</kbd>–<kbd>9</kbd> select · <kbd>f</kbd> flag · <kbd>←</kbd> <kbd>→</kbd> navigate · <kbd>esc</kbd> exit · real exam: 80 Q · 60 min · 85% to pass</p>}>
      {showExitConfirm && <ExitModal answered={engine.answeredCount} total={engine.pool.length} onCancel={() => setShowExitConfirm(false)} onConfirm={() => navigate('/')} />}
      {commonHeader}
      <MockQuizCard track={track} question={engine.current} selected={engine.selections[engine.idx] ?? []} flagged={engine.flagged.has(engine.idx)}
        canGoPrev={engine.idx > 0} canGoNext={engine.idx < engine.pool.length - 1}
        onToggle={engine.toggleOption} onToggleFlag={engine.toggleFlag} onNext={engine.goNext} onPrev={engine.goPrev}
        onReview={() => setStage('review')} questionNumber={engine.idx + 1} totalQuestions={engine.pool.length} />
      <MockNavigator pool={engine.pool} currentIdx={engine.idx} selections={engine.selections} flagged={engine.flagged} onJumpTo={engine.goTo} />
    </PageShell>
  );
}
