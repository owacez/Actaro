import { expect, test } from '@jest/globals';
import { habitGoalFact, goalProgress, type Goal } from '@/features/goals/goal-model';
import {
  habitConsistency,
  habitPeriods,
  habitReached,
  habitPayload,
  habitValue,
  habitStatusLabel,
  logValue,
  reminderDue,
  type HabitRecord,
} from '@/features/habits/habit-model';
const habit = (): HabitRecord => ({
  id: '05000000-0000-4000-8000-000000000003',
  user_id: '05000000-0000-4000-8000-000000000001',
  name: 'Walk',
  kind: 'numeric',
  unit: 'minutes',
  start_date: '2026-10-05',
  time_zone: 'UTC',
  archived: false,
  created_at: '2026-10-05',
  updated_at: '2026-10-05',
  habit_versions: [
    {
      id: '05000000-0000-4000-8000-000000000004',
      habit_id: '05000000-0000-4000-8000-000000000003',
      user_id: '05000000-0000-4000-8000-000000000001',
      effective_from: '2026-10-05',
      target: 20,
      weekdays: [1, 2, 3, 4, 5],
      end_date: null,
      motivation: 'streak',
      reminder_time: '18:00',
    },
  ],
  habit_logs: [],
});
function log(record: HabitRecord, date: string, value: number) {
  record.habit_logs.push({
    habit_id: record.id,
    user_id: record.user_id,
    version_id: record.habit_versions[0].id,
    local_date: date,
    value,
    notes: null,
    created_at: date,
    updated_at: date,
  });
}
test('habit status distinguishes missing reports, progress, rest days and exceeded limits', () => {
  const record = habit();
  expect(habitStatusLabel(record, '2026-10-12')).toBe('Not logged today');
  expect(habitStatusLabel(record, '2026-10-11')).toBe('Rest day');
  expect(habitStatusLabel(record, '2026-10-01')).toBe('Starts 2026-10-05');
  log(record, '2026-10-12', 10);
  expect(habitStatusLabel(record, '2026-10-12')).toBe('In progress');
  record.kind = 'avoidance';
  record.habit_versions[0].target = 2;
  expect(habitStatusLabel(record, '2026-10-12')).toBe('Over daily limit');
  record.kind = 'frequency';
  record.habit_logs = [];
  expect(habitStatusLabel(record, '2026-10-12')).toBe('Not logged this week');
  log(record, '2026-10-12', 1);
  expect(habitStatusLabel(record, '2026-10-12')).toBe('Done today');
});
test('rest days and an open unlogged day do not break a scheduled streak', () => {
  const record = habit();
  for (const day of ['2026-10-08', '2026-10-09']) log(record, day, 20);
  const result = habitConsistency(record, '2026-10-12');
  expect(result.streak).toBe(2);
  expect(result.periods.find((p) => p.date === '2026-10-10')?.status).toBe('rest');
  expect(result.periods.at(-1)?.status).toBe('pending');
});
test('avoidance requires an explicit report; missing is not zero or success', () => {
  const record = { ...habit(), kind: 'avoidance', unit: 'times' };
  record.habit_versions[0].target = 0;
  expect(habitReached(record, null, 0)).toBe(false);
  log(record, '2026-10-12', 0);
  const periods = habitPeriods(record, '2026-10-13');
  expect(periods.find((p) => p.date === '2026-10-12')?.status).toBe('done');
  expect(periods.find((p) => p.date === '2026-10-09')?.status).toBe('missed');
  expect(periods.at(-1)?.status).toBe('pending');
});
test('dated target changes preserve previous periods and in-app reminders use the habit zone', () => {
  const record = habit();
  record.habit_versions.push({
    ...record.habit_versions[0],
    id: '05000000-0000-4000-8000-000000000005',
    effective_from: '2026-10-13',
    target: 30,
  });
  log(record, '2026-10-12', 20);
  log(record, '2026-10-13', 20);
  const periods = habitPeriods(record, '2026-10-14');
  expect(periods.find((p) => p.date === '2026-10-12')?.status).toBe('done');
  expect(periods.find((p) => p.date === '2026-10-13')?.status).toBe('missed');
  expect(reminderDue(record, new Date('2026-10-14T17:59:00Z'))).toBe(false);
  expect(reminderDue(record, new Date('2026-10-14T18:00:00Z'))).toBe(true);
});
test('frequency counts distinct positive dates, including legacy counts, and keeps partial/open weeks honest', () => {
  const record = { ...habit(), kind: 'frequency', unit: 'times', start_date: '2026-10-07' };
  record.habit_versions[0].effective_from = '2026-10-07';
  record.habit_versions[0].target = 3;
  log(record, '2026-10-12', 2);
  log(record, '2026-10-13', 1);
  log(record, '2026-10-14', 0);
  expect(habitValue(record, '2026-10-14')).toBe(2);
  expect(habitValue(record, '2026-10-14', '2026-10-13')).toBe(1);
  expect(habitConsistency(record, '2026-10-14').periods.at(-1)?.status).toBe('pending');
  record.habit_logs[2].value = 1;
  const result = habitConsistency(record, '2026-10-14');
  expect(result.periods.find((p) => p.date === '2026-10-05')?.partial).toBe(true);
  expect(result.streak).toBe(1);
  expect(result.percentage).toBe(100);
  expect(record.habit_logs[0].value).toBe(2);
  expect(() => logValue(record, '5')).toThrow('A date counts once');
  expect(logValue(record, '0')).toBe(0);
  expect(logValue(record, '1')).toBe(1);
});
test('linked weekly goals count dates, update after replacement/undo and respect the goal window', () => {
  const record = { ...habit(), kind: 'frequency', unit: 'times' };
  const goal: Goal = {
    id: 'goal',
    user_id: record.user_id,
    name: 'Train five days',
    metric: 'habit_frequency_week',
    baseline: 0,
    target: 5,
    direction: 'at_least',
    tolerance: 10,
    start_date: '2026-10-12',
    end_date: null,
    time_zone: 'UTC',
    habit_id: record.id,
    exercise_id: null,
    measurement: null,
    archived: false,
    created_at: '',
    updated_at: '',
  };
  log(record, '2026-10-11', 1); // Previous week.
  log(record, '2026-10-12', 5); // Legacy count cannot become five days.
  log(record, '2026-10-13', 0);
  log(record, '2026-10-14', 1);
  let fact = habitGoalFact(goal, record, '2026-10-12');
  expect(fact.value).toBe(1);
  expect(goalProgress(goal, fact.value, '2026-10-12').percentage).toBe(20);
  record.habit_logs[1].value = 1;
  expect(habitGoalFact(goal, record, '2026-10-12').value).toBe(1);
  record.habit_logs[1].value = 0;
  expect(habitGoalFact(goal, record, '2026-10-12').value).toBe(0);
  fact = habitGoalFact({ ...goal, start_date: '2026-10-13' }, record, '2026-10-14');
  expect(fact.value).toBe(1);
  expect(habitGoalFact({ ...goal, end_date: '2026-10-13' }, record, '2026-10-14').value).toBe(0);
  expect(habitGoalFact(goal, record, '2026-10-19').value).toBe(0);
  expect(habitGoalFact(goal, record, '2026-10-10').value).toBeNull();
  expect(habitGoalFact(goal, { ...record, archived: true }, '2026-10-14').value).toBeNull();
});
test('linked completion goals use the same scheduled-day calculation after an in-place log', () => {
  const record = { ...habit(), kind: 'boolean', unit: 'done' };
  record.habit_versions[0].target = 1;
  const goal: Goal = {
    id: 'goal',
    user_id: record.user_id,
    name: 'Stretch',
    metric: 'habit_completion_week',
    baseline: 0,
    target: 100,
    direction: 'at_least',
    tolerance: 10,
    start_date: '2026-10-12',
    end_date: null,
    time_zone: 'UTC',
    habit_id: record.id,
    exercise_id: null,
    measurement: null,
    archived: false,
    created_at: '',
    updated_at: '',
  };
  log(record, '2026-10-12', 1);
  expect(habitGoalFact(goal, record, '2026-10-13').value).toBe(50);
  log(record, '2026-10-13', 1);
  expect(habitGoalFact(goal, record, '2026-10-13').value).toBe(100);
  record.habit_logs[1].value = 0;
  expect(habitGoalFact(goal, record, '2026-10-13').value).toBe(50);
});
test('form rejects missing schedule, fractional counts and invalid reminder/end dates', () => {
  const form = {
    name: 'Habit',
    kind: 'avoidance' as const,
    unit: 'times',
    start: '2026-10-14',
    zone: 'UTC',
    target: '0',
    days: [1],
    end: '',
    motivation: 'none',
    reminder: '18:30',
  };
  expect(habitPayload(form).target).toBe(0);
  expect(() => habitPayload({ ...form, days: [] })).toThrow();
  expect(() => habitPayload({ ...form, target: '.5' })).toThrow();
  expect(() => habitPayload({ ...form, reminder: '25:00' })).toThrow();
  expect(() => habitPayload({ ...form, end: '2026-10-13' })).toThrow();
  expect(() => habitPayload({ ...form, kind: 'frequency', target: '8' })).toThrow('1 and 7');
});
