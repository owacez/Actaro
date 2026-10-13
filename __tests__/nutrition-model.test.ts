import { expect, test } from '@jest/globals';
import {
  energy,
  foodUnits,
  numeric,
  nutritionDate,
  portionNutrition,
  previousDate,
  recipeNutrition,
  totalNutrition,
  type Food,
} from '@/features/nutrition/nutrition-model';
const food: Food = {
  id: '04000000-0000-4000-8000-000000000003',
  user_id: null,
  name: 'Test food',
  kind: 'reference',
  source: 'usda_sr_legacy',
  source_external_id: '1',
  source_revision: 'test',
  license: 'CC0-1.0',
  attribution: 'test',
  base_unit: 'g',
  base_amount: 100,
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  portions: [{ label: '1 cup chopped', unit: 'cup', amount: 140 }],
  ingredients: [],
  recipe_servings: null,
  cooked_weight_g: null,
  brand: null,
  archived: false,
  created_at: '2026-10-13T00:00:00Z',
  updated_at: '2026-10-13T00:00:00Z',
};
test('grams, ounces and food-specific cups use the same unrounded nutrients', () => {
  expect(portionNutrition(food, 'g', 180)).toEqual({
    calories: 297,
    protein: 55.800000000000004,
    carbs: 0,
    fat: 6.48,
  });
  expect(portionNutrition(food, 'oz', 1).calories).toBeCloseTo(46.77671315625);
  expect(portionNutrition(food, '0', 2).calories).toBeCloseTo(462);
  expect(foodUnits(food).map((x) => x.key)).not.toContain('ml');
  expect(() => portionNutrition(food, 'ml', 100)).toThrow();
});
test('volume foods never assume water density; serving-only recipes cannot invent grams', () => {
  expect(
    portionNutrition({ ...food, base_unit: 'ml', calories: 60, portions: [] }, 'ml', 250).calories,
  ).toBe(150);
  expect(() =>
    portionNutrition({ ...food, base_unit: 'serving', base_amount: 1, portions: [] }, 'g', 20),
  ).toThrow();
});
test('recipe totals, fractional servings and arbitrary cooked grams are deterministic', () => {
  const result = recipeNutrition(
    [portionNutrition(food, 'g', 180), { calories: 103, protein: 4.2, carbs: 20, fat: 1 }],
    2.5,
    800,
  );
  expect(result.total.calories).toBe(400);
  expect(result.perServing.calories).toBe(160);
  expect(result.per100g?.calories).toBe(50);
  expect(totalNutrition([result.perServing, result.perServing]).calories).toBe(320);
  expect(recipeNutrition([result.total], 4, null).per100g).toBeNull();
  expect(() => recipeNutrition([], 0, 0)).toThrow();
});
test('strict numeric validation, civil dates and kcal/kJ conversion', () => {
  for (const input of ['', 'NaN', 'Infinity', '-1', '0', '1e2', '  '])
    expect(() => numeric(input, 'quantity', 100000)).toThrow();
  expect(numeric('0', 'carbs', 100, true)).toBe(0);
  expect(numeric('.5', 'quantity', 100)).toBe(0.5);
  expect(energy(100, 'kJ')).toBeCloseTo(418.4);
  expect(previousDate('2024-03-01')).toBe('2024-02-29');
  expect(() => nutritionDate('2026-02-30')).toThrow();
  expect(() => portionNutrition(food, 'g', 100001)).toThrow();
});
