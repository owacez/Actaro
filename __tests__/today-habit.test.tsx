import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TodayHabit } from '@/features/today/today-habit';
import { habitService } from '@/features/habits/habit-service';
import { acknowledgedHabitLog, type HabitRecord } from '@/features/habits/habit-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { useState } from 'react';
import { TodayHabits } from '@/features/today/today-habits';
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
  expect(screen.queryByRole('button', { name: 'Log habit Read' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Edit today’s log for Read' })).toBeNull();
  expect(service.log).toHaveBeenCalledTimes(2);
  await fireEvent.press(screen.getByRole('button', { name: 'Options for Read' }));
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
test('a completed weekly day becomes a result row with only an options button for edit/undo', async () => {
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
  expect(screen.queryByRole('button', { name: 'Log habit Read' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss notification' }));
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(service.log).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('button', { name: 'Not done today' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Options for Read' }));
  expect(screen.queryByLabelText('Today’s value (times)')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Not done today' }));
  await waitFor(() => expect(logged).toHaveBeenLastCalledWith(day, 0, 'Original note'));
});
test('a completed weekly habit can be logged again on the next day in its own time zone', async () => {
  jest.useFakeTimers();
  try {
    jest.setSystemTime(new Date(day + 'T20:00:00Z'));
    const record = acknowledgedHabitLog(habit('frequency'), day, 1);
    record.time_zone = 'Asia/Karachi';
    // Karachi is already on the next date; yesterday's log must not disable today.
    const view = await render(
      <FeedbackTestRoot>
        <TodayHabit userId={owner} habit={record} onLogged={jest.fn()} />
      </FeedbackTestRoot>,
    );
    expect(screen.getByRole('button', { name: 'Log habit Read' })).toBeEnabled();
    record.time_zone = 'UTC';
    await view.rerender(
      <FeedbackTestRoot>
        <TodayHabit userId={owner} habit={record} onLogged={jest.fn()} />
      </FeedbackTestRoot>,
    );
    expect(screen.queryByRole('button', { name: 'Log habit Read' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Options for Read' })).toBeTruthy();
    jest.setSystemTime(new Date(new Date(day + 'T20:00:00Z').getTime() + 86400000));
    await view.rerender(
      <FeedbackTestRoot>
        <TodayHabit userId={owner} habit={record} onLogged={jest.fn()} />
      </FeedbackTestRoot>,
    );
    expect(screen.getByRole('button', { name: 'Log habit Read' })).toBeEnabled();
  } finally {
    jest.useRealTimers();
  }
});

test.each([
  ['duration', 15],
  ['duration', 20],
  ['numeric', 0],
  ['avoidance', 0],
  ['boolean', 0],
])(
  'a logged %s value of %s keeps only options, including partial targets and explicit zero',
  async (kind, amount) => {
    const record = acknowledgedHabitLog(habit(String(kind)), day, Number(amount), 'Keep this note');
    await render(
      <FeedbackTestRoot>
        <TodayHabit userId={owner} habit={record} onLogged={jest.fn()} />
      </FeedbackTestRoot>,
    );
    expect(screen.queryByRole('button', { name: 'Log habit Read' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Options for Read' }));
    if (kind === 'boolean') expect(screen.getByRole('button', { name: 'Done today' })).toBeTruthy();
    else {
      expect(screen.getByLabelText(`Today’s value (${record.unit})`).props.value).toBe(
        String(amount),
      );
      expect(screen.getByLabelText('Habit note (optional)').props.value).toBe('Keep this note');
    }
    expect(service.log).not.toHaveBeenCalled();
  },
);

test('habits form a compact checklist that logs each habit in place', async () => {
  const records = [1, 2, 3].map((number) => ({
    ...habit(),
    id: `habit-${number}`,
    name: `Habit ${number}`,
  }));
  function Fixture() {
    const [habits, setHabits] = useState(records);
    return (
      <TodayHabits
        userId={owner}
        habits={habits}
        onLogged={(id, date, value, notes) => {
          setHabits((rows) =>
            rows.map((row) =>
              row.id === id ? acknowledgedHabitLog(row, date, value, notes) : row,
            ),
          );
        }}
      />
    );
  }
  await render(
    <FeedbackTestRoot>
      <Fixture />
    </FeedbackTestRoot>,
  );
  // Every habit is visible at once; no paging.
  for (const name of ['Habit 1', 'Habit 2', 'Habit 3'])
    expect(screen.getByRole('button', { name: `Log habit ${name}` })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Log habit Habit 2' }));
  await waitFor(() => expect(service.log).toHaveBeenCalledWith(owner, 'habit-2', day, 1, ''));
  await screen.findByRole('button', { name: 'Options for Habit 2' });
  // Logged in place: the other habits keep their Log buttons.
  expect(screen.getByRole('button', { name: 'Log habit Habit 1' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Log habit Habit 3' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Log habit Habit 2' })).toBeNull();
});

test('no habits shows a message; more than four collapse behind Show all', async () => {
  const many = [1, 2, 3, 4, 5, 6].map((number) => ({
    ...habit(),
    id: `many-${number}`,
    name: `Many ${number}`,
  }));
  const tree = (habits: HabitRecord[]) => (
    <FeedbackTestRoot>
      <TodayHabits userId={owner} habits={habits} onLogged={jest.fn()} />
    </FeedbackTestRoot>
  );
  const view = await render(tree([]));
  expect(screen.getByText('No scheduled habits today.')).toBeTruthy();
  await view.rerender(tree(many));
  expect(screen.getByRole('button', { name: 'Log habit Many 4' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Log habit Many 5' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Show all 6 habits' }));
  expect(screen.getByRole('button', { name: 'Log habit Many 6' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Show fewer' }));
  expect(screen.queryByRole('button', { name: 'Log habit Many 6' })).toBeNull();
});
