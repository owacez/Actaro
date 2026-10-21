import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runStore } from '@/features/running/run-store';
import { runFixture, runOwner, runTime } from './helpers/run-fixture';
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
const storage = jest.mocked(AsyncStorage);
let records: Map<string, string>;
beforeEach(() => {
  jest.clearAllMocks();
  runStore.clearMemory();
  records = new Map();
  storage.getItem.mockImplementation(async (key) => records.get(key) ?? null);
  storage.setItem.mockImplementation(async (key, value) => {
    records.set(key, value);
  });
  storage.removeItem.mockImplementation(async (key) => {
    records.delete(key);
  });
});
test('serialized mutations retain the latest notes and account-bound drafts', async () => {
  const run = runFixture();
  await runStore.start(run);
  await Promise.all([
    runStore.update(runOwner, (value) => ({ ...value, notes: 'first' })),
    runStore.update(runOwner, (value) => ({ ...value, notes: 'latest' })),
  ]);
  runStore.clearMemory();
  expect((await runStore.read(runOwner))?.notes).toBe('latest');
  expect(await runStore.read('12000000-0000-4000-8000-000000000002')).toBeNull();
  await expect(runStore.start(run)).rejects.toThrow('already');
  await expect(runStore.discard(runOwner, '12000000-0000-4000-8000-000000000004')).rejects.toThrow(
    'changed',
  );
  expect(await runStore.trackingOwner()).toBe(runOwner);
  await runStore.pause(runOwner, runTime + 60000);
  expect(await runStore.trackingOwner()).toBeNull();
  await runStore.discard(runOwner, run.id);
  expect(await runStore.read(runOwner)).toBeNull();
});
test('failed storage never publishes success or poisons retries, and corrupt drafts are preserved', async () => {
  const run = runFixture(),
    changed = jest.fn();
  const unsubscribe = runStore.subscribe(changed);
  storage.setItem.mockRejectedValueOnce(new Error('full'));
  await expect(runStore.start(run)).rejects.toThrow('full');
  expect(changed).not.toHaveBeenCalled();
  await runStore.start(run);
  storage.setItem.mockRejectedValueOnce(new Error('full'));
  await expect(runStore.update(runOwner, (value) => ({ ...value, notes: 'lost' }))).rejects.toThrow(
    'full',
  );
  expect((await runStore.read(runOwner))?.notes).toBe('');
  unsubscribe();
  runStore.clearMemory();
  records.set(`actaro:run:draft:v1:${runOwner}`, '{}');
  await expect(runStore.read(runOwner)).rejects.toThrow();
  await expect(runStore.start(run)).rejects.toThrow();
  expect(records.get(`actaro:run:draft:v1:${runOwner}`)).toBe('{}');
});
