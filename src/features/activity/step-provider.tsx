import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { activityService } from './activity-service';
import { readTodaySteps } from './pedometer-service';

type Steps = { day: string; steps: number };
type StepState = { reading: Steps | null; error: string | null };
const StepContext = createContext<StepState | null>(null);
export const useDeviceSteps = () => useContext(StepContext);

// One observer per account, not one observer/request loop for each screen.
export function StepProvider({ userId, children }: PropsWithChildren<{ userId?: string }>) {
  const [state, setState] = useState<StepState>({ reading: null, error: null });
  useEffect(() => {
    if (!userId || Platform.OS !== 'ios') return;
    const ownerId = userId;
    let configured = false;
    let alive = true,
      epoch = 0,
      zone = 'UTC',
      unit = 'km';
    let watch: ReturnType<typeof Pedometer.watchStepCount> | undefined;
    let latest: Steps | null = null,
      saved: Steps | null = null;
    let saving = false,
      reading = false,
      lastRead = 0,
      lastAttempt = 0;
    let queuedRead: number | null = null;
    let syncError: string | null = null;
    const foreground = () =>
      AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    async function persist(force = false) {
      if (
        !alive ||
        !latest ||
        saving ||
        (saved?.day === latest.day && saved.steps === latest.steps)
      )
        return;
      if (!force && Date.now() - lastAttempt < 60000) return;
      const value = latest;
      saving = true;
      lastAttempt = Date.now();
      try {
        await activityService.save(
          ownerId,
          value.day,
          String(value.steps),
          '',
          unit,
          zone,
          'ios_pedometer',
        );
        if (alive) {
          saved = value;
          syncError = null;
          setState((current) => ({ ...current, error: null }));
        }
      } catch {
        syncError = 'Steps are live on this device. Cloud sync will retry automatically.';
        if (alive)
          setState((current) => ({
            ...current,
            error: syncError,
          }));
      } finally {
        saving = false;
      }
    }
    async function read(revision: number) {
      if (!alive || !configured || !foreground()) return;
      if (reading) {
        queuedRead = revision;
        return;
      }
      reading = true;
      lastRead = Date.now();
      try {
        const value = await readTodaySteps(zone);
        if (!alive || revision !== epoch || !foreground()) return;
        latest = value;
        setState({ reading: value, error: syncError });
        void persist();
      } catch (error) {
        if (alive && revision === epoch)
          setState((current) => ({
            ...current,
            error: error instanceof Error ? error.message : 'Step count unavailable.',
          }));
      } finally {
        reading = false;
        const next = queuedRead;
        queuedRead = null;
        if (next !== null && next === epoch) void read(next);
      }
    }
    async function start() {
      const revision = ++epoch;
      watch?.remove();
      watch = undefined;
      try {
        const data = await activityService.load(ownerId);
        if (!alive || revision !== epoch || !foreground()) return;
        zone = data.preferences.time_zone;
        unit = data.preferences.distance_unit;
        configured = true;
        saved =
          data.current?.steps_source === 'ios_pedometer' && data.current.steps !== null
            ? { day: data.day, steps: data.current.steps }
            : null;
        await read(revision);
        const permission = await Pedometer.getPermissionsAsync();
        if (!alive || revision !== epoch || !foreground() || !permission.granted) return;
        watch = Pedometer.watchStepCount(() => {
          if (Date.now() - lastRead >= 5000) void read(revision);
        });
      } catch {
        if (alive && revision === epoch)
          setState((current) => ({
            ...current,
            error: 'Unable to start step sync. It will retry when you reopen Actaro.',
          }));
      }
    }
    if (foreground()) void start();
    const listener = AppState.addEventListener('change', (next) => {
      if (next === 'active') void start();
      else {
        epoch++;
        watch?.remove();
        watch = undefined;
        void persist(true);
      }
    });
    const timer = setInterval(() => {
      if (foreground()) {
        if (configured) void read(epoch);
        else void start();
      }
    }, 60000);
    return () => {
      alive = false;
      epoch++;
      watch?.remove();
      listener.remove();
      clearInterval(timer);
    };
  }, [userId]);
  return <StepContext.Provider value={state}>{children}</StepContext.Provider>;
}
