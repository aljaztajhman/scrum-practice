import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageShell from '../components/PageShell';
import { ChevronRight } from '../components/Icons';
import { MODES, type ModeDef } from '../lib/modes';
import { TRACKS, type TrackId } from '../lib/tracks';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { countReviewQueue } from '../lib/review-queue';
import type { AttemptRow, MockSessionRow } from '../lib/stats';

export default function Home() {
  const [trackId, setTrackId] = useState<TrackId>('PSM1');
  const navigate = useNavigate();
  const track = TRACKS[trackId];
  const { isPro, isLoggedIn, user, profile, refreshProfile } = useAuth();
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [mockSessions, setMockSessions] = useState<MockSessionRow[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showUpgradedBanner, setShowUpgradedBanner] = useState(false);

  // Stripe success: poll profile until webhook flips tier; show banner; clean URL.
  useEffect(() => {
    if (searchParams.get('upgraded') !== 'true') return;
    if (!isLoggedIn) return;
    let cancelled = false;
    const poll = async () => {
      for (let i = 0; i < 8 && !cancelled; i++) {
        await refreshProfile();
        await new Promise((r) => setTimeout(r, 1000));
      }
    };
    void poll();
    setShowUpgradedBanner(true);
    const next = new URLSearchParams(searchParams);
    next.delete('upgraded');
    setSearchParams(next, { replace: true });
    const t = setTimeout(() => setShowUpgradedBanner(false), 8000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Fetch attempts + mock_sessions for logged-in users
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setAttempts(null);
      setMockSessions(null);
      return;
    }
    let cancelled = false;
    Promise.all([
      supabase
        .from('attempts')
        .select('id, user_id, track_id, question_id, source, selected, correct, topic, question_type, answered_at')
        .order('answered_at', { ascending: false }),
      supabase
        .from('mock_sessions')
        .select('*')
        .order('completed_at', { ascending: false }),
    ]).then(([a, m]) => {
      if (cancelled) return;
      if (!a.error) setAttempts((a.data ?? []) as AttemptRow[]);
      if (!m.error) setMockSessions((m.data ?? []) as MockSessionRow[]);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user]);

  const trackAttempts = useMemo(
    () => (attempts ?? []).filter((a) => a.track_id === trackId),
    [attempts, trackId]
  );
  const trackMocks = useMemo(
    () => (mockSessions ?? []).filter((m) => m.track_id === trackId),
    [mockSessions, trackId]
  );
  const reviewCount = useMemo(
    () => (attempts ? countReviewQueue(attempts, trackId, track.questions) : 0),
    [attempts, trackId, track.questions]
  );
  const totalAttempts = trackAttempts.length;
  const correctCount = trackAttempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : null;
  const lastMock = trackMocks[0] ?? null;

  const tierLabel = profile?.is_admin
    ? 'Admin'
    : profile?.tier === 'pro'
    ? 'Pro'
    : isLoggedIn
    ? 'Free'
    : null;

  const bankModes = MODES.filter((m) => m.group === 'bank');
  const aiModes = MODES.filter((m) => m.group === 'ai');

  return (
    <PageShell>
      <PageHeader
        eyebrow="Scrum.org · Practice"
        title="The"
        italic="practice"
        tagline="Built from the Scrum Guide 2020. Calibrated to how the real test reads."
      />

      {showUpgradedBanner && (
        <div className="mb-6 border border-emerald-300 bg-emerald-50/80 px-5 py-4">
          <p className="serif italic text-emerald-900 text-base" style={{ fontWeight: 400 }}>
            Welcome to Pro. AI mode and Open response are unlocked.
          </p>
        </div>
      )}

      {/* Cert tabs — slim horizontal selector */}
      <div className="border-b border-stone-300 mb-5">
        <div className="flex items-end gap-0">
          {Object.values(TRACKS).map((t) => (
            <button
              key={t.id}
              onClick={() => setTrackId(t.id)}
              aria-pressed={trackId === t.id}
              className={`px-4 md:px-5 py-3 serif text-base ${
                trackId === t.id
                  ? 'text-stone-900 border-b-2 border-stone-900 -mb-px'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {t.title}
              <span className="text-[10px] tracking-widest text-stone-400 ml-2 uppercase hidden sm:inline">
                · {t.questions.length}q
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Personal state row (logged in) OR sign-in prompt (anonymous) */}
      {isLoggedIn ? (
        <div className="text-xs text-stone-600 mb-8 flex items-center gap-2.5 flex-wrap tabular-nums">
          {tierLabel && (
            <span className="serif italic text-stone-700">{tierLabel} tier</span>
          )}
          {totalAttempts > 0 ? (
            <>
              <span className="text-stone-400">·</span>
              <span>
                <span className="serif text-stone-900">{totalAttempts}</span> attempts
              </span>
              {accuracy !== null && (
                <>
                  <span className="text-stone-400">·</span>
                  <span>
                    <span className="serif text-stone-900">{accuracy}%</span> accuracy
                  </span>
                </>
              )}
              {lastMock && (
                <>
                  <span className="text-stone-400">·</span>
                  <span>
                    last mock{' '}
                    <span className="serif text-stone-900">
                      {Math.round((lastMock.correct_count / lastMock.question_count) * 100)}%
                    </span>
                  </span>
                </>
              )}
              {reviewCount > 0 && (
                <>
                  <span className="text-stone-400">·</span>
                  <span className="text-amber-800">
                    <span className="serif">{reviewCount}</span> in review
                  </span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-stone-400">·</span>
              <span className="serif italic text-stone-500">
                No attempts in {track.title} yet — try Practice to start.
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="text-xs text-stone-600 mb-8 serif italic">
          <Link to="/login" className="text-stone-800 underline underline-offset-2 hover:text-stone-900">
            Sign in
          </Link>{' '}
          to track stats, surface weak questions, and unlock AI study tools.
        </div>
      )}

      <div className="space-y-8 md:space-y-10">
        {/* Default modes — Practice / Mock / Infinite (no header; these are the default) */}
        <section>
          <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
            {bankModes.map((m) => (
              <BankModeCard
                key={m.id}
                m={m}
                trackId={trackId}
                onClick={() => navigate(m.path(trackId))}
                lastMockPct={
                  m.id === 'mock' && lastMock
                    ? Math.round((lastMock.correct_count / lastMock.question_count) * 100)
                    : null
                }
                mockCount={m.id === 'mock' ? trackMocks.length : null}
                isLoggedIn={isLoggedIn}
              />
            ))}
          </div>
        </section>

        {/* AI modes — Pro */}
        <section>
          <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
            <h2 className="serif text-sm uppercase tracking-[0.25em] text-stone-600">
              AI study tools <span className="text-stone-400 mx-0.5">·</span>{' '}
              <span className="text-amber-800">Pro</span>
            </h2>
            {isLoggedIn && !isPro && (
              <button
                type="button"
                onClick={() => navigate(`/ai/${trackId}`)}
                className="text-[11px] uppercase tracking-widest text-amber-800 hover:text-amber-900 underline underline-offset-4"
              >
                Upgrade — €9.99/mo →
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            {aiModes.map((m) => (
              <AiModeCard
                key={m.id}
                m={m}
                trackId={trackId}
                isPro={isPro}
                onClick={() => navigate(m.path(trackId))}
              />
            ))}
          </div>
        </section>

        {/* Review tile — only when logged in and has weak questions */}
        {isLoggedIn && reviewCount > 0 && (
          <button
            onClick={() => navigate(`/review/${trackId}`)}
            className="group w-full text-left border border-amber-700 bg-amber-50/70 hover:border-amber-900 hover:bg-amber-50 transition-all duration-200 p-5 md:p-6 relative"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-3 mb-1">
                  <span
                    className="serif text-2xl md:text-3xl leading-tight text-stone-900"
                    style={{ fontWeight: 500 }}
                  >
                    Review
                  </span>
                  <span
                    className="serif italic text-sm md:text-base text-stone-700"
                    style={{ fontWeight: 400 }}
                  >
                    your weak spots
                  </span>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">
                  <span className="serif text-stone-900 tabular-nums">{reviewCount}</span>{' '}
                  {reviewCount === 1 ? 'question' : 'questions'} you&rsquo;ve missed in {track.title}.
                  Recently-missed first.
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1 mt-2"
                strokeWidth={2}
              />
            </div>
          </button>
        )}

        {/* Progressive disclosure — collapsed by default */}
        <details className="border-t border-stone-300 pt-6 mt-2 group">
          <summary className="serif text-sm uppercase tracking-[0.25em] text-stone-600 cursor-pointer hover:text-stone-900 list-none flex items-center gap-2">
            <span className="text-stone-400 group-open:rotate-90 transition-transform inline-block">
              ›
            </span>
            First time here?
          </summary>
          <ol className="space-y-3 text-sm text-stone-700 mt-5">
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">i.</span>
              <span>
                Pick a certification, then a mode. Practice and Infinite explain each answer; Mock
                mirrors the real exam (timer, no feedback until the end).
              </span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">ii.</span>
              <span>
                Multi-select questions are scored all-or-nothing — same as Scrum.org.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">iii.</span>
              <span>
                Sign in to track stats, surface your weak questions for review, and unlock AI study
                tools (Pro). Anonymous practice is free, no account needed.
              </span>
            </li>
            <li className="flex gap-4">
              <span className="serif text-stone-400 italic">iv.</span>
              <span>
                Real exam reference: 80 questions · 60 minutes · 85% to pass · based on the Scrum
                Guide 2020.
              </span>
            </li>
          </ol>
        </details>
      </div>
    </PageShell>
  );
}

function BankModeCard({
  m,
  onClick,
  lastMockPct,
  mockCount,
  isLoggedIn,
}: {
  m: ModeDef;
  trackId: TrackId;
  onClick: () => void;
  lastMockPct: number | null;
  mockCount: number | null;
  isLoggedIn: boolean;
}) {
  const isMock = m.id === 'mock';
  return (
    <button
      onClick={onClick}
      className={`group text-left border bg-white/50 transition-all duration-200 p-5 md:p-6 relative hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-sm ${
        isMock
          ? 'border-stone-700 hover:border-stone-900'
          : 'border-stone-400 hover:border-stone-900'
      }`}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <div
            className="serif text-2xl md:text-2xl leading-tight text-stone-900"
            style={{ fontWeight: 500 }}
          >
            {m.title}
          </div>
          <div
            className="serif italic text-sm text-stone-600 mt-0.5"
            style={{ fontWeight: 400 }}
          >
            {m.italic}
          </div>
        </div>
        <ChevronRight
          className="w-4 h-4 text-stone-500 transition-transform group-hover:translate-x-1 mt-2 flex-shrink-0"
          strokeWidth={2}
        />
      </div>
      <p className="text-sm text-stone-700 leading-relaxed">{m.desc}</p>
      {isMock && isLoggedIn && lastMockPct !== null && mockCount !== null && mockCount > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-200 text-[11px] uppercase tracking-widest text-stone-500 tabular-nums">
          Last: <span className="text-stone-900 font-medium">{lastMockPct}%</span>
          <span className="text-stone-400 ml-2">·</span>
          <span className="ml-2">
            {mockCount} {mockCount === 1 ? 'mock taken' : 'mocks taken'}
          </span>
        </div>
      )}
    </button>
  );
}

function AiModeCard({
  m,
  isPro,
  onClick,
}: {
  m: ModeDef;
  trackId: TrackId;
  isPro: boolean;
  onClick: () => void;
}) {
  const locked = !isPro;
  return (
    <button
      onClick={onClick}
      className={`group text-left border transition-all duration-200 p-5 md:p-6 relative ${
        locked
          ? 'border-stone-300 bg-stone-100/30 hover:border-stone-500'
          : 'border-stone-400 bg-white/50 hover:border-stone-900 hover:bg-white/80 hover:-translate-y-0.5 hover:shadow-sm'
      }`}
    >
      <span
        className={`absolute top-3 right-3 text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 serif ${
          locked ? 'bg-amber-700 text-stone-50' : 'bg-amber-700 text-stone-50'
        }`}
      >
        Pro
      </span>
      <div className="mb-2">
        <div
          className={`serif text-2xl md:text-2xl leading-tight ${
            locked ? 'text-stone-500' : 'text-stone-900'
          }`}
          style={{ fontWeight: 500 }}
        >
          {m.title}
        </div>
        <div
          className={`serif italic text-sm mt-0.5 ${
            locked ? 'text-stone-400' : 'text-stone-600'
          }`}
          style={{ fontWeight: 400 }}
        >
          {m.italic}
        </div>
      </div>
      <p
        className={`text-sm leading-relaxed ${
          locked ? 'text-stone-500' : 'text-stone-700'
        }`}
      >
        {m.desc}
      </p>
    </button>
  );
}
