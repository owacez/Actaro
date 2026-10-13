import { expect, jest, test } from '@jest/globals';
import {
  elapsed,
  pauseClock,
  resumeClock,
  restoreSession,
  sessionPayload,
  localDateAt,
} from '@/features/workouts/session-model';
import {
  estimated1rm,
  personalRecords,
  trainingVolume,
} from '@/features/workouts/training-metrics';
import { sessionFixture } from './helpers/session-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
test('elapsed time survives background/restart and pauses independently of rest', () => {
  const running = { elapsedMs: 2000, runningSince: 1000 };
  expect(elapsed(running, 61000)).toBe(62000);
  const paused = pauseClock(running, 61000);
  expect(elapsed(paused, 100000)).toBe(62000);
  expect(elapsed(resumeClock(paused, 100000), 105000)).toBe(67000);
  expect(elapsed(running, 500)).toBe(2000);
});
test('timezone local date is independent of UTC and device date', () => {
  expect(localDateAt('2026-10-13T01:00:00Z', 'America/Los_Angeles')).toBe('2026-10-12');
  expect(localDateAt('2026-10-13T23:00:00Z', 'Asia/Karachi')).toBe('2026-10-14');
});
test('restores only the account-specific validated draft and retains invalid data via an error', () => {
  const session = sessionFixture();
  expect(restoreSession(JSON.stringify(session), session.userId)).toEqual(session);
  expect(() => restoreSession(JSON.stringify(session), 'other')).toThrow('kept');
  expect(() =>
    restoreSession(
      JSON.stringify({ ...session, clock: { elapsedMs: 'bad', runningSince: 0 } }),
      session.userId,
    ),
  ).toThrow('kept');
});
test('only completed sets persist, weights convert canonically and Log Only has no duration', () => {
  const session = sessionFixture();
  session.mode = 'log_only';
  session.unit = 'lb';
  session.status = 'pending';
  session.endedAt = session.startedAt;
  session.mutationId = session.id;
  expect(() => sessionPayload(session)).toThrow('at least one');
  session.exercises[0].sets[0].completedAt = session.startedAt;
  session.exercises[0].sets.push({
    ...session.exercises[0].sets[0],
    id: session.id,
    completedAt: null,
    reps: 'invalid',
  });
  const payload = sessionPayload(session);
  expect(payload.duration_seconds).toBeNull();
  expect(payload.exercises[0].sets).toHaveLength(1);
  expect(payload.exercises[0].sets[0].weight_kg).toBe(9.072);
});
test('volume includes completed external load, distinguishes unknown from zero, and PRs compare matched loads', () => {
  expect(
    trainingVolume([
      { reps: 8, weightKg: 20 },
      { reps: 10, weightKg: null },
      { reps: 12, weightKg: 0 },
    ]),
  ).toEqual({ sets: 3, reps: 30, volumeKg: 160, unknownWeightSets: 1 });
  expect(estimated1rm({ reps: 1, weightKg: 100 })).toBe(100);
  expect(estimated1rm({ reps: 10, weightKg: 60 })).toBe(80);
  expect(estimated1rm({ reps: 11, weightKg: 60 })).toBeNull();
  const previous = {
    ...sessionFixture().exercises[0].performance,
    heaviestKg: 20,
    estimated1rm: 26,
    repsByWeight: { '20': 9 },
  };
  expect(personalRecords([{ reps: 8, weightKg: 20 }], previous)).toHaveLength(0);
  expect(
    personalRecords([{ reps: 10, weightKg: 20 }], previous).map((record) => record.kind),
  ).toEqual(['Estimated 1RM', 'Rep PR']);
  expect(personalRecords([{ reps: 50, weightKg: null }], previous)).toHaveLength(0);
});
test('an invalid finish clock is rejected before an active draft can become frozen', () => {
  const session = sessionFixture();
  session.status = 'pending';
  session.mutationId = session.id;
  session.exercises[0].sets[0].completedAt = session.startedAt;
  session.endedAt = new Date(Date.parse(session.startedAt) - 1000).toISOString();
  expect(() => sessionPayload(session)).toThrow('device clock');
});
