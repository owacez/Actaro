import type { Database, Json } from '@/lib/supabase/database.types';

export type Food = Database['public']['Tables']['foods']['Row'];
export type FoodLog = Omit<Database['public']['Tables']['food_logs']['Row'], keyof Nutrients> &
  Nutrients;
export type Targets = Database['public']['Tables']['nutrition_targets']['Row'];
export type SavedMeal = Database['public']['Tables']['saved_meals']['Row'];
export type WaterLog = Database['public']['Tables']['water_logs']['Row'];
export type Nutrients = { calories: number; protein: number; carbs: number; fat: number };
export const nutrientKeys = ['calories', 'protein', 'carbs', 'fat'] as const;
export const meals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as const;
export type Meal = (typeof meals)[number];
export type Portion = { label: string; unit: string; amount: number };
export type Ingredient = { food_id: string; unit: string; quantity: number };
export const ounceGrams = 28.349523125;
export class NutritionRequestError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'NutritionRequestError';
  }
}
export function normalizeFoodLog(row: Database['public']['Tables']['food_logs']['Row']): FoodLog {
  const { calories, protein, carbs, fat } = row;
  if (
    calories === null ||
    protein === null ||
    carbs === null ||
    fat === null ||
    ![calories, protein, carbs, fat].every((value) => Number.isFinite(value) && value >= 0)
  )
    throw new Error('Diary nutrition is unavailable.');
  return { ...row, calories, protein, carbs, fat };
}

export function numeric(value: string, label: string, max: number, allowZero = false) {
  const trimmed = value.trim();
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) throw new Error(`Enter a numeric ${label}.`);
  const result = Number(trimmed);
  if (!Number.isFinite(result) || result < (allowZero ? 0 : 0.000001) || result > max)
    throw new Error(`Enter ${label} ${allowZero ? 'from 0' : 'above 0'} and up to ${max}.`);
  return result;
}
export function portions(value: Json): Portion[] {
  if (!Array.isArray(value)) throw new Error('Food portions are unavailable.');
  return value.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.label !== 'string' ||
      typeof item.unit !== 'string' ||
      typeof item.amount !== 'number' ||
      !Number.isFinite(item.amount) ||
      item.amount <= 0
    )
      throw new Error('Invalid food portion.');
    return { label: item.label, unit: item.unit, amount: item.amount };
  });
}
export function foodUnits(food: Food) {
  return [
    { key: food.base_unit, label: food.base_unit, amount: 1 },
    ...(food.base_unit === 'g' ? [{ key: 'oz', label: 'oz', amount: ounceGrams }] : []),
    ...portions(food.portions).map((portion, index) => ({
      key: String(index),
      label: `${portion.label} (${formatNumber(portion.amount)} ${food.base_unit})`,
      amount: portion.amount,
    })),
  ];
}
export function portionNutrition(food: Food, unit: string, quantity: number): Nutrients {
  const selected = foodUnits(food).find((item) => item.key === unit);
  if (
    !selected ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    quantity > 100000 ||
    selected.amount * quantity > 100000 ||
    food.base_amount <= 0
  )
    throw new Error('Choose a valid portion and quantity.');
  const factor = (selected.amount * quantity) / food.base_amount;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
  };
}
// Countable foods start at USDA's measured medium size (e.g. 1 medium banana, 118 g);
// other foods start at their base amount for direct gram entry.
export function defaultPortion(food: Food) {
  const index = portions(food.portions).findIndex((portion) => /^1 medium\b/i.test(portion.label));
  return index < 0
    ? { unit: food.base_unit, quantity: String(food.base_amount) }
    : { unit: String(index), quantity: '1' };
}
// Switching between weight units keeps the same amount; a household portion starts at one.
export function switchPortion(food: Food, from: string, quantity: string, to: string) {
  const units = foodUnits(food),
    target = units.find((item) => item.key === to);
  if (!target) return quantity;
  if (to !== food.base_unit && to !== 'oz') return '1';
  const source = units.find((item) => item.key === from),
    amount = Number(quantity.trim());
  if (!source || !quantity.trim() || !Number.isFinite(amount) || amount <= 0)
    return String(food.base_amount);
  const converted = (source.amount * amount) / target.amount,
    step = converted >= 10 ? 1 : 10;
  return String(Math.max(0.1, Math.round(converted * step) / step));
}
// Readable amount for a chosen portion, always including its weight in the base unit.
export function portionText(food: Food, unit: string, quantity: number) {
  const portion = /^\d+$/.test(unit) ? portions(food.portions)[Number(unit)] : undefined;
  if (portion)
    return `${quantity === 1 ? portion.label : `${formatNumber(quantity)} × ${portion.label}`} · ${formatNumber(portion.amount * quantity)} ${food.base_unit}`;
  return unit === 'oz'
    ? `${formatNumber(quantity)} oz · ${formatNumber(quantity * ounceGrams)} g`
    : `${formatNumber(quantity)} ${unit}`;
}
export function totalNutrition(items: readonly Nutrients[]): Nutrients {
  return items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
export function recipeNutrition(
  items: readonly Nutrients[],
  servings: number,
  cookedWeight: number | null,
) {
  if (
    !items.length ||
    !Number.isFinite(servings) ||
    servings <= 0 ||
    servings > 10000 ||
    (cookedWeight !== null &&
      (!Number.isFinite(cookedWeight) || cookedWeight <= 0 || cookedWeight > 100000))
  )
    throw new Error('Enter valid recipe servings and cooked weight.');
  const total = totalNutrition(items);
  return {
    total,
    perServing: scale(total, 1 / servings),
    per100g: cookedWeight === null ? null : scale(total, 100 / cookedWeight),
  };
}
function scale(values: Nutrients, factor: number): Nutrients {
  return {
    calories: values.calories * factor,
    protein: values.protein * factor,
    carbs: values.carbs * factor,
    fat: values.fat * factor,
  };
}
export function energy(value: number, unit: 'kcal' | 'kJ') {
  return unit === 'kJ' ? value * 4.184 : value;
}
export function formatNumber(value: number) {
  return new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value);
}
export function nutritionLabel(values: Nutrients, unit: 'kcal' | 'kJ' = 'kcal') {
  return `${formatNumber(energy(values.calories, unit))} ${unit} · P ${formatNumber(values.protein)} g · C ${formatNumber(values.carbs)} g · F ${formatNumber(values.fat)} g`;
}
export function localNutritionDate(zone: string, instant = new Date()) {
  const fields = new Intl.DateTimeFormat('en', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  return ['year', 'month', 'day']
    .map((key) => fields.find((item) => item.type === key)?.value)
    .join('-');
}
export function nutritionDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value < '1900-01-01' ||
    value > '2100-12-31' ||
    new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) !== value
  )
    throw new Error('Enter a valid date as YYYY-MM-DD.');
  return value;
}
export function previousDate(value: string) {
  const date = new Date(nutritionDate(value) + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
