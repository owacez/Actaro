import { poundsPerKg } from '@/features/workouts/workout-model';
import { energy, numeric, nutritionDate } from '@/features/nutrition/nutrition-model';
import type { Preferences } from '@/features/profile/profile-model';
import { metricInfo } from '@/features/goals/goal-model';
import { monday } from '@/features/habits/habit-model';
import { shiftDate } from '@/features/workouts/training-overview';
import type { Tables } from '@/lib/supabase/database.types';
export function unitFactor(unit: string) {
  return unit === 'lb'
    ? poundsPerKg
    : unit === 'in'
      ? 1 / 2.54
      : unit === 'mi'
        ? 1 / 1.609344
        : unit === 'kJ'
          ? energy(1, 'kJ')
          : 1;
}
export function goalUnit(metric: string, preferences: Preferences) {
  const unit = metricInfo(metric).unit;
  return unit === 'kg'
    ? preferences.weight_unit
    : unit === 'cm'
      ? preferences.length_unit
      : unit === 'km'
        ? preferences.distance_unit
        : unit === 'kcal'
          ? preferences.energy_unit
          : unit;
}
export function canonicalInput(value: string, unit: string, max = 1000000, allowZero = false) {
  const result = numeric(value, 'value', max * unitFactor(unit), allowZero) / unitFactor(unit);
  return result;
}
export const bodySexOptions = [
  { value: '', label: 'Not set' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;
export type BodyForm = {
  date: string;
  weight: string;
  height: string;
  sex: string;
  birthDate: string;
  location: string;
  notes: string;
};
export function bodyFormPayload(form: BodyForm, preferences: Preferences, today: string) {
  const date = nutritionDate(form.date);
  if (date > today) throw new Error('Cannot log a future date.');
  if (!bodySexOptions.some((option) => option.value === form.sex))
    throw new Error('Choose a listed sex option.');
  const birthDate = form.birthDate ? nutritionDate(form.birthDate) : undefined;
  if (birthDate && birthDate > today) throw new Error('Date of birth cannot be in the future.');
  if (form.location.trim().length > 120) throw new Error('Use up to 120 location characters.');
  if (form.notes.length > 2000) throw new Error('Use up to 2,000 note characters.');
  return {
    p_date: date,
    p_zone: preferences.time_zone,
    ...(form.weight.trim()
      ? { p_weight: canonicalInput(form.weight, preferences.weight_unit, 1000) }
      : {}),
    ...(form.height.trim()
      ? { p_height: canonicalInput(form.height, preferences.length_unit, 1000) }
      : {}),
    ...(form.sex ? { p_sex: form.sex } : {}),
    ...(birthDate ? { p_date_of_birth: birthDate } : {}),
    ...(form.location.trim() ? { p_location: form.location.trim() } : {}),
    p_notes: form.notes,
  };
}
export function weightSummary(rows: Tables<'body_weights'>[], today: string) {
  const sorted = [...rows]
      .filter((row) => row.local_date <= today)
      .sort((a, b) => b.local_date.localeCompare(a.local_date)),
    latest = sorted[0] ?? null,
    week = monday(today);
  const baseline =
    sorted.find((row) => row.local_date < week && row.local_date >= shiftDate(week, -7)) ??
    sorted.filter((row) => row.local_date >= week).at(-1) ??
    null;
  const change =
    latest && baseline && latest.local_date >= week && latest.local_date !== baseline.local_date
      ? latest.weight_kg - baseline.weight_kg
      : null;
  const trend = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(today, index - 6);
    return { date, value: sorted.find((row) => row.local_date === date)?.weight_kg ?? null };
  });
  return { latest, baseline, change, trend };
}
