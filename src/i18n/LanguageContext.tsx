import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from '../lib/schema';

interface LanguageCtx {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const Ctx = createContext<LanguageCtx>({ lang: 'en', setLang: () => {} });

const STORAGE_KEY = 'scrum-practice-lang';

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === 'sl' || v === 'en') return v;
  } catch {
    // localStorage may be blocked; fall through
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStoredLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  return useContext(Ctx);
}
