import type { Question } from '../lib/schema';

interface Props {
  pool: Question[];
  currentIdx: number;
  selections: Record<number, number[]>;
  flagged: Set<number>;
  onJumpTo: (idx: number) => void;
}

export default function MockNavigator({
  pool,
  currentIdx,
  selections,
  flagged,
  onJumpTo,
}: Props) {
  return (
    <div className="mt-6 md:mt-8 border-t border-stone-300 pt-6">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-600 mb-3">
        Question navigator
      </p>
      <div className="grid grid-cols-10 sm:grid-cols-16 gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(2.25rem, 1fr))' }}>
        {pool.map((_, i) => {
          const answered = (selections[i]?.length ?? 0) > 0;
          const isFlagged = flagged.has(i);
          const isCurrent = i === currentIdx;

          let cls = 'border-stone-300 bg-white text-stone-600 hover:border-stone-700';
          if (answered) cls = 'border-stone-900 bg-stone-900 text-stone-50 hover:bg-stone-700';
          if (isFlagged) cls = 'border-amber-600 bg-amber-600 text-white hover:bg-amber-700';
          if (isFlagged && answered)
            cls = 'border-amber-700 bg-amber-700 text-white hover:bg-amber-800';
          if (isCurrent) cls += ' ring-2 ring-offset-1 ring-stone-900';

          return (
            <button
              key={i}
              onClick={() => onJumpTo(i)}
              aria-label={`Go to question ${i + 1}${answered ? ' (answered)' : ''}${isFlagged ? ' (flagged)' : ''}`}
              className={`h-9 text-[11px] font-medium tabular-nums border transition-all ${cls}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border border-stone-300 bg-white"></span>
          Unanswered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border border-stone-900 bg-stone-900"></span>
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border border-amber-600 bg-amber-600"></span>
          Flagged
        </span>
      </div>
    </div>
  );
}
