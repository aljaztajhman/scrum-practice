import type { Track } from '../lib/tracks';
import { ArrowLeft, Check, X } from './Icons';

interface Props {
  track: Track;
  idx: number;
  total: number;
  answeredCount: number;
  correctCount: number;
  incorrectCount: number;
  onExit: () => void;
}

export default function QuizHeader({
  track,
  idx,
  total,
  answeredCount,
  correctCount,
  incorrectCount,
  onExit,
}: Props) {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4 gap-2">
        <button
          onClick={onExit}
          className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1"
          aria-label="Exit quiz and return to start"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          Exit
        </button>
        <div className="flex items-center gap-2.5 md:gap-4 text-xs">
          <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">
            {track.title}
          </span>
          <span className="hidden md:inline text-stone-300">·</span>
          <span className="flex items-center gap-1 text-emerald-800" aria-label={`${correctCount} correct`}>
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="tabular-nums font-medium">{correctCount}</span>
          </span>
          <span className="flex items-center gap-1 text-rose-800" aria-label={`${incorrectCount} incorrect`}>
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span className="tabular-nums font-medium">{incorrectCount}</span>
          </span>
          <span className="text-stone-400">·</span>
          <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
            <span className="serif text-stone-900">{idx + 1}</span>
            <span className="text-stone-400">/{total}</span>
          </span>
        </div>
      </div>
      <div
        className="h-0.5 bg-stone-300 relative overflow-hidden"
        role="progressbar"
        aria-valuenow={answeredCount}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="absolute inset-y-0 left-0 bg-stone-900 transition-all duration-500"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
