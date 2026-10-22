import { nutritionDate, numeric } from './nutrition-model';

export const targetMethodUrl =
  'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/equations-estimate-energy-requirement.html';
export const targetMacroUrl =
  'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-macronutrients.html';
export const activityLevels = [
  {
    key: 'inactive',
    label: 'Inactive',
    detail: 'Usual daily tasks and light movement; the lowest activity category.',
  },
  {
    key: 'low',
    label: 'Low active',
    detail: 'Daily tasks plus about 60–80 minutes of walking at 5–7 km/h.',
  },
  {
    key: 'active',
    label: 'Active',
    detail: 'Substantial daily movement: for example walking, cycling and recreational sport.',
  },
  {
    key: 'very',
    label: 'Very active',
    detail: 'High daily movement with sustained exercise or physically demanding activity.',
  },
] as const;
// 2023 DRI adult EER, as published by Health Canada. Heights in cm, weights in kg.
const coefficients = {
  male: {
    inactive: [753.07, -10.83, 6.5, 14.1],
    low: [581.47, -10.83, 8.3, 14.94],
    active: [1004.82, -10.83, 6.52, 15.91],
    very: [-517.88, -10.83, 15.61, 19.11],
  },
  female: {
    inactive: [584.9, -7.01, 5.72, 11.71],
    low: [575.77, -7.01, 6.6, 12.14],
    active: [710.25, -7.01, 6.54, 12.34],
    very: [511.83, -7.01, 9.07, 12.56],
  },
} as const;
export function ageOnDate(birthDate: string, today: string) {
  const birth = nutritionDate(birthDate),
    day = nutritionDate(today);
  if (birth > day) throw new Error('Date of birth cannot be in the future.');
  return (
    Number(day.slice(0, 4)) - Number(birth.slice(0, 4)) - Number(day.slice(5) < birth.slice(5))
  );
}
export type TargetEstimate = { calories: number; protein: number; carbs: number; fat: number };
export function estimateTargets(input: {
  age: string;
  weightKg: number;
  heightCm: number;
  sex: string;
  activity: string;
  eligible: boolean;
}): TargetEstimate {
  const age = numeric(input.age, 'age', 120);
  if (!Number.isInteger(age) || age < 19)
    throw new Error('This estimate is for adults aged 19 or older. Use manual targets instead.');
  if (!input.eligible)
    throw new Error('Confirm the general adult estimate applies to you, or use manual targets.');
  if (input.sex !== 'male' && input.sex !== 'female')
    throw new Error('Choose a published equation setting or use manual targets.');
  const activity = activityLevels.find((level) => level.key === input.activity);
  if (!activity) throw new Error('Choose your usual activity level.');
  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg < 25 ||
    input.weightKg > 455 ||
    !Number.isFinite(input.heightCm) ||
    input.heightCm < 90 ||
    input.heightCm > 275
  )
    throw new Error(
      'Check your units: this calculator accepts 25–455 kg and 90–275 cm. Use manual targets outside that range.',
    );
  const [base, a, h, w] = coefficients[input.sex][activity.key];
  const raw = base + a * age + h * input.heightCm + w * input.weightKg;
  if (!Number.isFinite(raw) || raw < 1000 || raw > 10000)
    throw new Error('This estimate is outside the supported range. Use manual targets.');
  const calories = Math.round(raw / 50) * 50;
  // An editable 20/50/30 starting split, within adult DRI ranges; not personalized macro requirements.
  return {
    calories,
    protein: Math.round((calories * 0.2) / 4),
    carbs: Math.round((calories * 0.5) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

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
