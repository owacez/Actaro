import {
  runClock,
  runDistance,
  runMovingSeconds,
  runPace,
  runSeconds,
  type RunDraft,
} from './run-model';

// What the lock-screen activity (iOS) and live notification (Android) display.
// JSON-safe: Live Activity props are serialized, so times are epoch milliseconds.
export type RunLiveProps = {
  /** Timer origin: now minus elapsed time, so manual pauses are already excluded. */
  startedAt: number;
  /** Set while not recording; the system timer freezes at this instant. */
  pausedAt: number | null;
  elapsed: string;
  distance: string;
  unit: string;
  pace: string;
  status: 'Recording' | 'Auto-paused' | 'Paused' | 'Finished';
};
export function runLiveProps(draft: RunDraft, now: number): RunLiveProps {
  const seconds = runSeconds(draft, now);
  const recording = draft.status === 'recording';
  return {
    startedAt: now - seconds * 1000,
    pausedAt: recording ? null : now,
    elapsed: runClock(seconds),
    distance: runDistance(draft.distanceMeters, draft.unit),
    unit: draft.unit,
    pace: runPace(runMovingSeconds(draft), draft.distanceMeters, draft.unit),
    status:
      draft.status === 'review'
        ? 'Finished'
        : !recording
          ? 'Paused'
          : draft.autoPaused
            ? 'Auto-paused'
            : 'Recording',
  };
}
// Status changes go out at once; other changes at most every `interval` ms, which keeps
// within system update budgets. Android also refreshes its static clock on that interval.
export function liveUpdateDue(
  shown: RunLiveProps | null,
  next: RunLiveProps,
  sinceMs: number,
  interval: number,
  refreshClock = false,
) {
  if (!shown || shown.status !== next.status) return true;
  if (sinceMs < interval) return false;
  return (
    refreshClock ||
    shown.distance !== next.distance ||
    shown.pace !== next.pace ||
    shown.startedAt !== next.startedAt
  );
}
