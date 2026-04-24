import { useState } from 'react';
import type { Question } from '../lib/schema';
import type { Track } from '../lib/tracks';
import { Check, X, RotateCcw } from './Icons';

export interface AnswerRecord {
  selected: number[];
  correct: boolean;
}

interface Props {
  track: Track;
  pool: Question[];
  answers: Record<number, AnswerRecord>;
  onRestart: () => void;
  onRetrySame: () => void;
}

export default function Results({ track, pool, answers, onRestart, onRetrySame }: Props) {
  const [viewMode, setViewMode] = useState<'missed' | 'all'>('missed');

  const results = pool.map((q, i) => ({
    question: q,
    selected: answers[i]?.selected ?? [],
    correct: answers[i]?.correct ?? false,
  }));

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= 85;

  const byTopic: Record<string, { correct: number; total: number }> = {};
  results.forEach((r) => {
    const t = r.question.topic;
    if (!byTopic[t]) byTopic[t] = { correct: 0, total: 0 };
    byTopic[t].total++;
    if (r.correct) byTopic[t].correct++;
  });

  const topicsSorted = Object.entries(byTopic).sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total
  );

  const missed = results.filter((r) => !r.correct);
  const visibleResults = viewMode === 'all' ? results : missed;

  return (
    <div className="space-y-10 md:space-y-12">
      <div className="border border-stone-300 bg-white/70 p-8 md:p-12 paper">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-600 mb-4">
          {passed ? 'On track' : 'Keep studying'}
        </p>
        <div className="flex items-end gap-4 mb-3">
          <span
            className="serif text-7xl md:text-9xl text-stone-900 leading-none"
            style={{ fontWeight: 500 }}
          >
            {pct}
          </span>
          <span className="serif text-3xl md:text-4xl text-stone-500 italic pb-2">%</span>
        </div>
        <p
          className="serif text-xl md:text-2xl text-stone-700 italic"
          style={{ fontWeight: 400 }}
        >
          {correct} correct out of {total}.{' '}
          {passed
            ? "That's at or above the 85% threshold."
            : `You need ${Math.ceil(total * 0.85) - correct} more correct to reach 85%.`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onRetrySame}
          className="flex-1 bg-stone-900 text-stone-50 px-6 py-4 text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.8} /> New round — same {track.title}
        </button>
        <button
          onClick={onRestart}
          className="flex-1 border border-stone-900 text-stone-900 px-6 py-4 text-sm uppercase tracking-widest hover:bg-stone-900 hover:text-stone-50 transition-colors"
        >
          Change certification / length
        </button>
      </div>

      <div>
        <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
          By topic — weakest first
        </p>
        <div className="space-y-2">
          {topicsSorted.map(([topic, data]) => {
            const p = Math.round((data.correct / data.total) * 100);
            return (
              <div key={topic} className="border border-stone-300 bg-white/60 px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="serif text-stone-900 text-base"
                    style={{ fontWeight: 500 }}
                  >
                    {topic}
                  </span>
                  <span className="text-xs text-stone-600 tabular-nums">
                    {data.correct}/{data.total} ·{' '}
                    <span className="text-stone-900 font-medium">{p}%</span>
                  </span>
                </div>
                <div className="h-1 bg-stone-200 relative overflow-hidden">
                  <div
                    className={`h-1 absolute ${p >= 85 ? 'bg-emerald-700' : p >= 60 ? 'bg-amber-600' : 'bg-rose-700'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600">
            Review your answers
          </p>
          <div className="flex gap-0 border border-stone-900 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('missed')}
              aria-pressed={viewMode === 'missed'}
              className={`px-3 py-1.5 uppercase tracking-widest transition-colors ${
                viewMode === 'missed' ? 'bg-stone-900 text-stone-50' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              Missed ({missed.length})
            </button>
            <button
              onClick={() => setViewMode('all')}
              aria-pressed={viewMode === 'all'}
              className={`px-3 py-1.5 uppercase tracking-widest transition-colors ${
                viewMode === 'all' ? 'bg-stone-900 text-stone-50' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              All ({total})
            </button>
          </div>
        </div>

        {visibleResults.length === 0 ? (
          <div className="border border-emerald-300 bg-emerald-50/60 p-8 text-center">
            <p
              className="serif text-xl italic text-emerald-900"
              style={{ fontWeight: 400 }}
            >
              No missed questions. Clean sweep.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleResults.map((r, i) => (
              <div
                key={i}
                className={`border-l-4 bg-white/60 p-5 ${r.correct ? 'border-emerald-700' : 'border-rose-700'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-stone-500">
                    {r.question.topic}
                  </span>
                  {r.correct ? (
                    <span className="text-[10px] uppercase tracking-widest text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={3} /> Correct
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest text-rose-800 flex items-center gap-1">
                      <X className="w-3 h-3" strokeWidth={3} /> Missed
                    </span>
                  )}
                </div>
                <p
                  className="serif text-stone-900 mt-1 mb-3 text-base md:text-lg"
                  style={{ fontWeight: 500 }}
                >
                  {r.question.q}
                </p>
                {!r.correct && (
                  <>
                    <p className="text-xs text-stone-600 mb-1 uppercase tracking-wider">
                      Correct answer
                    </p>
                    <ul className="text-sm text-stone-800 mb-3 space-y-0.5">
                      {r.question.correct.map((ci) => (
                        <li key={ci}>· {r.question.options[ci]}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p className="text-sm text-stone-700 leading-relaxed italic serif">
                  {r.question.why}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
