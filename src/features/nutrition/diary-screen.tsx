import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { View } from 'react-native';
import { ActionSheet, ActionRow, IconButton, ScreenHeader, Meter } from '@/components/product-ui';
import { WeekStrip } from '@/components/date-picker';
import { useAppTheme } from '@/features/profile/theme-context';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import {
  energy,
  formatNumber,
  meals,
  numeric,
  nutritionDate,
  nutritionLabel,
  previousDate,
  totalNutrition,
  type FoodLog,
  type Meal,
} from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { LoadFeedback, SaveFeedback, useNutritionAction, useNutritionLoad } from './nutrition-ui';
export type NutritionView =
  'search' | 'recipes' | 'portion' | 'targets' | 'custom' | 'recipe' | 'saved';
export type OpenNutrition = (
  view: NutritionView,
  date: string,
  meal: Meal,
  foodId?: string,
) => void;
export function DiaryScreen({ userId, onOpen }: { userId: string; onOpen: OpenNutrition }) {
  const [optionsOpen, setOptionsOpen] = useState(false),
    [waterOpen, setWaterOpen] = useState(false);
  const [date, setDate] = useState(''),
    [mealMenu, setMealMenu] = useState<Meal | null>(null),
    [foodMenu, setFoodMenu] = useState<FoodLog | null>(null),
    [edit, setEdit] = useState<FoodLog | null>(null),
    [quantity, setQuantity] = useState(''),
    [water, setWater] = useState('250'),
    [waterUnit, setWaterUnit] = useState<'ml' | 'L' | 'fl oz'>('ml');
  const [remove, setRemove] = useState<{ table: 'food_logs' | 'water_logs'; id: string } | null>(
      null,
    ),
    [savingMeal, setSavingMeal] = useState<Meal | null>(null),
    [mealName, setMealName] = useState(''),
    [copyOpen, setCopyOpen] = useState(false),
    [copyDate, setCopyDate] = useState(''),
    [copyMeal, setCopyMeal] = useState<Meal | null>(null),
    [destinationMeal, setDestinationMeal] = useState<Meal>('Lunch');
  const load = useCallback(async () => {
      const context = await nutritionService.context(userId),
        selected = date || context.today;
      return { ...context, date: selected, ...(await nutritionService.diary(userId, selected)) };
    }, [userId, date]),
    resource = useNutritionLoad(load),
    action = useNutritionAction();
  const refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const { colors } = useAppTheme();
  const data = resource.data,
    unit = data?.preferences.energy_unit ?? 'kcal',
    total = totalNutrition(data?.logs ?? []);
  function open(view: NutritionView, meal: Meal = 'Lunch') {
    if (data && !action.locked) {
      setOptionsOpen(false);
      onOpen(view, data.date, meal);
    }
  }
  function validate(work: () => void) {
    try {
      work();
    } catch (reason) {
      action.setError(reason instanceof Error ? reason.message : 'Check your entries.');
    }
  }
  function copy(source: { date: string; meal?: Meal; destMeal?: Meal }) {
    if (!data) return;
    const id = randomUUID();
    void action.run(
      () => nutritionService.copy(userId, id, data.date, data.preferences.time_zone, source),
      'Food entries copied',
      () => {
        setCopyOpen(false);
        setMealMenu(null);
        setOptionsOpen(false);
        resource.refresh();
      },
    );
  }
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title="Food"
          subtitle={data?.date}
          action={
            <IconButton
              label="Food options"
              name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
              disabled={!data || action.locked}
              onPress={() => setOptionsOpen(true)}
            />
          }
        />
      }
    >
      <LoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <WeekStrip
            value={data.date}
            disabled={action.locked}
            onChange={(value) => {
              setDate(value);
              setEdit(null);
              setRemove(null);
            }}
          />
          <AuthCard>
            <AuthText kind="eyebrow">
              {data.targets && total.calories > data.targets.calories ? 'OVER TARGET' : 'REMAINING'}
            </AuthText>
            <AuthText kind="metric">
              {data.targets
                ? formatNumber(Math.abs(energy(data.targets.calories - total.calories, unit)))
                : '—'}{' '}
              {unit}
            </AuthText>
            <AuthText>
              {formatNumber(energy(total.calories, unit))} eaten
              {data.targets
                ? ' / ' + formatNumber(energy(data.targets.calories, unit)) + ' target'
                : ' · No target set'}
            </AuthText>
            <Meter
              value={total.calories}
              target={data.targets?.calories ?? 0}
              color={colors.accent}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['protein', 'carbs', 'fat'] as const).map((key) => (
                <View key={key} style={{ flex: 1, gap: 5 }}>
                  <AuthText kind="muted">{key[0].toUpperCase() + key.slice(1)}</AuthText>
                  <AuthText>
                    {formatNumber(total[key])}
                    {data.targets ? ' / ' + formatNumber(data.targets[key]) : ''} g
                  </AuthText>
                  <Meter value={total[key]} target={data.targets?.[key] ?? 0} color={colors[key]} />
                </View>
              ))}
            </View>
          </AuthCard>
          <AuthCard>
            {meals.map((meal) => {
              const items = data.logs.filter((log) => log.meal === meal);
              return (
                <View
                  key={meal}
                  style={{
                    gap: 6,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={authStyles.row}>
                    <AuthText kind="heading">{meal}</AuthText>
                    <View style={{ flexDirection: 'row' }}>
                      {items.length > 0 && (
                        <IconButton
                          label={`${meal} actions`}
                          name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
                          disabled={action.locked}
                          onPress={() => setMealMenu(meal)}
                        />
                      )}
                      <IconButton
                        name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                        label={`Add to ${meal}`}
                        disabled={action.locked}
                        onPress={() => open('search', meal)}
                      />
                    </View>
                  </View>
                  {items.length > 0 && (
                    <>
                      <AuthText>{nutritionLabel(totalNutrition(items), unit)}</AuthText>
                    </>
                  )}
                  {!items.length && <AuthText>No foods logged.</AuthText>}
                  {items.map((log) => (
                    <ActionRow
                      key={log.id}
                      title={log.food_name}
                      detail={
                        formatNumber(log.quantity) +
                        ' × ' +
                        log.portion_label +
                        ' · ' +
                        nutritionLabel(log, unit)
                      }
                      disabled={action.locked}
                      onPress={() => setFoodMenu(log)}
                    />
                  ))}
                </View>
              );
            })}
          </AuthCard>
          {edit && (
            <ActionSheet
              title="Edit food entry"
              visible
              onClose={() => {
                if (!action.locked) setEdit(null);
              }}
            >
              <AuthText kind="heading">Edit {edit.food_name}</AuthText>
              <AuthText>
                Original nutrition and portion retained: {edit.portion_label}. To choose another
                food or unit, delete this entry and add it again.
              </AuthText>
              <AuthInput
                label="Logged quantity"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                editable={!action.locked}
              />
              <AuthButton
                title="Save logged quantity"
                disabled={action.locked}
                busy={action.busy}
                onPress={() =>
                  validate(() => {
                    const amount = numeric(quantity, 'quantity', 100000);
                    if (amount * edit.portion_amount > 100000)
                      throw new Error('Portion exceeds 100,000 base units.');
                    const selected = edit;
                    void action.run(
                      () => nutritionService.editLog(userId, selected.id, amount),
                      'Food entry updated',
                      () => {
                        setEdit(null);
                        resource.refresh();
                      },
                    );
                  })
                }
              />
              <AuthLink
                title="Cancel edit"
                disabled={action.locked}
                onPress={() => setEdit(null)}
              />
              <SaveFeedback action={action} />
            </ActionSheet>
          )}
          {remove && (
            <ActionSheet
              title="Delete entry"
              visible
              onClose={() => {
                if (!action.locked) setRemove(null);
              }}
            >
              <AuthText>
                Delete this {remove.table === 'food_logs' ? 'food' : 'water'} entry?
              </AuthText>
              <AuthButton
                title="Confirm deletion"
                disabled={action.locked}
                busy={action.busy}
                onPress={() => {
                  const selected = remove;
                  void action.run(
                    () => nutritionService.remove(userId, selected.table, selected.id),
                    'Entry deleted',
                    () => {
                      setRemove(null);
                      resource.refresh();
                    },
                  );
                }}
              />
              <AuthLink
                title="Keep entry"
                disabled={action.locked}
                onPress={() => setRemove(null)}
              />
              <SaveFeedback action={action} />
            </ActionSheet>
          )}
          {savingMeal && (
            <ActionSheet
              title="Save meal"
              visible
              onClose={() => {
                if (!action.locked) setSavingMeal(null);
              }}
            >
              <AuthText kind="heading">Save {savingMeal}</AuthText>
              <AuthInput
                label="Saved meal name"
                value={mealName}
                onChangeText={setMealName}
                editable={!action.locked}
                maxLength={160}
              />
              <AuthButton
                title="Save meal template"
                disabled={action.locked}
                busy={action.busy}
                onPress={() =>
                  validate(() => {
                    if (!mealName.trim()) throw new Error('Enter a meal name.');
                    const id = randomUUID(),
                      meal = savingMeal,
                      name = mealName.trim();
                    void action.run(
                      () => nutritionService.saveMeal(userId, id, name, data.date, meal),
                      'Meal saved',
                      () => setSavingMeal(null),
                    );
                  })
                }
              />
              <AuthLink
                title="Cancel saved meal"
                disabled={action.locked}
                onPress={() => setSavingMeal(null)}
              />
              <SaveFeedback action={action} />
            </ActionSheet>
          )}
          {copyOpen && (
            <ActionSheet
              title="Copy food entries"
              visible
              onClose={() => {
                if (!action.locked) setCopyOpen(false);
              }}
            >
              <AuthInput
                label="Copy from date (YYYY-MM-DD)"
                value={copyDate}
                onChangeText={setCopyDate}
                editable={!action.locked}
              />
              <AuthText>Source meal</AuthText>
              <View style={authStyles.choices}>
                <AuthChoice
                  title="Whole day"
                  selected={copyMeal === null}
                  disabled={action.locked}
                  onPress={() => setCopyMeal(null)}
                />
                {meals.map((meal) => (
                  <AuthChoice
                    key={meal}
                    title={meal}
                    selected={copyMeal === meal}
                    disabled={action.locked}
                    onPress={() => setCopyMeal(meal)}
                  />
                ))}
              </View>
              {copyMeal && (
                <>
                  <AuthText>Destination meal</AuthText>
                  <View style={authStyles.choices}>
                    {meals.map((meal) => (
                      <AuthChoice
                        key={meal}
                        title={meal}
                        selected={destinationMeal === meal}
                        disabled={action.locked}
                        onPress={() => setDestinationMeal(meal)}
                      />
                    ))}
                  </View>
                </>
              )}
              <AuthButton
                title="Copy food entries"
                disabled={action.locked}
                onPress={() =>
                  validate(() =>
                    copy({
                      date: nutritionDate(copyDate),
                      ...(copyMeal ? { meal: copyMeal, destMeal: destinationMeal } : {}),
                    }),
                  )
                }
              />
              <SaveFeedback action={action} />
            </ActionSheet>
          )}
          <AuthCard>
            <ActionRow
              title="Hydration"
              detail={
                formatNumber(data.water.reduce((sum, row) => sum + row.amount_ml, 0)) +
                (data.targets ? ' / ' + formatNumber(data.targets.water_ml) : '') +
                ' ml'
              }
              onPress={() => setWaterOpen(true)}
            />
          </AuthCard>
          <ActionSheet
            title="Hydration"
            visible={waterOpen}
            onClose={() => {
              if (!action.locked) setWaterOpen(false);
            }}
          >
            <AuthText kind="heading">Hydration</AuthText>
            <AuthText>
              {formatNumber(data.water.reduce((sum, row) => sum + row.amount_ml, 0))} ml{' '}
              {data.targets
                ? `/ ${formatNumber(data.targets.water_ml)} ml target`
                : '· No water target set'}
            </AuthText>
            <View style={authStyles.choices}>
              {(['ml', 'L', 'fl oz'] as const).map((value) => (
                <AuthChoice
                  key={value}
                  title={value}
                  selected={waterUnit === value}
                  disabled={action.locked}
                  onPress={() => setWaterUnit(value)}
                />
              ))}
            </View>
            <AuthInput
              label="Water quantity"
              value={water}
              onChangeText={setWater}
              keyboardType="decimal-pad"
              editable={!action.locked}
            />
            <AuthText>Fluid ounces use the US measure (29.5735295625 ml).</AuthText>
            <AuthButton
              title="Log water"
              disabled={action.locked}
              busy={action.busy}
              onPress={() =>
                validate(() => {
                  const amount =
                    numeric(water, 'water quantity', 20000) *
                    (waterUnit === 'L' ? 1000 : waterUnit === 'fl oz' ? 29.5735295625 : 1);
                  if (amount < 1 || amount > 20000) throw new Error('Log between 1 and 20,000 ml.');
                  const id = randomUUID();
                  void action.run(
                    () =>
                      nutritionService.water(
                        userId,
                        id,
                        data.date,
                        data.preferences.time_zone,
                        amount,
                      ),
                    'Water logged',
                    resource.refresh,
                  );
                })
              }
            />
            {data.water.map((row) => (
              <View style={authStyles.row} key={row.id}>
                <AuthText>{formatNumber(row.amount_ml)} ml</AuthText>
                <AuthLink
                  title={`Delete water ${formatNumber(row.amount_ml)} ml`}
                  disabled={action.locked}
                  onPress={() => {
                    setWaterOpen(false);
                    setRemove({ table: 'water_logs', id: row.id });
                  }}
                />
              </View>
            ))}
            <SaveFeedback action={action} />
          </ActionSheet>
        </>
      )}
      <ActionSheet
        title="Food options"
        visible={optionsOpen}
        onClose={() => {
          if (!action.locked) setOptionsOpen(false);
        }}
      >
        <View style={authStyles.choices}>
          <AuthLink
            title="Daily targets"
            disabled={action.locked}
            onPress={() => open('targets')}
          />
          <AuthLink title="Custom foods" disabled={action.locked} onPress={() => open('custom')} />
          <AuthLink title="Recipes" disabled={action.locked} onPress={() => open('recipes')} />
          <AuthLink title="Saved meals" disabled={action.locked} onPress={() => open('saved')} />
        </View>
        <AuthButton
          title="Copy yesterday"
          outlined
          disabled={action.locked}
          onPress={() => {
            if (data) copy({ date: previousDate(data.date) });
          }}
        />
        <AuthLink
          title="Copy another meal or day"
          disabled={action.locked}
          onPress={() => {
            setOptionsOpen(false);
            setCopyOpen(!copyOpen);
            if (data) setCopyDate(previousDate(data.date));
          }}
        />
        <SaveFeedback action={action} />
      </ActionSheet>
      <ActionSheet
        title={mealMenu ?? 'Meal actions'}
        visible={!!mealMenu}
        onClose={() => {
          if (!action.locked) setMealMenu(null);
        }}
      >
        <ActionRow
          title={mealMenu ? 'Save ' + mealMenu + ' as meal' : 'Save as meal'}
          disabled={action.locked}
          onPress={() => {
            setSavingMeal(mealMenu);
            setMealName('');
            setMealMenu(null);
          }}
        />
        <ActionRow
          title={mealMenu ? 'Repeat ' + mealMenu : 'Repeat meal'}
          disabled={action.locked}
          onPress={() => {
            if (data && mealMenu) copy({ date: data.date, meal: mealMenu, destMeal: mealMenu });
          }}
        />
        <ActionRow
          title="Copy from another day"
          disabled={action.locked}
          onPress={() => {
            setCopyOpen(true);
            setCopyMeal(mealMenu);
            if (data) setCopyDate(previousDate(data.date));
            setMealMenu(null);
          }}
        />
        <SaveFeedback action={action} />
      </ActionSheet>
      <ActionSheet
        title={foodMenu?.food_name ?? 'Food entry'}
        visible={!!foodMenu}
        onClose={() => setFoodMenu(null)}
      >
        <ActionRow
          title={foodMenu ? 'Edit ' + foodMenu.food_name : 'Edit entry'}
          disabled={action.locked}
          onPress={() => {
            setEdit(foodMenu);
            setQuantity(String(foodMenu?.quantity));
            setFoodMenu(null);
          }}
        />
        <ActionRow
          title={foodMenu ? 'Delete ' + foodMenu.food_name : 'Delete entry'}
          disabled={action.locked}
          onPress={() => {
            if (foodMenu) setRemove({ table: 'food_logs', id: foodMenu.id });
            setFoodMenu(null);
          }}
        />
      </ActionSheet>
      {!edit && !remove && !savingMeal && !copyOpen && !mealMenu && !waterOpen && !optionsOpen && (
        <SaveFeedback action={action} />
      )}
    </AuthFrame>
  );
}
