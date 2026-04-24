import { formatDuration } from '../lib/quiz-engine';

interface Props {
  remainingMs: number;
}

export default function MockTimer({ remainingMs }: Props) {
  const mins = remainingMs / 60000;
  const low = mins < 5;
  const critical = mins < 1;

  return (
    <span
      className={`serif tabular-nums ${
        critical ? 'text-rose-700' : low ? 'text-amber-800' : 'text-stone-900'
      }`}
      style={{ fontWeight: 500 }}
      aria-live="polite"
      aria-label={`Time remaining: ${formatDuration(remainingMs)}`}
    >
      {formatDuration(remainingMs)}
    </span>
  );
}
