import AsyncStorage from '@react-native-async-storage/async-storage';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { appendRunFix, pauseRun, restoreRun, type RunDraft, type RunFix } from './run-model';

const trackingKey = 'actaro:run:tracking-owner:v1';
let pending = Promise.resolve();
let memory: RunDraft | null = null;
const listeners = new Set<(userId: string, draft: RunDraft | null) => void>();
function key(userId: string) {
  if (!validExerciseId(userId)) throw new Error('Invalid account.');
  return `actaro:run:draft:v1:${userId}`;
}
function serial<T>(operation: () => Promise<T>) {
  const result = pending.then(operation);
  pending = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}
async function read(userId: string) {
  if (memory?.userId === userId) return memory;
  const raw = await AsyncStorage.getItem(key(userId));
  memory = raw === null ? null : restoreRun(raw, userId);
  return memory;
}
async function write(draft: RunDraft) {
  await AsyncStorage.setItem(key(draft.userId), JSON.stringify(draft));
  memory = null;
  if (draft.status === 'recording') await AsyncStorage.setItem(trackingKey, draft.userId);
  else if ((await AsyncStorage.getItem(trackingKey)) === draft.userId)
    await AsyncStorage.removeItem(trackingKey);
  memory = draft;
  listeners.forEach((listener) => listener(draft.userId, draft));
  return draft;
}
export const runStore = {
  read(userId: string) {
    return serial(() => read(userId));
  },
  trackingOwner() {
    return serial(async () => {
      const owner = await AsyncStorage.getItem(trackingKey);
      if (owner !== null && !validExerciseId(owner))
        throw new Error('Run tracking state unavailable.');
      return owner;
    });
  },
  start(draft: RunDraft) {
    return serial(async () => {
      if (await read(draft.userId))
        throw new Error('A run is already saved on this device. Open it first.');
      const owner = await AsyncStorage.getItem(trackingKey);
      if (owner && owner !== draft.userId)
        throw new Error('Another account is recording. Stop that run first.');
      return write(draft);
    });
  },
  update(userId: string, change: (draft: RunDraft) => RunDraft) {
    return serial(async () => {
      const current = await read(userId);
      if (!current) throw new Error('No saved run on this device.');
      const next = change(current);
      if (next.userId !== userId || next.id !== current.id)
        throw new Error('Run changed. Reopen it.');
      return next === current ? current : write(next);
    });
  },
  append(userId: string, fixes: RunFix[]) {
    return this.update(userId, (draft) => fixes.reduce(appendRunFix, draft));
  },
  pause(userId: string, now: number, reason: string | null = null) {
    return this.update(userId, (draft) => pauseRun(draft, now, reason));
  },
  discard(userId: string, id: string) {
    return serial(async () => {
      const draft = await read(userId);
      if (draft && draft.id !== id) throw new Error('Run changed. Reopen it.');
      await AsyncStorage.removeItem(key(userId));
      if ((await AsyncStorage.getItem(trackingKey)) === userId)
        await AsyncStorage.removeItem(trackingKey);
      if (memory?.userId === userId) memory = null;
      listeners.forEach((listener) => listener(userId, null));
    });
  },
  clearMemory() {
    memory = null;
  },
  subscribe(listener: (userId: string, draft: RunDraft | null) => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
