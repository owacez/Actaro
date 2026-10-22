import { requireOptionalNativeModule } from 'expo';
import type { LiveActivity, LiveActivityFactory } from 'expo-widgets';
import type { RunDraft } from './run-model';
import { liveUpdateDue, runLiveProps, type RunLiveProps } from './run-live-model';

let factory: LiveActivityFactory<RunLiveProps> | null | undefined;
let current: LiveActivity<RunLiveProps> | null = null,
  shown: RunLiveProps | null = null,
  sentAt = 0;
// Expo Go and builds without the widget extension lack the native module; importing
// expo-widgets there would throw, so the activity module is required only when it exists.
function load() {
  if (factory === undefined) {
    try {
      const activity: typeof import('./run-activity') | null = requireOptionalNativeModule(
        'ExpoWidgets',
      )
        ? // A static import would load expo-widgets in Expo Go and crash; this stays conditional.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./run-activity')
        : null;
      factory = activity?.default ?? null;
    } catch {
      factory = null;
    }
  }
  return factory;
}
// The Live Activity mirrors the local draft only; failures never affect recording.
export const runLive = {
  async show(draft: RunDraft) {
    try {
      const activities = load();
      if (!activities) return;
      const now = Date.now(),
        props = runLiveProps(draft, now);
      if (!current) {
        // A relaunch can leave an activity from an earlier process; replace it.
        await Promise.all(activities.getInstances().map((old) => old.end('immediate')));
        current = activities.start(props, 'actaro://runs/session');
      } else if (liveUpdateDue(shown, props, now - sentAt, 5000)) await current.update(props);
      else return;
      shown = props;
      sentAt = now;
    } catch {
      // Recording and the saved draft are unaffected.
    }
  },
  async end() {
    try {
      const activities = load();
      const open = current ? [current] : (activities?.getInstances() ?? []);
      await Promise.all(open.map((activity) => activity.end('immediate')));
    } catch {
      // Nothing to clean up if the system already removed it.
    } finally {
      current = null;
      shown = null;
    }
  },
};
