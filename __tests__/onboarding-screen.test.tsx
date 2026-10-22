import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { onboardingService } from '@/features/onboarding/onboarding-service';
import { bodyService } from '@/features/body/body-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '07000000-0000-4000-8000-000000000001' }));
jest.mock('@/features/body/body-service', () => ({ bodyService: { form: jest.fn() } }));
jest.mock('@/features/onboarding/onboarding-service', () => ({
  onboardingService: { complete: jest.fn(), finish: jest.fn() },
}));
const owner = nutritionContext().preferences.user_id;
const service = jest.mocked(onboardingService);
beforeEach(() => {
  jest.mocked(bodyService.form).mockResolvedValue({
    profile: {
      id: owner,
      display_name: null,
      sex: 'male',
      date_of_birth: '1996-01-15',
      location: null,
      created_at: '',
      updated_at: '',
    },
    preferences: nutritionContext().preferences,
    today: '2026-10-22',
    day: '2026-10-22',
    weight: null,
    height: null,
  });
  service.complete.mockResolvedValue(undefined);
  service.finish.mockResolvedValue(undefined);
});
async function open() {
  const done = jest.fn();
  await render(
    <FeedbackTestRoot>
      <OnboardingScreen userId={owner} onDone={done} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Welcome to Actaro');
  return done;
}
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
test('setup collects body details and goal, previews an editable plan and saves it once', async () => {
  const done = await open();
  await press('Continue');
  // Prefilled sex and birth date; height is required.
  await press('Continue');
  expect(screen.getByText(/Enter a numeric value/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Height (cm)'), '180');
  await press('Continue');
  await fireEvent.changeText(screen.getByLabelText('Current weight (kg)'), '80');
  await fireEvent.changeText(screen.getByLabelText('Waist (cm, optional)'), '86');
  await press('Continue');
  await press('Lose fat');
  await fireEvent.changeText(screen.getByLabelText('Target weight (kg, optional)'), '85');
  await press('Continue');
  expect(screen.getByText(/below your current weight/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Target weight (kg, optional)'), '75');
  await press('Continue');
  await press('Continue');
  expect(screen.getByText('Choose your usual activity level.')).toBeTruthy();
  await press('Active');
  await press('I’m 19 or older and not pregnant or breastfeeding');
  await press('Continue');
  // Age 30 on 2026-10-22: maintenance 3,150 kcal, lose = 2,650 kcal with 128 g protein.
  expect(screen.getByText('Estimated maintenance: 3,150 kcal a day.')).toBeTruthy();
  expect(screen.getByLabelText('Calories (kcal)')).toHaveProp('value', '2650');
  expect(screen.getByLabelText('Protein (g)')).toHaveProp('value', '128');
  await press('Save my plan');
  expect(screen.getByText(/Enter a numeric daily water/)).toBeTruthy();
  expect(service.complete).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Daily water (ml)'), '2500');
  await press('Save my plan');
  await waitFor(() => expect(done).toHaveBeenCalled());
  expect(service.complete).toHaveBeenCalledTimes(1);
  expect(service.complete).toHaveBeenCalledWith(
    owner,
    nutritionContext().preferences,
    expect.objectContaining({
      units: { weight_unit: 'kg', length_unit: 'cm' },
      body: expect.objectContaining({
        date: '2026-10-22',
        weight: '80',
        height: '180',
        sex: 'male',
        birthDate: '1996-01-15',
      }),
      waist: '86',
      targets: { calories: 2650, protein: 128, carbs: 368, fat: 74, water_ml: 2500 },
      goal: {
        id: '07000000-0000-4000-8000-000000000001',
        form: expect.objectContaining({
          metric: 'body_weight',
          baseline: '80',
          target: '75',
          direction: 'at_most',
        }),
      },
    }),
  );
});
test('without eligibility confirmation the plan asks for manual targets instead of guessing', async () => {
  await open();
  await press('Continue');
  await fireEvent.changeText(screen.getByLabelText('Height (cm)'), '180');
  await press('Continue');
  await fireEvent.changeText(screen.getByLabelText('Current weight (kg)'), '80');
  await press('Continue');
  await press('Continue');
  await press('Low active');
  await press('Continue');
  expect(screen.getByText(/Confirm the general adult estimate applies to you/)).toBeTruthy();
  expect(screen.getByLabelText('Calories (kcal)')).toHaveProp('value', '');
});
test('setup can be skipped from any step without saving records', async () => {
  const done = await open();
  await press('Skip setup for now');
  await waitFor(() => expect(done).toHaveBeenCalled());
  expect(service.finish).toHaveBeenCalledWith(owner);
  expect(service.complete).not.toHaveBeenCalled();
});
