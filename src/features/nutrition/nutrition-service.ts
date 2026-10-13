import { getSupabase } from '@/lib/supabase/client';
import { profileService } from '@/features/profile/profile-service';
import {
  localNutritionDate,
  normalizeFoodLog,
  NutritionRequestError,
  nutritionDate,
  type Food,
  type Ingredient,
  type Meal,
  type Targets,
} from './nutrition-model';
import type { Database } from '@/lib/supabase/database.types';

async function actor(userId: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== userId)
    throw new NutritionRequestError(
      'Unable to verify your account. Reopen Nutrition or retry.',
      false,
    );
}
function checked<T>(data: T | null, error: unknown): T {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    ['22023', '23514', '23502', '23503', '23505', '42501', 'PGRST116'].includes(error.code)
  )
    throw new NutritionRequestError(
      'Nutrition request rejected. Check inputs or reload for the latest food and account data.',
      false,
    );
  if (error || data === null)
    throw new Error('Unable to load or save nutrition. Your inputs are kept; retry.');
  return data;
}
export const nutritionService = {
  async foods(userId: string, ids: string[]) {
    await actor(userId);
    if (!ids.length) return [];
    if (ids.length > 100) throw new Error('Recipe has too many ingredients.');
    const { data, error } = await getSupabase().from('foods').select('*').in('id', ids);
    return checked(data, error);
  },
  async context(userId: string) {
    const preferences = await profileService.getPreferences(userId);
    const unit = preferences.energy_unit;
    if (unit !== 'kcal' && unit !== 'kJ') throw new Error('Energy preference is unavailable.');
    const energyUnit: 'kcal' | 'kJ' = unit;
    return {
      preferences: { ...preferences, energy_unit: energyUnit },
      today: localNutritionDate(preferences.time_zone),
    };
  },
  async diary(userId: string, date: string) {
    nutritionDate(date);
    await actor(userId);
    const client = getSupabase();
    const [logs, water, targets] = await Promise.all([
      client
        .from('food_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('local_date', date)
        .order('created_at')
        .limit(1000),
      client
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('local_date', date)
        .order('created_at')
        .limit(1000),
      client
        .from('nutrition_target_history')
        .select('*')
        .eq('user_id', userId)
        .lte('effective_date', date)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (targets.error) throw new Error('Unable to load nutrition targets. Retry.');
    const foods = checked(logs.data, logs.error),
      drinks = checked(water.data, water.error);
    if (foods.length === 1000 || drinks.length === 1000)
      throw new Error(
        'This day exceeds the diary display limit. Export/review entries before continuing.',
      );
    return { logs: foods.map(normalizeFoodLog), water: drinks, targets: targets.data };
  },
  async targets(
    userId: string,
    values: Pick<Targets, 'calories' | 'protein' | 'carbs' | 'fat' | 'water_ml'>,
  ) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('nutrition_targets')
      .upsert({ user_id: userId, ...values })
      .select('*')
      .single();
    return checked(data, error);
  },
  async search(userId: string, query: string, mode: string, offset = 0) {
    await actor(userId);
    const { data, error } = await getSupabase().rpc('search_foods', {
      p_query: query.trim(),
      p_mode: mode,
      p_offset: offset,
    });
    return checked(data, error);
  },
  async food(userId: string, id: string) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('foods')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    return checked(data, error);
  },
  async log(
    userId: string,
    id: string,
    date: string,
    zone: string,
    meal: Meal,
    food: Food,
    unit: string,
    quantity: number,
  ) {
    nutritionDate(date);
    await actor(userId);
    const { data, error } = await getSupabase().rpc('save_food_log', {
      p_user_id: userId,
      p_id: id,
      p_date: date,
      p_time_zone: zone,
      p_meal: meal,
      p_food_id: food.id,
      p_unit: unit,
      p_quantity: quantity,
    });
    if (checked(data, error) !== id)
      throw new Error('Food was not acknowledged. Keep this screen open and retry.');
  },
  async editLog(userId: string, id: string, quantity: number) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('food_logs')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('id', id)
      .select('*')
      .single();
    return checked(data, error);
  },
  async remove(userId: string, table: 'food_logs' | 'water_logs' | 'saved_meals', id: string) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from(table)
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .select('id');
    checked(data, error); // Deletion retries also succeed when the owned entry is already gone.
  },
  async favorites(userId: string) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('food_favorites')
      .select('food_id')
      .eq('user_id', userId)
      .limit(1000);
    return checked(data, error).map((row) => row.food_id);
  },
  async favorite(userId: string, foodId: string, enabled: boolean) {
    await actor(userId);
    const request = enabled
      ? getSupabase().from('food_favorites').upsert({ user_id: userId, food_id: foodId })
      : getSupabase().from('food_favorites').delete().eq('user_id', userId).eq('food_id', foodId);
    const { error } = await request;
    if (error) throw new Error('Unable to update favorite. Retry.');
  },
  async custom(userId: string, values: Database['public']['Tables']['foods']['Insert']) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('foods')
      .upsert({
        ...values,
        user_id: userId,
        source: 'user',
        kind: 'custom',
        source_external_id: null,
      })
      .select('*')
      .single();
    return checked(data, error);
  },
  async archive(userId: string, id: string) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('foods')
      .update({ archived: true })
      .eq('user_id', userId)
      .eq('id', id)
      .select('id')
      .single();
    checked(data, error);
  },
  async recipe(
    userId: string,
    id: string,
    name: string,
    ingredients: Ingredient[],
    servings: number,
    weight: number | null,
  ) {
    await actor(userId);
    const { data, error } = await getSupabase().rpc('save_recipe', {
      p_user_id: userId,
      p_id: id,
      p_name: name,
      p_ingredients: ingredients,
      p_servings: servings,
      ...(weight === null ? {} : { p_cooked_weight: weight }),
    });
    if (checked(data, error) !== id) throw new Error('Recipe was not acknowledged. Retry.');
  },
  async savedMeals(userId: string) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('saved_meals')
      .select('*')
      .eq('user_id', userId)
      .order('name')
      .limit(1000);
    return checked(data, error);
  },
  async saveMeal(userId: string, id: string, name: string, date: string, meal: Meal) {
    await actor(userId);
    const { data, error } = await getSupabase().rpc('save_meal', {
      p_user_id: userId,
      p_id: id,
      p_name: name,
      p_date: nutritionDate(date),
      p_meal: meal,
    });
    if (checked(data, error) !== id) throw new Error('Saved meal was not acknowledged. Retry.');
  },
  async copy(
    userId: string,
    id: string,
    date: string,
    zone: string,
    source: { date?: string; meal?: Meal; savedMeal?: string; destMeal?: Meal },
  ) {
    await actor(userId);
    const { data, error } = await getSupabase().rpc('copy_nutrition', {
      p_user_id: userId,
      p_id: id,
      p_date: nutritionDate(date),
      p_time_zone: zone,
      ...(source.date ? { p_source_date: nutritionDate(source.date) } : {}),
      ...(source.meal ? { p_source_meal: source.meal } : {}),
      ...(source.savedMeal ? { p_saved_meal: source.savedMeal } : {}),
      ...(source.destMeal ? { p_dest_meal: source.destMeal } : {}),
    });
    return checked(data, error);
  },
  async water(userId: string, id: string, date: string, zone: string, amount: number) {
    await actor(userId);
    const { data, error } = await getSupabase()
      .from('water_logs')
      .upsert(
        {
          id,
          user_id: userId,
          local_date: nutritionDate(date),
          time_zone: zone,
          amount_ml: amount,
        },
        { onConflict: 'id' },
      )
      .select('id')
      .single();
    if (checked(data, error).id !== id) throw new Error('Water was not acknowledged. Retry.');
  },
};
