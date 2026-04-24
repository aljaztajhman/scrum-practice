import { useCallback, useEffect, useState } from 'react';
import ExitModal from '../components/ExitModal';
import QuizCard from '../components/QuizCard';
import QuizHeader from '../components/QuizHeader';
import Results, { type AnswerRecord } from '../components/Results';
import Welcome from '../components/Welcome';
import { ArrowLeft } from '../components/Icons';
import type { Question } from '../lib/schema';
import { TRACKS, type TrackId } from '../lib/tracks';
import { arraysEqualAsSets, shuffle } from '../lib/utils';

type Stage = 'welcome' | 'quiz' | 'results';

function scrollTop(smooth = false) {
  window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
}

export default function Home() {
  const [trackId, setTrackId] = useState<TrackId>('PSM1');
  const [stage, setStage] = useState<Stage>('welcome');
  const [count, setCount] = useState(20);
  const [pool, setPool] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [workingSelections, setWorkingSelections] = useState<Record<number, number[]>>({});
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const track = TRACKS[trackId];
  const current = pool[idx];
  const submittedAnswer = answers[idx];
  const locked = !!submittedAnswer;
  const selected = locked
    ? submittedAnswer!.selected
    : workingSelections[idx] ?? [];

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const incorrectCount = answeredCount - correctCount;

  const canSubmit = !locked && selected.length > 0;
  const canGoPrev = idx > 0;
  const canGoNext = locked;
  const isLastQuestion = pool.length > 0 && idx === pool.length - 1;

  const startQuiz = useCallback(
    (n: number) => {
      const shuffled = shuffle(track.questions).slice(0, n);
      setPool(shuffled);
      setIdx(0);
      setWorkingSelections({});
      setAnswers({});
      setCount(n);
      setStage('quiz');
      scrollTop();
    },
    [track.questions]
  );

  const resetToWelcome = useCallback(() => {
    setStage('welcome');
    setAnswers({});
    setWorkingSelections({});
    setIdx(0);
    setShowExitConfirm(false);
    scrollTop();
  }, []);

  const toggleOption = useCallback(
    (i: number) => {
      if (locked || !current) return;
      setWorkingSelections((prev) => {
        const cur = prev[idx] ?? [];
        const next =
          current.type === 'multi'
            ? cur.includes(i)
              ? cur.filter((x) => x !== i)
              : [...cur, i]
            : [i];
        return { ...prev, [idx]: next };
      });
    },
    [idx, locked, current]
  );

  const submitAnswer = useCallback(() => {
    if (!canSubmit || !current) return;
    const isCorrect = arraysEqualAsSets(selected, current.correct);
    setAnswers((prev) => ({
      ...prev,
      [idx]: { selected: [...selected], correct: isCorrect },
    }));
  }, [canSubmit, selected, current, idx]);

  const goNext = useCallback(() => {
    if (!locked) return;
    if (isLastQuestion) {
      setStage('results');
      scrollTop();
    } else {
      setIdx(idx + 1);
      scrollTop(true);
    }
  }, [locked, isLastQuestion, idx]);

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    setIdx(idx - 1);
    scrollTop(true);
  }, [canGoPrev, idx]);

  const requestExit = useCallback(() => {
    if (answeredCount > 0) {
      setShowExitConfirm(true);
    } else {
      resetToWelcome();
    }
  }, [answeredCount, resetToWelcome]);

  // Keyboard shortcuts
  useEffect(() => {
    if (stage !== 'quiz') return;
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
        if (locked) goNext();
        else if (canSubmit) submitAnswer();
      } else if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        goNext();
      } else if (/^[1-9]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (current && i < current.options.length) {
          e.preventDefault();
          toggleOption(i);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    stage,
    idx,
    locked,
    canSubmit,
    canGoPrev,
    canGoNext,
    current,
    showExitConfirm,
    requestExit,
    goNext,
    goPrev,
    submitAnswer,
    toggleOption,
  ]);

  return (
    <div className="app-bg w-full">
      {showExitConfirm && (
        <ExitModal
          answered={answeredCount}
          total={pool.length}
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={resetToWelcome}
        />
      )}

      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12">
        {stage === 'welcome' && (
          <header className="mb-10 md:mb-14">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-10 bg-stone-700"></div>
              <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">
                Scrum.org · Practice exam
              </span>
            </div>
            <h1
              className="serif text-5xl md:text-7xl text-stone-900 leading-[0.95] tracking-tight"
              style={{ fontWeight: 500 }}
            >
              The <span style={{ fontStyle: 'italic', fontWeight: 400 }}>practice</span> exam.
            </h1>
            <p
              className="serif text-xl md:text-2xl text-stone-600 mt-4 italic"
              style={{ fontWeight: 400 }}
            >
              {track.tagline}
            </p>
          </header>
        )}

        {stage === 'quiz' && current && (
          <QuizHeader
            track={track}
            idx={idx}
            total={pool.length}
            answeredCount={answeredCount}
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            onExit={requestExit}
          />
        )}

        {stage === 'results' && (
          <div className="mb-8 md:mb-10">
            <button
              onClick={resetToWelcome}
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
                Your results · {track.title}
              </span>
            </div>
          </div>
        )}

        {stage === 'welcome' && (
          <Welcome trackId={trackId} onSelectTrack={setTrackId} onStart={startQuiz} />
        )}

        {stage === 'quiz' && current && (
          <QuizCard
            track={track}
            question={current}
            selected={selected}
            locked={locked}
            canGoPrev={canGoPrev}
            canSubmit={canSubmit}
            isLastQuestion={isLastQuestion}
            onToggle={toggleOption}
            onSubmit={submitAnswer}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}

        {stage === 'results' && (
          <Results
            track={track}
            pool={pool}
            answers={answers}
            onRestart={resetToWelcome}
            onRetrySame={() => startQuiz(count)}
          />
        )}

        <footer className="mt-14 md:mt-16 pt-6 border-t border-stone-300">
          {stage === 'quiz' ? (
            <p className="hidden md:block text-[11px] text-stone-500 tracking-wide">
              <kbd>1</kbd>–<kbd>9</kbd> select · <kbd>↵</kbd> submit / next · <kbd>←</kbd>{' '}
              <kbd>→</kbd> navigate · <kbd>esc</kbd> exit
            </p>
          ) : (
            <p className="text-xs text-stone-500 serif italic">
              Real exam reference: 80 questions · 60 minutes · 85% to pass · based on the Scrum
              Guide 2020.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
