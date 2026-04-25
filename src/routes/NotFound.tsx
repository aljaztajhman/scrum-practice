import { Link } from 'react-router-dom';
import { ArrowLeft } from '../components/Icons';

export default function NotFound() {
  return (
    <div className="app-bg w-full">
      <div className="max-w-3xl mx-auto px-5 py-16 md:py-24">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-700 font-medium mb-4">404 — not found</p>
        <h1 className="serif text-5xl md:text-7xl text-stone-900 leading-[0.95] tracking-tight mb-6" style={{ fontWeight: 500 }}>
          That page <span style={{ fontStyle: 'italic', fontWeight: 400 }}>doesn't</span> exist.
        </h1>
        <p className="serif text-xl text-stone-600 italic mb-10" style={{ fontWeight: 400 }}>But the practice exam is always waiting.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-sm uppercase tracking-widest hover:bg-amber-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back to start
        </Link>
      </div>
    </div>
  );
}
