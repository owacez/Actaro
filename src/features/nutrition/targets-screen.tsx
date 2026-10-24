import { NumberStepper } from '@/components/number-stepper';
import { ScreenHeader } from '@/components/product-ui';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthLink,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { energy, formatEnergy, formatNumber, numeric } from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { LoadFeedback, SaveFeedback, useNutritionAction, useNutritionLoad } from './nutrition-ui';
import { TargetCalculator } from './target-calculator';
import {
  bodyGoals,
  targetMacroUrl,
  waterGuidance,
  type BodyGoal,
  type TargetEstimate,
} from './target-estimate';
type CalculatedPlan = { goal: BodyGoal; maintenance: TargetEstimate; values: TargetEstimate };
export function TargetsScreen({
  userId,
  onBack,
  onDone,
}: {
  userId: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const load = useCallback(async () => {
    const context = await nutritionService.context(userId),
      diary = await nutritionService.diary(userId, context.today);
    return { ...context, targets: diary.targets };
  }, [userId]);
  const [calories, setCalories] = useState(''),
    [protein, setProtein] = useState(''),
    [carbs, setCarbs] = useState(''),
    [fat, setFat] = useState(''),
    [water, setWater] = useState(''),
    // Used when water is left blank; the calculator refines it from the equation setting.
    [waterHint, setWaterHint] = useState(() => waterGuidance(null));
  const [mode, setMode] = useState<'manual' | 'calculated'>('manual'),
    [reviewing, setReviewing] = useState(false),
    [plan, setPlan] = useState<CalculatedPlan | null>(null),
    [saved, setSaved] = useState<(TargetEstimate & { water_ml: number }) | null>(null);
  const onLoaded = useCallback((value: Awaited<ReturnType<typeof load>>) => {
    // Without a target yet, start from the calculator so saved details do the work.
    if (!value.targets) setMode('calculated');
    if (value.targets) {
      const t = value.targets;
      setCalories(String(energy(t.calories, value.preferences.energy_unit)));
      setProtein(String(t.protein));
      setCarbs(String(t.carbs));
      setFat(String(t.fat));
      setWater(String(t.water_ml));
    }
  }, []);
  const resource = useNutritionLoad(load, onLoaded),
    action = useNutritionAction();
  function save() {
    try {
      const unit = resource.data?.preferences.energy_unit ?? 'kcal';
      const values = {
        calories:
          numeric(calories, 'energy target', unit === 'kJ' ? 83680 : 20000) /
          (unit === 'kJ' ? 4.184 : 1),
        protein: numeric(protein, 'protein target', 2000, true),
        carbs: numeric(carbs, 'carbohydrate target', 3000, true),
        fat: numeric(fat, 'fat target', 1000, true),
        water_ml: water.trim() ? numeric(water, 'water target', 20000) : waterHint,
      };
      if (values.calories < 1 || values.water_ml < 1)
        throw new Error('Energy and water targets must be at least 1.');
      void action.run(
        () => nutritionService.targets(userId, values),
        'Nutrition targets saved',
        () => {
          setSaved(values);
          resource.refresh();
        },
      );
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check your targets.');
    }
  }
  if (saved)
    return (
      <PlanSummary
        saved={saved}
        plan={plan}
        unit={resource.data?.preferences.energy_unit ?? 'kcal'}
        onDone={onDone}
        onEdit={() => setSaved(null)}
      />
    );
  return (
    <AuthFrame header={<ScreenHeader title="Daily plan & targets" />}>
      <BackLink label="Back" disabled={action.locked} onPress={onBack} />
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthCard>
            <AuthText kind="eyebrow">YOUR DAILY PLAN</AuthText>
            {resource.data.targets ? (
              <>
                <AuthText kind="metric">
                  {formatEnergy(
                    resource.data.targets.calories,
                    resource.data.preferences.energy_unit,
                  )}{' '}
                  <AuthText kind="muted">{resource.data.preferences.energy_unit} a day</AuthText>
                </AuthText>
                <AuthText>
                  Protein {formatNumber(resource.data.targets.protein)} g · Carbs{' '}
                  {formatNumber(resource.data.targets.carbs)} g · Fat{' '}
                  {formatNumber(resource.data.targets.fat)} g · Water{' '}
                  {formatNumber(resource.data.targets.water_ml)} ml
                </AuthText>
              </>
            ) : (
              <AuthText>
                Not set yet. Choose a goal and activity below and your saved details work out the
                rest.
              </AuthText>
            )}
            <AuthText kind="muted">
              Changes apply from today; earlier days keep the targets they had.
            </AuthText>
          </AuthCard>
          <View style={authStyles.choices}>
            <AuthChoice
              title="Enter manually"
              selected={mode === 'manual'}
              disabled={action.locked}
              onPress={() => setMode('manual')}
            />
            <AuthChoice
              title="Calculate from my details"
              selected={mode === 'calculated'}
              disabled={action.locked}
              onPress={() => {
                setMode('calculated');
                setReviewing(false);
              }}
            />
          </View>
          {mode === 'calculated' && (
            <View style={{ display: reviewing ? 'none' : 'flex' }}>
              <TargetCalculator
                userId={userId}
                preferences={resource.data.preferences}
                disabled={action.locked}
                onGenerated={(values, chosen, maintenance, waterMl) => {
                  setPlan({ goal: chosen, maintenance, values });
                  setWaterHint(waterMl);
                  if (!water.trim()) setWater(String(waterMl));
                  const preferences = resource.data?.preferences;
                  if (!preferences) return;
                  setCalories(String(energy(values.calories, preferences.energy_unit)));
                  setProtein(String(values.protein));
                  setCarbs(String(values.carbs));
                  setFat(String(values.fat));
                  setReviewing(true);
                }}
              />
            </View>
          )}
          {(mode === 'manual' || reviewing) && (
            <>
              {plan && (
                <>
                  <AuthText kind="heading">Review your targets</AuthText>
                  <AuthText>
                    {plan.goal === 'maintain'
                      ? 'Energy estimates maintenance, rounded to 50 kcal. Macros start at 20% protein, 50% carbohydrate and 30% fat.'
                      : `${bodyGoals.find((option) => option.key === plan.goal)?.detail} Protein starts at 1.6 g per kg of bodyweight; fat is 25% of energy and carbohydrate the rest.`}{' '}
                    These are editable starting points. Water starts from adult drinking guidance.
                  </AuthText>
                  <AuthLink
                    title="About the macro starting split"
                    disabled={action.locked}
                    onPress={() => void Linking.openURL(targetMacroUrl)}
                  />
                  {mode === 'calculated' && (
                    <AuthButton
                      title="Edit calculation"
                      outlined
                      disabled={action.locked}
                      onPress={() => setReviewing(false)}
                    />
                  )}
                </>
              )}
              <NumberStepper
                label={`Energy (${resource.data.preferences.energy_unit})`}
                value={calories}
                onChange={setCalories}
                step={10}
                disabled={action.locked}
                heading
              />
              <NumberStepper
                label="Protein (g)"
                value={protein}
                onChange={setProtein}
                step={10}
                disabled={action.locked}
                heading
              />
              <NumberStepper
                label="Carbohydrates (g)"
                value={carbs}
                onChange={setCarbs}
                step={10}
                disabled={action.locked}
                heading
              />
              <NumberStepper
                label="Fat (g)"
                value={fat}
                onChange={setFat}
                step={10}
                disabled={action.locked}
                heading
              />
              <NumberStepper
                label="Water (ml, optional)"
                value={water}
                onChange={setWater}
                step={10}
                disabled={action.locked}
                heading
              />
              <AuthText kind="muted">
                Leave blank to use general guidance: about {formatNumber(waterHint)} ml of drinks a
                day for adults. Heat, exercise and medical advice can change this.
              </AuthText>
              <AuthButton
                title="Save daily targets"
                busy={action.busy}
                disabled={action.locked}
                onPress={save}
              />
            </>
          )}
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}

// Confirms the saved plan and explains where each number came from before returning home.
function PlanSummary({
  saved,
  plan,
  unit,
  onDone,
  onEdit,
}: {
  saved: TargetEstimate & { water_ml: number };
  plan: CalculatedPlan | null;
  unit: 'kcal' | 'kJ';
  onDone: () => void;
  onEdit: () => void;
}) {
  const show = (kcal: number) => `${formatEnergy(kcal, unit)} ${unit}`,
    change = plan ? plan.values.calories - plan.maintenance.calories : 0,
    goal = plan && bodyGoals.find((option) => option.key === plan.goal);
  return (
    <AuthFrame header={<ScreenHeader title="Your daily plan" />}>
      <AuthCard>
        <AuthText kind="eyebrow">DAILY PLAN SAVED</AuthText>
        <AuthText kind="metric">
          {formatEnergy(saved.calories, unit)} <AuthText kind="muted">{unit} a day</AuthText>
        </AuthText>
        <AuthText>
          Protein {formatNumber(saved.protein)} g · Carbs {formatNumber(saved.carbs)} g · Fat{' '}
          {formatNumber(saved.fat)} g · Water {formatNumber(saved.water_ml)} ml
        </AuthText>
      </AuthCard>
      <AuthCard>
        <AuthText kind="heading">How it was worked out</AuthText>
        {plan && goal ? (
          <>
            <AuthText>
              1. Maintenance: {show(plan.maintenance.calories)} a day, from the 2023 DRI equation
              with your age, height, weight and activity.
            </AuthText>
            <AuthText>
              2. Goal, {goal.label}:{' '}
              {change === 0
                ? 'no change from maintenance.'
                : `${change > 0 ? '+' : '−'}${show(Math.abs(change))}, giving ${show(plan.values.calories)}.`}
            </AuthText>
            <AuthText>
              3. Macros:{' '}
              {plan.goal === 'maintain'
                ? '20% protein, 50% carbohydrate and 30% fat of energy.'
                : 'protein 1.6 g per kg of bodyweight, fat 25% of energy, carbohydrate the rest.'}
            </AuthText>
            {Math.abs(saved.calories - plan.values.calories) >= 1 && (
              <AuthText>You then adjusted energy to {show(saved.calories)}.</AuthText>
            )}
          </>
        ) : (
          <AuthText>You entered these targets yourself.</AuthText>
        )}
        <AuthText kind="muted">
          Changes apply from today. These are starting points; adjust them as you learn what works.
        </AuthText>
      </AuthCard>
      <AuthButton title="Go to Today" onPress={onDone} />
      <AuthButton title="Edit targets" outlined onPress={onEdit} />
    </AuthFrame>
  );
}
