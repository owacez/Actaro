import { useEffect, useState } from 'react';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import {
  AuthButton,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
} from '@/features/auth/auth-components';
import { CustomFoodScreen, RecipeScreen } from '@/features/nutrition/food-edit-screen';
import {
  FoodPortionScreen,
  FoodSearchScreen,
  RecipeLibraryScreen,
} from '@/features/nutrition/food-screen';
import { SavedMealsScreen } from '@/features/nutrition/saved-meals-screen';
import { TargetsScreen } from '@/features/nutrition/targets-screen';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { meals, nutritionDate, type Meal } from '@/features/nutrition/nutrition-model';
import type { NutritionView } from '@/features/nutrition/diary-screen';
function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
export default function NutritionManageRoute() {
  const { session, recovery } = useAuth(),
    params = useLocalSearchParams<{ view?: string; date?: string; meal?: string; id?: string }>();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <NutritionManager
      key={`${session.user.id}:${single(params.view)}:${single(params.id) ?? 'new'}:${single(params.date) ?? ''}`}
      userId={session.user.id}
      view={single(params.view) ?? 'search'}
      requestedDate={single(params.date)}
      requestedMeal={single(params.meal)}
      foodId={single(params.id)}
    />
  );
}
function NutritionManager({
  userId,
  view,
  requestedDate,
  requestedMeal,
  foodId,
}: {
  userId: string;
  view: string;
  requestedDate?: string;
  requestedMeal?: string;
  foodId?: string;
}) {
  const [date, setDate] = useState(requestedDate ?? ''),
    [error, setError] = useState<string | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    if (!requestedDate)
      void nutritionService
        .context(userId)
        .then((value) => {
          if (active) {
            setDate(value.today);
            setError(null);
          }
        })
        .catch(() => {
          if (active) setError('Unable to load nutrition. Retry.');
        });
    return () => {
      active = false;
    };
  }, [userId, requestedDate, attempt]);
  const onBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)/nutrition')),
    onLogged = () => router.dismissTo('/(tabs)/nutrition');
  const meal: Meal = meals.find((value) => value === requestedMeal) ?? 'Lunch';
  const onOpen = (next: NutritionView, id?: string) =>
    router.push({
      pathname: '/nutrition/manage',
      params: { view: next, date, meal, ...(id ? { id } : {}) },
    });
  const onSaved = (id: string) =>
    router.replace({ pathname: '/nutrition/manage', params: { view: 'portion', date, meal, id } });
  if (error)
    return (
      <AuthFrame>
        <AuthNotice error>{error}</AuthNotice>
        <AuthButton title="Retry loading" onPress={() => setAttempt((value) => value + 1)} />
        <AuthLink title="← Food" onPress={onBack} />
      </AuthFrame>
    );
  if (!date)
    return (
      <AuthFrame>
        <AuthLoading>Loading nutrition…</AuthLoading>
      </AuthFrame>
    );
  try {
    nutritionDate(date);
  } catch {
    return (
      <AuthFrame>
        <AuthNotice error>Invalid diary date.</AuthNotice>
        <AuthLink title="← Food" onPress={onBack} />
      </AuthFrame>
    );
  }
  const common = { userId, date, meal, onBack };
  if (view === 'targets')
    return (
      <TargetsScreen
        userId={userId}
        onBack={onBack}
        onDone={() => router.dismissTo('/(tabs)/today')}
      />
    );
  if (view === 'custom')
    return <CustomFoodScreen userId={userId} foodId={foodId} onBack={onBack} onSaved={onSaved} />;
  if (view === 'recipe')
    return <RecipeScreen userId={userId} foodId={foodId} onBack={onBack} onSaved={onSaved} />;
  if (view === 'saved') return <SavedMealsScreen {...common} onLogged={onLogged} />;
  if (view === 'portion' && foodId)
    return <FoodPortionScreen {...common} foodId={foodId} onOpen={onOpen} onLogged={onLogged} />;
  if (view === 'recipes') return <RecipeLibraryScreen {...common} onOpen={onOpen} />;
  if (view === 'search') return <FoodSearchScreen {...common} onOpen={onOpen} />;
  return (
    <AuthFrame>
      <AuthNotice error>Nutrition screen unavailable.</AuthNotice>
      <AuthLink title="← Food" onPress={onBack} />
    </AuthFrame>
  );
}
