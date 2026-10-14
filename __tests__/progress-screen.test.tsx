import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProgressScreen } from '@/features/progress/progress-screen';
import { progressService } from '@/features/progress/progress-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/body/weight-progress-screen', () => ({
  WeightProgressScreen: ({ navigation }: { navigation: React.ReactNode }) => navigation,
}));
jest.mock('@/features/progress/progress-service', () => ({
  progressService: {
    nutrition: jest.fn(),
    training: jest.fn(),
    strength: jest.fn(),
    steps: jest.fn(),
    habits: jest.fn(),
    summary: jest.fn(),
  },
}));
const data = {
  logs: [],
  targets: [],
  userId: nutritionContext().preferences.user_id,
  ...nutritionContext(),
  from: '2026-10-01',
  to: '2026-10-13',
  summary: {
    count: 1,
    calendarDays: 13,
    days: [
      {
        date: '2026-10-01',
        calories: 500,
        protein: 50,
        carbs: 20,
        fat: 5,
        target: null,
        adherence: null,
        proteinReached: null,
      },
    ],
    total: { calories: 500, protein: 50, carbs: 20, fat: 5 },
    average: { calories: 500, protein: 50, carbs: 20, fat: 5 },
    adherence: null,
    eligibleDays: 0,
    proteinDays: 0,
    proteinReachedDays: 0,
  },
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(progressService.nutrition).mockResolvedValue(data);
});
test('navigation opens nutrition, distinguishes unavailable targets and validates date edits before fetching', async () => {
  const onNutrition = jest.fn();
  await render(
    <FeedbackTestRoot>
      <ProgressScreen
        userId={data.preferences.user_id}
        onLog={jest.fn()}
        onNutrition={onNutrition}
      />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Nutrition' }));
  await screen.findByText('500 kcal');
  expect(screen.getAllByText('No targets')).toHaveLength(2);
  await fireEvent.press(screen.getByRole('button', { name: '7D' }));
  await waitFor(() =>
    expect(progressService.nutrition).toHaveBeenLastCalledWith(
      data.preferences.user_id,
      '7D',
      undefined,
    ),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Change dates' }));
  await fireEvent.changeText(screen.getByLabelText('Progress start (YYYY-MM-DD)'), '2026-10-14');
  await fireEvent.press(screen.getByRole('button', { name: 'Apply dates' }));
  expect(screen.getByText('Start date must be on or before the end date.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log or edit nutrition' }));
  expect(onNutrition).toHaveBeenCalled();
});
test('failed analytics expose retry and empty history never becomes zero intake', async () => {
  jest
    .mocked(progressService.nutrition)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({
      ...data,
      summary: { ...data.summary, count: 0, days: [], average: null },
    });
  await render(
    <FeedbackTestRoot>
      <ProgressScreen userId={data.preferences.user_id} onLog={jest.fn()} onNutrition={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Nutrition' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Retry loading' }));
  await screen.findByText(/No food logged in this period/);
  expect(screen.queryByRole('image')).toBeNull();
  expect(screen.queryByText('0 kcal')).toBeNull();
});
test('frequency and volume distinguish modes, unknown loads and actual recorded dates', async () => {
  jest.mocked(progressService.training).mockResolvedValue({
    ...data,
    overview: {
      sessions: 2,
      activeDays: 1,
      sets: 3,
      reps: 15,
      volumeKg: 625,
      unknownWeightSets: 1,
      firstDate: '2026-10-01',
      days: [
        {
          date: '2026-10-01',
          sessions: 2,
          sets: 3,
          reps: 15,
          volumeKg: 625,
          unknownWeightSets: 1,
        },
      ],
      muscles: [{ id: 'muscle', name: 'Back', sets: 3, volumeKg: 625 }],
    },
    sessions: [],
    frequency: {
      count: 2,
      activeDays: 1,
      calendarDays: 13,
      perWeek: 14 / 13,
      timed: 1,
      logOnly: 1,
      timedSeconds: 120,
    },
  });
  await render(
    <FeedbackTestRoot>
      <ProgressScreen userId={data.userId} onLog={jest.fn()} onNutrition={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Frequency' }));
  await screen.findByText('1 timed · 1 Log Only');
  expect(screen.getByText('1/13')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Volume' }));
  await screen.findByText('625 kg·reps');
  expect(screen.getByText(/Bodyweight sets with zero added load/)).toBeTruthy();
});
test('steps show distance-only records as unknown and summary toggles real weekly/monthly data', async () => {
  jest.mocked(progressService.steps).mockResolvedValue({
    ...data,
    rows: [],
    target: null,
    summary: {
      days: [
        {
          user_id: data.userId,
          local_date: data.from,
          time_zone: 'UTC',
          steps: null,
          distance_km: 2,
          steps_source: null,
          created_at: data.from,
          updated_at: data.from,
        },
      ],
      count: 0,
      calendarDays: 13,
      total: 0,
      average: null,
      best: null,
      recordedDistance: 2,
    },
  });
  jest.mocked(progressService.summary).mockResolvedValue({ ...data, weeks: [], months: [] });
  await render(
    <FeedbackTestRoot>
      <ProgressScreen userId={data.userId} onLog={jest.fn()} onNutrition={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Steps' }));
  await screen.findByText(/Steps not recorded/);
  expect(screen.getAllByText('Unavailable')).toHaveLength(3);
  await fireEvent.press(screen.getByRole('button', { name: 'Summary' }));
  await screen.findByRole('button', { name: 'Monthly' });
  await fireEvent.press(screen.getByRole('button', { name: 'Monthly' }));
  expect(screen.getByRole('button', { name: 'Monthly' }).props.accessibilityState.selected).toBe(
    true,
  );
  expect(screen.getByText(/do not establish a cause/)).toBeTruthy();
});
