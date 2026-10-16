import type { reminderPlan } from './reminder-model';
// Web keeps the existing in-app due reminders; background delivery is native only.
export const reminderDevice = {
  supported: false,
  async permitted() {
    return false;
  },
  async requestPermission() {
    return false;
  },
  async clear() {},
  async schedule(_plan: ReturnType<typeof reminderPlan>[number]) {},
  observe(_owner: () => string | undefined, _onTap: () => void) {
    return () => {};
  },
};
