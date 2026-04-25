import type { Track } from '../lib/tracks';
import { ChevronRight } from './Icons';

interface Props {
  track: Track;
  onPick: (topic: string) => void;
}

export default function TopicPicker({ track, onPick }: Props) {
  const counts: Record<string, number> = {};
  track.questions.forEach((q) => { counts[q.topic] = (counts[q.topic] ?? 0) + 1; });
  const topics = Object.keys(track.topicAccent).filter((t) => (counts[t] ?? 0) > 0);
  return (
    <div>
      <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">Pick a topic</p>
      <div className="grid sm:grid-cols-2 gap-3">
        {topics.map((topic) => {
          const n = counts[topic] ?? 0;
          const accent = track.topicAccent[topic] || 'bg-stone-100 border-stone-300';
          return (
            <button key={topic} onClick={() => onPick(topic)} className="group text-left border border-stone-400 bg-white/50 hover:border-stone-900 hover:bg-white/80 p-5 md:p-6 transition-all duration-200">
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${accent}`}>{topic}</span>
                <span className="text-xs text-stone-500 tabular-nums">{n} Q</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="serif text-2xl text-stone-900" style={{ fontWeight: 500 }}>Drill it</span>
                <ChevronRight className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1" strokeWidth={2} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
