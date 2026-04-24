import { ChevronRight } from './Icons';

interface LengthOption {
  n: number;
  label: string;
  sub: string;
}

interface Props {
  options: LengthOption[];
  onPick: (n: number) => void;
}

export default function LengthPicker({ options, onPick }: Props) {
  return (
    <div>
      <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
        Pick your length
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {options.map(({ n, label, sub }) => (
          <button
            key={n}
            onClick={() => onPick(n)}
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
  );
}
