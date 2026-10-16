import { beforeEach, expect, jest, test } from '@jest/globals';
import { reminderInstant, reminderPlan } from '@/features/notifications/reminder-model';
import type { HabitRecord } from '@/features/habits/habit-model';
import { reminderService } from '@/features/notifications/reminder-service';
import { reminderDevice } from '@/features/notifications/reminder-device';
import { habitService } from '@/features/habits/habit-service';
import { profileService } from '@/features/profile/profile-service';
import { requireOwner } from '@/lib/owned-data';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('@/features/notifications/reminder-device', () => ({
  reminderDevice: {
    supported: true,
    clear: jest.fn<() => Promise<void>>(),
    schedule: jest.fn<() => Promise<void>>(),
    permitted: jest.fn<() => Promise<boolean>>(),
  },
}));
jest.mock('@/features/habits/habit-service', () => ({ habitService: { all: jest.fn() } }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn() },
}));
jest.mock('@/lib/owned-data', () => ({ requireOwner: jest.fn() }));
const userId = nutritionContext().preferences.user_id;
function habit(): HabitRecord {
  return {
    id: '09000000-0000-4000-8000-000000000003',
    user_id: userId,
    name: 'Private habit name',
    kind: 'boolean',
    unit: 'done',
    start_date: '2026-01-01',
    time_zone: 'UTC',
    archived: false,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    habit_logs: [],
    habit_versions: [
      {
        id: 'version',
        user_id: userId,
        habit_id: '09000000-0000-4000-8000-000000000003',
        effective_from: '2026-01-01',
        target: 1,
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        end_date: null,
        motivation: 'none',
        reminder_time: '18:00',
      },
    ],
  };
}
beforeEach(async () => {
  jest.mocked(reminderDevice.clear).mockResolvedValue();
  jest.mocked(reminderDevice.schedule).mockResolvedValue();
  jest.mocked(reminderDevice.permitted).mockResolvedValue(true);
  jest
    .mocked(profileService.getPreferences)
    .mockResolvedValue({ ...nutritionContext().preferences, notifications_enabled: true });
  jest.mocked(habitService.all).mockResolvedValue([habit()]);
  jest.mocked(requireOwner).mockResolvedValue();
  await reminderService.setOwner(undefined);
  jest.clearAllMocks();
});
test('wall time handles DST gaps, repeated times and non-hour zones without duplicate reminders', () => {
  expect(reminderInstant('2026-03-08', '02:30', 'America/New_York')).toBeNull();
  expect(reminderInstant('2026-11-01', '01:30', 'America/New_York')?.toISOString()).toBe(
    '2026-11-01T05:30:00.000Z',
  );
  expect(reminderInstant('2026-10-15', '18:00', 'Asia/Kathmandu')?.toISOString()).toBe(
    '2026-10-15T12:15:00.000Z',
  );
});
test('plans respect owner, rest/end dates, completion, future times and the earliest-48 limit', () => {
  const record = habit(),
    now = new Date('2026-10-15T12:00:00Z');
  expect(reminderPlan(userId, [record], now)).toHaveLength(7);
  record.habit_versions[0].end_date = '2026-10-15';
  record.habit_logs = [
    {
      habit_id: record.id,
      user_id: userId,
      version_id: 'version',
      local_date: '2026-10-15',
      value: 1,
      notes: null,
      created_at: '2026-10-15',
      updated_at: '2026-10-15',
    },
  ];
  expect(reminderPlan(userId, [record], now)).toHaveLength(0);
  record.habit_logs = [];
  record.habit_versions[0].weekdays = [1];
  expect(reminderPlan(userId, [record], now)).toHaveLength(0);
  expect(() => reminderPlan('foreign', [record], now)).toThrow('account');
  const many = Array.from({ length: 10 }, (_, i) => ({ ...habit(), id: 'habit-' + i }));
  expect(reminderPlan(userId, many, now)).toHaveLength(48);
  expect(reminderPlan(userId, many, now)[0].date.toISOString()).toBe('2026-10-15T18:00:00.000Z');
});
test('disabled/denied permissions clear pending notifications without scheduling; logout clears them', async () => {
  jest.mocked(reminderDevice.permitted).mockResolvedValue(false);
  expect(await reminderService.setOwner(userId)).toBe(0);
  expect(reminderDevice.clear).toHaveBeenCalled();
  expect(reminderDevice.schedule).not.toHaveBeenCalled();
  jest.mocked(reminderDevice.permitted).mockResolvedValue(true);
  jest
    .mocked(profileService.getPreferences)
    .mockResolvedValue({ ...nutritionContext().preferences, notifications_enabled: false });
  expect(await reminderService.refresh()).toBe(0);
  await reminderService.setOwner(undefined);
  expect(reminderService.owner()).toBeUndefined();
  expect(reminderDevice.schedule).not.toHaveBeenCalled();
});
test('account switch invalidates an in-flight read and a scheduling failure removes a partial schedule', async () => {
  let resolve: (habits: HabitRecord[]) => void = () => {
    throw new Error('read not started');
  };
  const started = new Promise<void>((start) => {
    jest.mocked(habitService.all).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
          start();
        }),
    );
  });
  const first = reminderService.setOwner(userId);
  await started;
  const logout = reminderService.setOwner(undefined);
  resolve([habit()]);
  await Promise.all([first, logout]);
  expect(reminderDevice.schedule).not.toHaveBeenCalled();
  jest.mocked(reminderDevice.schedule).mockRejectedValueOnce(new Error('OS scheduling failure'));
  await expect(reminderService.setOwner(userId)).rejects.toThrow('OS scheduling');
  expect(jest.mocked(reminderDevice.clear).mock.calls.length).toBeGreaterThanOrEqual(4);
});
