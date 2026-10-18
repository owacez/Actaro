import { expect, test } from '@jest/globals';
import { dayRange, wholeSteps } from '@/features/activity/day-model';
import {
  goalPayload,
  goalProgress,
  macroAdherence,
  type Goal,
  type GoalForm,
} from '@/features/goals/goal-model';
import {
  canonicalInput,
  unitFactor,
  weightSummary,
  bodyFormPayload,
  type BodyForm,
} from '@/features/body/body-model';
import { nutritionContext } from './helpers/nutrition-fixture';
const form: GoalForm = {
  name: 'Lose weight',
  metric: 'body_weight',
  baseline: '80',
  target: '75',
  direction: 'at_most',
  tolerance: '10',
  start: '2026-10-01',
  end: '2026-10-31',
  zone: 'UTC',
  habitId: '',
  exerciseId: '',
  measurement: '',
};
test('body form converts weight/height, trims location and keeps blank measurements absent', () => {
  const body: BodyForm = {
    date: '2026-10-18',
    weight: '220.46226218487757',
    height: '70',
    sex: 'male',
    birthDate: '1995-02-14',
    location: ' Example City ',
    notes: '',
  };
  const preferences = { ...nutritionContext().preferences, weight_unit: 'lb', length_unit: 'in' };
  expect(bodyFormPayload(body, preferences, '2026-10-18')).toMatchObject({
    p_weight: 100,
    p_height: 177.8,
    p_location: 'Example City',
    p_sex: 'male',
    p_date_of_birth: '1995-02-14',
  });
  expect(
    bodyFormPayload(
      { ...body, weight: '', height: '', birthDate: '', sex: '', location: '' },
      preferences,
      '2026-10-18',
    ),
  ).toEqual({ p_date: body.date, p_zone: preferences.time_zone, p_notes: '' });
  for (const patch of [
    { birthDate: '2026-10-19' },
    { birthDate: '1995-02-30' },
    { date: '2026-10-19' },
    { weight: '0' },
    { height: '-1' },
    { sex: 'invalid' },
    { location: 'a'.repeat(121) },
  ])
    expect(() => bodyFormPayload({ ...body, ...patch }, preferences, '2026-10-18')).toThrow();
});
const goal: Goal = {
  ...goalPayload(form),
  id: 'goal',
  user_id: 'owner',
  archived: false,
  created_at: '',
  updated_at: '',
};
test('decreasing goals advance from baseline; missing and future facts never imply completion', () => {
  expect(goalProgress(goal, 77.5, '2026-10-14')).toMatchObject({ percentage: 50, reached: false });
  expect(goalProgress(goal, null, '2026-11-01')).toMatchObject({
    percentage: null,
    reached: false,
  });
  expect(goalProgress(goal, 74, '2026-09-30').status).toBe('Not started');
  expect(goalProgress(goal, 74, '2026-10-14')).toMatchObject({ percentage: 100, reached: true });
  expect(goalProgress(goal, 85, '2026-11-01')).toMatchObject({
    percentage: 0,
    status: 'Target date passed',
  });
});
test('goal validation rejects mismatched direction, sources, percentages, dates and fractional steps', () => {
  const patches: Partial<GoalForm>[] = [
    { target: '80' },
    { end: '2026-09-01' },
    { metric: 'steps_day', baseline: '0', target: '3.5', direction: 'at_least' },
    { metric: 'habit_completion_week', baseline: '0', target: '100', direction: 'at_least' },
    { metric: 'macro_adherence_day', baseline: '0', target: '101', direction: 'at_least' },
  ];
  for (const patch of patches) expect(() => goalPayload({ ...form, ...patch })).toThrow();
});
test('macro adherence uses dated targets, explicit zero and chosen tolerance', () => {
  const targets = { calories: 2000, protein: 100, carbs: 200, fat: 0 };
  expect(macroAdherence({ ...targets, calories: 2200 }, targets, 10)).toBe(100);
  expect(macroAdherence({ ...targets, fat: 1 }, targets, 10)).toBe(75);
  expect(macroAdherence(targets, null, 10)).toBeNull();
});
test('calendar ranges handle short/long DST days and non-hour offsets', () => {
  const short = dayRange('2026-03-08', 'America/Los_Angeles'),
    long = dayRange('2026-11-01', 'America/Los_Angeles');
  expect(short.start.toISOString()).toBe('2026-03-08T08:00:00.000Z');
  expect(+short.end - +short.start).toBe(23 * 3600000);
  expect(+long.end - +long.start).toBe(25 * 3600000);
  expect(dayRange('2026-10-14', 'Asia/Kolkata').start.toISOString()).toBe(
    '2026-10-13T18:30:00.000Z',
  );
});
test('canonical body/activity units preserve values and reject invalid counts', () => {
  expect(canonicalInput('220.46226218487757', 'lb', 1000)).toBeCloseTo(100);
  expect(canonicalInput('10', 'in', 1000)).toBeCloseTo(25.4);
  expect(canonicalInput('1', 'mi', 1000, true)).toBeCloseTo(1.609344);
  expect(unitFactor('kJ')).toBe(4.184);
  expect(wholeSteps('0')).toBe(0);
  expect(() => wholeSteps('1.1')).toThrow();
});
test('weight summary preserves missing trend dates and requires two relevant weigh-ins', () => {
  const row = (local_date: string, weight_kg: number) => ({
    local_date,
    weight_kg,
    user_id: 'owner',
    time_zone: 'UTC',
    notes: null,
    created_at: '',
    updated_at: '',
  });
  const summary = weightSummary([row('2026-10-14', 79), row('2026-10-11', 80)], '2026-10-14');
  expect(summary.change).toBe(-1);
  expect(summary.trend.filter((point) => point.value !== null)).toHaveLength(2);
  expect(weightSummary([row('2026-09-01', 80)], '2026-10-14').change).toBeNull();
});
