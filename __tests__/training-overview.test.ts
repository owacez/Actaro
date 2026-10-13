import { expect, jest, test } from '@jest/globals';
import {
  parseOverview,
  shiftDate,
  trainingStatus,
  type TrainingOverview,
} from '@/features/workouts/training-overview';
import { blankRecovery, recoveryPayload, recoveryResult } from '@/features/workouts/recovery-model';
import { exerciseRecords } from '@/features/workouts/training-metrics';
import { sessionFixture } from './helpers/session-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
const empty: TrainingOverview = {
  sessions: 0,
  activeDays: 0,
  sets: 0,
  reps: 0,
  volumeKg: 0,
  unknownWeightSets: 0,
  firstDate: null,
  days: [],
  muscles: [],
};
test('missing history gets no fabricated status, and new plans do not retroactively mark missed days', () => {
  expect(trainingStatus(empty, '2026-10-13', null)[0].label).toBe('More context needed');
  const days = Array.from({ length: 7 }, () => ({ isRest: false, workoutId: 'saved' }));
  expect(trainingStatus(empty, '2026-10-13', { since: '2026-10-13', days })[0].label).toBe(
    'More context needed',
  );
  expect(trainingStatus(empty, '2026-10-13', { since: '2026-10-01', days })[0].label).toBe(
    'Missed Sessions',
  );
  expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
});
test('volume and muscle statuses require sufficient observed context and expose their rules', () => {
  const days = Array.from({ length: 4 }, (_, index) => ({
    date: shiftDate('2026-10-13', -14 - index),
    sessions: 1,
    sets: 9,
    reps: 72,
    volumeKg: 100,
    unknownWeightSets: 0,
  }));
  const overview = {
    ...empty,
    firstDate: days[3].date,
    days: [
      ...days,
      {
        date: '2026-10-13',
        sessions: 1,
        sets: 24,
        reps: 200,
        volumeKg: 1000,
        unknownWeightSets: 0,
      },
    ],
  };
  expect(trainingStatus(overview, '2026-10-13', null).map((status) => status.label)).toContain(
    'High Training Volume',
  );
  expect(
    trainingStatus({ ...overview, days: days.slice(0, 1) }, '2026-10-13', null).map(
      (status) => status.label,
    ),
  ).not.toContain('Low Training Volume');
});
test('recovery requires explicit reports, preserves no-added-load soreness zero, and applies context without a score', () => {
  expect(recoveryResult(blankRecovery(), empty, '2026-10-13', false)).toBeNull();
  expect(() => recoveryPayload(blankRecovery())).toThrow('energy');
  const good = { energy: 3, soreness: 0, sleep: 3, stress: null, notes: '' };
  expect(recoveryPayload(good).soreness).toBe(0);
  expect(recoveryResult(good, empty, '2026-10-13', false)?.label).toBe('Good');
  expect(recoveryResult({ ...good, sleep: 1 }, empty, '2026-10-13', false)?.label).toBe(
    'Consider Recovery',
  );
  const days = [0, 1, 2].map((offset) => ({
    date: shiftDate('2026-10-13', -offset),
    sessions: 1,
    sets: 3,
    reps: 24,
    volumeKg: 100,
    unknownWeightSets: 0,
  }));
  expect(recoveryResult(good, { ...empty, days }, '2026-10-13', true)?.label).toBe('Moderate');
});
test('real overview parser rejects malformed responses and repeated exercises yield one heaviest record', () => {
  expect(() => parseOverview({ sessions: 'fake' })).toThrow('unavailable');
  const performance = sessionFixture().exercises[0].performance;
  const records = exerciseRecords([
    { exerciseId: 'same', performance, sets: [{ reps: 8, weightKg: 20 }] },
    { exerciseId: 'same', performance, sets: [{ reps: 8, weightKg: 30 }] },
  ]);
  expect(records.get('same')?.filter((record) => record.kind === 'Heaviest lift')).toEqual([
    { kind: 'Heaviest lift', value: 30, first: true },
  ]);
});
