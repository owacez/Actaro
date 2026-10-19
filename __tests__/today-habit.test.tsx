import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TodayHabit } from '@/features/today/today-habit';
import { habitService } from '@/features/habits/habit-service';
import { acknowledgedHabitLog, type HabitRecord } from '@/features/habits/habit-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/habits/habit-service', () => ({ habitService: { log: jest.fn() } }));
const day = new Date().toISOString().slice(0, 10),
  owner = '05200000-0000-4000-8000-000000000101';
function habit(kind = 'boolean'): HabitRecord {
  return {
    id: '05200000-0000-4000-8000-000000000103',
    user_id: owner,
    name: 'Read',
    kind,
    unit: kind === 'duration' ? 'minutes' : 'times',
    start_date: day,
    time_zone: 'UTC',
    archived: false,
    created_at: day,
    updated_at: day,
    habit_logs: [],
    habit_versions: [
      {
        id: 'version',
        habit_id: '05200000-0000-4000-8000-000000000103',
        user_id: owner,
        effective_from: day,
        target: kind === 'boolean' ? 1 : kind === 'frequency' ? 5 : 20,
        weekdays: [1, 2, 3, 4, 5, 6, 7],
        end_date: null,
        motivation: 'none',
        reminder_time: null,
      },
    ],
  };
}
const service = jest.mocked(habitService);
beforeEach(() => {
  jest.clearAllMocks();
  service.log.mockResolvedValue(undefined);
});
test('one-tap completion waits for acknowledgement, retries identical input and updates without navigation', async () => {
  service.log.mockRejectedValueOnce(new Error('offline'));
  const logged = jest.fn();
  const record = habit();
  const tree = (value: HabitRecord) => (
    <FeedbackTestRoot>
      <TodayHabit userId={owner} habit={value} onLogged={logged} />
    </FeedbackTestRoot>
  );
  const view = await render(tree(record));
  expect(screen.getByText('Not logged today')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Read' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(logged).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(logged).toHaveBeenCalledWith(day, 1, ''));
  expect(service.log.mock.calls[1]).toEqual(service.log.mock.calls[0]);
  await view.rerender(tree(acknowledgedHabitLog(record, day, 1)));
  expect(screen.getByText('✓ Done today')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Read' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Not done today' }));
  await waitFor(() => expect(logged).toHaveBeenLastCalledWith(day, 0, ''));
});
test('amount/minutes entry stays on Today and requires an explicit value, including zero', async () => {
  const logged = jest.fn();
  await render(
    <FeedbackTestRoot>
      <TodayHabit userId={owner} habit={habit('duration')} onLogged={logged} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Read' }));
  await screen.findByLabelText('Today’s value (minutes)');
  await fireEvent.press(screen.getByRole('button', { name: 'Save today’s log' }));
  expect(service.log).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Today’s value (minutes)'), '15');
  await fireEvent.changeText(screen.getByLabelText('Habit note (optional)'), 'Afternoon');
  await fireEvent.press(screen.getByRole('button', { name: 'Save today’s log' }));
  await waitFor(() => expect(logged).toHaveBeenCalledWith(day, 15, 'Afternoon'));
});
test('a weekly habit logs today once, then offers editing and undo rather than another increment', async () => {
  const record = habit('frequency');
  const logged = jest.fn();
  const tree = (record: HabitRecord) => (
    <FeedbackTestRoot>
      <TodayHabit userId={owner} habit={record} onLogged={logged} />
    </FeedbackTestRoot>
  );
  const view = await render(tree(record));
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Read' }));
  await waitFor(() => expect(logged).toHaveBeenCalledWith(day, 1, ''));
  await view.rerender(tree(acknowledgedHabitLog(record, day, 1, 'Original note')));
  expect(screen.getByText('✓ Done today')).toBeTruthy();
  expect(screen.getByText('1 days · Target 5 days this week')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Read' }));
  expect(service.log).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText('Today’s value (times)')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Not done today' }));
  await waitFor(() => expect(logged).toHaveBeenLastCalledWith(day, 0, 'Original note'));
});
