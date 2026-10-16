const listeners = new Set<() => void>();
export function remindersChanged() {
  for (const listener of listeners) listener();
}
export function observeReminderChanges(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
