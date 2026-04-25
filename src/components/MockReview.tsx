import { tr, type Question } from '../lib/schema';
import { useLanguage } from '../i18n/LanguageContext';
import { ChevronRight } from './Icons';

interface Props {
  pool: Question[];
  selections: Record<number, number[]>;
  flagged: Set<number>;
  remainingLabel: string;
  onJumpTo: (idx: number) => void;
  onSubmit: () => void;
  onResume: () => void;
}

export default function MockReview({
  pool,
  selections,
  flagged,
  remainingLabel,
  onJumpTo,
  onSubmit,
  onResume,
}: Props) {
  const unansweredIdx: number[] = [];
  const flaggedIdx: number[] = [];
  pool.forEach((_, i) => {
    if ((selections[i]?.length ?? 0) === 0) unansweredIdx.push(i);
    if (flagged.has(i)) flaggedIdx.push(i);
  });

  const answered = pool.length - unansweredIdx.length;
  const canSubmit = true;

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="border border-stone-300 bg-white/70 p-8 md:p-10 paper">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-600 mb-4">
          Review before submit
        </p>
        <h2
          className="serif text-3xl md:text-5xl text-stone-900 leading-tight mb-3"
          style={{ fontWeight: 500 }}
        >
          Are you sure you're{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 400 }}>done?</span>
        </h2>
        <p className="serif text-lg md:text-xl text-stone-700 italic" style={{ fontWeight: 400 }}>
          You've answered <span className="text-stone-900 font-medium">{answered}</span> of{' '}
          {pool.length} questions.
          {flaggedIdx.length > 0 && (
            <>
              {' '}
              <span className="text-stone-900 font-medium">{flaggedIdx.length}</span> flagged for
              review.
            </>
          )}
        </p>
        <p className="text-xs uppercase tracking-widest text-stone-500 mt-4">
          Time remaining · {remainingLabel}
        </p>
      </div>

      {unansweredIdx.length > 0 && (
        <ReviewSection
          title={`Unanswered (${unansweredIdx.length})`}
          accent="border-rose-700"
          indices={unansweredIdx}
          pool={pool}
          flagged={flagged}
          onJumpTo={onJumpTo}
        />
      )}

      {flaggedIdx.length > 0 && (
        <ReviewSection
          title={`Flagged (${flaggedIdx.length})`}
          accent="border-amber-600"
          indices={flaggedIdx}
          pool={pool}
          flagged={flagged}
          onJumpTo={onJumpTo}
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={onResume}
          className="flex-1 border border-stone-900 text-stone-900 px-6 py-4 text-sm uppercase tracking-widest hover:bg-stone-100 transition-colors"
        >
          Keep going
        </button>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex-1 bg-stone-900 text-stone-50 px-6 py-4 text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
        >
          Submit exam <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

interface ReviewSectionProps {
  title: string;
  accent: string;
  indices: number[];
  pool: Question[];
  flagged: Set<number>;
  onJumpTo: (idx: number) => void;
}

function ReviewSection({ title, accent, indices, pool, onJumpTo }: ReviewSectionProps) {
  const { lang } = useLanguage();
  return (
    <div>
      <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-4">{title}</p>
      <div className="space-y-2">
        {indices.map((i) => (
          <button
            key={i}
            onClick={() => onJumpTo(i)}
            className={`w-full text-left border-l-4 ${accent} border-y border-r border-stone-300 bg-white/60 hover:bg-white px-4 py-3 transition-colors flex items-center gap-3`}
          >
            <span className="text-xs uppercase tracking-widest text-stone-500 tabular-nums shrink-0 w-10">
              Q{i + 1}
            </span>
            <span className="text-sm text-stone-800 truncate flex-1">{tr(pool[i]!.q, lang)}</span>
            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  );
}
