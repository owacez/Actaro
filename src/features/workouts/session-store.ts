import AsyncStorage from '@react-native-async-storage/async-storage';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { restoreSession, type SessionDraft } from './session-model';
const queues = new Map<string, Promise<unknown>>();
function key(userId: string) {
  if (!validExerciseId(userId)) throw new Error('Invalid account.');
  return `actaro:active-workout:v1:${userId}`;
}
function serial<T>(userId: string, operation: (storageKey: string) => Promise<T>) {
  const storageKey = key(userId);
  const next = (queues.get(userId) ?? Promise.resolve())
    .catch(() => undefined)
    .then(() => operation(storageKey));
  queues.set(userId, next);
  const clean = () => {
    if (queues.get(userId) === next) queues.delete(userId);
  };
  void next.then(clean, clean);
  return next;
}
export const sessionStore = {
  read(userId: string) {
    return serial(userId, async (storageKey) => {
      const value = await AsyncStorage.getItem(storageKey);
      return value === null ? null : restoreSession(value, userId);
    });
  },
  start(session: SessionDraft) {
    return serial(session.userId, async (storageKey) => {
      if (await AsyncStorage.getItem(storageKey))
        throw new Error('A workout is already saved on this device. Resume it first.');
      await AsyncStorage.setItem(storageKey, JSON.stringify(session));
    });
  },
  write(session: SessionDraft) {
    return serial(session.userId, (storageKey) =>
      AsyncStorage.setItem(storageKey, JSON.stringify(session)),
    );
  },
  discard(userId: string) {
    return serial(userId, (storageKey) => AsyncStorage.removeItem(storageKey));
  },
  forgetSaved(userId: string, sessionId: string) {
    return serial(userId, async (storageKey) => {
      const value = await AsyncStorage.getItem(storageKey);
      if (!value) return;
      const draft = restoreSession(value, userId);
      if (draft.id === sessionId && draft.status === 'saved')
        await AsyncStorage.removeItem(storageKey);
    });
  },
};
