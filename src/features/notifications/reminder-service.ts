import { habitService } from '@/features/habits/habit-service';
import { profileService } from '@/features/profile/profile-service';
import { requireOwner } from '@/lib/owned-data';
import { reminderDevice } from './reminder-device';
import { reminderPlan } from './reminder-model';
let owner: string | undefined,
  generation = 0,
  queue: Promise<unknown> = Promise.resolve();
export const reminderService = {
  owner: () => owner,
  setOwner(userId?: string) {
    owner = userId;
    return reminderService.refresh();
  },
  refresh() {
    const request = ++generation,
      userId = owner;
    const operation = queue
      .catch(() => undefined)
      .then(async () => {
        if (request !== generation) return 0;
        await reminderDevice.clear();
        if (!reminderDevice.supported || !userId || request !== generation) return 0;
        const preferences = await profileService.getPreferences(userId);
        if (
          !preferences.notifications_enabled ||
          !(await reminderDevice.permitted()) ||
          request !== generation
        )
          return 0;
        const plan = reminderPlan(userId, await habitService.all(userId));
        await requireOwner(userId);
        try {
          for (const item of plan) {
            if (request !== generation) {
              await reminderDevice.clear();
              return 0;
            }
            await reminderDevice.schedule(item);
          }
        } catch (failure) {
          await reminderDevice.clear();
          throw failure;
        }
        return plan.length;
      });
    queue = operation;
    return operation;
  },
};
