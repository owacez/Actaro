import type { Food } from '@/features/nutrition/nutrition-model';
export const nutritionOwner = '04000000-0000-4000-8000-000000000001';
export function nutritionFood(): Food {
  return {
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
}
export function nutritionContext() {
  return {
    today: '2026-10-13',
    preferences: {
      user_id: nutritionOwner,
      time_zone: 'UTC',
      energy_unit: 'kcal' as const,
      weight_unit: 'kg',
      length_unit: 'cm',
      distance_unit: 'km',
      theme: 'system',
      notifications_enabled: false,
      gamification_enabled: false,
      created_at: '2026-10-13T00:00:00Z',
      updated_at: '2026-10-13T00:00:00Z',
    },
  };
}
