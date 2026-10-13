import { useCallback, useState } from 'react';
import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { energy, numeric } from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { LoadFeedback, SaveFeedback, useNutritionAction, useNutritionLoad } from './nutrition-ui';
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
    <AuthFrame>
      <AuthLink title="← Nutrition" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">Daily targets</AuthText>
      <AuthNotice>
        Set your own daily targets. These are tracking goals; Actaro does not prescribe calorie
        intake. Macro targets can differ from label energy totals. Changes apply from today in your
        saved time zone; previous dates retain their earlier targets.
      </AuthNotice>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthInput
            label={`Energy (${resource.data.preferences.energy_unit})`}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Protein (g)"
            value={protein}
            onChangeText={setProtein}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Carbohydrates (g)"
            value={carbs}
            onChangeText={setCarbs}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Fat (g)"
            value={fat}
            onChangeText={setFat}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthInput
            label="Water (ml)"
            value={water}
            onChangeText={setWater}
            keyboardType="decimal-pad"
            editable={!action.locked}
          />
          <AuthButton
            title="Save daily targets"
            busy={action.busy}
            disabled={action.locked}
            onPress={save}
          />
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}
