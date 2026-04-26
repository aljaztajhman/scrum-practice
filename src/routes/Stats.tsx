import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import PageHeader from '../components/PageHeader';
import { Spinner } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { TRACKS, type TrackId } from '../lib/tracks';
import {
  computeOverview,
  computeStreaks,
  computeTopicBreakdown,
  computeWeakQuestions,
  computeWeeklyTrend,
  type AttemptRow,
  type MockSessionRow,
  type WeakQuestion,
  type WeekStat,
} from '../lib/stats';

export default function Stats() {
  const { isLoggedIn, loading: authLoading, user } = useAuth();
  const [trackId, setTrackId] = useState<TrackId>('PSM1');
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [mockSessions, setMockSessions] = useState<MockSessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setError(null);
    Promise.all([
      supabase.from('attempts').select('*').order('answered_at', { ascending: false }),
      supabase.from('mock_sessions').select('*').order('completed_at', { ascending: false }),
    ]).then(([a, m]) => {
      if (cancelled) return;
      if (a.error) {
        setError(a.error.message);
        return;
      }
      if (m.error) {
        setError(m.error.message);
        return;
      }
      setAttempts((a.data ?? []) as AttemptRow[]);
      setMockSessions((m.data ?? []) as MockSessionRow[]);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const trackAttempts = useMemo(
    () => (attempts ?? []).filter((a) => a.track_id === trackId),
    [attempts, trackId]
  );
  const trackMocks = useMemo(
    () => (mockSessions ?? []).filter((m) => m.track_id === trackId),
    [mockSessions, trackId]
  );
  const overview = useMemo(() => computeOverview(trackAttempts), [trackAttempts]);
  const topics = useMemo(() => computeTopicBreakdown(trackAttempts), [trackAttempts]);
  const weekly = useMemo(() => computeWeeklyTrend(trackAttempts, 12), [trackAttempts]);
  const streaks = useMemo(() => computeStreaks(attempts ?? []), [attempts]);
  const weakQs = useMemo(() => computeWeakQuestions(trackAttempts), [trackAttempts]);

  if (authLoading) return null;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: '/stats' }} replace />;

  if (error) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Stats"
          title="Statistics"
          italic="something went wrong"
          tagline={error}
          backTo="/"
        />
      </PageShell>
    );
  }

  if (attempts === null || mockSessions === null) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Stats"
          title="Statistics"
          italic="loading"
          tagline="Pulling your history."
          backTo="/"
        />
        <div className="flex items-center justify-center py-12">
          <Spinner className="w-8 h-8 text-stone-500" />
        </div>
      </PageShell>
    );
  }

  if (attempts.length === 0) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Stats"
          title="Statistics"
          italic="nothing yet"
          tagline="Take a Practice or Mock session and your stats will start appearing here."
          backTo="/"
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Stats"
        title="Statistics"
        italic="your progress"
        tagline={`${attempts.length} attempts logged across ${mockSessions.length} mock sessions.`}
        backTo="/"
      />

      <div className="flex border-b border-stone-300 mb-8">
        {Object.values(TRACKS).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTrackId(t.id)}
            className={`px-5 py-3 serif text-base ${
              trackId === t.id
                ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      <Section title="Overview">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Attempts" value={overview.total.toString()} />
          <Stat label="Correct" value={overview.correct.toString()} />
          <Stat label="Accuracy" value={`${overview.accuracyPct}%`} />
        </div>
      </Section>

      <Section title="Activity">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Current streak" value={`${streaks.current}d`} />
          <Stat label="Longest streak" value={`${streaks.longest}d`} />
          <Stat label="Days active" value={streaks.totalDaysActive.toString()} />
        </div>
      </Section>

      <Section title="Weekly accuracy · last 12 weeks">
        <WeeklyChart data={weekly} />
      </Section>

      {trackMocks.length > 0 && (
        <Section title="Mock exam history">
          <MockHistory sessions={trackMocks} />
        </Section>
      )}

      {topics.length > 0 && (
        <Section title="By topic">
          <TopicBreakdown topics={topics} />
        </Section>
      )}

      {weakQs.length > 0 && (
        <Section title="Your weakest questions · 2+ attempts, < 60% accuracy">
          <WeakQuestionsList items={weakQs} />
        </Section>
      )}
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="serif text-sm uppercase tracking-[0.25em] text-stone-600 mb-5">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-300 bg-white/40 p-5">
      <div className="text-xs uppercase tracking-widest text-stone-500 mb-1.5">{label}</div>
      <div
        className="serif text-3xl text-stone-900 tabular-nums"
        style={{ fontWeight: 500 }}
      >
        {value}
      </div>
    </div>
  );
}

function WeeklyChart({ data }: { data: WeekStat[] }) {
  const maxTotal = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="border border-stone-300 bg-white/40 p-5">
      <div className="flex items-end gap-1.5 h-40">
        {data.map((w) => {
          const heightPct = w.total === 0 ? 0 : Math.max(8, (w.total / maxTotal) * 100);
          return (
            <div
              key={w.weekStart}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={
                w.total === 0
                  ? `${w.weekLabel}: no activity`
                  : `${w.weekLabel}: ${w.correct}/${w.total} (${w.accuracyPct}%)`
              }
            >
              <div className="text-[10px] tabular-nums text-stone-700 h-4">
                {w.total > 0 ? `${w.accuracyPct}%` : ''}
              </div>
              <div
                className={`w-full ${
                  w.total > 0 ? 'bg-stone-900 group-hover:bg-stone-700' : 'bg-stone-200'
                }`}
                style={{ height: `${heightPct}%`, minHeight: w.total > 0 ? 2 : 1 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((w, i) => (
          <div
            key={w.weekStart}
            className="flex-1 text-center text-[9px] uppercase tracking-wider text-stone-500"
          >
            {i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)
              ? w.weekLabel
              : ' '}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockHistory({ sessions }: { sessions: MockSessionRow[] }) {
  return (
    <div className="border border-stone-300 bg-white/40 divide-y divide-stone-200">
      {sessions.slice(0, 10).map((s) => {
        const pct = Math.round((s.correct_count / s.question_count) * 100);
        const date = new Date(s.completed_at);
        const mins = Math.floor(s.duration_ms / 60000);
        return (
          <div key={s.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="serif text-base text-stone-900 tabular-nums">
                {s.correct_count}/{s.question_count}{' '}
                <span className="text-stone-500">· {pct}%</span>
              </div>
              <div className="text-xs text-stone-500">
                {date.toLocaleDateString()}{' '}
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {mins} min
              </div>
            </div>
            <div
              className={`text-xs uppercase tracking-widest ${
                s.passed ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {s.passed ? 'Passed' : 'Failed'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopicBreakdown({
  topics,
}: {
  topics: { topic: string; total: number; correct: number; accuracyPct: number }[];
}) {
  return (
    <div className="border border-stone-300 bg-white/40 divide-y divide-stone-200">
      {topics.map((t) => (
        <div key={t.topic} className="px-5 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="serif text-stone-800">{t.topic}</span>
            <span className="text-xs tabular-nums text-stone-700">
              {t.correct}/{t.total} · {t.accuracyPct}%
            </span>
          </div>
          <div className="h-1.5 bg-stone-200 overflow-hidden">
            <div
              className="h-full bg-stone-900"
              style={{ width: `${Math.max(2, t.accuracyPct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WeakQuestionsList({ items }: { items: WeakQuestion[] }) {
  return (
    <div className="border border-stone-300 bg-white/40 divide-y divide-stone-200">
      {items.map((q) => (
        <div key={q.questionId} className="px-5 py-3 flex items-center justify-between">
          <div>
            <span className="serif text-stone-800">Q{q.questionId}</span>
            <span className="text-stone-500 italic text-sm"> · {q.topic}</span>
          </div>
          <div className="text-xs tabular-nums">
            <span className="text-rose-700 font-medium">{q.accuracyPct}%</span>
            <span className="text-stone-500">
              {' '}
              · {q.correct}/{q.total}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
