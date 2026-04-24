import { useCallback, useEffect, useState } from 'react';
import type { Question } from './schema';
import { arraysEqualAsSets, shuffle } from './utils';

export interface AnswerRecord {
  selected: number[];
  correct: boolean;
}

// ========== Sequential quiz (Practice, Drill) ==========

interface SequentialState {
  pool: Question[];
  idx: number;
  current: Question | undefined;
  selected: number[];
  locked: boolean;
  answers: Record<number, AnswerRecord>;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  canSubmit: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  stage: 'quiz' | 'results';
}

interface SequentialActions {
  toggleOption: (i: number) => void;
  submitAnswer: () => void;
  goNext: () => void;
  goPrev: () => void;
  finish: () => void;
  reset: () => void;
}

export function useSequentialQuiz(
  initialPool: Question[]
): SequentialState & SequentialActions {
  const [pool] = useState(initialPool);
  const [idx, setIdx] = useState(0);
  const [workingSelections, setWorkingSelections] = useState<Record<number, number[]>>({});
  const [answers, setAnswers] = useState<Record<number, AnswerRecord>>({});
  const [stage, setStage] = useState<'quiz' | 'results'>('quiz');

  const current = pool[idx];
  const submitted = answers[idx];
  const locked = !!submitted;
  const selected = locked ? submitted!.selected : (workingSelections[idx] ?? []);

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;
  const incorrectCount = answeredCount - correctCount;

  const canSubmit = !locked && selected.length > 0;
  const canGoPrev = idx > 0;
  const canGoNext = locked;
  const isLastQuestion = pool.length > 0 && idx === pool.length - 1;

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

  const finish = useCallback(() => setStage('results'), []);

  const goNext = useCallback(() => {
    if (!locked) return;
    if (isLastQuestion) {
      finish();
    } else {
      setIdx((i) => i + 1);
    }
  }, [locked, isLastQuestion, finish]);

  const goPrev = useCallback(() => {
    if (idx > 0) setIdx((i) => i - 1);
  }, [idx]);

  const reset = useCallback(() => {
    setIdx(0);
    setWorkingSelections({});
    setAnswers({});
    setStage('quiz');
  }, []);

  return {
    pool,
    idx,
    current,
    selected,
    locked,
    answers,
    answeredCount,
    correctCount,
    incorrectCount,
    canSubmit,
    canGoPrev,
    canGoNext,
    isLastQuestion,
    stage,
    toggleOption,
    submitAnswer,
    goNext,
    goPrev,
    finish,
    reset,
  };
}

// ========== Infinite quiz (endless shuffle) ==========

interface InfiniteEntry {
  question: Question;
  selected: number[];
  correct: boolean;
}

interface InfiniteState {
  current: Question;
  selected: number[];
  locked: boolean;
  history: InfiniteEntry[];
  answeredCount: number;
  correctCount: number;
  stage: 'quiz' | 'results';
  canSubmit: boolean;
}

interface InfiniteActions {
  toggleOption: (i: number) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  stopAndReview: () => void;
}

const RECENT_AVOIDANCE = 10;

