import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSequentialQuiz } from '../lib/quiz-engine';
import { useAttemptLogger, type AttemptSource } from '../lib/attempt-logger';
import type { Question } from '../lib/schema';
import type { Track } from '../lib/tracks';
import ExitModal from './ExitModal';
import QuizCard from './QuizCard';
import QuizHeader from './QuizHeader';
import Results from './Results';

function scrollTop(smooth = false) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
}

interface Props {
  track: Track;
  pool: Question[];
  onExitPath: string;
  onRestart: () => void;
  onChangeConfig: () => void;
  source?: AttemptSource;
}

export default function SequentialRunner({
  track,
  pool,
  onExitPath,
  onRestart,
  onChangeConfig,
  source = 'practice',
}: Props) {
  const logAttempt = useAttemptLogger(track.id, source);
  const engine = useSequentialQuiz(pool, {
    onAnswered: (q, selected, correct) => {
      void logAttempt(q, selected, correct);
    },
  });
  const navigate = useNavigate();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const requestExit = useCallback(() => {
    if (engine.answeredCount > 0) setShowExitConfirm(true);
    else navigate(onExitPath);
  }, [engine.answeredCount, navigate, onExitPath]);

  useEffect(() => {
    scrollTop();
  }, [engine.idx, engine.stage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (engine.stage !== 'quiz') return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (showExitConfirm) {
        if (e.key === 'Escape') setShowExitConfirm(false);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        requestExit();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (engine.locked) engine.goNext();
        else if (engine.canSubmit) engine.submitAnswer();
      } else if (e.key === 'ArrowLeft' && engine.canGoPrev) {
        e.preventDefault();
        engine.goPrev();
      } else if (e.key === 'ArrowRight' && engine.canGoNext) {
        e.preventDefault();
        engine.goNext();
      } else if (/^[1-9]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (engine.current && i < engine.current.options.length) {
          e.preventDefault();
          engine.toggleOption(i);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [engine, showExitConfirm, requestExit]);

  const { stage, current } = engine;

  if (stage === 'results') {
    return (
      <Results
        track={track}
        pool={engine.pool}
        answers={engine.answers}
        onRestart={onChangeConfig}
        onRetrySame={onRestart}
      />
    );
  }

  if (!current) return null;

  return (
    <>
      {showExitConfirm && (
        <ExitModal
          answered={engine.answeredCount}
          total={engine.pool.length}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => navigate(onExitPath)}
        />
      )}
      <QuizHeader
        track={track}
        idx={engine.idx}
        total={engine.pool.length}
        answeredCount={engine.answeredCount}
        correctCount={engine.correctCount}
        incorrectCount={engine.incorrectCount}
        onExit={requestExit}
      />
      <QuizCard
        track={track}
        question={current}
        selected={engine.selected}
        locked={engine.locked}
        canGoPrev={engine.canGoPrev}
        canSubmit={engine.canSubmit}
        isLastQuestion={engine.isLastQuestion}
        onToggle={engine.toggleOption}
        onSubmit={engine.submitAnswer}
        onNext={engine.goNext}
        onPrev={engine.goPrev}
      />
    </>
  );
}
