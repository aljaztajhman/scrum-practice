import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import { Check, ChevronRight } from '../components/Icons';
import { useLanguage, useT } from '../i18n/LanguageContext';
import { MODES } from '../lib/modes';
import { tr } from '../lib/schema';
import { TRACKS, type TrackId } from '../lib/tracks';

export default function Home() {
  const [trackId, setTrackId] = useState<TrackId>('PSM1');
  const navigate = useNavigate();
  const track = TRACKS[trackId];
  const t = useT();
  const { lang } = useLanguage();

  return (
    <PageShell>
      <PageHeader
        eyebrow={t('home.eyebrow')}
        title={t('home.title')}
        italic={t('home.italic')}
        tagline={tr(track.tagline, lang)}
      />

      <div className="space-y-10">
        <div>
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
            {t('home.pickCert')}
          </p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {Object.values(TRACKS).map((tr_) => {
              const active = tr_.id === trackId;
              return (
                <button
                  key={tr_.id}
                  onClick={() => setTrackId(tr_.id)}
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
                      {tr_.title}
                    </span>
                    {active && <Check className="w-4 h-4" strokeWidth={2.5} />}
                  </div>
                  <div
                    className={`serif italic text-sm md:text-base ${active ? 'text-stone-300' : 'text-stone-600'}`}
                    style={{ fontWeight: 400 }}
                  >
                    {tr(tr_.short, lang)}
                  </div>
                  <div
                    className={`text-[10px] uppercase tracking-widest mt-3 ${active ? 'text-stone-400' : 'text-stone-500'}`}
                  >
                    {tr_.questions.length} {t('common.questions')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
            {t('home.pickMode')}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => navigate(m.path(trackId))}
                className="group text-left border border-stone-400 bg-white/50 hover:border-stone-900 hover:bg-white/80 transition-all duration-200 p-5 md:p-6"
              >
                <div className="flex items-start justify-between mb-3 gap-3">
                  <div>
                    <div
                      className="serif text-2xl md:text-3xl leading-tight text-stone-900"
                      style={{ fontWeight: 500 }}
                    >
                      {tr(m.title, lang)}
                    </div>
                    <div
                      className="serif italic text-sm md:text-base text-stone-600 mt-0.5"
                      style={{ fontWeight: 400 }}
                    >
                      {tr(m.italic, lang)}
                    </div>
                  </div>
                  <ChevronRight
                    className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1 mt-2"
                    strokeWidth={2}
                  />
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{tr(m.desc, lang)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-stone-300 pt-8">
          <p className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">
            {t('home.howItWorks')}
          </p>
          <ol className="space-y-3 text-sm text-stone-700">
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">i.</span>
              <span>{t('home.how1')}</span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">ii.</span>
              <span>{t('home.how2')}</span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">iii.</span>
              <span>{t('home.how3')}</span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">iv.</span>
              <span>{t('home.how4')}</span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">v.</span>
              <span>{t('home.how5')}</span>
            </li>
          </ol>
        </div>
      </div>
    </PageShell>
  );
}
