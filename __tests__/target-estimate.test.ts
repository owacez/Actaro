import { expect, test } from '@jest/globals';
import { ageOnDate, estimateTargets } from '@/features/nutrition/target-estimate';
const input = {
  age: '30',
  weightKg: 80,
  heightCm: 180,
  sex: 'male',
  activity: 'inactive',
  eligible: true,
};
// Independently evaluated 2023 DRI equations; output rounds to the nearest 50 kcal.
test.each([
  ['male', 'inactive', 2750],
  ['male', 'low', 2950],
  ['male', 'active', 3150],
  ['male', 'very', 3500],
  ['female', 'inactive', 2350],
  ['female', 'low', 2500],
  ['female', 'active', 2650],
  ['female', 'very', 2950],
])('%s %s matches the published adult equation', (sex, activity, calories) => {
  const result = estimateTargets({ ...input, sex: String(sex), activity: String(activity) });
  expect(result.calories).toBe(calories);
  expect(
    Math.abs(result.protein * 4 + result.carbs * 4 + result.fat * 9 - result.calories),
  ).toBeLessThanOrEqual(10);
});
test('age uses the full birth date including birthday and leap-day boundaries', () => {
  expect(ageOnDate('1995-10-21', '2026-10-20')).toBe(30);
  expect(ageOnDate('1995-10-21', '2026-10-21')).toBe(31);
  expect(ageOnDate('2000-02-29', '2026-02-28')).toBe(25);
  expect(ageOnDate('2000-02-29', '2026-03-01')).toBe(26);
  expect(() => ageOnDate('2026-02-30', '2026-10-20')).toThrow();
  expect(() => ageOnDate('2027-01-01', '2026-10-20')).toThrow();
});
test('unsupported inputs never silently invent a sex, activity or calorie floor', () => {
  for (const patch of [
    { age: '18' },
    { age: '30.5' },
    { age: 'NaN' },
    { weightKg: NaN },
    { heightCm: 2 },
    { weightKg: 10000 },
    { sex: 'intersex' },
    { activity: '' },
    { eligible: false },
    { age: '120', weightKg: 25, heightCm: 90, sex: 'female' },
  ])
    expect(() => estimateTargets({ ...input, ...patch })).toThrow();
});
