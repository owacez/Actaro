import { expect, test } from '@jest/globals';
import type { Tables } from '@/lib/supabase/database.types';
import {
  nutritionProgress,
  workoutFrequency,
  strengthProgress,
  stepsProgress,
  habitsProgress,
  periodSummaries,
  type SummarySources,
} from '@/features/progress/progress-model';
import type { HabitRecord } from '@/features/habits/habit-model';
import {
  chartBins,
  progressRange,
  validateProgressRange,
} from '@/features/progress/progress-period';
const range = { from: '2026-10-01', to: '2026-10-04' };
function log(date: string, calories: number, protein: number): Tables<'food_logs'> {
  return {
    id: date,
    user_id: 'owner',
    food_id: null,
    food_name: 'Food',
    source: 'user',
    source_external_id: null,
    request_food_id: null,
    request_unit: null,
    local_date: date,
    time_zone: 'UTC',
    meal: 'Lunch',
    base_unit: 'g',
    base_amount: 100,
    base_calories: calories,
    base_protein: protein,
    base_carbs: 20,
    base_fat: 5,
    calories,
    protein,
    carbs: 20,
    fat: 5,
    portion_label: 'g',
    portion_amount: 100,
    quantity: 1,
    created_at: date,
    updated_at: date,
  };
}
function target(
  date: string,
  calories: number,
  protein: number,
): Tables<'nutrition_target_history'> {
  return {
    user_id: 'owner',
    effective_date: date,
    calories,
    protein,
    carbs: 20,
    fat: 5,
    water_ml: 2000,
    created_at: date,
    updated_at: date,
  };
}
test('nutrition averages only logged dates, uses historical targets and excludes unavailable adherence', () => {
  const result = nutritionProgress(
    [log('2026-10-01', 1000, 100), log('2026-10-03', 2000, 200), log('2026-10-04', 500, 50)],
    [target('2026-10-02', 2000, 200), target('2026-10-04', 500, 100)],
    range,
  );
  expect(result.count).toBe(3);
  expect(result.calendarDays).toBe(4);
  expect(result.average?.calories).toBeCloseTo(3500 / 3);
  expect(result.days[0].adherence).toBeNull();
  expect(result.days[1].adherence).toBe(100);
  expect(result.days[2].adherence).toBe(75);
  expect(result.adherence).toBe(87.5);
  expect(result.proteinReachedDays).toBe(1);
  expect(result.proteinDays).toBe(2);
  expect(nutritionProgress([], [], range).average).toBeNull();
  expect(() =>
    nutritionProgress([{ ...log('2026-10-01', 100, 10), protein: null }], [], range),
  ).toThrow();
});
test('calendar filters clamp month ends, include leap dates and reject future or reversed dates', () => {
  expect(progressRange('2026-10-14', '7D').from).toBe('2026-10-08');
  expect(progressRange('2026-05-31', '3M').from).toBe('2026-03-01');
  expect(progressRange('2025-02-28', '1Y').from).toBe('2024-02-29');
  expect(progressRange('2026-10-14', 'All', '2020-01-01').from).toBe('2020-01-01');
  expect(() =>
    validateProgressRange({ from: '2026-10-04', to: '2026-10-03' }, '2026-10-14'),
  ).toThrow();
  expect(() =>
    validateProgressRange({ from: '2026-10-01', to: '2026-10-15' }, '2026-10-14'),
  ).toThrow('future');
});
test('charts preserve gaps and bound long periods without estimating missing intake', () => {
  const result = chartBins(
    [
      { date: '2026-10-01', value: 0 },
      { date: '2026-10-03', value: 100 },
    ],
    range,
  );
  expect(result.bins.map((bin) => bin.value)).toEqual([0, null, 100, null]);
  expect(chartBins([], { from: '2020-01-01', to: '2026-10-14' }).bins.length).toBeLessThanOrEqual(
    60,
  );
});
const training: SummarySources['training'] = {
  sessions: 2,
  activeDays: 1,
  sets: 3,
  reps: 15,
  volumeKg: 500,
  unknownWeightSets: 1,
  firstDate: '2026-10-01',
  days: [
    { date: '2026-10-01', sessions: 2, sets: 3, reps: 15, volumeKg: 500, unknownWeightSets: 1 },
  ],
  muscles: [],
};
function habit(kind = 'boolean'): HabitRecord {
  return {
    id: 'habit',
    user_id: 'owner',
    name: 'Habit',
    kind,
    unit: 'times',
    start_date: '2026-10-05',
    time_zone: 'UTC',
    archived: false,
    created_at: '2026-10-05',
    updated_at: '2026-10-05',
    habit_versions: [
      {
        id: 'version',
        habit_id: 'habit',
        user_id: 'owner',
        effective_from: '2026-10-05',
        weekdays: [1, 2, 3, 4, 5],
        target: kind === 'avoidance' ? 0 : 1,
        end_date: null,
        reminder_time: null,
        motivation: 'streak',
      },
    ],
    habit_logs: [],
  };
}
function habitLog(date: string, value: number): Tables<'habit_logs'> {
  return {
    habit_id: 'habit',
    user_id: 'owner',
    version_id: 'version',
    local_date: date,
    value,
    notes: null,
    created_at: date,
    updated_at: date,
  };
}
test('frequency counts distinct recorded training dates, preserves modes and rejects a changed overview', () => {
  const sessions = [
    { id: 'one', local_date: '2026-10-01', mode: 'timed', duration_seconds: 120 },
    { id: 'two', local_date: '2026-10-01', mode: 'log_only', duration_seconds: null },
  ];
  const summary = workoutFrequency(training, sessions, range);
  expect(summary.count).toBe(2);
  expect(summary.activeDays).toBe(1);
  expect(summary.perWeek).toBe(3.5);
  expect(summary.timedSeconds).toBe(120);
  expect(summary.logOnly).toBe(1);
  expect(() => workoutFrequency(training, [], range)).toThrow('changed');
});
test('strength remains exercise-specific, excludes unknown/bodyweight estimates and handles declining loads', () => {
  const summary = strengthProgress([
    { exerciseId: 'one', name: 'Lift', date: '2026-10-01', reps: 10, weightKg: 60 },
    { exerciseId: 'one', name: 'Lift', date: '2026-10-02', reps: 11, weightKg: 55 },
    { exerciseId: 'one', name: 'Lift', date: '2026-10-02', reps: 5, weightKg: null },
    { exerciseId: 'two', name: 'Bodyweight', date: '2026-10-02', reps: 5, weightKg: 0 },
  ]);
  const lift = summary.find((row) => row.id === 'one');
  expect(lift?.bestEstimate).toBe(80);
  expect(lift?.change).toBe(-5);
  expect(lift?.unknown).toBe(1);
  expect(lift?.days[1].estimate).toBeNull();
  expect(summary.find((row) => row.id === 'two')?.bestKg).toBeNull();
  expect(() =>
    strengthProgress([
      { exerciseId: 'one', name: 'Lift', date: '2026-10-01', reps: 0, weightKg: 20 },
    ]),
  ).toThrow();
});
test('steps retain explicit zero and provenance while missing/distance-only days stay unknown', () => {
  const base = {
    user_id: 'owner',
    time_zone: 'UTC',
    created_at: '2026-10-01',
    updated_at: '2026-10-01',
    steps_source: 'manual',
  };
  const summary = stepsProgress(
    [
      { ...base, local_date: '2026-10-01', steps: 0, distance_km: null },
      { ...base, local_date: '2026-10-02', steps: null, distance_km: 2 },
      {
        ...base,
        local_date: '2026-10-03',
        steps: 1500,
        distance_km: null,
        steps_source: 'ios_pedometer',
      },
    ],
    range,
  );
  expect(summary.count).toBe(2);
  expect(summary.average).toBe(750);
  expect(summary.recordedDistance).toBe(2);
  expect(summary.days[1].steps).toBeNull();
  expect(stepsProgress([], range).average).toBeNull();
});
test('habit progress respects historical closure, rest, explicit avoidance, partial weeks and archive exclusion', () => {
  const now = new Date('2026-10-14T12:00:00Z'),
    record = habit('avoidance');
  record.habit_logs = [habitLog('2026-10-05', 0), habitLog('2026-10-09', 0)];
  const result = habitsProgress([record], { from: '2026-10-05', to: '2026-10-11' }, now);
  expect(result.completed).toBe(2);
  expect(result.expected).toBe(5);
  expect(result.percentage).toBe(40);
  expect(result.rows[0].streak).toBe(1);
  expect(habitsProgress([habit()], { from: '2026-10-13', to: '2026-10-13' }, now).expected).toBe(1);
  expect(habitsProgress([habit()], { from: '2026-10-14', to: '2026-10-14' }, now).expected).toBe(0);
  expect(
    habitsProgress([habit('frequency')], { from: '2026-10-07', to: '2026-10-11' }, now).expected,
  ).toBe(0);
  expect(
    habitsProgress([{ ...record, archived: true }], { from: '2026-10-05', to: '2026-10-11' }, now)
      .archivedExcluded,
  ).toBe(1);
});
test('weekly/monthly summaries preserve gaps, label partial boundaries and avoid invented comparisons', () => {
  const sources: SummarySources = {
    logs: [log('2026-10-01', 1000, 100)],
    targets: [],
    training,
    activity: [],
    habits: [],
    weights: [
      { local_date: '2026-10-01', weight_kg: 80 },
      { local_date: '2026-10-04', weight_kg: 79 },
    ],
  };
  const monthly = periodSummaries(
    sources,
    { from: '2026-09-01', to: '2026-10-31' },
    'month',
    new Date('2026-11-01T12:00:00Z'),
  );
  expect(monthly).toHaveLength(2);
  expect(monthly[0].nutrition.average).toBeNull();
  expect(monthly[1].nutrition.average?.calories).toBe(1000);
  expect(monthly[1].comparison?.energy).toBeNull();
  expect(monthly[1].weight.change).toBe(-1);
  expect(monthly[1].workouts).toBe(2);
  expect(monthly[1].unknownWeightSets).toBe(1);
  const weekly = periodSummaries(
    sources,
    { from: '2026-10-01', to: '2026-10-14' },
    'week',
    new Date('2026-10-14T12:00:00Z'),
  );
  expect(weekly.map((row) => row.partial)).toEqual([true, false, true]);
  expect(weekly[2].comparison).toBeNull();
  expect(weekly[1].steps.average).toBeNull();
});
