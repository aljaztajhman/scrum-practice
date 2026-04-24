import { TRACKS, type TrackId } from '../lib/tracks';
import { Check, ChevronRight } from './Icons';

interface Props {
  trackId: TrackId;
  onSelectTrack: (id: TrackId) => void;
  onStart: (count: number) => void;
}

export default function Welcome({ trackId, onSelectTrack, onStart }: Props) {
  const track = TRACKS[trackId];
  const lengths = [
    { n: 10, label: 'Warm-up', sub: 'Quick pulse-check' },
    { n: 30, label: 'Standard', sub: 'Balanced practice' },
    {
      n: track.questions.length,
      label: 'Full exam',
      sub: `All ${track.questions.length} · mirrors the real test`,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Track picker */}
      <div>
        <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
          Pick your certification
        </p>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {Object.values(TRACKS).map((t) => {
            const active = t.id === trackId;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTrack(t.id)}
                aria-pressed={active}
                className={`text-left border p-5 md:p-6 transition-all duration-200 ${
                  active
                    ? 'border-stone-900 bg-stone-900 text-stone-50'
                    : 'border-stone-400 bg-white/40 text-stone-800 hover:border-stone-900 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="serif text-2xl md:text-3xl leading-none"
                    style={{ fontWeight: 500 }}
                  >
                    {t.title}
                  </span>
                  {active && <Check className="w-4 h-4" strokeWidth={2.5} />}
                </div>
                <div
                  className={`serif italic text-sm md:text-base ${active ? 'text-stone-300' : 'text-stone-600'}`}
                  style={{ fontWeight: 400 }}
                >
                  {t.short}
                </div>
                <div
                  className={`text-[10px] uppercase tracking-widest mt-3 ${active ? 'text-stone-400' : 'text-stone-500'}`}
                >
                  {t.questions.length} questions
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Length picker */}
      <div>
        <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
          Pick your length
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {lengths.map(({ n, label, sub }) => (
            <button
              key={n}
              onClick={() => onStart(n)}
              className="group text-left border border-stone-800 bg-stone-900 text-stone-50 hover:bg-amber-700 hover:border-amber-700 transition-all duration-200 p-6 md:p-7"
            >
              <div className="flex items-baseline justify-between mb-3">
                <span
                  className="serif text-5xl md:text-6xl leading-none"
                  style={{ fontWeight: 500 }}
                >
                  {n}
                </span>
                <span className="text-xs uppercase tracking-widest opacity-60">questions</span>
              </div>
              <div className="serif text-xl italic" style={{ fontWeight: 400 }}>
                {label}
              </div>
              <div className="text-xs text-stone-400 group-hover:text-amber-100 mt-1">{sub}</div>
              <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-wider">
                Start{' '}
                <ChevronRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                  strokeWidth={2}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-stone-300 pt-8">
        <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
          How it works
        </p>
        <ol className="space-y-3 text-sm text-stone-700">
          <li className="flex gap-4">
            <span className="serif text-stone-400 italic">i.</span>
            <span>
              Questions mirror the three real exam formats: single-choice, multi-select, and
              true/false.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="serif text-stone-400 italic">ii.</span>
            <span>
              You get an explanation after each answer — the <em>why</em> matters more than the
              score.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="serif text-stone-400 italic">iii.</span>
            <span>Multi-select is scored all-or-nothing, same as Scrum.org.</span>
          </li>
          <li className="flex gap-4">
            <span className="serif text-stone-400 italic">iv.</span>
            <span>
              Go back and review any answered question. Keyboard shortcuts work on desktop.
            </span>
          </li>
          <li className="flex gap-4">
            <span className="serif text-stone-400 italic">v.</span>
            <span>The results page shows your weak topics so you know where to re-read.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
