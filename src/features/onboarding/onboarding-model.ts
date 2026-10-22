import type { TargetEstimate } from '@/features/nutrition/target-estimate';

// User-chosen direction for the first plan. Adjustments are explicit, shown and editable;
// they are starting points, not promised weight change.
export const bodyGoals = [
  {
    key: 'lose',
    label: 'Lose fat',
    detail: 'A moderate deficit: 500 kcal below maintenance, or 20% if that is smaller.',
  },
  {
    key: 'maintain',
    label: 'Maintain',
    detail: 'Eat around your estimated maintenance and keep your current weight.',
  },
  {
    key: 'gain',
    label: 'Build muscle',
    detail: 'A small surplus: 300 kcal above maintenance, or 15% if that is smaller.',
  },
] as const;
export type BodyGoal = (typeof bodyGoals)[number]['key'];

// Protein of 1.6 g/kg is a common evidence-based level for keeping or building muscle
// while losing or gaining; it is capped at 35% of energy for very high bodyweights.
export function planTargets(
  maintenance: TargetEstimate,
  goal: BodyGoal,
  weightKg: number,
): TargetEstimate {
  if (goal === 'maintain') return maintenance;
  const base = maintenance.calories;
  const change = goal === 'lose' ? -Math.min(500, base * 0.2) : Math.min(300, base * 0.15);
  const calories = Math.round((base + change) / 50) * 50;
  const protein = Math.round(Math.min(1.6 * weightKg, (calories * 0.35) / 4));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { calories, protein, carbs, fat };
}

// A target weight must point the same way as the chosen goal.
export function targetWeightError(goal: BodyGoal, currentKg: number, targetKg: number | null) {
  if (targetKg === null || goal === 'maintain') return null;
  if (goal === 'lose' && targetKg >= currentKg)
    return 'For losing fat, choose a target weight below your current weight.';
  if (goal === 'gain' && targetKg <= currentKg)
    return 'For building muscle, choose a target weight above your current weight.';
  return null;
}
