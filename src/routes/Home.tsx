import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import { Check, ChevronRight } from '../components/Icons';
import { MODES } from '../lib/modes';
import { TRACKS, type TrackId } from '../lib/tracks';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const [trackId, setTrackId] = useState<TrackId>('PSM1');
  const navigate = useNavigate();
  const track = TRACKS[trackId];
  const { isPro } = useAuth();

  return (
    <PageShell>
      <PageHeader eyebrow="Scrum.org · Practice" title="The" italic="practice" tagline={track.tagline} />
      <div className="space-y-10">
        <div>
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">Pick your certification</p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {Object.values(TRACKS).map((t) => {
              const active = t.id === trackId;
              return (
                <button key={t.id} onClick={() => setTrackId(t.id)} aria-pressed={active} className={`text-left border p-5 md:p-6 transition-all duration-200 ${active ? 'border-stone-900 bg-stone-900 text-stone-50' : 'border-stone-400 bg-white/40 text-stone-800 hover:border-stone-900 hover:bg-white/70'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="serif text-2xl md:text-3xl leading-none" style={{ fontWeight: 500 }}>{t.title}</span>
                    {active && <Check className="w-4 h-4" strokeWidth={2.5} />}
                  </div>
                  <div className={`serif italic text-sm md:text-base ${active ? 'text-stone-300' : 'text-stone-600'}`} style={{ fontWeight: 400 }}>{t.short}</div>
                  <div className={`text-[10px] uppercase tracking-widest mt-3 ${active ? 'text-stone-400' : 'text-stone-500'}`}>{t.questions.length} questions</div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">Pick your mode</p>
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            {MODES.map((m) => {
              const isAi = m.id === 'ai';
              const aiLocked = isAi && !isPro;
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(m.path(trackId))}
                  className={`group text-left border transition-all duration-200 p-5 md:p-6 relative ${
                    aiLocked
                      ? 'border-stone-300 bg-stone-100/30 hover:border-stone-500'
                      : 'border-stone-400 bg-white/50 hover:border-stone-900 hover:bg-white/80'
                  }`}
                >
                  {isAi && (
                    <span className="absolute top-3 right-3 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-stone-900 text-stone-50 serif">
                      Pro
                    </span>
                  )}
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div>
                      <div
                        className={`serif text-2xl md:text-3xl leading-tight ${aiLocked ? 'text-stone-500' : 'text-stone-900'}`}
                        style={{ fontWeight: 500 }}
                      >
                        {m.title}
                      </div>
                      <div
                        className={`serif italic text-sm md:text-base mt-0.5 ${aiLocked ? 'text-stone-400' : 'text-stone-600'}`}
                        style={{ fontWeight: 400 }}
                      >
                        {m.italic}
                      </div>
                    </div>
                    {!isAi && (
                      <ChevronRight
                        className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1 mt-2"
                        strokeWidth={2}
                      />
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${aiLocked ? 'text-stone-500' : 'text-stone-700'}`}>{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="border-t border-stone-300 pt-8">
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">How it works</p>
          <ol className="space-y-3 text-sm text-stone-700">
            <li className="flex gap-4"><span className="serif text-stone-400 italic">i.</span><span>Questions mirror the three real exam formats: single-choice, multi-select, and true/false.</span></li>
            <li className="flex gap-4"><span className="serif text-stone-400 italic">ii.</span><span>In Practice and Infinite you get an explanation after each answer — the why matters more than the score.</span></li>
            <li className="flex gap-4"><span className="serif text-stone-400 italic">iii.</span><span>Mock exam mirrors the real thing: timer, no feedback mid-exam, flag and review before submitting.</span></li>
            <li className="flex gap-4"><span className="serif text-stone-400 italic">iv.</span><span>Multi-select is scored all-or-nothing, same as Scrum.org.</span></li>
            <li className="flex gap-4"><span className="serif text-stone-400 italic">v.</span><span>Sign in to get statistics, weak-area tracking, and AI mode (Pro). Anonymous practice is free, no account needed.</span></li>
          </ol>
        </div>
      </div>
    </PageShell>
  );
}
