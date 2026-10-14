import type { Tables } from '@/lib/supabase/database.types';
import {
  numeric,
  nutritionDate,
  nutrientKeys,
  type Nutrients,
} from '@/features/nutrition/nutrition-model';
export type Goal = Tables<'goals'>;
export const goalMetrics = [
  { key: 'body_weight', label: 'Bodyweight', unit: 'kg', category: 'Body' },
  { key: 'body_measurement', label: 'Body measurement', unit: 'cm', category: 'Body' },
  { key: 'workouts_week', label: 'Workouts per week', unit: 'workouts', category: 'Training' },
  { key: 'lift_weight', label: 'Strength target', unit: 'kg', category: 'Training' },
  { key: 'exercise_pr', label: 'Exercise PR (estimated 1RM)', unit: 'kg', category: 'Training' },
  { key: 'steps_day', label: 'Daily steps', unit: 'steps', category: 'Activity' },
  { key: 'distance_day', label: 'Daily distance (manual)', unit: 'km', category: 'Activity' },
  { key: 'active_days_week', label: 'Active days per week', unit: 'days', category: 'Activity' },
  { key: 'calories_day', label: 'Daily calories', unit: 'kcal', category: 'Nutrition' },
  { key: 'protein_day', label: 'Daily protein', unit: 'g', category: 'Nutrition' },
  { key: 'macro_adherence_day', label: 'Daily macro adherence', unit: '%', category: 'Nutrition' },
  { key: 'habit_completion_week', label: 'Habit weekly completion', unit: '%', category: 'Habits' },
  {
    key: 'habit_frequency_week',
    label: 'Habit weekly frequency',
    unit: 'times',
    category: 'Habits',
  },
] as const;
export type GoalMetric = (typeof goalMetrics)[number]['key'];
export type GoalForm = {
  name: string;
  metric: GoalMetric;
  baseline: string;
  target: string;
  direction: 'at_least' | 'at_most';
  tolerance: string;
  start: string;
  end: string;
  zone: string;
  habitId: string;
  exerciseId: string;
  measurement: string;
};
export function metricInfo(metric: string) {
  const found = goalMetrics.find((item) => item.key === metric);
  if (!found) throw new Error('Unsupported goal metric.');
  return found;
}
export function goalPayload(form: GoalForm) {
  const name = form.name.trim(),
    baseline = numeric(form.baseline, 'baseline', 1000000, true),
    target = numeric(form.target, 'target', 1000000),
    start = nutritionDate(form.start),
    end = form.end.trim() ? nutritionDate(form.end) : null;
  if (!name || name.length > 120) throw new Error('Enter a goal name up to 120 characters.');
  const metric = metricInfo(form.metric);
  if (end && end < start) throw new Error('Target date must be on or after the start.');
  if (
    (form.direction === 'at_least' && target <= baseline) ||
    (form.direction === 'at_most' && target >= baseline)
  )
    throw new Error('Target must improve from the baseline in your chosen direction.');
  if (
    !['body_weight', 'body_measurement', 'calories_day'].includes(metric.key) &&
    form.direction !== 'at_least'
  )
    throw new Error('This metric requires an increasing target.');
  if (
    ['steps_day', 'workouts_week', 'active_days_week', 'habit_frequency_week'].includes(
      metric.key,
    ) &&
    ![baseline, target].every(Number.isInteger)
  )
    throw new Error('This metric needs whole numbers.');
  if (metric.unit === '%' && Math.max(baseline, target) > 100)
    throw new Error('Percentages cannot exceed 100.');
  if (metric.key === 'active_days_week' && Math.max(baseline, target) > 7)
    throw new Error('A week has at most seven active days.');
  new Intl.DateTimeFormat('en', { timeZone: form.zone });
  const habit_id = metric.category === 'Habits' ? form.habitId || null : null,
    exercise_id =
      metric.category === 'Training' && metric.key !== 'workouts_week'
        ? form.exerciseId || null
        : null,
    measurement = metric.key === 'body_measurement' ? form.measurement.trim().toLowerCase() : null;
  if (metric.category === 'Habits' && !habit_id) throw new Error('Select a habit.');
  if (['lift_weight', 'exercise_pr'].includes(metric.key) && !exercise_id)
    throw new Error('Select an exercise.');
  if (metric.key === 'body_measurement' && (!measurement || measurement.length > 80))
    throw new Error('Enter a measurement name up to 80 characters.');
  return {
    name,
    metric: metric.key,
    baseline,
    target,
    direction: form.direction,
    tolerance: numeric(form.tolerance, 'tolerance', 100, true),
    start_date: start,
    end_date: end,
    time_zone: form.zone,
    habit_id,
    exercise_id,
    measurement,
  };
}
export function goalProgress(goal: Goal, value: number | null, today: string) {
  if (today < goal.start_date) return { status: 'Not started', percentage: null, reached: false };
  if (value === null) return { status: 'No recorded data', percentage: null, reached: false };
  const reached = goal.direction === 'at_most' ? value <= goal.target : value >= goal.target;
  const raw = ((value - goal.baseline) / (goal.target - goal.baseline)) * 100;
  return {
    status: reached
      ? 'Target met'
      : goal.end_date && today > goal.end_date
        ? 'Target date passed'
        : 'In progress',
    percentage: Math.min(100, Math.max(0, raw)),
    reached,
  };
}
export function macroAdherence(total: Nutrients, targets: Nutrients | null, tolerance: number) {
  if (!targets) return null;
  return (
    (nutrientKeys.filter((key) =>
      targets[key] === 0
        ? total[key] === 0
        : (Math.abs(total[key] - targets[key]) / targets[key]) * 100 <= tolerance,
    ).length /
      4) *
    100
  );
}
