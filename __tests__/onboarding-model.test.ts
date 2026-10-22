import { expect, test } from '@jest/globals';
import { planTargets, targetWeightError } from '@/features/onboarding/onboarding-model';
import { estimateTargets } from '@/features/nutrition/target-estimate';
// 30-year-old, 180 cm, 80 kg, active: 2023 DRI EER = 3,126.3 → 3,150 kcal maintenance.
const maintenance = estimateTargets({
  age: '30',
  weightKg: 80,
  heightCm: 180,
  sex: 'male',
  activity: 'active',
  eligible: true,
});
test('maintain keeps the published estimate and its default split', () => {
  expect(maintenance.calories).toBe(3150);
  expect(planTargets(maintenance, 'maintain', 80)).toEqual(maintenance);
});
test('lose and gain apply explicit, bounded adjustments with 1.6 g/kg protein', () => {
  expect(planTargets(maintenance, 'lose', 80)).toEqual({
    calories: 2650,
    protein: 128,
    carbs: 368,
    fat: 74,
  });
  expect(planTargets(maintenance, 'gain', 80)).toEqual({
    calories: 3450,
    protein: 128,
    carbs: 519,
    fat: 96,
  });
  // Smaller bodies get a proportional change: 20% of 1,800 is less than 500.
  const small = { calories: 1800, protein: 90, carbs: 225, fat: 60 };
  expect(planTargets(small, 'lose', 50).calories).toBe(1450);
  // Protein is capped at 35% of energy for very high bodyweights.
  expect(planTargets(small, 'gain', 200).protein).toBe(Math.round((2050 * 0.35) / 4));
});
test('target weight must match the goal direction', () => {
  expect(targetWeightError('lose', 80, 85)).toMatch(/below/);
  expect(targetWeightError('gain', 80, 75)).toMatch(/above/);
  expect(targetWeightError('lose', 80, 75)).toBeNull();
  expect(targetWeightError('maintain', 80, 90)).toBeNull();
  expect(targetWeightError('gain', 80, null)).toBeNull();
});
