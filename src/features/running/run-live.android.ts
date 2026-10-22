import * as Notifications from 'expo-notifications';
import type { RunDraft } from './run-model';
import { liveUpdateDue, runLiveProps, type RunLiveProps } from './run-live-model';

const identifier = 'actaro-run-live',
  channelId = 'run-live';
let ready = false,
  shown: RunLiveProps | null = null,
  sentAt = 0;
// A quiet, low-importance channel: updates refresh the shade without sound or vibration.
async function prepare() {
  if (ready) return true;
  if (!(await Notifications.getPermissionsAsync()).granted) return false;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'Run in progress',
    importance: Notifications.AndroidImportance.LOW,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
  ready = true;
  return true;
}
// Android has no Live Activity; a sticky notification shows the same figures. Without
// notification permission it is skipped; the location service notification remains.
export const runLive = {
  async show(draft: RunDraft) {
    try {
      const now = Date.now(),
        props = runLiveProps(draft, now);
      if (!liveUpdateDue(shown, props, now - sentAt, 10000, props.status === 'Recording')) return;
      if (!(await prepare())) return;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: `Run ${props.status.toLowerCase()} · ${props.elapsed}`,
          body: `${props.distance} ${props.unit} · ${props.pace} avg`,
          sticky: true,
          autoDismiss: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
          data: { url: '/runs/session' },
        },
        trigger: { channelId },
      });
      shown = props;
      sentAt = now;
    } catch {
      // Recording and the saved draft are unaffected.
    }
  },
  async end() {
    try {
      await Notifications.dismissNotificationAsync(identifier);
    } catch {
      // Already dismissed.
    } finally {
      shown = null;
    }
  },
};
