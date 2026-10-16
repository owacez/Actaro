import { getSupabase } from '@/lib/supabase/client';
import { requireOwner, recordResult } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import {
  localNutritionDate as localDate,
  nutritionDate as validDate,
} from '@/features/nutrition/nutrition-model';
import { shiftDate } from '@/features/workouts/training-overview';
import { habitPayload, type HabitForm, type HabitRecord } from './habit-model';
import { remindersChanged } from '@/features/notifications/reminder-events';
function bounded(records: HabitRecord[]) {
  if (
    records.some(
      (record) => record.habit_versions.length >= 1000 || record.habit_logs.length >= 1000,
    )
  )
    throw new Error('Habit history exceeds this display window.');
  return records;
}
export const habitService = {
  async all(userId: string) {
    const rows: HabitRecord[] = [];
    for (let offset = 0; ; offset += 24) {
      const page = await habitService.list(userId, offset);
      rows.push(...page.rows);
      if (page.rows.length < 24) return rows;
    }
  },
  async list(userId: string, offset = 0, archived = false) {
    await requireOwner(userId);
    const preferences = await profileService.getPreferences(userId),
      today = localDate(preferences.time_zone);
    const { data, error } = await getSupabase()
      .from('habits')
      .select('*,habit_versions(*),habit_logs(*)')
      .eq('user_id', userId)
      .eq('archived', archived)
      .gte('habit_logs.local_date', shiftDate(today, -92))
      .lte('habit_logs.local_date', shiftDate(today, 1))
      .order('name')
      .order('id')
      .range(offset, offset + 23);
    return { preferences, today, rows: bounded(recordResult(data, error)) };
  },
  async load(userId: string, id: string, asOf?: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    const habit = recordResult(data, error),
      today = localDate(habit.time_zone),
      until = asOf ? validDate(asOf) : today;
    if (until > today) throw new Error('History cannot end in the future.');
    const [versions, logs] = await Promise.all([
      getSupabase()
        .from('habit_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('habit_id', id)
        .order('effective_from')
        .limit(1000),
      getSupabase()
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('habit_id', id)
        .gte('local_date', shiftDate(until, -92))
        .lte('local_date', until)
        .order('local_date'),
    ]);
    const record = {
      ...habit,
      habit_versions: recordResult(versions.data, versions.error),
      habit_logs: recordResult(logs.data, logs.error),
    };
    bounded([record]);
    return {
      record: {
        ...record,
        habit_logs: record.habit_logs,
      },
      today,
      until,
    };
  },
  async save(userId: string, id: string, form: HabitForm) {
    const value = habitPayload(form);
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_habit', {
      p_user_id: userId,
      p_id: id,
      p_name: value.name,
      p_kind: value.kind,
      p_unit: value.unit,
      p_start: value.start,
      p_zone: value.zone,
      p_target: value.target,
      p_days: value.days,
      p_motivation: value.motivation,
      ...(value.end ? { p_end: value.end } : {}),
      ...(value.reminder ? { p_reminder: value.reminder } : {}),
    });
    if (recordResult(data, error) !== id)
      throw new Error('Habit save was not acknowledged. Retry.');
    remindersChanged();
  },
  async log(userId: string, id: string, date: string, value: number, notes: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('log_habit', {
      p_user_id: userId,
      p_habit_id: id,
      p_date: validDate(date),
      p_value: value,
      p_notes: notes.trim(),
    });
    if (recordResult(data, error) !== date)
      throw new Error('Habit log was not acknowledged. Retry.');
    remindersChanged();
  },
  async removeLog(userId: string, id: string, date: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('habit_logs')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', id)
      .eq('local_date', validDate(date))
      .select('habit_id');
    recordResult(data, error);
    remindersChanged();
  },
  async archive(userId: string, id: string, archived = true) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('habits')
      .update({ archived })
      .eq('user_id', userId)
      .eq('id', id)
      .select('id')
      .single();
    recordResult(data, error);
    remindersChanged();
  },
};
