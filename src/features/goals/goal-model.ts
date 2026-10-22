import type { Tables } from '@/lib/supabase/database.types';
import { habitPeriods, habitValue, monday, type HabitRecord } from '@/features/habits/habit-model';
import {
  numeric,
  nutritionDate,
  localNutritionDate,
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
    label: 'Habit days per week',
    unit: 'days',
    category: 'Habits',
  },
] as const;
export type GoalMetric = (typeof goalMetrics)[number]['key'];
export const goalHelp: Record<GoalMetric, { example: string; source: string }> = {
  body_weight: {
    example: 'Go from 80 to 75 {unit}.',
    source: 'Log weigh-ins in Body records. Your latest recorded weight updates this goal.',
  },
  body_measurement: {
    example: 'Change a waist measurement from 90 to 85 {unit}.',
    source: 'Log the same named measurement in Body records.',
  },
  workouts_week: {
    example: 'Finish 3 workouts this week.',
    source: 'Finish workouts in Train. Planned workouts and saved drafts do not count.',
  },
  lift_weight: {
    example: 'Lift 40 {unit} on an exercise you choose.',
    source: 'Log completed sets for the selected exercise in Train.',
  },
  exercise_pr: {
    example: 'Improve your estimated one-rep maximum.',
    source: 'Completed sets of 1–10 reps estimate your strength. This is not a tested maximum.',
  },
  steps_day: {
    example: 'Reach 8,000 steps each day.',
    source: 'Saved steps from Steps & activity update this goal.',
  },
  distance_day: {
    example: 'Record 5 {unit} each day.',
    source: 'Enter distance in Steps & activity. This does not track a GPS run.',
  },
  active_days_week: {
    example: 'Be active on 3 different days this week.',
    source: 'A finished workout or positive recorded steps/distance makes a day active.',
  },
  calories_day: {
    example: 'Change your daily intake target from 2,500 to 2,200 {unit}.',
    source: 'Log meals in Food. This uses recorded intake, not an automatic meal plan.',
  },
  protein_day: {
    example: 'Log 100 g of protein each day.',
    source: 'Log meals in Food. Their protein totals update this goal.',
  },
  macro_adherence_day: {
    example: 'Meet your calorie, protein, carbohydrate and fat targets.',
    source:
      'Log food and set daily nutrition targets. The score compares all four totals within your chosen tolerance.',
  },
  habit_completion_week: {
    example: 'Complete a selected habit on all its scheduled days this week.',
    source:
      'Log the selected habit. This optional goal reads its weekly completion; the habit already works on its own.',
  },
  habit_frequency_week: {
    example: 'Work out on 5 different days this week.',
    source: 'Log a Count days each week habit. Each date counts once, even if edited repeatedly.',
  },
};
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
// Only these goals compare a value over time. Daily/weekly counts restart from zero
// each period, so a starting value would only confuse.
export const changeGoalMetrics: readonly GoalMetric[] = [
  'body_weight',
  'body_measurement',
  'lift_weight',
  'exercise_pr',
  'calories_day',
];
function amount(value: string, unit: string) {
  return unit === '%' ? `${value}%` : `${value} ${unit}`;
}
// One plain sentence describing the goal being saved.
export function goalSummary(metric: GoalMetric, baseline: string, target: string, unit: string) {
  const period = metric.endsWith('_day')
    ? ' each day'
    : metric.endsWith('_week')
      ? ' each week'
      : '';
  return changeGoalMetrics.includes(metric) && baseline.trim()
    ? `Go from ${baseline.trim()} to ${amount(target.trim(), unit)}${period}.`
    : `Reach ${amount(target.trim(), unit)}${period}.`;
}
// Used when the optional name is left blank, e.g. "Workouts per week: 3 workouts".
export function goalDefaultName(metric: GoalMetric, target: string, unit: string) {
  return `${metricInfo(metric).label}: ${amount(target.trim() || '?', unit)}`.slice(0, 120);
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
    throw new Error(
      form.direction === 'at_most'
        ? 'Choose a target below your starting value.'
        : 'Choose a target above your starting value.',
    );
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
  if (
    ['active_days_week', 'habit_frequency_week'].includes(metric.key) &&
    Math.max(baseline, target) > 7
  )
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
// The service and acknowledged Today updates use the same date-bounded calculation.
export function habitGoalFact(
  goal: Goal,
  habit: HabitRecord,
  today = localNutritionDate(goal.time_zone),
) {
  if (today < goal.start_date) return { value: null, detail: 'Starts ' + goal.start_date };
  if (habit.archived)
    return { value: null, detail: 'Source habit was deleted. Choose another active habit.' };
  const date = goal.end_date && goal.end_date < today ? goal.end_date : today;
  if (goal.metric === 'habit_frequency_week')
    return {
      value: habitValue(habit, date, goal.start_date),
      detail: 'Distinct logged days this week through ' + date,
    };
  const periods = habitPeriods(habit, date, 7).filter(
    (period) =>
      period.date >= monday(date) && period.date >= goal.start_date && period.status !== 'rest',
  );
  return {
    value: periods.length
      ? (periods.filter((period) => period.status === 'done').length / periods.length) * 100
      : null,
    detail: 'Week-to-date scheduled-day completion; rest days excluded.',
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
