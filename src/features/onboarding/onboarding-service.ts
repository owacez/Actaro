import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/lib/supabase/client';
import { recordResult, requireOwner } from '@/lib/owned-data';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { bodyService } from '@/features/body/body-service';
import { goalService } from '@/features/goals/goal-service';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { profileService } from '@/features/profile/profile-service';
import type { BodyForm } from '@/features/body/body-model';
import type { Preferences } from '@/features/profile/profile-model';
import type { GoalForm } from '@/features/goals/goal-model';
import type { TargetEstimate } from '@/features/nutrition/target-estimate';

function key(userId: string) {
  if (!validExerciseId(userId)) throw new Error('Invalid account.');
  return `actaro:onboarding:v1:${userId}`;
}
export type SetupInput = {
  units: { weight_unit: 'kg' | 'lb'; length_unit: 'cm' | 'in' };
  body: BodyForm;
  waist: string;
  targets: TargetEstimate & { water_ml: number };
  goal: { id: string; form: GoalForm } | null;
};
export const onboardingService = {
  // Setup is offered once to accounts with no targets and no weigh-ins. A device flag
  // records completion or skipping so later launches need no extra request.
  async needed(userId: string) {
    try {
      if (await AsyncStorage.getItem(key(userId))) return false;
    } catch {
      return false; // Never block the app on device storage.
    }
    await requireOwner(userId);
    const client = getSupabase();
    const [targets, weights] = await Promise.all([
      client.from('nutrition_target_history').select('user_id').eq('user_id', userId).limit(1),
      client.from('body_weights').select('user_id').eq('user_id', userId).limit(1),
    ]);
    const existing =
      recordResult(targets.data, targets.error).length +
      recordResult(weights.data, weights.error).length;
    if (existing) await onboardingService.finish(userId);
    return existing === 0;
  },
  async finish(userId: string) {
    try {
      await AsyncStorage.setItem(key(userId), 'done');
    } catch {
      // Not remembering only means the data check runs again next launch.
    }
  },
  // Each write is an upsert keyed by user/date/goal id, so a retry after a partial
  // failure repeats the same requests safely.
  async complete(userId: string, preferences: Preferences, input: SetupInput) {
    const updated = await profileService.updatePreferences(input.units, userId);
    await bodyService.saveForm(userId, input.body, updated);
    if (input.waist.trim())
      await bodyService.save(
        userId,
        'measurement',
        input.body.date,
        input.waist,
        updated.length_unit,
        preferences.time_zone,
        'waist',
        '',
      );
    await nutritionService.targets(userId, input.targets);
    if (input.goal) await goalService.save(userId, input.goal.id, input.goal.form);
    await onboardingService.finish(userId);
  },
};
