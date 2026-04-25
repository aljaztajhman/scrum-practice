import { Link } from 'react-router-dom';
import { ArrowLeft } from './Icons';

interface Props {
  eyebrow: string;
  title: string;
  italic?: string;
  tagline?: string;
  backTo?: string;
  backLabel?: string;
}

export default function PageHeader({ eyebrow, title, italic, tagline, backTo, backLabel = 'Back to start' }: Props) {
  return (
    <header className="mb-10 md:mb-14">
      {backTo && (
        <Link to={backTo} className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1 mb-5">
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" strokeWidth={2} />
          {backLabel}
        </Link>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px w-10 bg-stone-700"></div>
        <span className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium">{eyebrow}</span>
      </div>
      <h1 className="serif text-5xl md:text-7xl text-stone-900 leading-[0.95] tracking-tight" style={{ fontWeight: 500 }}>
        {title}
        {italic && (<> <span style={{ fontStyle: 'italic', fontWeight: 400 }}>{italic}</span></>)}
      </h1>
      {tagline && <p className="serif text-xl md:text-2xl text-stone-600 mt-4 italic" style={{ fontWeight: 400 }}>{tagline}</p>}
    </header>
  );
}
