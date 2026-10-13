import { useCallback, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { View } from 'react-native';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import {
  foodUnits,
  numeric,
  portions,
  portionNutrition,
  recipeNutrition,
  type Food,
  type Ingredient,
} from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { FoodPicker } from './food-screen';
import {
  LoadFeedback,
  NutrientSummary,
  PortionEditor,
  SaveFeedback,
  useNutritionAction,
  useNutritionLoad,
} from './nutrition-ui';
import type { Json } from '@/lib/supabase/database.types';

export function CustomFoodScreen({
  userId,
  foodId,
  onBack,
  onSaved,
}: {
  userId: string;
  foodId?: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}) {
  const [id] = useState(() => foodId ?? randomUUID()),
    [name, setName] = useState(''),
    [brand, setBrand] = useState(''),
    [baseUnit, setBaseUnit] = useState<'g' | 'ml' | 'serving'>('g'),
    [baseAmount, setBaseAmount] = useState('100'),
    [calories, setCalories] = useState(''),
    [protein, setProtein] = useState(''),
    [carbs, setCarbs] = useState(''),
    [fat, setFat] = useState(''),
    [extra, setExtra] = useState<{ label: string; unit: string; amount: string }[]>([]);
  const load = useCallback(async () => {
    const context = await nutritionService.context(userId);
    const food = foodId ? await nutritionService.food(userId, foodId) : null;
    if (food && (food.user_id !== userId || food.kind !== 'custom' || food.archived))
      throw new Error('Custom food unavailable.');
    return { ...context, food };
  }, [userId, foodId]);
  const onLoaded = useCallback((value: Awaited<ReturnType<typeof load>>) => {
    const food = value.food;
    if (food) {
      setName(food.name);
      setBrand(food.brand ?? '');
      setBaseUnit(food.base_unit === 'ml' ? 'ml' : food.base_unit === 'serving' ? 'serving' : 'g');
      setBaseAmount(String(food.base_amount));
      setCalories(String(food.calories * (value.preferences.energy_unit === 'kJ' ? 4.184 : 1)));
      setProtein(String(food.protein));
      setCarbs(String(food.carbs));
      setFat(String(food.fat));
      setExtra(
        portions(food.portions).map((portion) => ({ ...portion, amount: String(portion.amount) })),
      );
    }
  }, []);
  const resource = useNutritionLoad(load, onLoaded),
    action = useNutritionAction();
  function save() {
    try {
      if (!name.trim() || name.trim().length > 200)
        throw new Error('Enter a food name of up to 200 characters.');
      const values = {
        id,
        name: name.trim(),
        brand: brand.trim() || null,
        kind: 'custom',
        source: 'user',
        base_unit: baseUnit,
        base_amount: numeric(baseAmount, 'base amount', 100000),
        calories:
          numeric(
            calories,
            'energy',
            resource.data?.preferences.energy_unit === 'kJ' ? 418400 : 100000,
            true,
          ) / (resource.data?.preferences.energy_unit === 'kJ' ? 4.184 : 1),
        protein: numeric(protein, 'protein', 100000, true),
        carbs: numeric(carbs, 'carbohydrates', 100000, true),
        fat: numeric(fat, 'fat', 100000, true),
        portions: extra.map((portion) => {
          if (!portion.label.trim()) throw new Error('Enter a label for each serving unit.');
          return {
            label: portion.label.trim(),
            unit: portion.unit,
            amount: numeric(portion.amount, 'serving equivalent', 100000),
          };
        }),
      };
      void action.run(
        () => nutritionService.custom(userId, values),
        'Custom food saved',
        () => onSaved(id),
      );
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check food values.');
    }
  }
  return (
    <AuthFrame>
      <AuthLink title="← Nutrition" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">{foodId ? 'Edit custom food' : 'New custom food'}</AuthText>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthNotice>
            Copy calories and macros from the food label for the base amount below. Enter explicit
            zeros where applicable. For a packaged serving weighing 30 g, choose g, enter 30, then
            add a serving equal to 30 g. Volume foods may use ml without assuming density.
          </AuthNotice>
          <AuthInput
            label="Food name"
            value={name}
            onChangeText={setName}
            editable={!action.locked}
            maxLength={200}
          />
          <AuthInput
            label="Brand (optional)"
            value={brand}
            onChangeText={setBrand}
            editable={!action.locked}
            maxLength={160}
          />
          <AuthText>Base unit</AuthText>
          <View style={authStyles.choices}>
            {(['g', 'ml', 'serving'] as const).map((unit) => (
              <AuthChoice
                key={unit}
                title={unit}
                selected={baseUnit === unit}
                disabled={action.locked}
                onPress={() => {
                  setBaseUnit(unit);
                  setExtra([]);
                }}
              />
            ))}
          </View>
          <AuthInput
            label="Base amount"
            value={baseAmount}
            onChangeText={setBaseAmount}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label={`Energy per base (${resource.data.preferences.energy_unit})`}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Protein per base (g)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Carbohydrates per base (g)"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Fat per base (g)"
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthText kind="heading">Food-specific servings</AuthText>
          {extra.map((portion, index) => (
            <AuthCard key={index}>
              <AuthInput
                label={`Serving ${index + 1} label`}
                value={portion.label}
                editable={!action.locked}
                maxLength={160}
                onChangeText={(label) =>
                  setExtra((values) =>
                    values.map((value, i) => (i === index ? { ...value, label } : value)),
                  )
                }
              />
              <View style={authStyles.choices}>
                {['serving', 'piece', 'slice', 'cup', 'tbsp', 'tsp', 'ml'].map((unit) => (
                  <AuthChoice
                    key={unit}
                    title={unit}
                    selected={portion.unit === unit}
                    disabled={action.locked}
                    onPress={() =>
                      setExtra((values) =>
                        values.map((value, i) => (i === index ? { ...value, unit } : value)),
                      )
                    }
                  />
                ))}
              </View>
              <AuthInput
                label={`Serving ${index + 1} equals (${baseUnit})`}
                value={portion.amount}
                editable={!action.locked}
                keyboardType="decimal-pad"
                onChangeText={(amount) =>
                  setExtra((values) =>
                    values.map((value, i) => (i === index ? { ...value, amount } : value)),
                  )
                }
              />
              <AuthLink
                title={`Remove serving ${index + 1}`}
                disabled={action.locked}
                onPress={() => setExtra((values) => values.filter((_, i) => i !== index))}
              />
            </AuthCard>
          ))}
          <AuthLink
            title="Add serving unit"
            disabled={action.locked || extra.length >= 80}
            onPress={() =>
              setExtra((values) => [...values, { label: '1 serving', unit: 'serving', amount: '' }])
            }
          />
          <AuthButton
            title="Save custom food"
            disabled={action.locked}
            busy={action.busy}
            onPress={save}
          />
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}

type Entry = { food: Food; unit: string; quantity: string };
function ingredientSnapshots(value: Json) {
  if (!Array.isArray(value)) throw new Error('Recipe ingredients unavailable.');
  return value.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.food_id !== 'string' ||
      typeof item.base_unit !== 'string' ||
      typeof item.portion_amount !== 'number' ||
      typeof item.quantity !== 'number' ||
      typeof item.portion_label !== 'string'
    )
      throw new Error('Recipe ingredient unavailable.');
    return {
      foodId: item.food_id,
      baseUnit: item.base_unit,
      amount: item.portion_amount,
      quantity: item.quantity,
      label: item.portion_label,
    };
  });
}
export function RecipeScreen({
  userId,
  foodId,
  onBack,
  onSaved,
}: {
  userId: string;
  foodId?: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}) {
  const [id] = useState(() => foodId ?? randomUUID()),
    [name, setName] = useState(''),
    [servings, setServings] = useState('1'),
    [weight, setWeight] = useState(''),
    [entries, setEntries] = useState<Entry[]>([]),
    [picker, setPicker] = useState(false),
    [selected, setSelected] = useState<Food | null>(null),
    [unit, setUnit] = useState('g'),
    [quantity, setQuantity] = useState('100'),
    [editIndex, setEditIndex] = useState<number | null>(null);
  const load = useCallback(async () => {
    const context = await nutritionService.context(userId),
      food = foodId ? await nutritionService.food(userId, foodId) : null;
    if (food && (food.user_id !== userId || food.kind !== 'recipe' || food.archived))
      throw new Error('Recipe unavailable.');
    const snapshots = food ? ingredientSnapshots(food.ingredients) : [],
      foods = await nutritionService.foods(userId, [
        ...new Set(snapshots.map((item) => item.foodId)),
      ]);
    const ingredients = snapshots.map((snapshot) => {
      const ingredient = foods.find((item) => item.id === snapshot.foodId);
      if (!ingredient || ingredient.base_unit !== snapshot.baseUnit)
        throw new Error(
          'An ingredient is unavailable. Original recipe and diary snapshots are preserved.',
        );
      const selected = foodUnits(ingredient).find(
        (item) => item.label.startsWith(snapshot.label) && item.amount === snapshot.amount,
      );
      return {
        food: ingredient,
        unit: selected?.key ?? ingredient.base_unit,
        quantity: String(selected ? snapshot.quantity : snapshot.quantity * snapshot.amount),
      };
    });
    return { ...context, food, ingredients };
  }, [userId, foodId]);
  const onLoaded = useCallback((value: Awaited<ReturnType<typeof load>>) => {
    if (value.food) {
      const food = value.food;
      setName(food.name);
      setServings(String(food.recipe_servings));
      setWeight(food.cooked_weight_g === null ? '' : String(food.cooked_weight_g));
      setEntries(value.ingredients);
    }
  }, []);
  const resource = useNutritionLoad(load, onLoaded),
    action = useNutritionAction();
  let preview = null;
  try {
    if (entries.length)
      preview = recipeNutrition(
        entries.map((entry) =>
          portionNutrition(
            entry.food,
            entry.unit,
            numeric(entry.quantity, 'ingredient quantity', 100000),
          ),
        ),
        numeric(servings, 'servings', 10000),
        weight.trim() ? numeric(weight, 'cooked weight', 100000) : null,
      );
  } catch {}
  function validate(work: () => void) {
    try {
      work();
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check your recipe.');
    }
  }
  function save() {
    validate(() => {
      if (!name.trim() || name.trim().length > 200)
        throw new Error('Enter a recipe name of up to 200 characters.');
      if (!entries.length || entries.length > 100) throw new Error('Add 1–100 ingredients.');
      const ingredients: Ingredient[] = entries.map((entry) => ({
          food_id: entry.food.id,
          unit: entry.unit,
          quantity: numeric(entry.quantity, 'ingredient quantity', 100000),
        })),
        count = numeric(servings, 'servings', 10000),
        cooked = weight.trim() ? numeric(weight, 'cooked weight', 100000) : null;
      void action.run(
        () => nutritionService.recipe(userId, id, name.trim(), ingredients, count, cooked),
        'Recipe saved',
        () => onSaved(id),
      );
    });
  }
  return (
    <AuthFrame>
      <AuthLink title="← Nutrition" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">{foodId ? 'Edit recipe' : 'New recipe'}</AuthText>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthInput
            label="Recipe name"
            value={name}
            onChangeText={setName}
            maxLength={200}
            editable={!action.locked}
          />
          <AuthText>
            Ingredients use the selected preparation and edible portion. Saving recalculates current
            ingredient nutrition; existing diary entries retain their original values.
          </AuthText>
          {entries.map((entry, index) => (
            <AuthCard key={index}>
              <AuthText kind="heading">{entry.food.name}</AuthText>
              <AuthText>
                {entry.quantity} ×{' '}
                {foodUnits(entry.food).find((item) => item.key === entry.unit)?.label}
                {entry.food.archived ? ' · Deleted food; remove or replace before saving.' : ''}
              </AuthText>
              <View style={authStyles.choices}>
                <AuthLink
                  title={`Edit ingredient ${index + 1}`}
                  disabled={action.locked}
                  onPress={() => {
                    setSelected(entry.food);
                    setUnit(entry.unit);
                    setQuantity(entry.quantity);
                    setEditIndex(index);
                    setPicker(false);
                  }}
                />
                <AuthLink
                  title={`Remove ingredient ${index + 1}`}
                  disabled={action.locked}
                  onPress={() => setEntries((values) => values.filter((_, i) => i !== index))}
                />
              </View>
            </AuthCard>
          ))}
          <AuthLink
            title="Add ingredient"
            disabled={action.locked || entries.length >= 100}
            onPress={() => {
              setPicker(true);
              setSelected(null);
              setEditIndex(null);
            }}
          />
          {picker && (
            <>
              <FoodPicker
                userId={userId}
                disabled={action.locked}
                onSelect={(food) => {
                  if (food.id === id) {
                    action.setError('A recipe cannot include itself.');
                    return;
                  }
                  setSelected(food);
                  setUnit(food.base_unit);
                  setQuantity(String(food.base_amount));
                  setPicker(false);
                }}
              />
              <AuthLink
                title="Cancel ingredient search"
                disabled={action.locked}
                onPress={() => setPicker(false)}
              />
            </>
          )}
          {selected && (
            <AuthCard>
              <AuthText kind="heading">{selected.name}</AuthText>
              <PortionEditor
                food={selected}
                unit={unit}
                quantity={quantity}
                onUnit={setUnit}
                onQuantity={setQuantity}
                disabled={action.locked}
                energyUnit={resource.data.preferences.energy_unit}
              />
              <AuthButton
                title="Use ingredient portion"
                disabled={action.locked}
                onPress={() =>
                  validate(() => {
                    const amount = numeric(quantity, 'ingredient quantity', 100000);
                    portionNutrition(selected, unit, amount);
                    const entry = { food: selected, unit, quantity: String(amount) };
                    setEntries((values) =>
                      editIndex === null
                        ? [...values, entry]
                        : values.map((value, i) => (i === editIndex ? entry : value)),
                    );
                    setSelected(null);
                    setEditIndex(null);
                  })
                }
              />
              <AuthLink
                title="Cancel ingredient portion"
                disabled={action.locked}
                onPress={() => setSelected(null)}
              />
            </AuthCard>
          )}
          <AuthInput
            label="Recipe servings"
            value={servings}
            onChangeText={setServings}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Total cooked weight (g, optional)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthNotice>
            Weigh the finished edible batch to log arbitrary grams. Without cooked weight, the
            recipe can be logged by servings only. Added water changes weight, not ingredient
            calories.
          </AuthNotice>
          {preview && (
            <>
              <NutrientSummary
                title="Recipe total"
                values={preview.total}
                unit={resource.data.preferences.energy_unit}
              />
              <NutrientSummary
                title="Per serving"
                values={preview.perServing}
                unit={resource.data.preferences.energy_unit}
              />
              {preview.per100g && (
                <NutrientSummary
                  title="Per 100 g cooked"
                  values={preview.per100g}
                  unit={resource.data.preferences.energy_unit}
                />
              )}
            </>
          )}
          <AuthButton
            title="Save recipe"
            disabled={action.locked || preview === null || selected !== null || picker}
            busy={action.busy}
            onPress={save}
          />
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}
