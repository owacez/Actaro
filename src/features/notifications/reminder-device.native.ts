import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { reminderPlan } from './reminder-model';
const prefix = 'actaro:habit:',
  channelId = 'actaro-habits';
function accepted(permission: Notifications.NotificationPermissionsStatus) {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}
export const reminderDevice = {
  supported: true,
  async permitted() {
    return accepted(await Notifications.getPermissionsAsync());
  },
  async requestPermission() {
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync(channelId, {
        name: 'Habit reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    return accepted(
      await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: false, allowSound: false },
      }),
    );
  },
  async clear() {
    for (const request of await Notifications.getAllScheduledNotificationsAsync()) {
      if (request.identifier.startsWith(prefix))
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
    }
    for (const notification of await Notifications.getPresentedNotificationsAsync()) {
      if (notification.request.identifier.startsWith(prefix))
        await Notifications.dismissNotificationAsync(notification.request.identifier);
    }
  },
  async schedule(plan: ReturnType<typeof reminderPlan>[number]) {
    if (Platform.OS === 'android')
      await Notifications.setNotificationChannelAsync(channelId, {
        name: 'Habit reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    await Notifications.scheduleNotificationAsync({
      identifier: plan.identifier,
      content: {
        title: 'Actaro reminder',
        body: 'Review your scheduled habit.',
        data: { userId: plan.userId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: plan.date,
        channelId,
      },
    });
  },
  observe(owner: () => string | undefined, onTap: () => void) {
    function owned(notification: Notifications.Notification) {
      return (
        !!owner() &&
        notification.request.identifier.startsWith(prefix) &&
        notification.request.content.data?.userId === owner()
      );
    }
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => ({
        shouldShowBanner: owned(notification),
        shouldShowList: owned(notification),
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    let active = true,
      lastIdentifier: string | undefined;
    function tapped(response: Notifications.NotificationResponse) {
      if (!active || !owner()) return;
      const identifier = response.notification.request.identifier;
      if (owned(response.notification) && identifier !== lastIdentifier) {
        lastIdentifier = identifier;
        onTap();
      }
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    }
    const listener = Notifications.addNotificationResponseReceivedListener(tapped);
    void Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) tapped(response);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      listener.remove();
    };
  },
};
