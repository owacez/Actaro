import { expect, test } from '@jest/globals';
import { todayWorkoutState } from '@/features/today/today-model';

const done = [{ id: 'a', name: 'Full Body', mode: 'timed', duration_seconds: 3120 }];

test('an unfinished local session resumes, even after a workout was completed today', () => {
  expect(
    todayWorkoutState({ session: { status: 'active' }, completed: done, scheduled: true }),
  ).toBe('resume');
  expect(
    todayWorkoutState({ session: { status: 'pending' }, completed: [], scheduled: true }),
  ).toBe('resume');
});

test('a server-acknowledged session is not offered for resuming; today shows it done', () => {
  expect(
    todayWorkoutState({ session: { status: 'saved' }, completed: done, scheduled: true }),
  ).toBe('done');
});

test('completing replaces the scheduled plan; otherwise the plan or nothing shows', () => {
  expect(todayWorkoutState({ session: null, completed: done, scheduled: false })).toBe('done');
  expect(todayWorkoutState({ session: null, completed: [], scheduled: true })).toBe('scheduled');
  expect(todayWorkoutState({ session: null, completed: [], scheduled: false })).toBe('none');
});
