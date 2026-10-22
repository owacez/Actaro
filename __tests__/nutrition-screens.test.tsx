import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  FoodPicker,
  FoodPortionScreen,
  RecipeLibraryScreen,
} from '@/features/nutrition/food-screen';
import { CustomFoodScreen, RecipeScreen } from '@/features/nutrition/food-edit-screen';
import { TargetsScreen } from '@/features/nutrition/targets-screen';
import { bodyService } from '@/features/body/body-service';
import { DiaryScreen } from '@/features/nutrition/diary-screen';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext, nutritionFood, nutritionOwner } from './helpers/nutrition-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '04000000-0000-4000-8000-000000000009' }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/body/body-service', () => ({
  bodyService: { form: jest.fn(), saveForm: jest.fn() },
}));
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
test('ingredient picker searches individual foods and keeps personal recipes separately selectable', async () => {
  await render(
    <FoodPicker userId={nutritionOwner} initialMode="Ingredients" onSelect={jest.fn()} />,
    { wrapper: FeedbackTestRoot },
  );
  await waitFor(() =>
    expect(service.search).toHaveBeenCalledWith(nutritionOwner, '', 'Ingredients', 0),
  );
  expect(screen.getByText(/Individual foods for your recipe/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search foods'), 'banana');
  await fireEvent.press(screen.getByRole('button', { name: 'Search food database' }));
  await waitFor(() =>
    expect(service.search).toHaveBeenCalledWith(nutritionOwner, 'banana', 'Ingredients', 0),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Recipes' }));
  await waitFor(() =>
    expect(service.search).toHaveBeenCalledWith(nutritionOwner, 'banana', 'Recipes', 0),
  );
});
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
  jest.mocked(bodyService.form).mockResolvedValue({
    profile: {
      id: nutritionOwner,
      display_name: null,
      sex: 'male',
      date_of_birth: '1996-10-13',
      location: null,
      created_at: '',
      updated_at: '',
    },
    preferences: nutritionContext().preferences,
    day: '2026-10-13',
    today: '2026-10-13',
    weight: {
      user_id: nutritionOwner,
      local_date: '2026-10-12',
      weight_kg: 80,
      time_zone: 'UTC',
      notes: null,
      created_at: '',
      updated_at: '',
    },
    height: {
      user_id: nutritionOwner,
      measurement: 'height',
      local_date: '2026-09-01',
      value_cm: 180,
      time_zone: 'UTC',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  });
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
  expect(screen.getAllByLabelText('297 kcal · P 55.8 g · C 0 g · F 6.5 g').length).toBeGreaterThan(
    0,
  );
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
  await fireEvent.press(screen.getByRole('button', { name: 'Add to recipe' }));
  // Each ingredient shows its own calories; the combined total sits below the list.
  expect(screen.getByLabelText('Test food, 300 g, 495 kcal')).toBeTruthy();
  expect(screen.getByLabelText('Recipe total 495 kcal · P 93 g · C 0 g · F 10.8 g')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Recipe servings'), '2.5');
  await fireEvent.changeText(screen.getByLabelText('Total cooked weight (g, optional)'), '600');
  expect(screen.getByLabelText('198 kcal · P 37.2 g · C 0 g · F 4.3 g')).toBeTruthy();
  expect(screen.getByLabelText('82.5 kcal · P 15.5 g · C 0 g · F 1.8 g')).toBeTruthy();
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

test('recipe library separates creating, editing and portion logging from food search', async () => {
  const open = jest.fn();
  service.search.mockResolvedValue([{ ...nutritionFood(), kind: 'recipe', name: 'Lentil soup' }]);
  await render(
    <FeedbackTestRoot>
      <RecipeLibraryScreen
        userId={nutritionOwner}
        date="2026-10-13"
        meal="Dinner"
        onBack={jest.fn()}
        onOpen={open}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Lentil soup' });
  expect(service.search).toHaveBeenCalledWith(nutritionOwner, '', 'Recipes', 0);
  expect(screen.queryByRole('button', { name: 'Custom' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Create recipe' }));
  expect(open).toHaveBeenLastCalledWith('recipe');
  await fireEvent.press(screen.getByRole('button', { name: 'Edit Lentil soup' }));
  expect(open).toHaveBeenLastCalledWith('recipe', nutritionFood().id);
  await fireEvent.press(screen.getByRole('button', { name: 'Lentil soup' }));
  expect(open).toHaveBeenLastCalledWith('portion', nutritionFood().id);
  expect(service.log).not.toHaveBeenCalled();
});

test('recipe portion can choose a meal and does not log until confirmed', async () => {
  service.food.mockResolvedValue({ ...nutritionFood(), kind: 'recipe', recipe_servings: 4 });
  await render(
    <FeedbackTestRoot>
      <FoodPortionScreen
        userId={nutritionOwner}
        foodId={nutritionFood().id}
        date="2026-10-13"
        meal="Lunch"
        onBack={jest.fn()}
        onOpen={jest.fn()}
        onLogged={jest.fn()}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Quantity');
  expect(service.log).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Dinner' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Log to Dinner' }));
  expect(service.log).toHaveBeenCalledWith(
    nutritionOwner,
    expect.any(String),
    '2026-10-13',
    'UTC',
    'Dinner',
    expect.objectContaining({ kind: 'recipe' }),
    'g',
    100,
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
  expect(bodyService.form).not.toHaveBeenCalled();
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
test('calculation prefills saved imperial body details, preserves water, reviews before saving and converts kJ correctly', async () => {
  const preferences = {
    ...nutritionContext().preferences,
    weight_unit: 'lb',
    length_unit: 'in',
    energy_unit: 'kJ' as const,
  };
  service.context.mockResolvedValue({ ...nutritionContext(), preferences });
  const body = await bodyService.form(nutritionOwner);
  jest.mocked(bodyService.form).mockClear().mockResolvedValue(body);
  await render(
    <FeedbackTestRoot>
      <TargetsScreen userId={nutritionOwner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Water (ml)');
  await fireEvent.changeText(screen.getByLabelText('Water (ml)'), '1800');
  await fireEvent.press(screen.getByRole('button', { name: 'Calculate from my details' }));
  await screen.findByLabelText('Age (years)');
  expect(screen.getByLabelText('Age (years)').props.value).toBe('30');
  expect(Number(screen.getByLabelText('Calculation weight (lb)').props.value)).toBeCloseTo(
    176.37,
    2,
  );
  expect(Number(screen.getByLabelText('Calculation height (in)').props.value)).toBeCloseTo(
    70.866,
    2,
  );
  expect(screen.getByText('Saved weight: 2026-10-12 · Saved height: 2026-09-01')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Inactive' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Generate targets' }));
  expect(screen.getByText(/Confirm the general adult/)).toBeTruthy();
  expect(service.targets).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'This general adult estimate applies to me' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Generate targets' }));
  expect(Number(screen.getByLabelText('Energy (kJ)').props.value)).toBeCloseTo(11506);
  expect(screen.getByLabelText('Water (ml)').props.value).toBe('1800');
  expect(service.targets).not.toHaveBeenCalled();
  expect(bodyService.saveForm).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit calculation' }));
  expect(screen.getByLabelText('Age (years)').props.value).toBe('30');
  expect(bodyService.form).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Generate targets' }));
  await fireEvent.changeText(screen.getByLabelText('Energy (kJ)'), '10460');
  await fireEvent.press(screen.getByRole('button', { name: 'Save daily targets' }));
  await waitFor(() =>
    expect(service.targets).toHaveBeenCalledWith(nutritionOwner, {
      calories: 2500,
      protein: 138,
      carbs: 344,
      fat: 92,
      water_ml: 1800,
    }),
  );
});
test('missing body inputs are entered in the calculator without guessing profile data or writing it', async () => {
  const body = await bodyService.form(nutritionOwner);
  jest
    .mocked(bodyService.form)
    .mockClear()
    .mockResolvedValue({
      ...body,
      weight: null,
      height: null,
      profile: { ...body.profile, sex: 'prefer_not_to_say', date_of_birth: null },
    });
  await render(
    <FeedbackTestRoot>
      <TargetsScreen userId={nutritionOwner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Energy (kcal)');
  await fireEvent.press(screen.getByRole('button', { name: 'Calculate from my details' }));
  await screen.findByLabelText('Age (years)');
  expect(screen.getByLabelText('Age (years)').props.value).toBe('');
  expect(screen.getByRole('button', { name: 'Male equation' })).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: false }),
  );
  for (const [field, value] of [
    ['Age (years)', '30'],
    ['Calculation weight (kg)', '80'],
    ['Calculation height (cm)', '180'],
  ])
    await fireEvent.changeText(screen.getByLabelText(field), value);
  await fireEvent.press(screen.getByRole('button', { name: 'Female equation' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Inactive' }));
  await fireEvent.press(
    screen.getByRole('button', { name: 'This general adult estimate applies to me' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Generate targets' }));
  expect(screen.getByLabelText('Energy (kcal)').props.value).toBe('2350');
  expect(bodyService.saveForm).not.toHaveBeenCalled();
  expect(service.targets).not.toHaveBeenCalled();
});
test('diary shows all four empty groups and hydration validates before logging', async () => {
  service.water.mockResolvedValue(undefined);
  await render(
    <FeedbackTestRoot>
      <DiaryScreen userId={nutritionOwner} onOpen={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByText(/No target set/);
  for (const meal of ['Breakfast', 'Lunch', 'Dinner', 'Snacks'])
    expect(screen.getByRole('button', { name: 'Add to ' + meal })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Hydration' }));
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

test('food options keep a failed copy visible and retry the same request before closing', async () => {
  service.copy.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(1);
  await render(
    <FeedbackTestRoot>
      <DiaryScreen userId={nutritionOwner} onOpen={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Food options' });
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Food options' }).props.accessibilityState.disabled,
    ).toBe(false),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Food options' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Copy yesterday' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss Food options' }));
  expect(screen.getByRole('button', { name: 'Retry saved request' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Copy yesterday' })).toBeNull());
  expect(service.copy).toHaveBeenCalledTimes(2);
  expect(service.copy.mock.calls[1]).toEqual(service.copy.mock.calls[0]);
});
test('oatmeal recipe adds grams of oats then one medium banana with live per-ingredient calories', async () => {
  const oats = {
    ...nutritionFood(),
    name: 'Quick oats',
    calories: 371,
    protein: 13.7,
    carbs: 68.2,
    fat: 6.87,
    portions: [],
  };
  const banana = {
    ...nutritionFood(),
    id: '04000000-0000-4000-8000-000000000010',
    name: 'Bananas, raw',
    calories: 89,
    protein: 1.09,
    carbs: 22.8,
    fat: 0.33,
    portions: [{ label: '1 medium (7" to 7-7/8" long)', unit: 'medium', amount: 118 }],
  };
  await render(
    <FeedbackTestRoot>
      <RecipeScreen userId={nutritionOwner} onBack={jest.fn()} onSaved={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Recipe name');
  expect(screen.getByText(/No ingredients yet/)).toBeTruthy();
  service.search.mockResolvedValue([oats]);
  await fireEvent.press(screen.getByRole('button', { name: 'Add ingredient' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Quick oats' }));
  await fireEvent.changeText(await screen.findByLabelText('Quantity'), '70');
  expect(screen.getByText('Adds 259.7 kcal · recipe total 259.7 kcal')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Add to recipe' }));
  service.search.mockResolvedValue([banana]);
  await fireEvent.press(screen.getByRole('button', { name: 'Add another ingredient' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Bananas, raw' }));
  // A countable food starts at one measured medium piece, not 100 pieces.
  expect(await screen.findByLabelText('Quantity')).toHaveProp('value', '1');
  expect(screen.getByText('Adds 105 kcal · recipe total 364.7 kcal')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'g' }));
  expect(screen.getByLabelText('Quantity')).toHaveProp('value', '118');
  await fireEvent.press(
    screen.getByRole('button', { name: '1 medium (7" to 7-7/8" long) (118 g)' }),
  );
  expect(screen.getByLabelText('Quantity')).toHaveProp('value', '1');
  await fireEvent.press(screen.getByRole('button', { name: 'Add to recipe' }));
  expect(screen.getByLabelText('Quick oats, 70 g, 259.7 kcal')).toBeTruthy();
  expect(
    screen.getByLabelText('Bananas, raw, 1 medium (7" to 7-7/8" long) · 118 g, 105 kcal'),
  ).toBeTruthy();
  expect(
    screen.getByLabelText('Recipe total 364.7 kcal · P 10.9 g · C 74.6 g · F 5.2 g'),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove ingredient 1' }));
  expect(
    screen.getByLabelText('Recipe total 105 kcal · P 1.3 g · C 26.9 g · F 0.4 g'),
  ).toBeTruthy();
});
test('Food tab shows a recipes section for creating and opening recipes', async () => {
  const open = jest.fn();
  await render(
    <FeedbackTestRoot>
      <DiaryScreen userId={nutritionOwner} onOpen={open} />
    </FeedbackTestRoot>,
  );
  await screen.findByText(/No target set/);
  await fireEvent.press(screen.getByRole('button', { name: 'Create recipe' }));
  expect(open).toHaveBeenLastCalledWith('recipe', '2026-10-13', 'Lunch');
  await fireEvent.press(screen.getByRole('button', { name: 'Your recipes' }));
  expect(open).toHaveBeenLastCalledWith('recipes', '2026-10-13', 'Lunch');
});