export function useInfiniteQuiz(allQuestions: Question[]): InfiniteState & InfiniteActions {
  const [queue, setQueue] = useState<Question[]>(() => shuffle(allQuestions));
  const [idxInQueue, setIdxInQueue] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [history, setHistory] = useState<InfiniteEntry[]>([]);
  const [stage, setStage] = useState<'quiz' | 'results'>('quiz');

  const current = queue[idxInQueue]!;

  const toggleOption = useCallback(
    (i: number) => {
      if (locked) return;
      setSelected((prev) =>
        current.type === 'multi'
          ? prev.includes(i)
            ? prev.filter((x) => x !== i)
            : [...prev, i]
          : [i]
      );
    },
    [locked, current]
  );

  const submitAnswer = useCallback(() => {
    if (locked || selected.length === 0) return;
    const isCorrect = arraysEqualAsSets(selected, current.correct);
    setHistory((h) => [...h, { question: current, selected: [...selected], correct: isCorrect }]);
    setLocked(true);
  }, [locked, selected, current]);

  const nextQuestion = useCallback(() => {
    // Re-shuffle when near the end, avoiding recent duplicates
    const recent = history.slice(-RECENT_AVOIDANCE).map((h) => h.question.id);
    let nextIdx = idxInQueue + 1;
    if (nextIdx >= queue.length) {
      let reshuffled = shuffle(allQuestions);
      // rotate so the first element isn't in the recent history
      let guard = 0;
      while (reshuffled[0] && recent.includes(reshuffled[0].id) && guard++ < 20) {
        reshuffled = shuffle(allQuestions);
      }
      setQueue(reshuffled);
      nextIdx = 0;
    } else if (queue[nextIdx] && recent.includes(queue[nextIdx]!.id)) {
      // swap current with a later non-recent question when possible
      const swapAt = queue.findIndex(
        (q, i) => i > nextIdx && !recent.includes(q.id)
      );
      if (swapAt >= 0) {
        const copy = [...queue];
        [copy[nextIdx], copy[swapAt]] = [copy[swapAt]!, copy[nextIdx]!];
        setQueue(copy);
      }
    }
    setIdxInQueue(nextIdx);
    setSelected([]);
    setLocked(false);
  }, [idxInQueue, queue, allQuestions, history]);

  const stopAndReview = useCallback(() => setStage('results'), []);

  const answeredCount = history.length;
  const correctCount = history.filter((h) => h.correct).length;
  const canSubmit = !locked && selected.length > 0;

  return {
    current,
    selected,
    locked,
    history,
    answeredCount,
    correctCount,
    stage,
    canSubmit,
    toggleOption,
    submitAnswer,
    nextQuestion,
    stopAndReview,
  };
}

// ========== Mock exam (timed, no feedback, flag/review) ==========

interface MockState {
  pool: Question[];
  idx: number;
  current: Question | undefined;
  selections: Record<number, number[]>;
  flagged: Set<number>;
  remainingMs: number;
  finished: boolean;
  finalAnswers: Record<number, AnswerRecord> | null;
  answeredCount: number;
  flaggedCount: number;
}

interface MockActions {
  toggleOption: (i: number) => void;
  toggleFlag: () => void;
  goTo: (idx: number) => void;
  goNext: () => void;
  goPrev: () => void;
  finish: () => void;
}

export function useMockExam(
  pool: Question[],
  durationMs: number
): MockState & MockActions {
  const [idx, setIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, number[]>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [startedAt] = useState<number>(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [finalAnswers, setFinalAnswers] = useState<Record<number, AnswerRecord> | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [finished]);

  const elapsed = now - startedAt;
  const remainingMs = Math.max(0, durationMs - elapsed);

  const current = pool[idx];

  const finalize = useCallback(() => {
    const answers: Record<number, AnswerRecord> = {};
    pool.forEach((q, i) => {
      const sel = selections[i] ?? [];
      answers[i] = {
        selected: [...sel],
        correct: sel.length > 0 && arraysEqualAsSets(sel, q.correct),
      };
    });
    setFinalAnswers(answers);
    setFinished(true);
  }, [pool, selections]);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (!finished && remainingMs <= 0) {
      finalize();
    }
  }, [remainingMs, finished, finalize]);

  const toggleOption = useCallback(
    (i: number) => {
      if (finished || !current) return;
      setSelections((prev) => {
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
    [idx, finished, current]
  );

  const toggleFlag = useCallback(() => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, [idx]);

  const goTo = useCallback(
    (n: number) => {
      if (n < 0 || n >= pool.length) return;
      setIdx(n);
    },
    [pool.length]
  );

  const goNext = useCallback(() => {
    if (idx < pool.length - 1) setIdx(idx + 1);
  }, [idx, pool.length]);

  const goPrev = useCallback(() => {
    if (idx > 0) setIdx(idx - 1);
  }, [idx]);

  const answeredCount = Object.values(selections).filter((s) => s.length > 0).length;

  return {
    pool,
    idx,
    current,
    selections,
    flagged,
    remainingMs,
    finished,
    finalAnswers,
    answeredCount,
    flaggedCount: flagged.size,
    toggleOption,
    toggleFlag,
    goTo,
    goNext,
    goPrev,
    finish: finalize,
  };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
