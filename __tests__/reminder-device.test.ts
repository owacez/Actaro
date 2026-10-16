import { beforeEach, expect, jest, test } from '@jest/globals';
import * as Notifications from 'expo-notifications';
import { reminderDevice } from '@/features/notifications/reminder-device.native';
jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getPresentedNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  dismissNotificationAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  clearLastNotificationResponseAsync: jest.fn(),
}));
const notification = (
  identifier = 'actaro:habit:owner:habit:date',
  userId = 'owner',
): Notifications.Notification => ({
  date: Date.now(),
  request: {
    identifier,
    trigger: null,
    content: {
      title: 'Actaro reminder',
      subtitle: null,
      body: 'Review your scheduled habit.',
      categoryIdentifier: null,
      sound: null,
      data: { userId },
    },
  },
});
beforeEach(() => {
  jest
    .mocked(Notifications.getAllScheduledNotificationsAsync)
    .mockResolvedValue([notification().request, notification('other').request]);
  jest
    .mocked(Notifications.getPresentedNotificationsAsync)
    .mockResolvedValue([notification(), notification('other')]);
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(null);
  jest.mocked(Notifications.clearLastNotificationResponseAsync).mockResolvedValue();
  jest
    .mocked(Notifications.addNotificationResponseReceivedListener)
    .mockReturnValue({ remove: jest.fn() });
});
test('native scheduling uses an absolute one-off date and generic content; cleanup preserves unrelated notifications', async () => {
  const date = new Date('2026-10-15T18:00:00Z');
  await reminderDevice.schedule({
    identifier: 'actaro:habit:owner:habit:date',
    date,
    userId: 'owner',
  });
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
    identifier: 'actaro:habit:owner:habit:date',
    content: {
      title: 'Actaro reminder',
      body: 'Review your scheduled habit.',
      data: { userId: 'owner' },
    },
    trigger: { type: 'date', date, channelId: 'actaro-habits' },
  });
  await reminderDevice.clear();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
    'actaro:habit:owner:habit:date',
  );
  expect(Notifications.dismissNotificationAsync).toHaveBeenCalledTimes(1);
});
test('foreground/cold-start taps are owner-bound, deduplicated and never expose another account notification', async () => {
  const response = { notification: notification(), actionIdentifier: 'default' };
  jest.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValue(response);
  let owner: string | undefined = 'owner';
  const tapped = jest.fn();
  const stop = reminderDevice.observe(() => owner, tapped);
  await Promise.resolve();
  const listener = jest.mocked(Notifications.addNotificationResponseReceivedListener).mock
    .calls[0][0];
  listener(response);
  expect(tapped).toHaveBeenCalledTimes(1);
  const handler = jest.mocked(Notifications.setNotificationHandler).mock.calls[0][0];
  expect(await handler?.handleNotification(notification())).toMatchObject({
    shouldShowBanner: true,
  });
  owner = undefined;
  expect(await handler?.handleNotification(notification())).toMatchObject({
    shouldShowBanner: false,
    shouldShowList: false,
  });
  listener(response);
  expect(tapped).toHaveBeenCalledTimes(1);
  stop();
});
