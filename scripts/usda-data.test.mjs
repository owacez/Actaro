import test from 'node:test';
import assert from 'node:assert/strict';
import { parseUsda } from './usda-data.mjs';
const food = () => ({
  fdcId: 1,
  description: 'Test label',
  foodNutrients: [1008, 1003, 1005, 1004].map((id, i) => ({
    nutrient: { id, unitName: i ? 'g' : 'kcal' },
    amount: [165, 31, 0, 3.6][i],
  })),
  foodPortions: [{ amount: 1, modifier: 'cup, chopped', gramWeight: 140 }],
});
test('stable import preserves explicit zero, food-specific weights and provenance', () => {
  const a = parseUsda({ SRLegacyFoods: [food()] })[0];
  assert.equal(a.carbs, 0);
  assert.equal(a.portions[0].amount, 140);
  assert.equal(a.portions[0].unit, 'cup');
  assert.equal(a.base_amount, 100);
  assert.equal(a.id, parseUsda({ SRLegacyFoods: [food()] })[0].id);
  assert.equal(a.license, 'CC0-1.0');
});
test('missing nutrients, wrong units, duplicates and invalid portions are rejected', () => {
  for (const mutate of [
    (f) => f.foodNutrients.pop(),
    (f) => (f.foodNutrients[0].nutrient.unitName = 'kJ'),
    (f) => (f.foodPortions[0].gramWeight = 0),
  ]) {
    const f = food();
    mutate(f);
    assert.throws(() => parseUsda({ SRLegacyFoods: [f] }));
  }
  assert.throws(() => parseUsda({ SRLegacyFoods: [food(), food()] }));
});
