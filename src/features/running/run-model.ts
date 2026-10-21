import { validExerciseId } from '@/features/exercises/exercise-service';
import { localNutritionDate } from '@/features/nutrition/nutrition-model';
import { elapsed, pauseClock, resumeClock, type Clock } from '@/features/workouts/session-model';

export type RunPoint = {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  segment: number;
};
export type RunFix = Omit<RunPoint, 'segment'>;
export type RunDraft = {
  format: 1;
  unit: 'km' | 'mi';
  id: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  localDate: string;
  timeZone: string;
  status: 'recording' | 'paused' | 'review';
  background: boolean;
  clock: Clock;
  segment: number;
  route: RunPoint[];
  distanceMeters: number;
  updatedAt: number;
  notes: string;
  interruption: string | null;
};
export const runLimits = { points: 20000, accuracy: 35, gapSeconds: 60, speed: 12, hours: 24 };
export function validFix(value: RunFix) {
  return (
    Object.values(value).every(Number.isFinite) &&
    Math.abs(value.latitude) <= 90 &&
    Math.abs(value.longitude) <= 180 &&
    value.timestamp >= 0 &&
    value.timestamp <= 4133980800000 &&
    value.accuracy >= 0 &&
    value.accuracy <= runLimits.accuracy
  );
}
export function pointDistance(a: RunFix, b: RunFix) {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
export function routeDistance(route: readonly RunPoint[]) {
  return route.reduce((sum, point, index) => {
    const previous = route[index - 1];
    return (
      sum + (previous && previous.segment === point.segment ? pointDistance(previous, point) : 0)
    );
  }, 0);
}
export function newRun(
  id: string,
  userId: string,
  timeZone: string,
  background: boolean,
  first: RunFix,
  now: number,
  unit: 'km' | 'mi' = 'km',
): RunDraft {
  if (
    !validExerciseId(id) ||
    !validExerciseId(userId) ||
    !validFix(first) ||
    first.timestamp > now ||
    now - first.timestamp > 15000
  )
    throw new Error('Wait for a fresh, accurate GPS signal and try again.');
  const startedAt = new Date(first.timestamp).toISOString();
  return {
    format: 1,
    unit,
    id,
    userId,
    timeZone,
    startedAt,
    endedAt: null,
    localDate: localNutritionDate(timeZone, new Date(startedAt)),
    background,
    status: 'recording',
    clock: { elapsedMs: 0, runningSince: now },
    segment: 0,
    route: [{ ...first, segment: 0 }],
    distanceMeters: 0,
    updatedAt: now,
    notes: '',
    interruption: null,
  };
}
export function appendRunFix(draft: RunDraft, fix: RunFix): RunDraft {
  if (
    draft.status !== 'recording' ||
    !validFix(fix) ||
    fix.timestamp < (draft.clock.runningSince ?? Infinity)
  )
    return draft;
  const previous = draft.route.at(-1);
  if (!previous || fix.timestamp <= previous.timestamp) return draft;
  if (
    fix.timestamp - Date.parse(draft.startedAt) > 86400000 ||
    draft.route.length >= runLimits.points
  )
    return pauseRun(
      draft,
      Math.min(fix.timestamp, Date.parse(draft.startedAt) + 86400000),
      'Recording limit reached. Review and save this run.',
    );
  const seconds = (fix.timestamp - previous.timestamp) / 1000;
  const metres = pointDistance(previous, fix);
  let segment = draft.segment;
  if (segment === previous.segment) {
    if (seconds > runLimits.gapSeconds) segment++;
    else if (metres / seconds > runLimits.speed || metres < 5) return draft;
  }
  const point = { ...fix, segment };
  return {
    ...draft,
    segment,
    route: [...draft.route, point],
    updatedAt: fix.timestamp,
    distanceMeters: draft.distanceMeters + (segment === previous.segment ? metres : 0),
  };
}
export function pauseRun(
  draft: RunDraft,
  now: number,
  interruption: string | null = null,
): RunDraft {
  if (draft.status !== 'recording') return draft;
  return {
    ...draft,
    status: 'paused',
    clock: pauseClock(draft.clock, now),
    updatedAt: now,
    interruption,
  };
}
export function resumeRun(draft: RunDraft, now: number): RunDraft {
  if (draft.status !== 'paused') throw new Error('This run cannot be resumed.');
  if (now - Date.parse(draft.startedAt) >= 86400000 || draft.route.length >= runLimits.points)
    throw new Error('Recording limit reached. Save this run and start a new one.');
  return {
    ...draft,
    status: 'recording',
    clock: resumeClock(draft.clock, now),
    segment: draft.segment + 1,
    updatedAt: now,
    interruption: null,
  };
}
export function finishRun(draft: RunDraft, now: number): RunDraft {
  if (draft.status === 'review') return draft;
  const ended = Math.min(now, Date.parse(draft.startedAt) + 86400000);
  return {
    ...pauseRun(draft, ended),
    status: 'review',
    endedAt: new Date(ended).toISOString(),
    updatedAt: ended,
  };
}
export function runSeconds(draft: RunDraft, now: number) {
  return Math.min(86400, Math.max(0, Math.floor(elapsed(draft.clock, now) / 1000)));
}
export function runClock(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return value >= 3600
    ? `${Math.floor(value / 3600)}:${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
    : `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}
export function runDistance(metres: number, unit: 'km' | 'mi') {
  return (metres / (unit === 'mi' ? 1609.344 : 1000)).toFixed(2);
}
export function runPace(seconds: number, metres: number, unit: 'km' | 'mi') {
  return metres < 20 || seconds <= 0
    ? '—'
    : `${runClock(seconds / (metres / (unit === 'mi' ? 1609.344 : 1000)))} /${unit}`;
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function readRunPoints(value: unknown): RunPoint[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > runLimits.points)
    throw new Error('Run route unavailable.');
  return value.map((item, index) => {
    if (
      !object(item) ||
      typeof item.latitude !== 'number' ||
      typeof item.longitude !== 'number' ||
      typeof item.timestamp !== 'number' ||
      typeof item.accuracy !== 'number' ||
      typeof item.segment !== 'number'
    )
      throw new Error('Run point unavailable.');
    const point = {
      latitude: item.latitude,
      longitude: item.longitude,
      timestamp: item.timestamp,
      accuracy: item.accuracy,
      segment: item.segment,
    };
    const previous: unknown = value[index - 1];
    if (
      !validFix(point) ||
      !Number.isInteger(point.segment) ||
      point.segment < 0 ||
      point.segment > 20000 ||
      (object(previous) &&
        (typeof previous.timestamp !== 'number' ||
          typeof previous.segment !== 'number' ||
          point.timestamp <= previous.timestamp ||
          point.segment < previous.segment))
    )
      throw new Error('Invalid run route.');
    return point;
  });
}
export function restoreRun(raw: string, userId: string): RunDraft {
  const value: unknown = JSON.parse(raw);
  if (
    !object(value) ||
    (value.unit !== 'km' && value.unit !== 'mi') ||
    value.format !== 1 ||
    value.userId !== userId ||
    typeof value.id !== 'string' ||
    !validExerciseId(value.id) ||
    typeof value.startedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.startedAt)) ||
    typeof value.localDate !== 'string' ||
    typeof value.timeZone !== 'string' ||
    !['recording', 'paused', 'review'].includes(String(value.status)) ||
    typeof value.background !== 'boolean' ||
    typeof value.segment !== 'number' ||
    !Number.isInteger(value.segment) ||
    value.segment < 0 ||
    !object(value.clock) ||
    typeof value.clock.elapsedMs !== 'number' ||
    !Number.isFinite(value.clock.elapsedMs) ||
    value.clock.elapsedMs < 0 ||
    value.clock.elapsedMs > 86400000 ||
    (value.clock.runningSince !== null &&
      (typeof value.clock.runningSince !== 'number' ||
        !Number.isFinite(value.clock.runningSince))) ||
    typeof value.updatedAt !== 'number' ||
    !Number.isFinite(value.updatedAt) ||
    typeof value.notes !== 'string' ||
    value.notes.length > 2000 ||
    (value.interruption !== null && typeof value.interruption !== 'string')
  )
    throw new Error('Saved run unavailable. Keep device storage and retry.');
  const route = readRunPoints(value.route);
  const status =
    value.status === 'recording' ? 'recording' : value.status === 'paused' ? 'paused' : 'review';
  const endedAt =
    typeof value.endedAt === 'string' && Number.isFinite(Date.parse(value.endedAt))
      ? value.endedAt
      : null;
  if (
    (status === 'recording') !== (value.clock.runningSince !== null) ||
    (status === 'review') !== (endedAt !== null) ||
    localNutritionDate(value.timeZone, new Date(value.startedAt)) !== value.localDate ||
    value.segment < route[route.length - 1].segment
  )
    throw new Error('Saved run state unavailable.');
  return {
    format: 1,
    unit: value.unit,
    id: value.id,
    userId,
    startedAt: value.startedAt,
    endedAt,
    localDate: value.localDate,
    timeZone: value.timeZone,
    status,
    background: value.background,
    clock: { elapsedMs: value.clock.elapsedMs, runningSince: value.clock.runningSince },
    segment: value.segment,
    route,
    distanceMeters: routeDistance(route),
    updatedAt: value.updatedAt,
    notes: value.notes,
    interruption: value.interruption,
  };
}
