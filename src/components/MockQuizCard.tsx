import { tr, type Question } from '../lib/schema';
import type { Track } from '../lib/tracks';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { Check, ChevronLeft, ChevronRight } from './Icons';

interface Props {
  track: Track;
  question: Question;
  selected: number[];
  flagged: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  onToggle: (i: number) => void;
  onToggleFlag: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReview: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export default function MockQuizCard({
  track,
  question,
  selected,
  flagged,
  canGoPrev,
  canGoNext,
  onToggle,
  onToggleFlag,
  onNext,
  onPrev,
  onReview,
  questionNumber,
  totalQuestions,
}: Props) {
  const { lang } = useLanguage();
  const t = useT();
  return (
    <div>
      <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-6 md:p-10 paper">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-stone-500 tabular-nums">
              Q{questionNumber}/{totalQuestions}
            </span>
            <p className="text-xs uppercase tracking-widest text-stone-500">
              {question.type === 'multi'
                ? t('quiz.selectAll')
                : question.type === 'tf'
                  ? t('quiz.tf')
                  : t('quiz.chooseOne')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${
                track.topicAccent[question.topic] || 'bg-stone-100 border-stone-300'
              }`}
            >
              {question.topic}
            </span>
            <button
              onClick={onToggleFlag}
              aria-pressed={flagged}
              aria-label={flagged ? t('mock.flagged') : t('mock.flag')}
              className={`text-[10px] uppercase tracking-widest px-2 py-1 border transition-colors ${
                flagged
                  ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700'
                  : 'bg-white border-stone-400 text-stone-600 hover:border-amber-600 hover:text-amber-800'
              }`}
            >
              {flagged ? `⚑ ${t('mock.flagged')}` : `⚐ ${t('mock.flag')}`}
            </button>
          </div>
        </div>

        <h2
          className="serif text-2xl md:text-3xl text-stone-900 leading-snug mb-8"
          style={{ fontWeight: 500 }}
        >
          {tr(question.q, lang)}
        </h2>

        <div className="space-y-2.5" role="group">
          {question.options.map((opt, i) => {
            const isSel = selected.includes(i);
            const cls = isSel
              ? 'border-stone-900 bg-stone-100'
              : 'border-stone-300 bg-white hover:border-stone-900 hover:bg-stone-50';

            return (
              <button
                key={i}
                onClick={() => onToggle(i)}
                aria-pressed={isSel}
                className={`w-full text-left border-l-4 border-y border-r px-4 md:px-5 py-3.5 transition-all duration-150 flex items-start gap-3 cursor-pointer ${cls}`}
              >
                <span
                  className={`shrink-0 w-6 h-6 border flex items-center justify-center mt-0.5 text-xs ${
                    isSel
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-400 text-transparent'
                  }`}
                  style={{ borderRadius: question.type === 'multi' ? '2px' : '50%' }}
                >
                  {isSel ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : null}
                </span>
                <span className="text-stone-800 text-sm md:text-base leading-relaxed">{tr(opt, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label={t('common.previous')}
          className="flex items-center gap-2 px-4 md:px-5 py-3 text-xs uppercase tracking-widest border border-stone-400 text-stone-700 hover:bg-stone-900 hover:text-stone-50 hover:border-stone-900 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">{t('common.previous')}</span>
        </button>

        <span className="text-xs text-stone-500 uppercase tracking-wider hidden sm:block">
          {question.type === 'multi' && selected.length > 0 ? `${selected.length} ${t('quiz.selected')}` : ''}
        </span>

        {canGoNext ? (
          <button
            onClick={onNext}
            className="bg-stone-900 text-stone-50 px-6 py-3 text-xs md:text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            {t('common.next')}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        ) : (
          <button
            onClick={onReview}
            className="bg-stone-900 text-stone-50 px-6 py-3 text-xs md:text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center gap-2"
          >
            {t('mock.reviewSubmit')}
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
}
