import { randomUUID } from 'expo-crypto';
import { getSupabase } from '@/lib/supabase/client';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { displayWeight } from './workout-model';
import { parsePerformance, type SessionDraft } from './session-model';
async function owner(expected: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== expected)
    throw new Error('Unable to verify account. Reopen workout history.');
}
export type HistoryFilters = { offset: number; query: string; mode: 'timed' | 'log_only' | null };
export const historyService = {
  async list(userId: string, filters: HistoryFilters) {
    await owner(userId);
    const [history, preference] = await Promise.all([
      getSupabase().rpc('get_training_history', {
        p_offset: filters.offset,
        p_query: filters.query,
        ...(filters.mode ? { p_mode: filters.mode } : {}),
      }),
      getSupabase().from('user_preferences').select('weight_unit').eq('user_id', userId).single(),
    ]);
    if (history.error || !history.data || preference.error || !preference.data)
      throw new Error('Unable to load history. Retry.');
    return {
      rows: history.data.slice(0, 10),
      more: history.data.length > 10,
      unit: preference.data.weight_unit === 'lb' ? ('lb' as const) : ('kg' as const),
    };
  },
  async load(userId: string, id: string): Promise<SessionDraft | null> {
    if (!validExerciseId(id)) throw new Error('Invalid recorded workout.');
    await owner(userId);
    const [saved, preference] = await Promise.all([
      getSupabase()
        .from('workout_sessions')
        .select('*,workout_session_exercises(*,workout_sets(*))')
        .eq('id', id)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .maybeSingle(),
      getSupabase().from('user_preferences').select('weight_unit').eq('user_id', userId).single(),
    ]);
    if (saved.error || preference.error || !preference.data)
      throw new Error('Unable to load recorded workout. Retry.');
    const row = saved.data;
    if (!row) return null;
    if (!row.ended_at || (row.mode !== 'timed' && row.mode !== 'log_only'))
      throw new Error('Recorded workout is incomplete.');
    const unit = preference.data.weight_unit === 'lb' ? 'lb' : 'kg';
    const entries = row.workout_session_exercises
      .filter((entry) => entry.workout_sets.some((set) => set.completed_at))
      .sort((a, b) => a.position - b.position);
    if (!entries.length) throw new Error('This record contains no completed sets.');
    const { data: performance, error } = await getSupabase().rpc('get_exercise_performance', {
      p_exercise_ids: [...new Set(entries.map((entry) => entry.exercise_id))],
      p_before: row.started_at,
      p_exclude_session: row.id,
    });
    if (error || !performance) throw new Error('Unable to calculate recorded performance. Retry.');
    return {
      format: 1,
      userId,
      id: row.id,
      templateId: row.template_id,
      name: row.name,
      notes: row.notes ?? '',
      unit,
      mode: row.mode,
      status: 'pending',
      startedAt: row.started_at,
      endedAt: row.ended_at,
      localDate: row.local_date,
      timeZone: row.time_zone,
      clock: { elapsedMs: (row.duration_seconds ?? 0) * 1000, runningSince: null },
      rest: null,
      restDuration: 0,
      version: row.version,
      mutationId: randomUUID(),
      exercises: entries.map((entry) => {
        const prior = performance.find((value) => value.exercise_id === entry.exercise_id);
        if (!prior) throw new Error('Recorded performance unavailable.');
        return {
          id: entry.id,
          exerciseId: entry.exercise_id,
          name: entry.exercise_name,
          imageUrl: null,
          metadata: 'Recorded exercise',
          notes: entry.notes ?? '',
          performance: parsePerformance(prior.previous, prior.best),
          sets: entry.workout_sets
            .filter((set) => set.completed_at)
            .sort((a, b) => a.position - b.position)
            .map((set) => ({
              id: set.id,
              reps: String(set.reps),
              weight: displayWeight(set.weight_kg, unit),
              rest: String(set.rest_seconds),
              rpe: set.rpe === null ? '' : String(set.rpe),
              notes: set.notes ?? '',
              completedAt: set.completed_at,
            })),
        };
      }),
    };
  },
  async remove(userId: string, id: string, version: number) {
    if (!validExerciseId(id) || !Number.isInteger(version) || version < 0)
      throw new Error('Invalid recorded workout.');
    await owner(userId);
    const { data, error } = await getSupabase()
      .from('workout_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .eq('version', version)
      .eq('status', 'completed')
      .select('id');
    if (error || data?.length !== 1)
      throw new Error('Workout changed or was already removed. Reopen history.');
  },
};
