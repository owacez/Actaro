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
    previous: null,
    waist: null,
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
test('goal editor validates a starting value and infers decreasing direction without another choice', async () => {
  const onBack = jest.fn();
  await render(
    <FeedbackTestRoot>
      <GoalEditor userId={owner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('What do you want to achieve?');
  await fireEvent.changeText(screen.getByLabelText('Goal name (optional)'), 'Weight target');
  await fireEvent.press(screen.getByRole('button', { name: 'Bodyweight' }));
  await fireEvent.changeText(screen.getByLabelText('Starting value (kg)'), '80');
  await fireEvent.changeText(screen.getByLabelText('Target (kg)'), '80');
  await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
  expect(goalService.save).not.toHaveBeenCalled();
  expect(screen.getByText('Choose a target above your starting value.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Decrease to at most' })).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Target (kg)'), '75');
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
test('weekly goals count from zero, name themselves and summarize the goal before saving', async () => {
  const onBack = jest.fn();
  await render(
    <FeedbackTestRoot>
      <GoalEditor userId={owner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('What do you want to achieve?');
  // Workouts per week is the default: no starting value, a plain summary and a generated name.
  expect(screen.queryByLabelText('Starting value (workouts)')).toBeNull();
  expect(screen.getByText('Reach 3 workouts each week.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Target (workouts)'), '4');
  expect(screen.getByText('Reach 4 workouts each week.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Bodyweight' }));
  expect(screen.getByLabelText('Starting value (kg)')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Workouts per week' }));
  await fireEvent.changeText(screen.getByLabelText('Target (workouts)'), '4');
  await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
  await waitFor(() => expect(onBack).toHaveBeenCalled());
  expect(goalService.save).toHaveBeenCalledWith(
    owner,
    expect.any(String),
    expect.objectContaining({ name: 'Workouts per week: 4 workouts', baseline: '0', target: '4' }),
  );
});
test('more goals keeps a selected uncommon goal visible and preserves hidden optional settings', async () => {
  const onBack = jest.fn();
  await render(
    <FeedbackTestRoot>
      <GoalEditor userId={owner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('What do you want to achieve?');
  expect(screen.queryByRole('button', { name: 'Daily macro adherence' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'More goals' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Daily macro adherence' }));
  await fireEvent.changeText(
    screen.getByLabelText('Goal name (optional)'),
    'Nutrition consistency',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Dates and other options' }));
  await fireEvent.changeText(screen.getByLabelText('Macro tolerance (%)'), '15');
  await fireEvent.press(screen.getByRole('button', { name: 'Hide optional settings' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer goals' }));
  expect(screen.getByRole('button', { name: 'Daily macro adherence' })).toHaveProp(
    'accessibilityState',
    expect.objectContaining({ selected: true }),
  );
  expect(screen.queryByLabelText('Macro tolerance (%)')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Save goal' }));
  await waitFor(() => expect(onBack).toHaveBeenCalled());
  expect(goalService.save).toHaveBeenCalledWith(
    owner,
    expect.any(String),
    expect.objectContaining({
      metric: 'macro_adherence_day',
      tolerance: '15',
      target: '100',
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
  await fireEvent.press(screen.getByRole('button', { name: 'Save record' }));
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
