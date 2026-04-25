import { useLanguage } from '../i18n/LanguageContext';

export default function LanguagePicker() {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className="inline-flex border border-stone-400 text-[11px] uppercase tracking-[0.2em]"
      role="group"
      aria-label="Language"
    >
      <button
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`px-2.5 py-1 transition-colors ${
          lang === 'en'
            ? 'bg-stone-900 text-stone-50'
            : 'bg-white/60 text-stone-700 hover:bg-stone-100'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang('sl')}
        aria-pressed={lang === 'sl'}
        className={`px-2.5 py-1 transition-colors border-l border-stone-400 ${
          lang === 'sl'
            ? 'bg-stone-900 text-stone-50'
            : 'bg-white/60 text-stone-700 hover:bg-stone-100'
        }`}
      >
        SL
      </button>
    </div>
  );
}
