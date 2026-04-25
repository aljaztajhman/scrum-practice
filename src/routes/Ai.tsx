import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Check, X, RotateCcw } from '../components/Icons';
import PageShell from '../components/PageShell';
import QuizCard from '../components/QuizCard';
import type { Question } from '../lib/schema';
import { TRACKS, type Track, type TrackId } from '../lib/tracks';
import { arraysEqualAsSets } from '../lib/utils';

interface AiQuestion extends Question {
  style: string;
  scrumGuideSection: string;
  selfCritique: string;
  confidence: number;
}

const STYLE_LABELS: Record<string, string> = {
  'first-principles': 'First principles',
  'find-the-flaw': 'Find the flaw',
  'steel-manning': 'Steel-manning',
  counterfactual: 'Counterfactual',
  'cross-framework': 'Cross-framework',
  'devils-advocate': "Devil's advocate",
};

const STYLE_BLURBS: Record<string, string> = {
  'first-principles': 'Derive the rule from underlying goals.',
  'find-the-flaw': 'Spot what is broken in this scenario.',
  'steel-manning': "Engage with the argument's strongest form.",
  counterfactual: 'Imagine the rule absent. What degrades?',
  'cross-framework': 'Map a Scrum concept onto another framework.',
  'devils-advocate': 'Where the apparent exception is not actually one.',
};

export default function Ai() {
  const { cert } = useParams<{ cert: string }>();
  const trackId = (cert?.toUpperCase() ?? '') as TrackId;
  const track = TRACKS[trackId];
  if (!track) return <Navigate to="/" replace />;
  return <AiSession track={track} />;
}

function AiSession({ track }: { track: Track }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState<AiQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [stats, setStats] = useState({ answered: 0, correct: 0 });

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected([]);
    setLocked(false);
    setQuestion(null);
    try {
      const res = await fetch(`/api/generate-question?cert=${track.id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned ${res.status}`);
      }
      const data = await res.json();
      setQuestion({
        id: Date.now(),
        type: data.type,
        topic: data.topic,
        q: data.q,
        options: data.options,
        correct: data.correct,
        why: data.why,
        style: data.style,
        scrumGuideSection: data.scrumGuideSection,
        selfCritique: data.selfCritique,
        confidence: data.confidence,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [track.id]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const onToggle = (i: number) => {
    if (locked || !question) return;
    setSelected((prev) =>
      question.type === 'multi'
        ? prev.includes(i)
          ? prev.filter((x) => x !== i)
          : [...prev, i]
        : [i]
    );
  };

  const onSubmit = () => {
    if (!question || selected.length === 0 || locked) return;
    const isCorrect = arraysEqualAsSets(selected, question.correct);
    setLocked(true);
    setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }));
  };

  const onNext = () => {
    void fetchQuestion();
  };

  const incorrect = stats.answered - stats.correct;

  return (
    <PageShell
      footer={
        <p className="text-xs text-stone-500 serif italic">
          AI-generated · grounded in the Scrum Guide 2020 · drift can happen, flag anything that
          looks wrong.
        </p>
      }
    >
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4 gap-2">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-600 hover:text-stone-900 transition-colors py-2 -ml-1"
          >
            <ArrowLeft
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5"
              strokeWidth={2}
            />
            Back to start
          </button>
          <div className="flex items-center gap-2.5 md:gap-4 text-xs">
            <span className="hidden md:inline text-[10px] uppercase tracking-[0.2em] text-stone-500">
              {track.title} · AI
            </span>
            <span className="hidden md:inline text-stone-300">·</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{stats.correct}</span>
            </span>
            <span className="flex items-center gap-1 text-rose-800">
              <X className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{incorrect}</span>
            </span>
            <span className="text-stone-400">·</span>
            <span className="uppercase tracking-[0.15em] text-stone-600 tabular-nums">
              <span className="serif text-stone-900">{stats.answered}</span>
              <span className="text-stone-400"> answered</span>
            </span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white/70 backdrop-blur-sm border border-stone-300 p-12 md:p-16 paper text-center">
          <p
            className="serif italic text-2xl md:text-3xl text-stone-700 mb-3"
            style={{ fontWeight: 400 }}
          >
            Composing a question…
          </p>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
            One moment, the model is thinking
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="border border-rose-300 bg-rose-50/60 p-8 md:p-10">
          <p className="serif italic text-xl text-rose-900 mb-3" style={{ fontWeight: 400 }}>
            That one did not land.
          </p>
          <p className="text-sm text-stone-700 leading-relaxed mb-6">{error}</p>
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 bg-stone-900 text-stone-50 px-6 py-3 text-xs uppercase tracking-widest hover:bg-amber-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} /> Try again
          </button>
        </div>
      )}

      {question && !loading && !error && (
        <>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-500">
                Style ·{' '}
              </span>
              <span
                className="serif italic text-base md:text-lg text-stone-800"
                style={{ fontWeight: 500 }}
              >
                {STYLE_LABELS[question.style] || question.style}
              </span>
            </div>
            <span className="text-xs text-stone-500 italic hidden sm:inline">
              {STYLE_BLURBS[question.style]}
            </span>
          </div>
          <QuizCard
            track={track}
            question={question}
            selected={selected}
            locked={locked}
            canGoPrev={false}
            canSubmit={selected.length > 0}
            isLastQuestion={false}
            onToggle={onToggle}
            onSubmit={onSubmit}
            onNext={onNext}
            onPrev={() => {}}
          />

          {locked && (
            <div className="mt-5 border border-stone-300 bg-white/40 p-5 md:p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-2">
                Self-critique · the strongest argument against the marked answer
              </p>
              <p className="text-sm text-stone-700 leading-relaxed serif italic">
                {question.selfCritique}
              </p>
              <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-stone-500">
                Grounded in · {question.scrumGuideSection}
              </p>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
