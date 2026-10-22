import { beforeEach, expect, jest, test } from '@jest/globals';
import { liveUpdateDue, runLiveProps } from '@/features/running/run-live-model';
import { pauseRun } from '@/features/running/run-model';
import { runFixture, runTime } from './helpers/run-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
let mockNative: object | null = null;
jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockNative }));
const mockActivity = { update: jest.fn(async () => {}), end: jest.fn(async () => {}) };
const mockFactory = { start: jest.fn(() => mockActivity), getInstances: jest.fn(() => []) };
jest.mock('@/features/running/run-activity', () => ({ __esModule: true, default: mockFactory }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(async () => null),
  scheduleNotificationAsync: jest.fn(async () => 'actaro-run-live'),
  dismissNotificationAsync: jest.fn(async () => {}),
  AndroidImportance: { LOW: 2 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidNotificationPriority: { LOW: 'low' },
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});
test('live props: timer origin excludes pauses and paused runs freeze at the pause time', () => {
  const draft = runFixture(); // Recording since runTime with ~111 m in 30 s.
  const now = runTime + 90000;
  const live = runLiveProps(draft, now);
  expect(live).toMatchObject({
    startedAt: runTime,
    pausedAt: null,
    elapsed: '1:30',
    distance: '0.11',
    unit: 'km',
    status: 'Recording',
  });
  const paused = runLiveProps(pauseRun(draft, runTime + 60000), now);
  expect(paused).toMatchObject({ status: 'Paused', elapsed: '1:00', pausedAt: now });
  expect(paused.startedAt).toBe(now - 60000);
  expect(runLiveProps(runFixture(true), now).status).toBe('Finished');
});
test('updates go out on status change at once and otherwise no more than each interval', () => {
  const live = runLiveProps(runFixture(), runTime + 30000);
  expect(liveUpdateDue(null, live, 0, 5000)).toBe(true);
  expect(liveUpdateDue(live, { ...live, distance: '0.20' }, 1000, 5000)).toBe(false);
  expect(liveUpdateDue(live, { ...live, distance: '0.20' }, 6000, 5000)).toBe(true);
  expect(liveUpdateDue(live, live, 6000, 5000)).toBe(false);
  expect(liveUpdateDue(live, live, 11000, 10000, true)).toBe(true);
  expect(liveUpdateDue(live, { ...live, status: 'Paused' }, 0, 5000)).toBe(true);
});
test('iOS without the widget native module (Expo Go) never loads the activity', async () => {
  mockNative = null;
  const { runLive } = jest.requireActual<typeof import('@/features/running/run-live.ios')>(
    '@/features/running/run-live.ios',
  );
  await runLive.show(runFixture());
  await runLive.end();
  expect(mockFactory.start).not.toHaveBeenCalled();
});
test('iOS starts one Live Activity, throttles updates, and ends it', async () => {
  mockNative = {};
  const { runLive } = jest.requireActual<typeof import('@/features/running/run-live.ios')>(
    '@/features/running/run-live.ios',
  );
  const now = jest.spyOn(Date, 'now');
  now.mockReturnValue(runTime + 30000);
  await runLive.show(runFixture());
  expect(mockFactory.start).toHaveBeenCalledTimes(1);
  expect(mockFactory.start.mock.calls[0]).toEqual([
    expect.objectContaining({ status: 'Recording', distance: '0.11' }),
    'actaro://runs/session',
  ]);
  now.mockReturnValue(runTime + 31000);
  await runLive.show(runFixture());
  expect(mockActivity.update).not.toHaveBeenCalled();
  now.mockReturnValue(runTime + 32000);
  await runLive.show(pauseRun(runFixture(), runTime + 32000));
  expect(mockActivity.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'Paused' }));
  await runLive.end();
  expect(mockActivity.end).toHaveBeenCalledWith('immediate');
  now.mockRestore();
});
test('Android posts a quiet sticky notification and dismisses it at the end', async () => {
  const Notifications = jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
  const { runLive } = jest.requireActual<typeof import('@/features/running/run-live.android')>(
    '@/features/running/run-live.android',
  );
  const now = jest.spyOn(Date, 'now').mockReturnValue(runTime + 90000);
  await runLive.show(runFixture());
  expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
    'run-live',
    expect.objectContaining({ importance: 2, sound: null, enableVibrate: false }),
  );
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'actaro-run-live',
    content: expect.objectContaining({
      title: 'Run recording · 1:30',
      body: '0.11 km · 4:29 /km avg',
      sticky: true,
    }),
    trigger: { channelId: 'run-live' },
  });
  await runLive.end();
  expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('actaro-run-live');
  now.mockRestore();
});
test('Android skips the live notification without notification permission', async () => {
  const Notifications = jest.requireMock<typeof import('expo-notifications')>('expo-notifications');
  jest.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({ granted: false } as never);
  const { runLive } = jest.requireActual<typeof import('@/features/running/run-live.android')>(
    '@/features/running/run-live.android',
  );
  await runLive.show(runFixture());
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});
