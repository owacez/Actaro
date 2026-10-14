import { getSupabase } from '@/lib/supabase/client';
import { recordResult, requireOwner, recordInput, RecordRequestError } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import { localNutritionDate, nutritionDate } from '@/features/nutrition/nutrition-model';
import { wholeSteps } from './day-model';
import { canonicalInput } from '@/features/body/body-model';
export const activityService = {
  async load(userId: string, date?: string, offset = 0) {
    await requireOwner(userId);
    const preferences = await profileService.getPreferences(userId),
      today = localNutritionDate(preferences.time_zone),
      day = date ? nutritionDate(date) : today;
    if (day > today) throw new Error('Cannot log a future date.');
    const [current, history, target] = await Promise.all([
      getSupabase()
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .eq('local_date', day)
        .maybeSingle(),
      getSupabase()
        .from('daily_activity')
        .select('*')
        .eq('user_id', userId)
        .lte('local_date', day)
        .order('local_date', { ascending: false })
        .range(offset, offset + 29),
      getSupabase().from('activity_targets').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    if (current.error || target.error) throw new Error('Unable to load activity. Retry.');
    return {
      preferences,
      today,
      day,
      current: current.data,
      target: target.data,
      history: recordResult(history.data, history.error),
    };
  },
  async save(
    userId: string,
    date: string,
    steps: string,
    distance: string,
    unit: string,
    zone: string,
    source: 'manual' | 'ios_pedometer' = 'manual',
  ) {
    const count = steps.trim() ? recordInput(() => wholeSteps(steps)) : null,
      km = distance.trim() ? recordInput(() => canonicalInput(distance, unit, 1000, true)) : null;
    if (count === null && km === null)
      throw new RecordRequestError('Enter steps or distance. An empty day is not zero.');
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_activity', {
      p_user_id: userId,
      p_date: recordInput(() => nutritionDate(date)),
      ...(count === null ? {} : { p_steps: count, p_source: source }),
      ...(km === null ? {} : { p_distance: km }),
      p_zone: zone,
    });
    if (recordResult(data, error) !== date)
      throw new Error('Activity save was not acknowledged. Retry.');
  },
  async target(userId: string, value: string) {
    const target = recordInput(() => wholeSteps(value));
    if (!target) throw new RecordRequestError('Set a target above zero.');
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_steps_target', {
      p_user_id: userId,
      p_target: target,
    });
    if (recordResult(data, error) !== target)
      throw new Error('Target save was not acknowledged. Retry.');
  },
  async remove(userId: string, date: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('daily_activity')
      .delete()
      .eq('user_id', userId)
      .eq('local_date', nutritionDate(date))
      .select('local_date');
    recordResult(data, error);
  },
};
