export type SetDraft = { reps: string; weight: string; rest: string; rpe: string; notes: string };
export type ExerciseDraft = {
  key: string;
  exerciseId: string;
  name: string;
  imageUrl: string | null;
  notes: string;
  sets: SetDraft[];
};
export type WorkoutDraft = { id: string; name: string; notes: string; exercises: ExerciseDraft[] };
export type WeightUnit = 'kg' | 'lb';
export const blankSet = (): SetDraft => ({ reps: '8', weight: '', rest: '90', rpe: '', notes: '' });
export const poundsPerKg = 2.2046226218487757;
export function displayWeight(kg: number | null, unit: WeightUnit) {
  return kg === null
    ? ''
    : String(Math.round(kg * (unit === 'lb' ? poundsPerKg : 1) * 1000) / 1000);
}
function numberField(
  value: string,
  label: string,
  min: number,
  max: number,
  integer = false,
  decimals = 3,
) {
  const text = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(text)) throw new Error(`${label}: enter a valid number.`);
  const number = Number(text);
  if (number < min || number > max || (integer && !Number.isInteger(number)))
    throw new Error(
      `${label}: enter ${integer ? 'a whole number' : 'a number'} from ${min} to ${max}.`,
    );
  if ((text.split('.')[1]?.length ?? 0) > decimals)
    throw new Error(`${label}: use at most ${decimals} decimal place${decimals === 1 ? '' : 's'}.`);
  return number;
}
export function workoutPayload(draft: WorkoutDraft, unit: WeightUnit) {
  if (!draft.name.trim() || draft.name.trim().length > 100)
    throw new Error('Enter a workout name of 1 to 100 characters.');
  if (draft.notes.length > 2000) throw new Error('Workout notes must be at most 2,000 characters.');
  if (!draft.exercises.length || draft.exercises.length > 100)
    throw new Error('Choose 1 to 100 exercises.');
  return draft.exercises.map((exercise, index) => {
    if (exercise.notes.length > 2000)
      throw new Error('Exercise notes must be at most 2,000 characters.');
    if (!exercise.sets.length || exercise.sets.length > 100)
      throw new Error('Choose 1 to 100 sets per exercise.');
    return {
      exercise_id: exercise.exerciseId,
      notes: exercise.notes.trim() || null,
      sets: exercise.sets.map((set, position) => {
        const label = `Exercise ${index + 1}, set ${position + 1}`;
        if (set.notes.length > 2000) throw new Error(`${label}: notes exceed 2,000 characters.`);
        const weight = set.weight.trim()
          ? numberField(
              set.weight,
              `${label} weight`,
              0,
              unit === 'lb' ? 10000 * poundsPerKg : 10000,
            )
          : null;
        return {
          reps: numberField(set.reps, `${label} reps`, 1, 1000, true),
          weight_kg:
            weight === null
              ? null
              : Math.round((weight / (unit === 'lb' ? poundsPerKg : 1)) * 1000) / 1000,
          rest_seconds: numberField(set.rest, `${label} rest`, 0, 3600, true),
          rpe: set.rpe.trim() ? numberField(set.rpe, `${label} RPE`, 1, 10, false, 1) : null,
          notes: set.notes.trim() || null,
        };
      }),
    };
  });
}
