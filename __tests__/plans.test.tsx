import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlansScreen } from '@/features/workouts/plans-screen';
import { planService, planWorkouts, type TrainingPlan } from '@/features/workouts/plan-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000002' }));
jest.mock('@/features/workouts/plan-service', () => {
  const actual = jest.requireActual<typeof import('@/features/workouts/plan-service')>(
    '@/features/workouts/plan-service',
  );
  return { ...actual, planService: { list: jest.fn(), adopt: jest.fn() } };
});
const plan: TrainingPlan = {
  id: '00000000-0000-4000-8000-000000000003',
  name: 'Bodyweight',
  goal: 'general',
  experience: 'any',
  days_per_week: 3,
  description: 'Editable template',
  source_url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
  required_equipment: [],
  schedule: ['Bodyweight A', null, 'Bodyweight A', null, 'Bodyweight A', null, null],
  workouts: [{ name: 'Bodyweight A', sets: 2, reps: 8, rest: 90, exercises: ['Squat', 'Push-up'] }],
};
const mocks = jest.mocked(planService);
const props = { userId: 'owner', onBack: jest.fn(), onAdopted: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks();
  mocks.list.mockResolvedValue([plan]);
  mocks.adopt.mockResolvedValue('00000000-0000-4000-8000-000000000002');
});
test('rejects malformed preview data instead of showing fake exercises', () => {
  expect(() => planWorkouts([{ name: 'broken', exercises: [10] }])).toThrow('preview');
  expect(
    planWorkouts([{ name: 'A', sets: 2, reps: 8, rest_seconds: 90, exercises: ['Squat'] }])[0]
      .exercises,
  ).toEqual(['Squat']);
});
test('filters, previews real targets and schedule, and keeps a stable adoption identity on failure', async () => {
  await render(
    <FeedbackTestRoot>
      <PlansScreen {...props} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Preview Bodyweight' });
  await fireEvent.press(screen.getByRole('button', { name: 'Plan filters' }));
  await fireEvent.press(screen.getByRole('button', { name: '3 days' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss Plan filters' }));
  await waitFor(() =>
    expect(mocks.list).toHaveBeenLastCalledWith('owner', expect.objectContaining({ days: 3 })),
  );
  await screen.findByRole('button', { name: 'Preview Bodyweight' });
  await fireEvent.press(screen.getByRole('button', { name: 'Preview Bodyweight' }));
  expect(screen.getByLabelText('Monday: Bodyweight A')).toBeTruthy();
  expect(screen.getByLabelText('Tuesday: Rest')).toBeTruthy();
  // Stat tiles: 2 exercises × 2 sets = 4 sets × 45 s + 3 × 90 s rest = 7.5 → ~8 min.
  expect(screen.getByLabelText('Days per week: 3 days')).toBeTruthy();
  expect(screen.getByLabelText('Session time: ~8 min')).toBeTruthy();
  expect(screen.getByLabelText('Equipment: None')).toBeTruthy();
  expect(screen.getAllByText('~8 min')).toHaveLength(2); // Tile and workout card.
  expect(screen.getByText('1. Squat')).toBeTruthy();
  expect(mocks.adopt).not.toHaveBeenCalled();
  mocks.adopt.mockRejectedValueOnce(new Error('lost response'));
  await fireEvent.press(screen.getByRole('button', { name: 'Use this plan' }));
  await screen.findByText('Unable to add plan. Retry to recover the same copy.');
  expect(props.onAdopted).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Use this plan' }));
  await waitFor(() => expect(props.onAdopted).toHaveBeenCalledTimes(1));
  expect(mocks.adopt.mock.calls[0]).toEqual(mocks.adopt.mock.calls[1]);
});
test('guards double adoption while pending and reports an empty equipment match', async () => {
  mocks.list.mockResolvedValueOnce([plan]).mockResolvedValue([]);
  await render(
    <FeedbackTestRoot>
      <PlansScreen {...props} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Preview Bodyweight' });
  await fireEvent.press(screen.getByRole('button', { name: 'Plan filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Use only my available equipment' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss Plan filters' }));
  await screen.findByText(/No plans match/);
  mocks.list.mockResolvedValue([plan]);
  await fireEvent.press(screen.getByRole('button', { name: 'Plan filters' }));
  await fireEvent.press(screen.getByRole('button', { name: 'All goals' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss Plan filters' }));
  await screen.findByRole('button', { name: 'Preview Bodyweight' });
  await fireEvent.press(screen.getByRole('button', { name: 'Preview Bodyweight' }));
  let finish: ((id: string) => void) | undefined;
  mocks.adopt.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Use this plan' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Use this plan' }));
  expect(mocks.adopt).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish?.('copy');
  });
});
