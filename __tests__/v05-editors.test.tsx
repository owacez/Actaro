import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GoalEditor } from '@/features/goals/goal-screens';
import { BodyScreen } from '@/features/body/body-screen';
import { ActivityScreen } from '@/features/activity/activity-screen';
import { goalService } from '@/features/goals/goal-service';
import { bodyService } from '@/features/body/body-service';
import { activityService } from '@/features/activity/activity-service';
import { RecordRequestError } from '@/lib/owned-data';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '05000000-0000-4000-8000-000000000003' }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/goals/goal-service', () => ({
  goalService: { load: jest.fn(), save: jest.fn() },
}));
jest.mock('@/features/body/body-service', () => ({
  bodyService: { history: jest.fn(), save: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/features/activity/activity-service', () => ({
  activityService: { load: jest.fn(), save: jest.fn(), target: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/features/activity/pedometer-service', () => ({ readTodaySteps: jest.fn() }));
const owner = nutritionContext().preferences.user_id,
  day = '2026-10-14';
beforeEach(() => {
  jest.clearAllMocks();
  const preferences = nutritionContext().preferences;
  jest.mocked(goalService.load).mockResolvedValue({ preferences, today: day, goal: null });
  jest
    .mocked(bodyService.history)
    .mockResolvedValue({ preferences, today: day, until: day, weights: [], measurements: [] });
  jest
    .mocked(activityService.load)
    .mockResolvedValue({ preferences, today: day, day, current: null, target: null, history: [] });
  jest.mocked(goalService.save).mockResolvedValue(undefined);
  jest.mocked(bodyService.save).mockResolvedValue(undefined);
  jest.mocked(activityService.save).mockResolvedValue(undefined);
});
test('goal editor validates baseline/direction and saves the measurable target with stable identity', async () => {
  const onBack = jest.fn();
  await render(
    <FeedbackTestRoot>
      <GoalEditor userId={owner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Goal name');
  await fireEvent.changeText(screen.getByLabelText('Goal name'), 'Weight target');
  await fireEvent.press(screen.getByRole('button', { name: 'Bodyweight' }));
  await fireEvent.changeText(screen.getByLabelText('Baseline (kg)'), '80');
  await fireEvent.changeText(screen.getByLabelText('Target (kg)'), '75');
  await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
  expect(goalService.save).not.toHaveBeenCalled();
  expect(screen.getByText(/Target must improve/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Decrease to at most' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
  await waitFor(() => expect(onBack).toHaveBeenCalled());
  expect(goalService.save).toHaveBeenCalledWith(
    owner,
    '05000000-0000-4000-8000-000000000003',
    expect.objectContaining({
      metric: 'body_weight',
      baseline: '80',
      target: '75',
      direction: 'at_most',
      start: day,
    }),
  );
});
test('body editor saves a real dated value; an uncertain write freezes inputs and exact retry', async () => {
  jest
    .mocked(bodyService.save)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(undefined);
  await render(
    <FeedbackTestRoot>
      <BodyScreen userId={owner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Bodyweight (kg)');
  await fireEvent.changeText(screen.getByLabelText('Bodyweight (kg)'), '79');
  await fireEvent.press(screen.getByRole('button', { name: 'Save body record' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Bodyweight (kg)').props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await screen.findByText('Body record saved');
  expect(jest.mocked(bodyService.save).mock.calls[1]).toEqual(
    jest.mocked(bodyService.save).mock.calls[0],
  );
});
test('activity distinguishes blank/invalid inputs from explicit zero and permits correction', async () => {
  jest
    .mocked(activityService.save)
    .mockRejectedValueOnce(new RecordRequestError('Enter steps or distance.'))
    .mockResolvedValueOnce(undefined);
  await render(
    <FeedbackTestRoot>
      <ActivityScreen userId={owner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Daily steps');
  await fireEvent.press(screen.getByRole('button', { name: 'Save steps and distance' }));
  await screen.findByText('Enter steps or distance.');
  expect(screen.getByLabelText('Daily steps').props.editable).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('Daily steps'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Save steps and distance' }));
  await screen.findByText('Activity saved');
  expect(activityService.save).toHaveBeenLastCalledWith(owner, day, '0', '', 'km', 'UTC', 'manual');
});
