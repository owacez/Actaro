import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { FoodPortionScreen } from '@/features/nutrition/food-screen';
import { CustomFoodScreen, RecipeScreen } from '@/features/nutrition/food-edit-screen';
import { TargetsScreen } from '@/features/nutrition/targets-screen';
import { DiaryScreen } from '@/features/nutrition/diary-screen';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext, nutritionFood, nutritionOwner } from './helpers/nutrition-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '04000000-0000-4000-8000-000000000009' }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/nutrition/nutrition-service', () => ({
  nutritionService: {
    context: jest.fn(),
    diary: jest.fn(),
    targets: jest.fn(),
    food: jest.fn(),
    foods: jest.fn(),
    favorites: jest.fn(),
    search: jest.fn(),
    log: jest.fn(),
    custom: jest.fn(),
    recipe: jest.fn(),
    water: jest.fn(),
    editLog: jest.fn(),
    remove: jest.fn(),
    savedMeals: jest.fn(),
    copy: jest.fn(),
    saveMeal: jest.fn(),
  },
}));
const service = jest.mocked(nutritionService);
beforeEach(() => {
  jest.clearAllMocks();
  service.context.mockResolvedValue(nutritionContext());
  service.diary.mockResolvedValue({ logs: [], water: [], targets: null });
  service.food.mockResolvedValue(nutritionFood());
  service.foods.mockResolvedValue([]);
  service.favorites.mockResolvedValue([]);
  service.search.mockResolvedValue([nutritionFood()]);
  service.log.mockResolvedValue(undefined);
  service.recipe.mockResolvedValue(undefined);
});
test('portion changes update live totals; failed save locks inputs and retries the original request', async () => {
  service.log.mockRejectedValueOnce(new Error('offline'));
  const logged = jest.fn();
  await render(
    <FeedbackTestRoot>
      <FoodPortionScreen
        userId={nutritionOwner}
        foodId={nutritionFood().id}
        date="2026-10-13"
        meal="Lunch"
        onBack={jest.fn()}
        onOpen={jest.fn()}
        onLogged={logged}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Quantity');
  await fireEvent.changeText(screen.getByLabelText('Quantity'), '180');
  expect(screen.getAllByText('297 kcal · P 55.8 g · C 0 g · F 6.5 g').length).toBeGreaterThan(0);
  await fireEvent.press(screen.getByRole('button', { name: 'Log to Lunch' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Quantity').props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(logged).toHaveBeenCalledTimes(1));
  expect(service.log).toHaveBeenCalledTimes(2);
  expect(service.log.mock.calls[1]).toEqual(service.log.mock.calls[0]);
});
test('custom packaged label supports a volume basis and explicit zero macros', async () => {
  const saved = jest.fn();
  service.custom.mockResolvedValue(nutritionFood());
  await render(
    <FeedbackTestRoot>
      <CustomFoodScreen userId={nutritionOwner} onBack={jest.fn()} onSaved={saved} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Food name');
  await fireEvent.press(screen.getByRole('button', { name: 'Save custom food' }));
  expect(service.custom).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Food name'), 'Packaged drink');
  await fireEvent.press(screen.getByRole('button', { name: 'ml' }));
  for (const [label, value] of [
    ['Base amount', '100'],
    ['Energy per base (kcal)', '60'],
    ['Protein per base (g)', '3'],
    ['Carbohydrates per base (g)', '10'],
    ['Fat per base (g)', '0'],
  ])
    await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole('button', { name: 'Save custom food' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(service.custom).toHaveBeenCalledWith(
    nutritionOwner,
    expect.objectContaining({ base_unit: 'ml', base_amount: 100, calories: 60, fat: 0 }),
  );
});
test('recipe editor sums selected ingredients, cooked weight and fractional servings', async () => {
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <RecipeScreen userId={nutritionOwner} onBack={jest.fn()} onSaved={saved} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Recipe name');
  await fireEvent.changeText(screen.getByLabelText('Recipe name'), 'Recipe');
  await fireEvent.press(screen.getByRole('button', { name: 'Add ingredient' }));
  await screen.findByRole('button', { name: 'Test food' });
  await fireEvent.press(screen.getByRole('button', { name: 'Test food' }));
  await screen.findByLabelText('Quantity');
  await fireEvent.changeText(screen.getByLabelText('Quantity'), '300');
  await fireEvent.press(screen.getByRole('button', { name: 'Use ingredient portion' }));
  await fireEvent.changeText(screen.getByLabelText('Recipe servings'), '2.5');
  await fireEvent.changeText(screen.getByLabelText('Total cooked weight (g, optional)'), '600');
  expect(screen.getByText('198 kcal · P 37.2 g · C 0 g · F 4.3 g')).toBeTruthy();
  expect(screen.getByText('82.5 kcal · P 15.5 g · C 0 g · F 1.8 g')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save recipe' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(service.recipe).toHaveBeenCalledWith(
    nutritionOwner,
    expect.any(String),
    'Recipe',
    [{ food_id: nutritionFood().id, unit: 'g', quantity: 300 }],
    2.5,
    600,
  );
});
test('targets validate before writing and kJ values normalize to kcal', async () => {
  service.context.mockResolvedValue({
    ...nutritionContext(),
    preferences: { ...nutritionContext().preferences, energy_unit: 'kJ' },
  });
  service.targets.mockResolvedValue({
    user_id: nutritionOwner,
    calories: 100,
    protein: 0,
    carbs: 0,
    fat: 0,
    water_ml: 1000,
    created_at: '2026-10-13',
    updated_at: '2026-10-13',
  });
  await render(
    <FeedbackTestRoot>
      <TargetsScreen userId={nutritionOwner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Energy (kJ)');
  await fireEvent.press(screen.getByRole('button', { name: 'Save daily targets' }));
  expect(service.targets).not.toHaveBeenCalled();
  for (const [label, value] of [
    ['Energy (kJ)', '418.4'],
    ['Protein (g)', '0'],
    ['Carbohydrates (g)', '0'],
    ['Fat (g)', '0'],
    ['Water (ml)', '1000'],
  ])
    await fireEvent.changeText(screen.getByLabelText(label), value);
  await fireEvent.press(screen.getByRole('button', { name: 'Save daily targets' }));
  await waitFor(() => expect(service.targets).toHaveBeenCalled());
  expect(service.targets.mock.calls[0][1].calories).toBeCloseTo(100);
});
test('diary shows all four empty groups and hydration validates before logging', async () => {
  service.water.mockResolvedValue(undefined);
  await render(
    <FeedbackTestRoot>
      <DiaryScreen userId={nutritionOwner} onOpen={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('No daily targets set. Food logging works without targets.');
  for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks'])
    expect(screen.getByRole('button', { name: 'Add to ' + meal })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Water quantity'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Log water' }));
  expect(service.water).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Water quantity'), '.5');
  await fireEvent.press(screen.getByRole('button', { name: 'L' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Log water' }));
  await waitFor(() =>
    expect(service.water).toHaveBeenCalledWith(
      nutritionOwner,
      expect.any(String),
      '2026-10-13',
      'UTC',
      500,
    ),
  );
});
