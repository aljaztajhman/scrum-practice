import { tr, type Question } from '../lib/schema';
import type { Track } from '../lib/tracks';
import { arraysEqualAsSets } from '../lib/utils';
import { useLanguage } from '../i18n/LanguageContext';
import { Check, X, ChevronLeft, ChevronRight } from './Icons';

interface Props {
  track: Track;
  question: Question;
  selected: number[];
  locked: boolean;
  canGoPrev: boolean;
  canSubmit: boolean;
  isLastQuestion: boolean;
  onToggle: (i: number) => void;
  onSubmit: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function QuizCard({
  track,
  question,
  selected,
  locked,
  canGoPrev,
  canSubmit,
  isLastQuestion,
  onToggle,
  onSubmit,
  onNext,
  onPrev,
}: Props) {
  const { lang } = useLanguage();
  const isCorrect = locked && arraysEqualAsSets(selected, question.correct);

  return (
    <div>
      <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-6 md:p-10 paper">
        <div className="flex items-center justify-between mb-4 gap-3">
          <p className="text-xs uppercase tracking-widest text-stone-500">
            {question.type === 'multi'
              ? 'Select all that apply'
              : question.type === 'tf'
                ? 'True or False'
                : 'Choose one'}
          </p>
          <span
            className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
              track.topicAccent[question.topic] || 'bg-stone-100 border-stone-300'
            }`}
          >
            {question.topic}
          </span>
        </div>

        <h2
          className="serif text-2xl md:text-3xl text-stone-900 leading-snug mb-8"
          style={{ fontWeight: 500 }}
        >
          {tr(question.q, lang)}
        </h2>

        <div className="space-y-2.5" role="group" aria-label="Answer options">
          {question.options.map((opt, i) => {
            const isSel = selected.includes(i);
            const isRight = question.correct.includes(i);
            const showAsCorrect = locked && isRight;
            const showAsWrong = locked && isSel && !isRight;

            let cls = 'border-stone-300 bg-white hover:border-stone-900 hover:bg-stone-50';
            if (isSel && !locked) cls = 'border-stone-900 bg-stone-100';
            if (showAsCorrect) cls = 'border-emerald-700 bg-emerald-50';
            if (showAsWrong) cls = 'border-rose-700 bg-rose-50';

            return (
              <button
                key={i}
                onClick={() => onToggle(i)}
                disabled={locked}
                aria-pressed={isSel}
                className={`w-full text-left border-l-4 border-y border-r px-4 md:px-5 py-3.5 transition-all duration-150 flex items-start gap-3 ${cls} ${
                  locked ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span
                  className={`shrink-0 w-6 h-6 border flex items-center justify-center mt-0.5 text-xs ${
                    showAsCorrect
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : showAsWrong
                        ? 'border-rose-700 bg-rose-700 text-white'
                        : isSel
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-400 text-transparent'
                  }`}
                  style={{ borderRadius: question.type === 'multi' ? '2px' : '50%' }}
                >
                  {showAsCorrect ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : showAsWrong ? (
                    <X className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : isSel ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : null}
                </span>
                <span className="text-stone-800 text-sm md:text-base leading-relaxed">{tr(opt, lang)}</span>
              </button>
            );
          })}
        </div>

        {locked && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-7 border-l-4 pl-5 py-4 pr-5 slide-up ${
              isCorrect ? 'border-emerald-700 bg-emerald-50/60' : 'border-rose-700 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" strokeWidth={2.5} />
                  <span className="serif italic text-emerald-900 text-lg">Correct.</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-rose-700" strokeWidth={2.5} />
                  <span className="serif italic text-rose-900 text-lg">Not quite.</span>
                </>
              )}
            </div>
            <p className="text-sm text-stone-800 leading-relaxed">{tr(question.why, lang)}</p>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Previous question"
          className="flex items-center gap-2 px-4 md:px-5 py-3 text-xs uppercase tracking-widest border border-stone-400 text-stone-700 hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <span className="text-xs text-stone-500 uppercase tracking-wider hidden sm:block">
          {question.type === 'multi' && !locked && selected.length > 0
            ? `${selected.length} selected`
            : ''}
        </span>

        {!locked ? (
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="bg-stone-900 text-stone-50 px-6 py-3 text-xs md:text-sm uppercase tracking-widest hover:bg-amber-700 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit answer
          </button>
        ) : (
          <button
            onClick={onNext}
            className="bg-stone-900 text-stone-50 px-6 py-3 text-xs md:text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            {isLastQuestion ? 'See results' : 'Next'}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
