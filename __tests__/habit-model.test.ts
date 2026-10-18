import { expect, test } from '@jest/globals';
import {
  habitConsistency,
  habitPeriods,
  habitReached,
  habitPayload,
  habitValue,
  habitStatusLabel,
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
  expect(habitStatusLabel(record, '2026-10-12')).toBe('In progress this week');
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
test('frequency sums actual weekly counts, while partial and open weeks avoid false misses', () => {
  const record = { ...habit(), kind: 'frequency', unit: 'times', start_date: '2026-10-07' };
  record.habit_versions[0].effective_from = '2026-10-07';
  record.habit_versions[0].target = 3;
  log(record, '2026-10-12', 2);
  log(record, '2026-10-13', 1);
  expect(habitValue(record, '2026-10-14')).toBe(3);
  expect(habitValue(record, '2026-10-14', '2026-10-13')).toBe(1);
  const result = habitConsistency(record, '2026-10-14');
  expect(result.periods.find((p) => p.date === '2026-10-05')?.partial).toBe(true);
  expect(result.streak).toBe(1);
  expect(result.percentage).toBe(100);
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
});
