import type { ReactNode } from 'react';
import LanguagePicker from './LanguagePicker';

interface Props {
  children: ReactNode;
  footer?: ReactNode;
}

export default function PageShell({ children, footer }: Props) {
  return (
    <div className="app-bg w-full">
      <div className="max-w-3xl mx-auto px-5 py-8 md:py-12 relative">
        <div className="absolute top-4 right-5 md:top-6 md:right-5 z-10">
          <LanguagePicker />
        </div>
        {children}
        <footer className="mt-14 md:mt-16 pt-6 border-t border-stone-300">
          {footer ?? (
            <p className="text-xs text-stone-500 serif italic">
              Real exam reference: 80 questions · 60 minutes · 85% to pass · based on the Scrum
              Guide 2020.
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
