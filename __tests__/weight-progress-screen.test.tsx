import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { WeightProgressScreen } from '@/features/body/weight-progress-screen';
import { bodyService } from '@/features/body/body-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/body/body-service', () => ({ bodyService: { progress: jest.fn() } }));
const owner = nutritionContext().preferences.user_id,
  data = {
    preferences: { ...nutritionContext().preferences, weight_unit: 'lb' },
    today: '2026-10-14',
    from: '2026-09-15',
    to: '2026-10-14',
    rows: [
      { local_date: '2026-09-20', weight_kg: 82 },
      { local_date: '2026-10-14', weight_kg: 80 },
    ],
  };
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(bodyService.progress).mockResolvedValue(data);
});
test('weight progress uses saved units, shows actual dates/gaps and validates date changes', async () => {
  const onLog = jest.fn();
  await render(
    <FeedbackTestRoot>
      <WeightProgressScreen userId={owner} onLog={onLog} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('-4.4 lb');
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('Blank positions');
  expect(screen.getByText(/Latest 176.4 lb/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Change weight dates' }));
  await fireEvent.changeText(
    screen.getByLabelText('Weight progress start (YYYY-MM-DD)'),
    '2026-10-15',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Apply weight dates' }));
  expect(screen.getByText('Start date must be on or before the end date.')).toBeTruthy();
  expect(bodyService.progress).toHaveBeenCalledTimes(1);
  await fireEvent.changeText(
    screen.getByLabelText('Weight progress start (YYYY-MM-DD)'),
    '2026-10-01',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Apply weight dates' }));
  await waitFor(() =>
    expect(bodyService.progress).toHaveBeenLastCalledWith(owner, {
      from: '2026-10-01',
      to: '2026-10-14',
    }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Log or edit bodyweight' }));
  expect(onLog).toHaveBeenCalled();
});
test('load failures expose retry and an empty period never renders a zero-weight chart', async () => {
  jest
    .mocked(bodyService.progress)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ ...data, rows: [] });
  await render(
    <FeedbackTestRoot>
      <WeightProgressScreen userId={owner} onLog={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Retry loading' });
  await fireEvent.press(screen.getByRole('button', { name: 'Retry loading' }));
  await screen.findByText(/No weigh-ins in this period/);
  expect(screen.queryByRole('image')).toBeNull();
  expect(screen.queryByText('0 lb')).toBeNull();
});
