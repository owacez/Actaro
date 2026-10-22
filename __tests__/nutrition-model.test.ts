import { expect, test } from '@jest/globals';
import {
  defaultPortion,
  energy,
  foodUnits,
  numeric,
  nutritionDate,
  portionNutrition,
  portionText,
  switchPortion,
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
test('oatmeal recipe: 70 g quick oats plus one medium banana uses measured USDA portions', () => {
  // USDA SR Legacy 172989 (Quaker Quick Oats, dry) and 173944 (Bananas, raw), per 100 g.
  const oats: Food = {
    ...food,
    name: 'Cereals, QUAKER, Quick Oats, Dry',
    calories: 371,
    protein: 13.7,
    carbs: 68.2,
    fat: 6.87,
    portions: [{ label: '0.5 cup', unit: 'cup', amount: 40 }],
  };
  const banana: Food = {
    ...food,
    name: 'Bananas, raw',
    calories: 89,
    protein: 1.09,
    carbs: 22.8,
    fat: 0.33,
    portions: [
      { label: '1 NLEA serving', unit: 'serving', amount: 126 },
      { label: '1 large (8" to 8-7/8" long)', unit: 'large', amount: 136 },
      { label: '1 medium (7" to 7-7/8" long)', unit: 'medium', amount: 118 },
    ],
  };
  // Countable foods start at one USDA medium; others at their base grams.
  expect(defaultPortion(banana)).toEqual({ unit: '2', quantity: '1' });
  expect(defaultPortion(oats)).toEqual({ unit: 'g', quantity: '100' });
  const total = totalNutrition([portionNutrition(oats, 'g', 70), portionNutrition(banana, '2', 1)]);
  expect(total.calories).toBeCloseTo(364.72, 6);
  expect(total.protein).toBeCloseTo(10.8762, 6);
  expect(total.carbs).toBeCloseTo(74.644, 6);
  expect(total.fat).toBeCloseTo(5.1984, 6);
  expect(portionText(banana, '2', 1)).toBe('1 medium (7" to 7-7/8" long) · 118 g');
  expect(portionText(banana, '2', 2)).toBe('2 × 1 medium (7" to 7-7/8" long) · 236 g');
  expect(portionText(oats, 'g', 70)).toBe('70 g');
  expect(portionText(oats, 'oz', 2)).toBe('2 oz · 56.7 g');
});
test('changing unit never turns 100 g into 100 pieces; weight units keep the same amount', () => {
  const banana: Food = { ...food, portions: [{ label: '1 medium', unit: 'medium', amount: 118 }] };
  expect(switchPortion(banana, 'g', '100', '0')).toBe('1');
  expect(switchPortion(banana, '0', '2', 'g')).toBe('236');
  expect(switchPortion(banana, 'g', '100', 'oz')).toBe('3.5');
  expect(switchPortion(banana, 'oz', '1', 'g')).toBe('28');
  expect(switchPortion(banana, '0', '', 'g')).toBe('100');
  expect(switchPortion(banana, 'g', '0.01', 'oz')).toBe('0.1');
});
