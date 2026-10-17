import { useCallback, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { ActionRow, ProductIcon } from '@/components/product-ui';
import { randomUUID } from 'expo-crypto';
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
  formatNumber,
  numeric,
  nutritionLabel,
  portionNutrition,
  totalNutrition,
  type Food,
  type Meal,
} from './nutrition-model';
import { nutritionService } from './nutrition-service';
import {
  LoadFeedback,
  NutrientSummary,
  PortionEditor,
  SaveFeedback,
  useNutritionAction,
  useNutritionLoad,
} from './nutrition-ui';
import type { NutritionView } from './diary-screen';

export function FoodPicker({
  userId,
  onSelect,
  initialMode = 'Search',
  disabled = false,
}: {
  userId: string;
  onSelect: (food: Food) => void;
  initialMode?: string;
  disabled?: boolean;
}) {
  const [input, setInput] = useState(''),
    [query, setQuery] = useState(''),
    [mode, setMode] = useState(initialMode),
    [offset, setOffset] = useState(0);
  const load = useCallback(
      () => nutritionService.search(userId, query, mode, offset),
      [userId, query, mode, offset],
    ),
    resource = useNutritionLoad(load);
  return (
    <>
      <AuthInput
        label="Search foods"
        value={input}
        onChangeText={setInput}
        maxLength={200}
        editable={!disabled}
        onSubmitEditing={() => {
          setOffset(0);
          setQuery(input);
        }}
      />
      <AuthButton
        title="Search food database"
        outlined
        disabled={disabled}
        onPress={() => {
          setOffset(0);
          setQuery(input);
          if (query === input) resource.refresh();
        }}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['Search', 'Recent', 'Frequent', 'Favorites', 'Custom', 'Recipes'].map((value) => (
            <AuthChoice
              key={value}
              title={value}
              selected={mode === value}
              disabled={disabled}
              onPress={() => {
                setMode(value);
                setOffset(0);
              }}
            />
          ))}
        </View>
      </ScrollView>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          {resource.data.length === 0 && (
            <AuthNotice>
              No matching foods. Try another term or create a custom food from its label.
            </AuthNotice>
          )}
          {resource.data.map((food) => (
            <View key={food.id}>
              <ActionRow
                title={food.name}
                disabled={disabled}
                onPress={() => onSelect(food)}
                trailing={
                  <ProductIcon
                    name={{
                      ios: 'plus.circle',
                      android: 'add_circle_outline',
                      web: 'add_circle_outline',
                    }}
                  />
                }
              />
              <AuthText>
                {nutritionLabel(food)} / {formatNumber(food.base_amount)} {food.base_unit}
              </AuthText>
              <AuthText>
                {food.kind === 'reference'
                  ? 'USDA SR Legacy · April 2018'
                  : food.kind === 'recipe'
                    ? 'Your recipe'
                    : 'Your custom food'}
              </AuthText>
            </View>
          ))}
          <View style={authStyles.row}>
            <AuthLink
              title="Previous food page"
              disabled={disabled || offset === 0}
              onPress={() => setOffset((value) => Math.max(0, value - 24))}
            />
            <AuthText>Page {offset / 24 + 1}</AuthText>
            <AuthLink
              title="Next food page"
              disabled={disabled || resource.data.length < 24}
              onPress={() => setOffset((value) => value + 24)}
            />
          </View>
        </>
      )}
    </>
  );
}
export function FoodSearchScreen({
  userId,
  date,
  meal,
  onBack,
  onOpen,
  initialMode = 'Search',
}: {
  userId: string;
  date: string;
  meal: Meal;
  onBack: () => void;
  onOpen: (view: NutritionView, foodId?: string) => void;
  initialMode?: string;
}) {
  return (
    <AuthFrame>
      <AuthLink title="← Nutrition" onPress={onBack} />
      <AuthText kind="title">{initialMode === 'Recipes' ? 'Your recipes' : 'Log food'}</AuthText>
      <AuthText>
        {date} · {meal}
      </AuthText>
      <AuthText>
        USDA’s historical common-food catalog and your own foods. Check the exact product or
        preparation; use its current label when it differs.
      </AuthText>
      <View style={authStyles.choices}>
        <AuthLink title="New custom food" onPress={() => onOpen('custom')} />
        <AuthLink title="New recipe" onPress={() => onOpen('recipe')} />
        <AuthLink title="Saved meals" onPress={() => onOpen('saved')} />
      </View>
      <FoodPicker
        userId={userId}
        initialMode={initialMode}
        onSelect={(food) => onOpen('portion', food.id)}
      />
    </AuthFrame>
  );
}
export function FoodPortionScreen({
  userId,
  foodId,
  date,
  meal,
  onBack,
  onOpen,
  onLogged,
}: {
  userId: string;
  foodId: string;
  date: string;
  meal: Meal;
  onBack: () => void;
  onOpen: (view: NutritionView, foodId?: string) => void;
  onLogged: () => void;
}) {
  const load = useCallback(async () => {
    const [context, food, favorites] = await Promise.all([
      nutritionService.context(userId),
      nutritionService.food(userId, foodId),
      nutritionService.favorites(userId),
    ]);
    return { ...context, food, favorites, diary: await nutritionService.diary(userId, date) };
  }, [userId, foodId, date]);
  const [unit, setUnit] = useState('g'),
    [quantity, setQuantity] = useState('100'),
    [favorite, setFavorite] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [id] = useState(randomUUID);
  const onLoaded = useCallback(
    (value: Awaited<ReturnType<typeof load>>) => {
      setUnit(value.food.base_unit);
      setQuantity(String(value.food.base_amount));
      setFavorite(value.favorites.includes(foodId));
    },
    [foodId],
  );
  const resource = useNutritionLoad(load, onLoaded),
    action = useNutritionAction();
  const data = resource.data;
  let preview = null;
  try {
    if (data) preview = portionNutrition(data.food, unit, numeric(quantity, 'quantity', 100000));
  } catch {}
  return (
    <AuthFrame>
      <AuthLink title="← Food search" disabled={action.locked} onPress={onBack} />
      <LoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <AuthText kind="title">{data.food.name}</AuthText>
          <AuthText>
            {date} · {meal}
          </AuthText>
          {data.food.archived ? (
            <AuthNotice>
              This food was deleted from your library. Existing diary nutrition is preserved.
            </AuthNotice>
          ) : (
            <>
              <PortionEditor
                food={data.food}
                unit={unit}
                quantity={quantity}
                onUnit={setUnit}
                onQuantity={setQuantity}
                disabled={action.locked}
                energyUnit={data.preferences.energy_unit}
              />
              {preview && (
                <NutrientSummary
                  title={`${meal} after adding this portion`}
                  values={totalNutrition([
                    ...data.diary.logs.filter((log) => log.meal === meal),
                    preview,
                  ])}
                  unit={data.preferences.energy_unit}
                />
              )}
              <AuthButton
                title={`Log to ${meal}`}
                disabled={action.locked || preview === null}
                busy={action.busy}
                onPress={() => {
                  if (preview)
                    void action.run(
                      () =>
                        nutritionService.log(
                          userId,
                          id,
                          date,
                          data.preferences.time_zone,
                          meal,
                          data.food,
                          unit,
                          numeric(quantity, 'quantity', 100000),
                        ),
                      'Food logged',
                      onLogged,
                    );
                }}
              />
              <AuthButton
                title={favorite ? 'Remove favorite' : 'Add favorite'}
                outlined
                disabled={action.locked}
                onPress={() => {
                  const next = !favorite;
                  void action.run(
                    () => nutritionService.favorite(userId, foodId, next),
                    next ? 'Favorite added' : 'Favorite removed',
                    () => setFavorite(next),
                  );
                }}
              />
              {data.food.user_id === userId && (
                <>
                  <AuthLink
                    title={data.food.kind === 'recipe' ? 'Edit recipe' : 'Edit custom food'}
                    disabled={action.locked}
                    onPress={() =>
                      onOpen(data.food.kind === 'recipe' ? 'recipe' : 'custom', foodId)
                    }
                  />
                  <AuthLink
                    title="Delete from food library"
                    disabled={action.locked}
                    onPress={() => setConfirmDelete(true)}
                  />
                  {confirmDelete && (
                    <AuthCard>
                      <AuthText>
                        Remove this food from search? Existing diary entries and saved meal
                        snapshots remain.
                      </AuthText>
                      <AuthButton
                        title="Confirm food deletion"
                        disabled={action.locked}
                        onPress={() =>
                          void action.run(
                            () => nutritionService.archive(userId, foodId),
                            'Food removed',
                            onLogged,
                          )
                        }
                      />
                      <AuthLink
                        title="Keep food"
                        disabled={action.locked}
                        onPress={() => setConfirmDelete(false)}
                      />
                    </AuthCard>
                  )}
                </>
              )}
            </>
          )}
          {data.food.kind === 'recipe' && (
            <AuthText>
              {formatNumber(data.food.recipe_servings ?? 0)} servings
              {data.food.cooked_weight_g !== null
                ? ` · ${formatNumber(data.food.cooked_weight_g)} g cooked total`
                : ' · Weigh the cooked batch to enable gram logging.'}
            </AuthText>
          )}
          {data.food.source === 'usda_sr_legacy' && (
            <AuthNotice>
              {data.food.attribution} · FDC ID {data.food.source_external_id} · {data.food.license}
            </AuthNotice>
          )}
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}
