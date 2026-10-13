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
  return draft.days.map((day, index) => {
    if (day.isRest ? day.workoutId !== null : !validExerciseId(day.workoutId))
      throw new Error(`Choose a workout or rest for ${weekdays[index]}.`);
    return { is_rest: day.isRest, workout_id: day.workoutId };
  });
}
