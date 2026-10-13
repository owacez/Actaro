import { getSupabase } from '@/lib/supabase/client';
import { localDateAt } from './session-model';
import { parseOverview, shiftDate } from './training-overview';
export const trainingService = {
  async load(userId: string) {
    const { data: auth, error: authError } = await getSupabase().auth.getUser();
    if (authError || auth.user?.id !== userId)
      throw new Error('Unable to verify account. Retry training summary.');
    const { data: preferences, error: preferenceError } = await getSupabase()
      .from('user_preferences')
      .select('weight_unit,time_zone')
      .eq('user_id', userId)
      .single();
    if (preferenceError || !preferences) throw new Error('Unable to load preferences. Retry.');
    const today = localDateAt(new Date().toISOString(), preferences.time_zone);
    const [overview, split] = await Promise.all([
      getSupabase().rpc('get_training_overview', { p_from: shiftDate(today, -27), p_to: today }),
      getSupabase()
        .from('training_splits')
        .select('name,updated_at,training_split_days(weekday,is_rest,workout_id)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle(),
    ]);
    if (overview.error || overview.data === null || split.error)
      throw new Error('Unable to load training summary. Retry.');
    const plan = split.data
      ? {
          name: split.data.name,
          since: localDateAt(split.data.updated_at, preferences.time_zone),
          days: [...split.data.training_split_days]
            .sort((a, b) => a.weekday - b.weekday)
            .map((day) => ({ isRest: day.is_rest, workoutId: day.workout_id })),
        }
      : null;
    return {
      overview: parseOverview(overview.data),
      plan,
      today,
      unit: preferences.weight_unit === 'lb' ? ('lb' as const) : ('kg' as const),
      timeZone: preferences.time_zone,
    };
  },
};
