import { poundsPerKg } from '@/features/workouts/workout-model';
import { energy, numeric } from '@/features/nutrition/nutrition-model';
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
