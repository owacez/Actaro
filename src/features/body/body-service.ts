import { getSupabase } from '@/lib/supabase/client';
import { recordResult, requireOwner, recordInput, RecordRequestError } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import { localNutritionDate, nutritionDate } from '@/features/nutrition/nutrition-model';
import { canonicalInput } from './body-model';
export type BodyKind = 'weight' | 'measurement';
export const bodyService = {
  async history(userId: string, offset = 0, until?: string) {
    await requireOwner(userId);
    const preferences = await profileService.getPreferences(userId),
      today = localNutritionDate(preferences.time_zone),
      date = until ? nutritionDate(until) : today;
    if (date > today) throw new Error('History cannot end in the future.');
    const [weights, measurements] = await Promise.all([
      getSupabase()
        .from('body_weights')
        .select('*')
        .eq('user_id', userId)
        .lte('local_date', date)
        .order('local_date', { ascending: false })
        .range(offset, offset + 29),
      getSupabase()
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .lte('local_date', date)
        .order('local_date', { ascending: false })
        .order('measurement')
        .range(offset, offset + 29),
    ]);
    return {
      preferences,
      today,
      until: date,
      weights: recordResult(weights.data, weights.error),
      measurements: recordResult(measurements.data, measurements.error),
    };
  },
  async save(
    userId: string,
    kind: BodyKind,
    date: string,
    value: string,
    unit: string,
    zone: string,
    name: string,
    notes: string,
  ) {
    const amount = recordInput(() => canonicalInput(value, unit, 1000)),
      day = recordInput(() => nutritionDate(date)),
      measurement = name.trim().toLowerCase();
    if (kind === 'measurement' && (!measurement || measurement.length > 80))
      throw new RecordRequestError('Enter a measurement name up to 80 characters.');
    if (notes.length > 2000) throw new RecordRequestError('Use up to 2,000 note characters.');
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_body_record', {
      p_user_id: userId,
      p_kind: kind,
      p_date: day,
      p_value: amount,
      p_zone: zone,
      p_name: measurement,
      p_notes: notes,
    });
    if (recordResult(data, error) !== day) throw new Error('Save was not acknowledged. Retry.');
  },
  async remove(userId: string, kind: BodyKind, date: string, name: string) {
    await requireOwner(userId);
    const query =
      kind === 'weight'
        ? getSupabase()
            .from('body_weights')
            .delete()
            .eq('user_id', userId)
            .eq('local_date', nutritionDate(date))
        : getSupabase()
            .from('body_measurements')
            .delete()
            .eq('user_id', userId)
            .eq('local_date', nutritionDate(date))
            .eq('measurement', name);
    const { data, error } = await query.select('local_date');
    recordResult(data, error);
  },
};
