import type { BodyGoal } from '@/features/nutrition/target-estimate';
// Goal targets are shared with the Daily plan screen and live with the energy estimate.
export { bodyGoals, planTargets, type BodyGoal } from '@/features/nutrition/target-estimate';

// A target weight must point the same way as the chosen goal.
export function targetWeightError(goal: BodyGoal, currentKg: number, targetKg: number | null) {
  if (targetKg === null || goal === 'maintain') return null;
  if (goal === 'lose' && targetKg >= currentKg)
    return 'For losing fat, choose a target weight below your current weight.';
  if (goal === 'gain' && targetKg <= currentKg)
    return 'For building muscle, choose a target weight above your current weight.';
  return null;
}
