import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { getSupabase } from '@/lib/supabase/client';
import { RecordRequestError, recordInput } from '@/lib/owned-data';
import { newRun, finishRun, resumeRun, type RunDraft, type RunFix } from './run-model';
import { runStore } from './run-store';

export const runLocationTask = 'actaro-running-location-v1';
let foreground: Location.LocationSubscription | null = null;
let problem: { userId: string; message: string } | null = null;
const problems = new Set<(value: typeof problem) => void>();
let commands = Promise.resolve();
function serial<T>(work: () => Promise<T>) {
  const next = commands.then(work);
  commands = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
export function backgroundRunSupported() {
  return (
    Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}
function fix(location: Location.LocationObject): RunFix | null {
  const { latitude, longitude, accuracy, speed } = location.coords;
  return accuracy === null
    ? null
    : {
        latitude,
        longitude,
        accuracy,
        timestamp: location.timestamp,
        speed: speed !== null && speed >= 0 ? speed : null,
      };
}
function report(userId: string, message: string) {
  problem = { userId, message };
  problems.forEach((listener) => listener(problem));
}
async function halt() {
  foreground?.remove();
  foreground = null;
  if (backgroundRunSupported() && (await Location.hasStartedLocationUpdatesAsync(runLocationTask)))
    await Location.stopLocationUpdatesAsync(runLocationTask);
}
async function interrupt(userId: string, message: string) {
  report(userId, message);
  // Stop the sensor even if device storage has become unavailable.
  try {
    await halt();
  } finally {
    try {
      await runStore.pause(userId, Date.now(), message);
    } catch {
      report(
        userId,
        'Run recording stopped because device storage is unavailable. Keep the app open and retry.',
      );
    }
  }
}
async function sameAccount(userId: string) {
  const { data, error } = await getSupabase().auth.getSession();
  if (error || data.session?.user.id !== userId)
    throw new RecordRequestError('Your account changed. Reopen Running.');
}
async function stopAfterSaving(userId: string, save: () => Promise<unknown>) {
  const owner = await runStore.trackingOwner();
  if (owner && owner !== userId)
    throw new RecordRequestError('Another account is recording. Reopen your run.');
  try {
    return await save();
  } catch (error) {
    report(
      userId,
      'Recording stopped, but device storage did not confirm the change. Keep the app open and retry.',
    );
    throw error;
  } finally {
    await halt();
  }
}
function consume(locations: Location.LocationObject[]) {
  return serial(async () => {
    let owner: string | null;
    try {
      owner = await runStore.trackingOwner();
    } catch {
      await halt();
      return;
    }
    if (!owner) {
      await halt();
      return;
    }
    try {
      const points = locations
        .map(fix)
        .filter((value): value is RunFix => value !== null)
        .sort((a, b) => a.timestamp - b.timestamp);
      const draft = await runStore.append(owner, points);
      if (draft.status !== 'recording') await halt();
    } catch {
      await interrupt(
        owner,
        'Run recording was interrupted. Your last saved points are kept; reopen the run to continue.',
      );
    }
  });
}
// Imported by the root layout, so a headless native launch registers the task without mounting UI.
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(runLocationTask)) {
  TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
    runLocationTask,
    async ({ data, error }) => {
      if (!error) {
        if (data?.locations) await consume(data.locations);
        return;
      }
      await serial(async () => {
        let owner: string | null;
        try {
          owner = await runStore.trackingOwner();
        } catch {
          await halt();
          return;
        }
        if (!owner) {
          await halt();
          return;
        }
        await interrupt(
          owner,
          'GPS tracking stopped. Check location permission and resume your saved run.',
        );
      });
    },
  );
}
async function permissions(background: boolean) {
  if (!(await Location.requestForegroundPermissionsAsync()).granted)
    throw new RecordRequestError(
      'Location permission is needed to record a run. Enable it in your device settings.',
    );
  if (!(await Location.hasServicesEnabledAsync()))
    throw new RecordRequestError('Turn on Location Services and try again.');
  if (
    background &&
    (!backgroundRunSupported() ||
      !(await TaskManager.isAvailableAsync()) ||
      !(await Location.requestBackgroundPermissionsAsync()).granted)
  )
    throw new RecordRequestError(
      'Background location was not enabled. Allow Always/background location in settings, or choose foreground-only recording.',
    );
}
async function attach(draft: RunDraft) {
  await halt();
  if (draft.background) {
    await Location.startLocationUpdatesAsync(runLocationTask, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 0,
      timeInterval: 2000,
      activityType: Location.ActivityType.Fitness,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Actaro is recording your run',
        notificationBody: 'Open Actaro to pause or stop location recording.',
        killServiceOnDestroy: true,
      },
    });
  } else {
    if (AppState.currentState !== 'active')
      throw new RecordRequestError('Return to Actaro to start foreground recording.');
    foreground = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 0, timeInterval: 2000 },
      (position) => {
        void consume([position]).catch(() =>
          report(draft.userId, 'Run recording stopped. Reopen your run and check permissions.'),
        );
      },
      () => {
        void serial(async () => {
          if (
            (await runStore.trackingOwner()) === draft.userId &&
            (await runStore.read(draft.userId))?.id === draft.id
          )
            await interrupt(
              draft.userId,
              'GPS tracking stopped. Check location permission and resume your run.',
            );
        }).catch(() => {});
      },
    );
  }
  problem = null;
  problems.forEach((listener) => listener(null));
}
export const runTracker = {
  begin(userId: string, id: string, zone: string, background: boolean, unit: 'km' | 'mi' = 'km') {
    return serial(async () => {
      await permissions(background);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      let position: Location.LocationObject;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  new RecordRequestError('GPS is taking too long. Move outdoors and try again.'),
                ),
              20000,
            );
          }),
        ]);
      } finally {
        clearTimeout(timeout);
      }
      await sameAccount(userId);
      const first = fix(position);
      if (!first)
        throw new RecordRequestError(
          'An accurate GPS signal is not available yet. Move outdoors and try again.',
        );
      const draft = await runStore.start(
        recordInput(() => newRun(id, userId, zone, background, first, Date.now(), unit)),
      );
      try {
        await attach(draft);
      } catch {
        await interrupt(
          userId,
          'GPS could not start. Your run is saved as paused; check permissions and resume.',
        );
      }
      return draft;
    });
  },
  pause(userId: string) {
    return serial(async () => {
      // Persist the boundary first: any late callbacks are ignored by the paused draft.
      await stopAfterSaving(userId, () => runStore.pause(userId, Date.now()));
    });
  },
  resume(userId: string) {
    return serial(async () => {
      const saved = await runStore.read(userId);
      if (!saved) throw new RecordRequestError('No run to resume.');
      await permissions(saved.background);
      await sameAccount(userId);
      const draft = await runStore.update(userId, (current) => resumeRun(current, Date.now()));
      try {
        await attach(draft);
      } catch {
        await interrupt(userId, 'GPS could not resume. Check permissions and try again.');
      }
    });
  },
  finish(userId: string) {
    return serial(async () => {
      await stopAfterSaving(userId, () =>
        runStore.update(userId, (draft) => finishRun(draft, Date.now())),
      );
    });
  },
  discard(userId: string, id: string) {
    return serial(async () => {
      const owner = await runStore.trackingOwner();
      if (!owner || owner === userId) await halt();
      await runStore.discard(userId, id);
    });
  },
  setOwner(userId?: string) {
    return serial(async () => {
      const previous = await runStore.trackingOwner();
      if (previous && previous !== userId) {
        try {
          await runStore.pause(
            previous,
            Date.now(),
            'Recording paused because the signed-in account changed.',
          );
        } finally {
          await halt();
        }
      }
      runStore.clearMemory();
      problem = null;
      if (!userId) return;
      const draft = await runStore.read(userId);
      if (draft?.status !== 'recording') return;
      const alive =
        draft.background &&
        backgroundRunSupported() &&
        (await Location.hasStartedLocationUpdatesAsync(runLocationTask));
      if (!alive || Date.now() - draft.updatedAt > 120000) {
        await stopAfterSaving(userId, () =>
          runStore.pause(
            userId,
            draft.updatedAt,
            'Recording was interrupted. Time after the last saved location is excluded. Resume when ready.',
          ),
        );
      }
    });
  },
  backgrounded(userId: string) {
    return serial(async () => {
      const draft = await runStore.read(userId);
      if (draft?.status === 'recording' && !draft.background) {
        await stopAfterSaving(userId, () =>
          runStore.pause(
            userId,
            Date.now(),
            'Foreground recording paused when Actaro left the screen. Resume to continue.',
          ),
        );
      }
    });
  },
  problem(userId: string) {
    return problem?.userId === userId ? problem.message : null;
  },
  subscribeProblems(listener: (value: typeof problem) => void) {
    problems.add(listener);
    return () => {
      problems.delete(listener);
    };
  },
};
