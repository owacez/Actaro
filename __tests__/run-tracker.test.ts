import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { PermissionStatus } from 'expo-modules-core';
import { runTracker, runLocationTask } from '@/features/running/run-tracker';
import { runStore } from '@/features/running/run-store';
import { runFixture, runId, runOwner, runTime } from './helpers/run-fixture';
const mockGetSession =
  jest.fn<() => Promise<{ data: { session: { user: { id: string } } }; error: null }>>();
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ auth: { getSession: mockGetSession } }),
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'bare' },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4, BestForNavigation: 6 },
  ActivityType: { Fitness: 3 },
}));
jest.mock('expo-task-manager', () => ({
  isTaskDefined: () => false,
  defineTask: jest.fn(),
  isAvailableAsync: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
const task = jest.mocked(TaskManager.defineTask).mock.calls[0][1];
const storage = jest.mocked(AsyncStorage),
  location = jest.mocked(Location);
let records: Map<string, string>,
  started = false;
function position(longitude: number, timestamp: number): Location.LocationObject {
  return {
    coords: {
      latitude: 0,
      longitude,
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: 3.7,
    },
    timestamp,
  };
}
async function batch(points: Location.LocationObject[]) {
  await task({
    data: { locations: points },
    error: null,
    executionInfo: { eventId: 'test-event', taskName: runLocationTask },
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(runTime);
  runStore.clearMemory();
  records = new Map();
  started = false;
  AppState.currentState = 'active';
  storage.getItem.mockImplementation(async (key) => records.get(key) ?? null);
  storage.setItem.mockImplementation(async (key, value) => {
    records.set(key, value);
  });
  storage.removeItem.mockImplementation(async (key) => {
    records.delete(key);
  });
  const granted = {
    status: PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: 'never' as const,
  };
  location.requestForegroundPermissionsAsync.mockResolvedValue(granted);
  location.requestBackgroundPermissionsAsync.mockResolvedValue(granted);
  location.hasServicesEnabledAsync.mockResolvedValue(true);
  jest.mocked(TaskManager.isAvailableAsync).mockResolvedValue(true);
  location.getCurrentPositionAsync.mockResolvedValue(position(0, runTime));
  location.hasStartedLocationUpdatesAsync.mockImplementation(async () => started);
  location.startLocationUpdatesAsync.mockImplementation(async () => {
    started = true;
  });
  location.stopLocationUpdatesAsync.mockImplementation(async () => {
    started = false;
  });
  location.watchPositionAsync.mockResolvedValue({ remove: jest.fn() });
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: runOwner } } }, error: null });
});
afterEach(async () => {
  await runTracker.setOwner(undefined);
  jest.useRealTimers();
});
test('background GPS persists offline without auth polling, and pause/finish stop sensors', async () => {
  await runTracker.begin(runOwner, runId, 'UTC', true);
  expect(location.startLocationUpdatesAsync).toHaveBeenCalledWith(
    runLocationTask,
    expect.objectContaining({ showsBackgroundLocationIndicator: true }),
  );
  mockGetSession.mockRejectedValue(new Error('offline'));
  jest.setSystemTime(runTime + 30000);
  await batch([position(0.001, runTime + 30000)]);
  expect((await runStore.read(runOwner))?.distanceMeters).toBeCloseTo(111.1949);
  expect(mockGetSession).toHaveBeenCalledTimes(1);
  jest.setSystemTime(runTime + 60000);
  await runTracker.pause(runOwner);
  expect(started).toBe(false);
  expect((await runStore.read(runOwner))?.status).toBe('paused');
  await batch([position(10, runTime + 90000)]);
  expect((await runStore.read(runOwner))?.route).toHaveLength(2);
  await runTracker.finish(runOwner);
  expect((await runStore.read(runOwner))?.status).toBe('review');
});
test('denied background permission cannot silently start foreground recording', async () => {
  location.requestBackgroundPermissionsAsync.mockResolvedValue({
    status: PermissionStatus.DENIED,
    granted: false,
    canAskAgain: true,
    expires: 'never',
  });
  await expect(runTracker.begin(runOwner, runId, 'UTC', true)).rejects.toThrow(
    'Background location',
  );
  expect(await runStore.read(runOwner)).toBeNull();
  expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
});
test('foreground backgrounding pauses and account changes retain only private paused drafts', async () => {
  await runTracker.begin(runOwner, runId, 'UTC', false);
  jest.setSystemTime(runTime + 10000);
  await runTracker.backgrounded(runOwner);
  expect((await runStore.read(runOwner))?.status).toBe('paused');
  await runTracker.resume(runOwner);
  expect((await runStore.read(runOwner))?.segment).toBe(1);
  await runTracker.setOwner('12000000-0000-4000-8000-000000000002');
  expect((await runStore.read(runOwner))?.status).toBe('paused');
  expect(await runStore.read('12000000-0000-4000-8000-000000000002')).toBeNull();
  expect(await runStore.trackingOwner()).toBeNull();
});
test('cold recovery excludes unknown time and storage failure prevents GPS start', async () => {
  await runStore.start(runFixture());
  jest.setSystemTime(runTime + 600000);
  await runTracker.setOwner(runOwner);
  expect((await runStore.read(runOwner))?.clock).toEqual({ elapsedMs: 30000, runningSince: null });
  await runTracker.discard(runOwner, runId);
  jest.setSystemTime(runTime);
  storage.setItem.mockRejectedValueOnce(new Error('full'));
  await expect(runTracker.begin(runOwner, runId, 'UTC', true)).rejects.toThrow();
  expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
});

test('cleaning up an old account draft cannot stop another account recording', async () => {
  await runTracker.begin(runOwner, runId, 'UTC', false);
  const other = '12000000-0000-4000-8000-000000000002';
  await runTracker.setOwner(other);
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: other } } }, error: null });
  await runTracker.begin(other, '12000000-0000-4000-8000-000000000004', 'UTC', true);
  await runTracker.discard(runOwner, runId);
  expect(started).toBe(true);
  expect((await runStore.read(other))?.status).toBe('recording');
  await expect(runTracker.pause(runOwner)).rejects.toThrow('Another account');
  expect(started).toBe(true);
});
