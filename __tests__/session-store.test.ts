import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionStore } from '@/features/workouts/session-store';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
const storage = jest.mocked(AsyncStorage);
let saved = new Map<string, string>();
beforeEach(() => {
  jest.clearAllMocks();
  saved = new Map();
  storage.getItem.mockImplementation(async (key) => saved.get(key) ?? null);
  storage.setItem.mockImplementation(async (key, value) => {
    saved.set(key, value);
  });
  storage.removeItem.mockImplementation(async (key) => {
    saved.delete(key);
  });
});
test('serializes writes and restores the latest draft without overwriting another account', async () => {
  const session = sessionFixture(),
    other = { ...session, userId: '00000000-0000-4000-8000-000000000006' };
  await Promise.all([sessionStore.start(session), sessionStore.start(other)]);
  await Promise.all([
    sessionStore.write({ ...session, notes: 'first' }),
    sessionStore.write({ ...session, notes: 'latest' }),
  ]);
  expect((await sessionStore.read(sessionOwner))?.notes).toBe('latest');
  await sessionStore.discard(sessionOwner);
  expect(await sessionStore.read(sessionOwner)).toBeNull();
  expect(await sessionStore.read(other.userId)).toEqual(other);
});
test('failed storage writes reject; existing/corrupt drafts cannot be silently replaced', async () => {
  const session = sessionFixture();
  storage.setItem.mockRejectedValueOnce(new Error('device full'));
  await expect(sessionStore.start(session)).rejects.toThrow('device full');
  await sessionStore.start(session);
  await expect(sessionStore.start(session)).rejects.toThrow('Resume');
  saved.set(`actaro:active-workout:v1:${sessionOwner}`, '{}');
  await expect(sessionStore.read(sessionOwner)).rejects.toThrow('kept');
  await expect(sessionStore.start(session)).rejects.toThrow('Resume');
});
