import { getSupabase } from '@/lib/supabase/client';
import type { Database, Json } from '@/lib/supabase/database.types';
import { validExerciseId } from '@/features/exercises/exercise-service';
export type PlanFilters = {
  goal: 'general' | 'strength' | 'hypertrophy' | null;
  experience: 'beginner' | 'intermediate' | null;
  days: number | null;
  availableOnly: boolean;
};
type PlanRow = Database['public']['Functions']['get_training_plans']['Returns'][number];
export function planWorkouts(value: Json) {
  if (!Array.isArray(value)) throw new Error('Plan preview unavailable.');
  return value.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.name !== 'string' ||
      typeof item.sets !== 'number' ||
      typeof item.reps !== 'number' ||
      typeof item.rest_seconds !== 'number' ||
      !Array.isArray(item.exercises)
    )
      throw new Error('Plan preview unavailable.');
    const exercises = item.exercises.map((name) => {
      if (typeof name !== 'string') throw new Error('Plan preview unavailable.');
      return name;
    });
    return {
      name: item.name,
      sets: item.sets,
      reps: item.reps,
      rest: item.rest_seconds,
      exercises,
    };
  });
}
export type TrainingPlan = Omit<PlanRow, 'workouts' | 'schedule'> & {
  // PostgreSQL arrays can contain null rest days; generated types omit element nullability.
  schedule: (string | null)[];
  workouts: ReturnType<typeof planWorkouts>;
};
async function owner(expected: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== expected)
    throw new Error('Account changed. Reopen training plans.');
}
export const planService = {
  async list(userId: string, filters: PlanFilters): Promise<TrainingPlan[]> {
    await owner(userId);
    const { data, error } = await getSupabase().rpc('get_training_plans', {
      ...(filters.goal ? { p_goal: filters.goal } : {}),
      ...(filters.experience ? { p_experience: filters.experience } : {}),
      ...(filters.days ? { p_days: filters.days } : {}),
      p_available_only: filters.availableOnly,
    });
    if (error || !data) throw new Error('Unable to load plans. Retry.');
    return data.map((row) => ({ ...row, workouts: planWorkouts(row.workouts) }));
  },
  async adopt(userId: string, planId: string, splitId: string) {
    if (!validExerciseId(planId) || !validExerciseId(splitId))
      throw new Error('Invalid plan selection.');
    await owner(userId);
    const { data, error } = await getSupabase().rpc('adopt_training_plan', {
      p_plan_id: planId,
      p_split_id: splitId,
    });
    if (error || data !== splitId)
      throw new Error('Unable to add plan. Retry to recover the same copy.');
    return data;
  },
};
