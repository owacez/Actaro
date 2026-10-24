import { useEffect, useRef, useState } from 'react';
import {
  AuthButton,
  BackLink,
  AuthFrame,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { profileService } from '@/features/profile/profile-service';
import { reminderDevice } from './reminder-device';
import { reminderService } from './reminder-service';
export function ReminderScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    void profileService
      .getPreferences(userId)
      .then((record) => {
        if (active) setEnabled(record.notifications_enabled);
      })
      .catch(() => {
        if (active) setError('Unable to read your reminder preference. Retry refresh.');
      });
    return () => {
      active = false;
    };
  }, [userId]);
  async function update(action: 'enable' | 'disable' | 'refresh') {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (action === 'enable' && !(await reminderDevice.requestPermission()))
        throw new Error(
          'Notifications are not permitted. Enable them in device settings, or keep in-app reminders.',
        );
      const record =
        action === 'refresh'
          ? await profileService.getPreferences(userId)
          : await profileService.updatePreferences(
              { notifications_enabled: action === 'enable' },
              userId,
            );
      setEnabled(record.notifications_enabled);
      const count = await reminderService.refresh();
      setMessage(
        !reminderDevice.supported
          ? 'Web shows due reminders inside Actaro only.'
          : !record.notifications_enabled
            ? 'Device reminders disabled.'
            : !(await reminderDevice.permitted())
              ? 'Notifications are blocked in device settings.'
              : `${count} reminders scheduled on this device. Reopen Actaro regularly to refresh them.`,
      );
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Reminder setup failed. Retry.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <BackLink label="Preferences" onPress={onBack} disabled={busy} />
      <AuthText kind="heading">Habit reminders</AuthText>
      <AuthText>
        {enabled === null
          ? 'Preference not loaded.'
          : `Account preference: ${enabled ? 'On' : 'Off'}`}
      </AuthText>
      <AuthText>
        Set a time and weekdays in each habit. This device schedules the next seven days, up to the
        earliest 48 reminders. Opening Actaro, returning to it or editing habits refreshes the
        schedule. Completed habits are skipped when refreshed.
      </AuthText>
      <AuthText>
        Lock-screen messages stay generic. Other devices refresh when opened. Delivery can be
        delayed or silenced by device settings; there is no server push or background sync.
      </AuthText>
      {!reminderDevice.supported && (
        <AuthNotice>
          Web supports in-app due reminders only. Open Actaro on your phone to enable device
          notifications.
        </AuthNotice>
      )}
      {reminderDevice.supported && (
        <>
          <AuthButton
            title="Enable on this device"
            busy={busy}
            onPress={() => void update('enable')}
          />
          <AuthButton
            title="Disable reminders"
            outlined
            busy={busy}
            onPress={() => void update('disable')}
          />
        </>
      )}
      <AuthButton
        title="Refresh reminders"
        outlined
        busy={busy}
        onPress={() => void update('refresh')}
      />
      {!!message && <AuthNotice>{message}</AuthNotice>}
      {!!error && <AuthNotice error>{error}</AuthNotice>}
    </AuthFrame>
  );
}
