import { validExerciseId } from '@/features/exercises/exercise-service';
export const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;
export type SplitDay = { isRest: boolean; workoutId: string | null; workoutName: string | null };
export type SplitDraft = { id: string; name: string; active: boolean; days: SplitDay[] };
export function splitPayload(draft: SplitDraft) {
  if (!validExerciseId(draft.id) || !draft.name.trim() || draft.name.trim().length > 100)
    throw new Error('Enter a split name of 1 to 100 characters.');
  if (draft.days.length !== 7) throw new Error('A split needs seven days.');
  // Name every day still unset so the user sees the whole week, not one day at a time.
  const missing = weekdays.filter((_, index) => {
    const day = draft.days[index];
    return day.isRest ? day.workoutId !== null : !validExerciseId(day.workoutId);
  });
  if (missing.length)
    throw new Error(`Every day needs a workout or rest. Still to set: ${missing.join(', ')}.`);
  return draft.days.map((day) => ({ is_rest: day.isRest, workout_id: day.workoutId }));
}
