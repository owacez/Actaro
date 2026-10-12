import { getSupabase } from '@/lib/supabase/client';
import { mediaUrls, validExerciseId } from '@/features/exercises/exercise-service';
import { displayWeight, workoutPayload, type WorkoutDraft, type WeightUnit } from './workout-model';

async function owner(expected: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== expected)
    throw new Error('Your account changed. Reopen workouts.');
  return data.user.id;
}
export const workoutService = {
  async remove(userId: string, workoutId: string) {
    if (!validExerciseId(workoutId)) throw new Error('Invalid workout.');
    const id = await owner(userId);
    const { data, error } = await getSupabase()
      .from('workout_templates')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', id)
      .select('id');
    if (error) throw new Error('Unable to delete workout. Check your connection and retry.');
    if (data?.length !== 1 || data[0].id !== workoutId)
      throw new Error('Workout unavailable. Reopen My workouts.');
  },
  async list(userId: string, offset: number) {
    const id = await owner(userId);
    if (!Number.isInteger(offset) || offset < 0) throw new Error('Invalid page.');
    const { data, error } = await getSupabase()
      .from('workout_templates')
      .select('id,name,updated_at,workout_template_exercises(count)')
      .eq('user_id', id)
      .order('updated_at', { ascending: false })
      .order('id')
      .range(offset, offset + 10);
    if (error || !data)
      throw new Error('Unable to load workouts. Check your connection and retry.');
    return { rows: data.slice(0, 10), more: data.length > 10 };
  },
  async load(userId: string, id: string) {
    await owner(userId);
    if (!validExerciseId(id)) throw new Error('Invalid workout.');
    const { data: preference, error: prefError } = await getSupabase()
      .from('user_preferences')
      .select('weight_unit')
      .eq('user_id', userId)
      .single();
    if (prefError || !preference) throw new Error('Unable to load weight preferences. Retry.');
    const unit: WeightUnit = preference.weight_unit === 'lb' ? 'lb' : 'kg';
    const { data, error } = await getSupabase()
      .from('workout_templates')
      .select(
        '*,workout_template_exercises(*,exercises(name,exercise_media(storage_path,pose)),workout_template_sets(*))',
      )
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error('Unable to load this workout. Retry.');
    if (!data) return { unit, draft: null };
    const paths = data.workout_template_exercises.map(
      (entry) =>
        entry.exercises.exercise_media.find((media) => media.pose === 'start')?.storage_path ??
        entry.exercises.exercise_media[0]?.storage_path ??
        '',
    );
    const urls = await mediaUrls(paths);
    const draft: WorkoutDraft = {
      id: data.id,
      name: data.name,
      notes: data.notes ?? '',
      exercises: data.workout_template_exercises
        .map((entry, index) => ({
          key: entry.id,
          exerciseId: entry.exercise_id,
          name: entry.exercises.name,
          imageUrl: urls.get(paths[index]) ?? null,
          notes: entry.notes ?? '',
          sets: [...entry.workout_template_sets]
            .sort((a, b) => a.position - b.position)
            .map((set) => ({
              reps: set.reps === null ? '' : String(set.reps),
              weight: displayWeight(set.weight_kg, unit),
              rest: String(set.rest_seconds),
              rpe: set.rpe === null ? '' : String(set.rpe),
              notes: set.notes ?? '',
            })),
          position: entry.position,
        }))
        .sort((a, b) => a.position - b.position),
    };
    return { unit, draft };
  },
  async save(userId: string, draft: WorkoutDraft, unit: WeightUnit) {
    if (
      !validExerciseId(draft.id) ||
      draft.exercises.some((item) => !validExerciseId(item.exerciseId))
    )
      throw new Error('Invalid workout selection.');
    const payload = workoutPayload(draft, unit);
    await owner(userId);
    const { data, error } = await getSupabase().rpc('save_workout_template', {
      p_id: draft.id,
      p_name: draft.name.trim(),
      p_notes: draft.notes.trim(),
      p_exercises: payload,
    });
    if (error || data !== draft.id)
      throw new Error('Unable to save workout. Your draft is kept; retry.');
    return data;
  },
};
