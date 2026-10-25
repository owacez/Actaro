import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import {
  importSummary,
  latest,
  localDate,
  workoutSummary,
  type HealthImport,
  type HealthResult,
} from '@/features/health/health-model';
import { health } from '@/features/health/health';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { bodyService } from '@/features/body/body-service';
import { onboardingService } from '@/features/onboarding/onboarding-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';

jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '07000000-0000-4000-8000-000000000001' }));
jest.mock('@/features/health/health', () => ({
  health: { source: 'Apple Health', available: jest.fn(), importForSetup: jest.fn() },
}));
jest.mock('@/features/body/body-service', () => ({ bodyService: { form: jest.fn() } }));
jest.mock('@/features/onboarding/onboarding-service', () => ({
  onboardingService: { complete: jest.fn(), finish: jest.fn() },
}));
const healthMock = jest.mocked(health),
  body = jest.mocked(bodyService),
  owner = nutritionContext().preferences.user_id;

const imported: HealthImport = {
  source: 'Apple Health',
  sex: 'male',
  birthDate: '1990-04-02',
  heightCm: 180.3,
  weight: { kg: 80, date: '2026-10-20' },
  restingHeartRate: 58.4,
  workouts: { count: 6, minutes: 280 },
};

beforeEach(() => {
  jest.clearAllMocks();
  healthMock.available.mockResolvedValue(true);
  body.form.mockResolvedValue({
    profile: {
      id: owner,
      display_name: null,
      sex: null,
      date_of_birth: null,
      location: null,
      created_at: '',
      updated_at: '',
    },
    preferences: { ...nutritionContext().preferences, weight_unit: 'lb', length_unit: 'in' },
    today: '2026-10-22',
    day: '2026-10-22',
    weight: null,
    height: null,
    previous: null,
    waist: null,
  });
  jest.mocked(onboardingService.complete).mockResolvedValue(undefined);
});

test('the newest plausible reading wins regardless of order', () => {
  const samples = [
    { at: '2026-10-01T08:00:00Z', kg: 81 },
    { at: '2026-10-20T08:00:00Z', kg: 3 },
    { at: '2026-10-18T08:00:00Z', kg: 80 },
  ];
  expect(
    latest(
      samples,
      (sample) => new Date(sample.at),
      (sample) => sample.kg,
      [25, 455],
    ),
  ).toEqual({ at: new Date('2026-10-18T08:00:00Z'), value: 80 });
  expect(
    latest(
      [],
      () => new Date(),
      () => 1,
      [0, 2],
    ),
  ).toBeNull();
});

test('workout totals skip empty durations; dates use the device calendar', () => {
  expect(workoutSummary([1800, 0, -5, Number.NaN, 2700])).toEqual({ count: 2, minutes: 75 });
  expect(localDate(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
});

test('the summary lists what was found, in the chosen weight unit', () => {
  expect(importSummary(imported, 'lb', 2.20462)).toBe(
    'Imported from Apple Health: weight 176.4 lb, height, sex, date of birth, 6 workouts in the last 30 days, resting heart rate 58 bpm.',
  );
  expect(
    importSummary(
      {
        ...imported,
        sex: null,
        birthDate: null,
        heightCm: null,
        weight: null,
        restingHeartRate: null,
        workouts: { count: 0, minutes: 0 },
      },
      'kg',
      1,
    ),
  ).toMatch(/had no matching data, or access was not allowed/);
});

async function openAboutYou() {
  await render(
    <FeedbackTestRoot>
      <OnboardingScreen userId={owner} onDone={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Welcome to Actaro');
  await fireEvent.press(screen.getByRole('button', { name: 'lb' }));
  await fireEvent.press(screen.getByRole('button', { name: 'in' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
}

test('connecting fills empty setup fields in the chosen units and shows what was read', async () => {
  healthMock.importForSetup.mockResolvedValue({ status: 'imported', data: imported });
  await openAboutYou();
  await fireEvent.changeText(screen.getByLabelText('Height (in)'), '69');
  await fireEvent.press(await screen.findByRole('button', { name: 'Connect Apple Health' }));
  await screen.findByText(/^Imported from Apple Health/);
  // Typed height is kept; sex comes from Apple Health.
  expect(screen.getByLabelText('Height (in)').props.value).toBe('69');
  expect(screen.getByRole('button', { name: 'Male' })).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: true }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Current weight (lb)').props.value).toBe('176.4'),
  );
});

test('declined or unavailable health access leaves manual entry with a clear message', async () => {
  const unavailable: HealthResult = {
    status: 'unavailable',
    reason: 'Apple Health is not available in this build. Enter your details manually.',
  };
  healthMock.importForSetup.mockResolvedValue(unavailable);
  await openAboutYou();
  await fireEvent.press(await screen.findByRole('button', { name: 'Connect Apple Health' }));
  await screen.findByText(unavailable.reason);
  expect(screen.getByLabelText('Height (in)').props.value).toBe('');
});
