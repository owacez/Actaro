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
  bodyService: { history: jest.fn(), form: jest.fn(), save: jest.fn(), remove: jest.fn() },
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
  jest.mocked(bodyService.form).mockResolvedValue({
    preferences,
    today: day,
    day,
    weight: null,
    height: null,
    profile: {
      id: owner,
      display_name: null,
      sex: null,
      date_of_birth: null,
      location: null,
      created_at: '',
      updated_at: '',
    },
  });
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
  await fireEvent.press(screen.getByRole('button', { name: 'Body' }));
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
test('additional measurements still save a dated value; an uncertain write freezes inputs and exact retry', async () => {
  jest
    .mocked(bodyService.save)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(undefined);
  await render(
    <FeedbackTestRoot>
      <BodyScreen userId={owner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(await screen.findByRole('button', { name: 'Add another measurement' }));
  await screen.findByLabelText('Measurement (cm)');
  await fireEvent.changeText(screen.getByLabelText('Measurement (cm)'), '79');
  await fireEvent.press(screen.getByRole('button', { name: 'Save body record' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Measurement (cm)').props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await screen.findByText('Body record saved');
  expect(jest.mocked(bodyService.save).mock.calls[1]).toEqual(
    jest.mocked(bodyService.save).mock.calls[0],
  );
});
test('steps are read-only, distance saves preserve sensor totals, and the daily target stays in this section', async () => {
  jest
    .mocked(activityService.save)
    .mockRejectedValueOnce(new RecordRequestError('Enter distance.'))
    .mockResolvedValueOnce(undefined);
  await render(
    <FeedbackTestRoot>
      <ActivityScreen userId={owner} onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Daily steps target');
  expect(screen.queryByLabelText('Daily steps')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Read iPhone steps for today' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Save distance' }));
  await screen.findByText('Enter distance.');
  await fireEvent.changeText(screen.getByLabelText('Daily distance (km, optional)'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Save distance' }));
  await screen.findByText('Distance saved');
  expect(activityService.save).toHaveBeenLastCalledWith(owner, day, '', '0', 'km', 'UTC');
});
