import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
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
import {
  LoadFeedback,
  NutrientSummary,
  SaveFeedback,
  useNutritionAction,
  useNutritionLoad,
} from './nutrition-ui';
export type NutritionView =
  'search' | 'recipes' | 'portion' | 'targets' | 'custom' | 'recipe' | 'saved';
export type OpenNutrition = (
  view: NutritionView,
  date: string,
  meal: Meal,
  foodId?: string,
) => void;
export function DiaryScreen({ userId, onOpen }: { userId: string; onOpen: OpenNutrition }) {
  const [date, setDate] = useState(''),
    [dateInput, setDateInput] = useState(''),
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
  const data = resource.data,
    unit = data?.preferences.energy_unit ?? 'kcal',
    total = totalNutrition(data?.logs ?? []);
  function open(view: NutritionView, meal: Meal = 'Lunch') {
    if (data && !action.locked) onOpen(view, data.date, meal);
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
        resource.refresh();
      },
    );
  }
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">ACTARO</AuthText>
      <AuthText kind="title">Nutrition</AuthText>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <View style={authStyles.row}>
            <AuthText kind="heading">{data.date}</AuthText>
            <AuthLink
              title="Today"
              disabled={action.locked}
              onPress={() => {
                setDate('');
                setDateInput('');
                resource.refresh();
              }}
            />
          </View>
          <AuthInput
            label="Diary date (YYYY-MM-DD)"
            value={dateInput || data.date}
            onChangeText={setDateInput}
            editable={!action.locked}
          />
          <AuthButton
            title="Open date"
            outlined
            disabled={action.locked}
            onPress={() =>
              validate(() => {
                setDate(nutritionDate(dateInput || data.date));
                setEdit(null);
                setRemove(null);
              })
            }
          />
          <NutrientSummary title="Consumed" values={total} unit={unit} />
          {data.targets ? (
            <AuthCard>
              {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => {
                const remaining = data.targets![key] - total[key];
                return (
                  <AuthText key={key}>
                    {key === 'calories' ? 'Energy' : key[0].toUpperCase() + key.slice(1)}:{' '}
                    {formatNumber(
                      key === 'calories' ? energy(data.targets![key], unit) : data.targets![key],
                    )}{' '}
                    {key === 'calories' ? unit : 'g'} target ·{' '}
                    {formatNumber(
                      Math.abs(key === 'calories' ? energy(remaining, unit) : remaining),
                    )}{' '}
                    {key === 'calories' ? unit : 'g'} {remaining < 0 ? 'over' : 'remaining'}
                  </AuthText>
                );
              })}
            </AuthCard>
          ) : (
            <AuthNotice>No daily targets set. Food logging works without targets.</AuthNotice>
          )}
          <View style={authStyles.choices}>
            <AuthLink
              title="Daily targets"
              disabled={action.locked}
              onPress={() => open('targets')}
            />
            <AuthLink
              title="Custom foods"
              disabled={action.locked}
              onPress={() => open('custom')}
            />
            <AuthLink title="Recipes" disabled={action.locked} onPress={() => open('recipes')} />
            <AuthLink title="Saved meals" disabled={action.locked} onPress={() => open('saved')} />
          </View>
          {meals.map((meal) => {
            const items = data.logs.filter((log) => log.meal === meal);
            return (
              <AuthCard key={meal}>
                <View style={authStyles.row}>
                  <AuthText kind="heading">{meal}</AuthText>
                  <AuthLink
                    title={`Add to ${meal}`}
                    disabled={action.locked}
                    onPress={() => open('search', meal)}
                  />
                </View>
                <AuthText>{nutritionLabel(totalNutrition(items), unit)}</AuthText>
                {!items.length && <AuthText>No foods logged.</AuthText>}
                {items.map((log) => (
                  <View key={log.id}>
                    <AuthText kind="heading">{log.food_name}</AuthText>
                    <AuthText>
                      {formatNumber(log.quantity)} × {log.portion_label} ·{' '}
                      {nutritionLabel(log, unit)}
                    </AuthText>
                    <View style={authStyles.choices}>
                      <AuthLink
                        title={`Edit ${log.food_name}`}
                        disabled={action.locked}
                        onPress={() => {
                          setEdit(log);
                          setQuantity(String(log.quantity));
                          setRemove(null);
                        }}
                      />
                      <AuthLink
                        title={`Delete ${log.food_name}`}
                        disabled={action.locked}
                        onPress={() => {
                          setRemove({ table: 'food_logs', id: log.id });
                          setEdit(null);
                        }}
                      />
                    </View>
                  </View>
                ))}
                {items.length > 0 && (
                  <View style={authStyles.choices}>
                    <AuthLink
                      title={`Save ${meal} as meal`}
                      disabled={action.locked}
                      onPress={() => {
                        setSavingMeal(meal);
                        setMealName('');
                      }}
                    />
                    <AuthLink
                      title={`Repeat ${meal}`}
                      disabled={action.locked}
                      onPress={() => copy({ date: data.date, meal, destMeal: meal })}
                    />
                  </View>
                )}
              </AuthCard>
            );
          })}
          {edit && (
            <AuthCard>
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
            </AuthCard>
          )}
          {remove && (
            <AuthCard>
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
            </AuthCard>
          )}
          {savingMeal && (
            <AuthCard>
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
            </AuthCard>
          )}
          <AuthButton
            title="Copy yesterday"
            outlined
            disabled={action.locked}
            onPress={() => copy({ date: previousDate(data.date) })}
          />
          <AuthLink
            title="Copy another meal or day"
            disabled={action.locked}
            onPress={() => {
              setCopyOpen(!copyOpen);
              setCopyDate(previousDate(data.date));
            }}
          />
          {copyOpen && (
            <AuthCard>
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
            </AuthCard>
          )}
          <AuthCard>
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
                  onPress={() => setRemove({ table: 'water_logs', id: row.id })}
                />
              </View>
            ))}
          </AuthCard>
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}
