import { useEffect } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { reminderDevice } from './reminder-device';
import { reminderService } from './reminder-service';
import { observeReminderChanges } from './reminder-events';
export function ReminderCoordinator({ userId }: { userId?: string }) {
  useEffect(() => {
    void reminderService.setOwner(userId).catch(() => undefined);
    return () => {
      void reminderService.setOwner(undefined).catch(() => undefined);
    };
  }, [userId]);
  useEffect(() => {
    const refresh = () => {
      void reminderService.refresh().catch(() => undefined);
    };
    const stop = observeReminderChanges(refresh);
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    const taps = reminderDevice.observe(reminderService.owner, () => router.push('/habits'));
    return () => {
      stop();
      app.remove();
      taps();
    };
  }, [userId]);
  return null;
}
