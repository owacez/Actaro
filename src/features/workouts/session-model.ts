import { validExerciseId } from '@/features/exercises/exercise-service';
import { workoutPayload, type SetDraft, type WorkoutDraft, type WeightUnit } from './workout-model';
export type Clock = { elapsedMs: number; runningSince: number | null };
export type Performance = {
  previous: { reps: number; weightKg: number | null }[];
  heaviestKg: number | null;
  estimated1rm: number | null;
  repsByWeight: Record<string, number>;
};
export type SessionExercise = {
  id: string;
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  metadata: string;
  notes: string;
  performance: Performance;
  sets: (SetDraft & { id: string; completedAt: string | null })[];
};
export type SessionDraft = {
  format: 1;
  userId: string;
  id: string;
  templateId: string | null;
  name: string;
  notes: string;
  unit: WeightUnit;
  mode: 'timed' | 'log_only';
  status: 'active' | 'pending' | 'saved';
  startedAt: string;
  endedAt: string | null;
  localDate: string;
  timeZone: string;
  clock: Clock;
  rest: Clock | null;
  restDuration: number;
  version: number;
  mutationId: string | null;
  exercises: SessionExercise[];
};
export const emptyPerformance = (): Performance => ({
  previous: [],
  heaviestKg: null,
  estimated1rm: null,
  repsByWeight: {},
});
export function elapsed(clock: Clock, now: number) {
  return (
    clock.elapsedMs + (clock.runningSince === null ? 0 : Math.max(0, now - clock.runningSince))
  );
}
export function pauseClock(clock: Clock, now: number): Clock {
  return { elapsedMs: elapsed(clock, now), runningSince: null };
}
export function resumeClock(clock: Clock, now: number): Clock {
  return clock.runningSince === null ? { ...clock, runningSince: now } : clock;
}
export function timerText(ms: number) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function localDateAt(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-');
}
export function prestartTotals(draft: WorkoutDraft) {
  const sets = draft.exercises.flatMap((exercise) => exercise.sets);
  return {
    sets: sets.length,
    estimatedMinutes: Math.ceil(
      (sets.length * 45 + sets.slice(0, -1).reduce((sum, set) => sum + Number(set.rest), 0)) / 60,
    ),
  };
}
export function sessionPayload(session: SessionDraft) {
  if (session.status === 'active' || !session.endedAt || !session.mutationId)
    throw new Error('Finish the workout before saving.');
  const completed = session.exercises
    .map((exercise) => ({ ...exercise, sets: exercise.sets.filter((set) => set.completedAt) }))
    .filter((exercise) => exercise.sets.length);
  if (!completed.length) throw new Error('Complete at least one set.');
  const draft: WorkoutDraft = {
    id: session.id,
    name: session.name,
    notes: session.notes,
    exercises: completed.map((exercise) => ({ ...exercise, key: exercise.id })),
  };
  const values = workoutPayload(draft, session.unit);
  const duration = Math.min(
    Math.floor(elapsed(session.clock, Date.parse(session.endedAt)) / 1000),
    Math.floor((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000),
  );
  return {
    id: session.id,
    template_id: session.templateId,
    name: session.name.trim(),
    notes: session.notes.trim(),
    mode: session.mode,
    status: 'completed',
    started_at: session.startedAt,
    ended_at: session.endedAt,
    local_date: session.localDate,
    time_zone: session.timeZone,
    duration_seconds: session.mode === 'timed' ? duration : null,
    exercises: values.map((exercise, index) => ({
      ...exercise,
      id: completed[index].id,
      sets: exercise.sets.map((set, position) => ({
        ...set,
        id: completed[index].sets[position].id,
        completed_at: completed[index].sets[position].completedAt,
      })),
    })),
  };
}
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const nullableNumber = (value: unknown) => value === null || finite(value);
const instant = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
function validClock(value: unknown): value is Clock {
  return (
    object(value) &&
    finite(value.elapsedMs) &&
    value.elapsedMs >= 0 &&
    nullableNumber(value.runningSince)
  );
}
export function parsePerformance(previous: unknown, best: unknown): Performance {
  if (
    !Array.isArray(previous) ||
    !object(best) ||
    !nullableNumber(best.heaviest_kg) ||
    !nullableNumber(best.estimated_1rm) ||
    !object(best.reps_by_weight)
  )
    throw new Error('Performance data unavailable.');
  const rows = previous.map((value) => {
    if (
      !object(value) ||
      !finite(value.reps) ||
      !(value.weight_kg === null || finite(value.weight_kg))
    )
      throw new Error('Performance data unavailable.');
    return { reps: value.reps, weightKg: value.weight_kg };
  });
  const repsByWeight: Record<string, number> = {};
  for (const [key, value] of Object.entries(best.reps_by_weight)) {
    if (!finite(value)) throw new Error('Performance data unavailable.');
    repsByWeight[key] = value;
  }
  return {
    previous: rows,
    heaviestKg: typeof best.heaviest_kg === 'number' ? best.heaviest_kg : null,
    estimated1rm: typeof best.estimated_1rm === 'number' ? best.estimated_1rm : null,
    repsByWeight,
  };
}
function validPerformance(value: unknown): value is Performance {
  return (
    object(value) &&
    Array.isArray(value.previous) &&
    value.previous.every(
      (row) => object(row) && finite(row.reps) && nullableNumber(row.weightKg),
    ) &&
    nullableNumber(value.heaviestKg) &&
    nullableNumber(value.estimated1rm) &&
    object(value.repsByWeight) &&
    Object.values(value.repsByWeight).every(finite)
  );
}
function validSession(value: unknown): value is SessionDraft {
  if (
    !object(value) ||
    value.format !== 1 ||
    !validExerciseId(value.userId) ||
    !validExerciseId(value.id) ||
    !(value.templateId === null || validExerciseId(value.templateId)) ||
    typeof value.name !== 'string' ||
    typeof value.notes !== 'string' ||
    !['kg', 'lb'].includes(String(value.unit)) ||
    !['timed', 'log_only'].includes(String(value.mode)) ||
    !['active', 'pending', 'saved'].includes(String(value.status)) ||
    !instant(value.startedAt) ||
    !(value.endedAt === null || instant(value.endedAt)) ||
    typeof value.localDate !== 'string' ||
    typeof value.timeZone !== 'string' ||
    !validClock(value.clock) ||
    !(value.rest === null || validClock(value.rest)) ||
    !finite(value.restDuration) ||
    value.restDuration < 0 ||
    !finite(value.version) ||
    !Number.isInteger(value.version) ||
    value.version < 0 ||
    !(value.mutationId === null || validExerciseId(value.mutationId))
  )
    return false;
  return (
    Array.isArray(value.exercises) &&
    value.exercises.length >= 1 &&
    value.exercises.length <= 100 &&
    value.exercises.every(
      (exercise) =>
        object(exercise) &&
        validExerciseId(exercise.id) &&
        validExerciseId(exercise.exerciseId) &&
        typeof exercise.name === 'string' &&
        typeof exercise.metadata === 'string' &&
        (exercise.imageUrl === null || typeof exercise.imageUrl === 'string') &&
        typeof exercise.notes === 'string' &&
        validPerformance(exercise.performance) &&
        Array.isArray(exercise.sets) &&
        exercise.sets.length >= 1 &&
        exercise.sets.length <= 100 &&
        exercise.sets.every(
          (set) =>
            object(set) &&
            validExerciseId(set.id) &&
            ['reps', 'weight', 'rest', 'rpe', 'notes'].every(
              (field) => typeof set[field] === 'string',
            ) &&
            (set.completedAt === null || instant(set.completedAt)),
        ),
    )
  );
}
export function restoreSession(text: string, userId: string): SessionDraft {
  const value: unknown = JSON.parse(text);
  if (!validSession(value) || value.userId !== userId)
    throw new Error('Saved workout could not be restored. It has been kept on this device.');
  return value;
}
