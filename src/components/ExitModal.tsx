import { useEffect, useRef } from 'react';

interface Props {
  answered: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ExitModal({ answered, total, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="exit-modal-title" className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-4 fade-in" onClick={onCancel}>
      <div className="bg-stone-50 border border-stone-300 max-w-md w-full p-7 md:p-9 slide-up" onClick={(e) => e.stopPropagation()}>
        <h3 id="exit-modal-title" className="serif text-2xl md:text-3xl text-stone-900 mb-3" style={{ fontWeight: 500 }}>Exit this quiz?</h3>
        <p className="text-stone-700 mb-7 text-sm leading-relaxed">
          You've answered <span className="text-stone-900 font-medium">{answered}</span> of {total} questions. Your progress will be lost.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button ref={cancelRef} onClick={onCancel} className="flex-1 border border-stone-900 text-stone-900 px-5 py-3 text-sm uppercase tracking-widest hover:bg-stone-100 transition-colors">Keep going</button>
          <button onClick={onConfirm} className="flex-1 bg-stone-900 text-stone-50 px-5 py-3 text-sm uppercase tracking-widest hover:bg-rose-800 transition-colors">Exit anyway</button>
        </div>
      </div>
    </div>
  );
}
