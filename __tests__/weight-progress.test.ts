import { expect, test } from '@jest/globals';
import { weightPeriod, weightProgress } from '@/features/body/weight-progress-model';
test('period calculations use first/latest recorded dates, never fill missing weights or use out-of-range entries', () => {
  const result = weightProgress(
    [
      { local_date: '2026-10-14', weight_kg: 79 },
      { local_date: '2026-09-20', weight_kg: 82 },
      { local_date: '2026-09-01', weight_kg: 100 },
      { local_date: '2026-10-15', weight_kg: 75 },
    ],
    '2026-09-15',
    '2026-10-14',
  );
  expect(result.count).toBe(2);
  expect(result.change).toBe(-3);
  expect(result.changePercent).toBeCloseTo((-3 / 82) * 100);
  expect(result.average).toBe(80.5);
  expect(result.low).toBe(79);
  expect(result.high).toBe(82);
  expect(result.bins).toHaveLength(30);
  expect(result.bins.filter((bin) => bin.value !== null)).toHaveLength(2);
});
test('single, empty and constant histories do not fabricate a trend; invalid values and dates are rejected', () => {
  const point = { local_date: '2026-10-14', weight_kg: 80 };
  expect(weightProgress([point], point.local_date, point.local_date)).toMatchObject({
    count: 1,
    change: null,
    changePercent: null,
    average: 80,
  });
  expect(weightProgress([], '2026-10-01', '2026-10-14')).toMatchObject({
    count: 0,
    first: null,
    latest: null,
    change: null,
    average: null,
  });
  expect(() => weightPeriod('2026-02-30', '2026-10-14', '2026-10-14')).toThrow();
  expect(() => weightPeriod('2026-10-15', '2026-10-14', '2026-10-14')).toThrow();
  expect(() => weightPeriod('2026-10-01', '2026-10-15', '2026-10-14')).toThrow();
  expect(() => weightProgress([point, point], '2026-10-01', '2026-10-14')).toThrow();
  expect(() => weightProgress([{ ...point, weight_kg: 0 }], '2026-10-01', '2026-10-14')).toThrow();
  const constant = weightProgress(
    [{ ...point, local_date: '2026-10-13' }, point],
    '2026-10-01',
    '2026-10-14',
  );
  expect(constant.change).toBe(0);
  expect(constant.low).toBe(constant.high);
});
test('long periods stay bounded and bin means divide by recorded weigh-ins, not calendar days', () => {
  const result = weightProgress(
    [
      { local_date: '2026-01-01', weight_kg: 80 },
      { local_date: '2026-01-02', weight_kg: 82 },
      { local_date: '2026-10-14', weight_kg: 79 },
    ],
    '2026-01-01',
    '2026-10-14',
  );
  expect(result.bins.length).toBeLessThanOrEqual(60);
  expect(result.binDays).toBe(5);
  expect(result.bins[0]).toMatchObject({ value: 81, count: 2 });
  expect(result.bins[1].value).toBeNull();
  expect(result.count).toBe(3);
});
