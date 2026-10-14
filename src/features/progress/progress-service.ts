import { getSupabase } from '@/lib/supabase/client';
import { recordResult } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import { localNutritionDate } from '@/features/nutrition/nutrition-model';
import {
  progressRange,
  validateProgressRange,
  type ProgressPreset,
  type ProgressRange,
} from './progress-period';
import {
  nutritionProgress,
  workoutFrequency,
  strengthProgress,
  stepsProgress,
  habitsProgress,
  periodSummaries,
} from './progress-model';
import { parseOverview } from '@/features/workouts/training-overview';
import { monday } from '@/features/habits/habit-model';

// Exact-count pagination avoids silently truncating analytics at a project's API row cap.
export async function progressPages<T>(
  read: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown; count: number | null }>,
) {
  const rows: T[] = [];
  let expected: number | null = null;
  do {
    const result = await read(rows.length, rows.length + 499),
      page = recordResult(result.data, result.error);
    if (
      result.count === null ||
      result.count < 0 ||
      (expected !== null && expected !== result.count) ||
      (!page.length && rows.length < result.count) ||
      rows.length + page.length > result.count
    )
      throw new Error('Progress history changed or is incomplete. Retry loading.');
    expected = result.count;
    rows.push(...page);
  } while (rows.length < expected);
  return rows;
}
async function progressContext(
  userId: string,
  source: 'food_logs' | 'workout_sessions' | 'daily_activity' | 'habits' | 'summary',
  preset: ProgressPreset,
  custom?: ProgressRange,
) {
  const preferences = await profileService.getPreferences(userId),
    today = localNutritionDate(preferences.time_zone),
    client = getSupabase();
  if (!['kcal', 'kJ'].includes(preferences.energy_unit))
    throw new Error('Energy preference unavailable.');
  let earliest: string | null = null;
  if (preset === 'All' && !custom) {
    if (source === 'summary') {
      const firsts = await Promise.all([
        client
          .from('food_logs')
          .select('date:local_date')
          .eq('user_id', userId)
          .lte('local_date', today)
          .order('local_date')
          .limit(1)
          .maybeSingle(),
        client
          .from('workout_sessions')
          .select('date:local_date')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .lte('local_date', today)
          .order('local_date')
          .limit(1)
          .maybeSingle(),
        client
          .from('daily_activity')
          .select('date:local_date')
          .eq('user_id', userId)
          .lte('local_date', today)
          .order('local_date')
          .limit(1)
          .maybeSingle(),
        client
          .from('body_weights')
          .select('date:local_date')
          .eq('user_id', userId)
          .lte('local_date', today)
          .order('local_date')
          .limit(1)
          .maybeSingle(),
        client
          .from('habits')
          .select('date:start_date')
          .eq('user_id', userId)
          .eq('archived', false)
          .lte('start_date', today)
          .order('start_date')
          .limit(1)
          .maybeSingle(),
      ]);
      if (firsts.some((first) => first.error)) throw new Error('Summary dates unavailable. Retry.');
      earliest = firsts.flatMap((first) => (first.data ? [first.data.date] : [])).sort()[0] ?? null;
    } else if (source === 'habits') {
      const first = await client
        .from('habits')
        .select('start_date')
        .eq('user_id', userId)
        .lte('start_date', today)
        .order('start_date')
        .limit(1)
        .maybeSingle();
      if (first.error) throw new Error('Habit dates unavailable. Retry.');
      earliest = first.data?.start_date ?? null;
    } else {
      const query =
        source === 'workout_sessions'
          ? client.from(source).select('local_date').eq('status', 'completed')
          : client.from(source).select('local_date');
      const first = await query
        .eq('user_id', userId)
        .lte('local_date', today)
        .order('local_date')
        .limit(1)
        .maybeSingle();
      if (first.error) throw new Error('Progress dates unavailable. Retry.');
      earliest = first.data?.local_date ?? null;
    }
  }
  const range = validateProgressRange(custom ?? progressRange(today, preset, earliest), today);
  return { userId, preferences, today, ...range };
}
type ProgressContext = Awaited<ReturnType<typeof progressContext>>;
async function readNutrition(context: ProgressContext) {
  const { userId, ...range } = context,
    client = getSupabase();
  const [logs, targets] = await Promise.all([
    progressPages((from, to) =>
      client
        .from('food_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('local_date', range.from)
        .lte('local_date', range.to)
        .order('local_date')
        .order('id')
        .range(from, to),
    ),
    progressPages((from, to) =>
      client
        .from('nutrition_target_history')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .lte('effective_date', range.to)
        .order('effective_date')
        .range(from, to),
    ),
  ]);
  return { ...context, logs, targets, summary: nutritionProgress(logs, targets, range) };
}
async function readTraining(context: ProgressContext) {
  const { userId, from, to } = context,
    client = getSupabase();
  const [result, sessions] = await Promise.all([
    client.rpc('get_training_overview', { p_from: from, p_to: to }),
    progressPages((start, end) =>
      client
        .from('workout_sessions')
        .select('id,local_date,mode,duration_seconds', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('local_date', from)
        .lte('local_date', to)
        .order('local_date')
        .order('id')
        .range(start, end),
    ),
  ]);
  const overview = parseOverview(recordResult(result.data, result.error));
  return {
    ...context,
    overview,
    sessions,
    frequency: workoutFrequency(overview, sessions, context),
  };
}
async function readSteps(context: ProgressContext) {
  const { userId, from, to } = context,
    client = getSupabase();
  const [rows, target] = await Promise.all([
    progressPages((start, end) =>
      client
        .from('daily_activity')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('local_date', from)
        .lte('local_date', to)
        .order('local_date')
        .range(start, end),
    ),
    client.from('activity_targets').select('steps_target').eq('user_id', userId).maybeSingle(),
  ]);
  if (target.error) throw new Error('Activity target unavailable. Retry.');
  return {
    ...context,
    rows,
    target: target.data?.steps_target ?? null,
    summary: stepsProgress(rows, context),
  };
}
async function readHabits(context: ProgressContext) {
  const { userId, to } = context,
    client = getSupabase();
  const [records, versions, logs] = await Promise.all([
    progressPages((start, end) =>
      client
        .from('habits')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .lte('start_date', to)
        .order('id')
        .range(start, end),
    ),
    progressPages((start, end) =>
      client
        .from('habit_versions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .lte('effective_from', to)
        .order('habit_id')
        .order('effective_from')
        .range(start, end),
    ),
    progressPages((start, end) =>
      client
        .from('habit_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('local_date', monday(context.from))
        .lte('local_date', to)
        .order('habit_id')
        .order('local_date')
        .range(start, end),
    ),
  ]);
  const rows = records.map((record) => ({
    ...record,
    habit_versions: versions.filter((version) => version.habit_id === record.id),
    habit_logs: logs.filter((log) => log.habit_id === record.id),
  }));
  return { ...context, records: rows, summary: habitsProgress(rows, context) };
}
export const progressService = {
  async summary(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    const context = await progressContext(userId, 'summary', preset, custom);
    const [nutrition, training, steps, habits, weights] = await Promise.all([
      readNutrition(context),
      readTraining(context),
      readSteps(context),
      readHabits(context),
      progressPages((start, end) =>
        getSupabase()
          .from('body_weights')
          .select('local_date,weight_kg', { count: 'exact' })
          .eq('user_id', userId)
          .gte('local_date', context.from)
          .lte('local_date', context.to)
          .order('local_date')
          .range(start, end),
      ),
    ]);
    const sources = {
      logs: nutrition.logs,
      targets: nutrition.targets,
      training: training.overview,
      activity: steps.rows,
      habits: habits.records,
      weights,
    };
    return {
      ...context,
      weeks: periodSummaries(sources, context, 'week'),
      months: periodSummaries(sources, context, 'month'),
    };
  },
  async nutrition(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    return readNutrition(await progressContext(userId, 'food_logs', preset, custom));
  },
  async training(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    return readTraining(await progressContext(userId, 'workout_sessions', preset, custom));
  },
  async steps(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    return readSteps(await progressContext(userId, 'daily_activity', preset, custom));
  },
  async habits(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    return readHabits(await progressContext(userId, 'habits', preset, custom));
  },
  async strength(userId: string, preset: ProgressPreset = '30D', custom?: ProgressRange) {
    const context = await progressContext(userId, 'workout_sessions', preset, custom),
      client = getSupabase();
    const rows = await progressPages((from, to) =>
      client
        .from('workout_sets')
        .select(
          'id,reps,weight_kg,workout_session_exercises!inner(exercise_id,exercise_name,workout_sessions!inner(local_date,status))',
          { count: 'exact' },
        )
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .eq('workout_session_exercises.workout_sessions.status', 'completed')
        .gte('workout_session_exercises.workout_sessions.local_date', context.from)
        .lte('workout_session_exercises.workout_sessions.local_date', context.to)
        .order('id')
        .range(from, to),
    );
    const sets = rows.map((row) => {
      if (row.reps === null) throw new Error('Completed set has no repetitions. Retry.');
      return {
        date: row.workout_session_exercises.workout_sessions.local_date,
        exerciseId: row.workout_session_exercises.exercise_id,
        name: row.workout_session_exercises.exercise_name,
        reps: row.reps,
        weightKg: row.weight_kg,
      };
    });
    return { ...context, exercises: strengthProgress(sets) };
  },
};
