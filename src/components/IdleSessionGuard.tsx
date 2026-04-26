import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 60 * 1000; // show warning 1 min before logout
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
];

/**
 * Watches user activity and signs out the user after IDLE_TIMEOUT_MS of inactivity.
 * Shows a warning modal WARNING_BEFORE_MS before logout with a "Stay signed in" button.
 * Only runs when the user is logged in.
 */
export default function IdleSessionGuard() {
  const { isLoggedIn, signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    warningTimer.current = null;
    logoutTimer.current = null;
    countdownTimer.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsLeft(Math.floor(WARNING_BEFORE_MS / 1000));
    countdownTimer.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    clearAll();
    setShowWarning(false);
    if (!isLoggedIn) return;
    warningTimer.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);
    logoutTimer.current = setTimeout(async () => {
      clearAll();
      await signOut();
      setShowWarning(false);
    }, IDLE_TIMEOUT_MS);
  }, [clearAll, isLoggedIn, signOut, startCountdown]);

  useEffect(() => {
    if (!isLoggedIn) {
      clearAll();
      setShowWarning(false);
      return;
    }
    const handleActivity = () => {
      // Only treat user input as activity-extending when the warning isn't shown.
      // While the warning is shown, the user must explicitly click "Stay signed in".
      if (!showWarning) reset();
    };
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handleActivity));
    reset();
    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handleActivity));
      clearAll();
    };
  }, [isLoggedIn, reset, clearAll, showWarning]);

  if (!isLoggedIn || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white border border-stone-300 max-w-sm w-full mx-5 p-6 shadow-xl">
        <h2 className="serif text-2xl text-stone-900 mb-2" style={{ fontWeight: 500 }}>
          Still there?
        </h2>
        <p className="text-sm text-stone-700 mb-1">
          You&rsquo;ll be signed out in <span className="tabular-nums font-medium">{secondsLeft}s</span> for security.
        </p>
        <p className="text-xs serif italic text-stone-500 mb-5">
          Sessions auto-expire after 30 minutes of inactivity.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex-1 bg-stone-900 text-stone-50 py-2.5 serif hover:bg-stone-800"
          >
            Stay signed in
          </button>
          <button
            type="button"
            onClick={async () => {
              clearAll();
              setShowWarning(false);
              await signOut();
            }}
            className="flex-1 border border-stone-400 bg-white/60 text-stone-800 py-2.5 serif hover:border-stone-900"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
