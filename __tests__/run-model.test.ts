import { expect, jest, test } from '@jest/globals';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
import {
  appendRunFix,
  finishRun,
  newRun,
  pauseRun,
  readRunPoints,
  restoreRun,
  resumeRun,
  routeDistance,
  runDistance,
  runPace,
  runSeconds,
} from '@/features/running/run-model';
import { routePath } from '@/features/running/run-route';
import { runFixture, runFix, runId, runOwner, runTime } from './helpers/run-fixture';
test('haversine distance, stored route and pace agree without inventing low-distance precision', () => {
  const run = runFixture(true);
  expect(run.distanceMeters).toBeCloseTo(111.1949, 3);
  expect(routeDistance(run.route)).toBeCloseTo(run.distanceMeters);
  expect(runSeconds(run, runTime + 999999)).toBe(60);
  expect(runPace(60, 1000, 'km')).toBe('1:00 /km');
  expect(runPace(60, 1609.344, 'mi')).toBe('1:00 /mi');
  expect(runPace(60, 0, 'km')).toBe('—');
  expect(runDistance(22.24, 'km')).toBe('0.02');
  expect(runDistance(1609.344, 'mi')).toBe('1.00');
});
test('pauses exclude time and travel; resumed and late locations cannot bridge the pause', () => {
  const paused = pauseRun(runFixture(), runTime + 60000);
  expect(appendRunFix(paused, { ...runFix, longitude: 1, timestamp: runTime + 90000 })).toBe(
    paused,
  );
  let run = resumeRun(paused, runTime + 120000);
  run = appendRunFix(run, { ...runFix, longitude: 1, timestamp: runTime + 121000 });
  run = appendRunFix(run, { ...runFix, longitude: 1.001, timestamp: runTime + 151000 });
  expect(run.distanceMeters).toBeCloseTo(222.38985, 3);
  expect(runSeconds(finishRun(run, runTime + 180000), runTime + 180000)).toBe(120);
  expect(run.route.at(-1)?.segment).toBe(1);
  expect((routePath(run.route).match(/M/g) ?? []).length).toBe(2);
});
test('GPS noise, poor accuracy, stale and impossible jumps are ignored; gaps start a new segment', () => {
  const run = runFixture();
  for (const fix of [
    { ...runFix, accuracy: 80 },
    { ...runFix, longitude: 90, timestamp: runTime + 31000 },
    { ...runFix, longitude: 0.001001, timestamp: runTime + 31000 },
  ])
    expect(appendRunFix(run, fix)).toBe(run);
  const gap = appendRunFix(run, { ...runFix, longitude: 1, timestamp: runTime + 100000 });
  expect(gap.distanceMeters).toBe(run.distanceMeters);
  expect(gap.route.at(-1)?.segment).toBe(1);
});
test('restoration is account-bound and recalculates distance rather than trusting cached totals', () => {
  const run = runFixture(true);
  expect(
    restoreRun(JSON.stringify({ ...run, distanceMeters: 9999 }), runOwner).distanceMeters,
  ).toBeCloseTo(111.1949);
  expect(() => restoreRun(JSON.stringify(run), '12000000-0000-4000-8000-000000000002')).toThrow();
  expect(() =>
    restoreRun(
      JSON.stringify({ ...run, clock: { elapsedMs: 1, runningSince: runTime } }),
      runOwner,
    ),
  ).toThrow();
  expect(() => readRunPoints([{ ...runFix, latitude: 91, segment: 0 }])).toThrow();
  expect(() =>
    newRun(runId, runOwner, 'UTC', false, { ...runFix, timestamp: runTime - 20000 }, runTime),
  ).toThrow('fresh');
});
test('local start date follows selected time zone; review remains frozen and route projection handles dateline', () => {
  const run = newRun(
    runId,
    runOwner,
    'America/Los_Angeles',
    true,
    { ...runFix, timestamp: Date.parse('2026-10-21T00:01:00Z') },
    Date.parse('2026-10-21T00:01:00Z'),
  );
  expect(run.localDate).toBe('2026-10-20');
  const review = finishRun(runFixture(), runTime + 60000);
  expect(finishRun(review, runTime + 100000)).toBe(review);
  const path = routePath([
    { ...runFix, longitude: 179.999, segment: 0 },
    { ...runFix, longitude: -179.999, timestamp: runTime + 30000, segment: 0 },
  ]);
  expect(path).not.toMatch(/NaN|Infinity/);
});
