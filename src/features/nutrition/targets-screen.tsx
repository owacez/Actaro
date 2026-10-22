import { NumberStepper } from '@/components/number-stepper';
import { ScreenHeader } from '@/components/product-ui';
import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import {
  AuthButton,
  AuthChoice,
  AuthFrame,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { energy, numeric } from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { LoadFeedback, SaveFeedback, useNutritionAction, useNutritionLoad } from './nutrition-ui';
import { TargetCalculator } from './target-calculator';
import { targetMacroUrl } from './target-estimate';
export function TargetsScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const load = useCallback(async () => {
    const context = await nutritionService.context(userId),
      diary = await nutritionService.diary(userId, context.today);
    return { ...context, targets: diary.targets };
  }, [userId]);
  const [calories, setCalories] = useState(''),
    [protein, setProtein] = useState(''),
    [carbs, setCarbs] = useState(''),
    [fat, setFat] = useState(''),
    [water, setWater] = useState('');
  const [mode, setMode] = useState<'manual' | 'calculated'>('manual'),
    [reviewing, setReviewing] = useState(false),
    [generated, setGenerated] = useState(false);
  const onLoaded = useCallback((value: Awaited<ReturnType<typeof load>>) => {
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
        water_ml: numeric(water, 'water target', 20000),
      };
      if (values.calories < 1 || values.water_ml < 1)
        throw new Error('Energy and water targets must be at least 1.');
      void action.run(
        () => nutritionService.targets(userId, values),
        'Nutrition targets saved',
        resource.refresh,
      );
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check your targets.');
    }
  }
  return (
    <AuthFrame header={<ScreenHeader title="Daily targets" />}>
      <AuthLink title="← Food" disabled={action.locked} onPress={onBack} />
      <AuthNotice>
        Enter targets yourself or calculate an editable maintenance estimate. Changes apply from
        today in your saved time zone; previous dates retain their earlier targets.
      </AuthNotice>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
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
                onGenerated={(values) => {
                  const preferences = resource.data?.preferences;
                  if (!preferences) return;
                  setCalories(String(energy(values.calories, preferences.energy_unit)));
                  setProtein(String(values.protein));
                  setCarbs(String(values.carbs));
                  setFat(String(values.fat));
                  setGenerated(true);
                  setReviewing(true);
                }}
              />
            </View>
          )}
          {(mode === 'manual' || reviewing) && (
            <>
              {generated && (
                <>
                  <AuthText kind="heading">Review your targets</AuthText>
                  <AuthText>
                    Generated energy estimates maintenance needs, rounded to 50 kcal. Macros start
                    at 20% protein, 50% carbohydrate and 30% fat; these are editable defaults, not
                    individually calculated requirements. Water stays as your own goal.
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
              />
              <NumberStepper
                label="Protein (g)"
                value={protein}
                onChange={setProtein}
                step={10}
                disabled={action.locked}
              />
              <NumberStepper
                label="Carbohydrates (g)"
                value={carbs}
                onChange={setCarbs}
                step={10}
                disabled={action.locked}
              />
              <NumberStepper
                label="Fat (g)"
                value={fat}
                onChange={setFat}
                step={10}
                disabled={action.locked}
              />
              <NumberStepper
                label="Water (ml)"
                value={water}
                onChange={setWater}
                step={10}
                disabled={action.locked}
              />
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
