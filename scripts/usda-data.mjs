import { createHash } from 'node:crypto';

export const USDA_REVISION = 'SR Legacy April 2018';
export const USDA_ATTRIBUTION =
  'U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, SR Legacy April 2018. https://fdc.nal.usda.gov/';
export const USDA_DOWNLOAD =
  'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip';

export function parseUsda(data) {
  if (!Array.isArray(data?.SRLegacyFoods) || !data.SRLegacyFoods.length)
    throw new Error('Expected USDA SR Legacy JSON');
  const ids = new Set();
  return data.SRLegacyFoods.map((food) => {
    if (!Number.isSafeInteger(food.fdcId) || food.fdcId <= 0 || ids.has(food.fdcId))
      throw new Error('Invalid or duplicate FDC ID');
    ids.add(food.fdcId);
    if (
      typeof food.description !== 'string' ||
      !food.description.trim() ||
      food.description.length > 200
    )
      throw new Error('Invalid food description');
    const nutrients = {};
    for (const [key, id, unit] of [
      ['calories', 1008, 'kcal'],
      ['protein', 1003, 'g'],
      ['carbs', 1005, 'g'],
      ['fat', 1004, 'g'],
    ]) {
      const nutrient = food.foodNutrients?.find((item) => item.nutrient?.id === id);
      if (
        nutrient?.nutrient.unitName !== unit ||
        !Number.isFinite(nutrient.amount) ||
        nutrient.amount < 0 ||
        nutrient.amount > 100000
      )
        throw new Error('Missing or invalid required nutrient; never substitute zero');
      nutrients[key] = nutrient.amount;
    }
    const portions = (food.foodPortions ?? []).map((portion) => {
      if (
        !Number.isFinite(portion.gramWeight) ||
        portion.gramWeight <= 0 ||
        portion.gramWeight > 100000
      )
        throw new Error('Invalid portion weight');
      const description =
        portion.modifier || portion.portionDescription || portion.measureUnit?.name;
      if (!description || description === 'undetermined')
        throw new Error('Missing portion description');
      const label = `${portion.amount ?? 1} ${description}`;
      if (label.length > 160) throw new Error('Oversized portion description');
      const unit =
        ['slice', 'piece', 'cup', 'tbsp', 'tsp'].find((name) =>
          new RegExp(`\\b${name}s?\\b`, 'i').test(description),
        ) ?? 'serving';
      return { label, unit, amount: portion.gramWeight };
    });
    const hex = createHash('sha256').update(`usda_sr_legacy:${food.fdcId}`).digest('hex');
    const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    return {
      id,
      user_id: null,
      name: food.description.trim(),
      kind: 'reference',
      source: 'usda_sr_legacy',
      source_external_id: String(food.fdcId),
      source_revision: USDA_REVISION,
      license: 'CC0-1.0',
      attribution: USDA_ATTRIBUTION,
      base_unit: 'g',
      base_amount: 100,
      ...nutrients,
      portions,
    };
  });
}
