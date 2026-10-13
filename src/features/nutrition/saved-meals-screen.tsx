import { useCallback, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthLink,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { nutritionLabel, totalNutrition, type Meal, type Nutrients } from './nutrition-model';
import { nutritionService } from './nutrition-service';
import { LoadFeedback, SaveFeedback, useNutritionAction, useNutritionLoad } from './nutrition-ui';
import type { Json } from '@/lib/supabase/database.types';
function savedValues(items: Json): Nutrients[] {
  if (!Array.isArray(items)) throw new Error('Saved meal unavailable.');
  return items.map((item) => {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.calories !== 'number' ||
      typeof item.protein !== 'number' ||
      typeof item.carbs !== 'number' ||
      typeof item.fat !== 'number'
    )
      throw new Error('Saved meal unavailable.');
    return { calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat };
  });
}
export function SavedMealsScreen({
  userId,
  date,
  meal,
  onBack,
  onLogged,
}: {
  userId: string;
  date: string;
  meal: Meal;
  onBack: () => void;
  onLogged: () => void;
}) {
  const load = useCallback(async () => {
      const [context, rows] = await Promise.all([
        nutritionService.context(userId),
        nutritionService.savedMeals(userId),
      ]);
      return {
        ...context,
        rows: rows.map((row) => ({ ...row, total: totalNutrition(savedValues(row.items)) })),
      };
    }, [userId]),
    resource = useNutritionLoad(load),
    action = useNutritionAction(),
    [remove, setRemove] = useState<string | null>(null);
  return (
    <AuthFrame>
      <AuthLink title="← Nutrition" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">Saved meals</AuthText>
      <AuthText>
        Log to {meal} · {date}. Create a saved meal from any populated meal group in the diary.
        Snapshots retain the original ingredients and nutrition.
      </AuthText>
      <LoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          {!resource.data.rows.length && (
            <AuthNotice>
              No saved meals yet. Log foods, then select “Save as meal” in the diary.
            </AuthNotice>
          )}
          {resource.data.rows.map((row) => (
            <AuthCard key={row.id}>
              <AuthText kind="heading">{row.name}</AuthText>
              <AuthText>
                {nutritionLabel(row.total, resource.data!.preferences.energy_unit)}
              </AuthText>
              <AuthButton
                title={`Log ${row.name}`}
                disabled={action.locked}
                busy={action.busy}
                onPress={() => {
                  const id = randomUUID(),
                    zone = resource.data!.preferences.time_zone;
                  void action.run(
                    () =>
                      nutritionService.copy(userId, id, date, zone, {
                        savedMeal: row.id,
                        destMeal: meal,
                      }),
                    'Saved meal logged',
                    onLogged,
                  );
                }}
              />
              <AuthLink
                title={`Delete saved meal ${row.name}`}
                disabled={action.locked}
                onPress={() => setRemove(row.id)}
              />
              {remove === row.id && (
                <>
                  <AuthText>Delete this template? Existing diary entries remain.</AuthText>
                  <AuthButton
                    title="Confirm saved meal deletion"
                    disabled={action.locked}
                    onPress={() =>
                      void action.run(
                        () => nutritionService.remove(userId, 'saved_meals', row.id),
                        'Saved meal deleted',
                        () => {
                          setRemove(null);
                          resource.refresh();
                        },
                      )
                    }
                  />
                  <AuthLink
                    title="Keep saved meal"
                    disabled={action.locked}
                    onPress={() => setRemove(null)}
                  />
                </>
              )}
            </AuthCard>
          ))}
        </>
      )}
      <SaveFeedback action={action} />
    </AuthFrame>
  );
}
