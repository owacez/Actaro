import { getSupabase } from '@/lib/supabase/client';
import { recordResult, requireOwner, recordInput, RecordRequestError } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import { localNutritionDate, nutritionDate } from '@/features/nutrition/nutrition-model';
import { canonicalInput, bodyFormPayload, type BodyForm } from './body-model';
import { weightPeriod, type WeightPoint } from './weight-progress-model';
import { progressRange, type ProgressPreset } from '@/features/progress/progress-period';
import { progressPages } from '@/features/progress/progress-service';
export type BodyKind = 'weight' | 'measurement';
export const bodyService = {
  async form(userId: string, date?: string, options?: { latestWeight: boolean }) {
    const [profile, preferences] = await Promise.all([
      profileService.getProfile(userId),
      profileService.getPreferences(userId),
    ]);
    const today = localNutritionDate(preferences.time_zone),
      day = date ? nutritionDate(date) : today;
    if (day > today) throw new Error('Cannot log a future date.');
    const weightQuery = getSupabase().from('body_weights').select('*').eq('user_id', userId);
    const [weight, height] = await Promise.all([
      (options?.latestWeight
        ? weightQuery.lte('local_date', day).order('local_date', { ascending: false }).limit(1)
        : weightQuery.eq('local_date', day)
      ).maybeSingle(),
      getSupabase()
        .from('body_measurements')
        .select('*')
        .eq('user_id', userId)
        .eq('measurement', 'height')
        .lte('local_date', today)
        .order('local_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (weight.error || height.error) throw new Error('Body values unavailable. Retry.');
    return { profile, preferences, today, day, weight: weight.data, height: height.data };
  },
  async saveForm(
    userId: string,
    form: BodyForm,
    preferences: Parameters<typeof bodyFormPayload>[1],
  ) {
    const payload = recordInput(() =>
      bodyFormPayload(form, preferences, localNutritionDate(preferences.time_zone)),
    );
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_body_form', {
      p_user_id: userId,
      ...payload,
    });
    if (recordResult(data, error) !== payload.p_date)
      throw new Error('Body form save was not acknowledged. Retry.');
  },
  async progress(
    userId: string,
    period?: { from: string; to: string },
    preset: ProgressPreset = '30D',
  ) {
    const preferences = await profileService.getPreferences(userId),
      today = localNutritionDate(preferences.time_zone);
    let earliest: string | null = null;
    if (preset === 'All' && !period) {
      const first = await getSupabase()
        .from('body_weights')
        .select('local_date')
        .eq('user_id', userId)
        .lte('local_date', today)
        .order('local_date')
        .limit(1)
        .maybeSingle();
      if (first.error) throw new Error('Weight dates unavailable. Retry.');
      earliest = first.data?.local_date ?? null;
    }
    const dates = period ?? progressRange(today, preset, earliest),
      range = weightPeriod(dates.from, dates.to, today);
    if (preferences.weight_unit !== 'kg' && preferences.weight_unit !== 'lb')
      throw new Error('Weight preference unavailable.');
    const rows: WeightPoint[] = await progressPages((from, to) =>
      getSupabase()
        .from('body_weights')
        .select('local_date,weight_kg', { count: 'exact' })
        .eq('user_id', userId)
        .gte('local_date', range.from)
        .lte('local_date', range.to)
        .order('local_date')
        .range(from, to),
    );
    return { preferences, today, ...range, rows };
  },
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
