import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HistoryScreen } from '@/features/workouts/history-screen';
import { historyService } from '@/features/workouts/history-service';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/session-store', () => ({
  sessionStore: { forgetSaved: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000007' }));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/features/workouts/history-service', () => ({
  historyService: { calendar: jest.fn(), list: jest.fn(), load: jest.fn(), remove: jest.fn() },
}));
const history = jest.mocked(historyService),
  props = { userId: sessionOwner, onBack: jest.fn(), onOpen: jest.fn() };
const recorded = () => {
  const draft = sessionFixture();
  draft.status = 'pending';
  draft.endedAt = draft.startedAt;
  draft.mutationId = draft.id;
  draft.version = 1;
  draft.exercises[0].sets[0].completedAt = draft.startedAt;
  return draft;
};
beforeEach(() => {
  jest.clearAllMocks();
  history.load.mockResolvedValue(recorded());
  history.list.mockResolvedValue({ rows: [], more: false, unit: 'kg' });
  history.calendar.mockResolvedValue({ month: '2026-10', today: '2026-10-18', rows: [] });
  history.remove.mockResolvedValue(undefined);
});
test('a recorded workout is read-only: totals, compact sets and a one-line note that expands', async () => {
  const row = recorded();
  row.exercises[0].notes =
    'Kept the bar path close and paused at the bottom of every rep; next time add 2.5 kg.';
  history.load.mockResolvedValue(row);
  await render(
    <FeedbackTestRoot>
      <HistoryScreen {...props} id={row.id} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Test workout');
  expect(screen.getByLabelText('Volume: 160 kg')).toBeTruthy();
  expect(screen.getByLabelText('Set 1: 20 kg × 8 reps')).toBeTruthy();
  // Nothing in a recorded workout is editable.
  expect(screen.queryByLabelText(/Reps · exercise 1 set 1/)).toBeNull();
  expect(screen.queryByRole('button', { name: /Save recorded workout/ })).toBeNull();
  const note = screen.getByText(/Kept the bar path close/);
  expect(note.props.numberOfLines).toBe(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Show more of note' }));
  expect(screen.getByText(/Kept the bar path close/).props.numberOfLines).toBeUndefined();
  await fireEvent.press(screen.getByRole('button', { name: 'Show less of note' }));
  expect(screen.getByText(/Kept the bar path close/).props.numberOfLines).toBe(1);
});

test('calendar marks actual workout dates and defers detailed-history requests until History is selected', async () => {
  const onOpen = jest.fn();
  history.calendar.mockResolvedValue({
    month: '2026-10',
    today: '2026-10-18',
    rows: [
      {
        id: recorded().id,
        name: 'Test workout',
        local_date: '2026-10-14',
        mode: 'log_only',
        duration_seconds: null,
      },
    ],
  });
  await render(
    <FeedbackTestRoot>
      <HistoryScreen {...props} onOpen={onOpen} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: '2026-10-14: workout completed' });
  // The month's sessions are listed before any day is chosen.
  expect(screen.getByText('This month')).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Test workout, / })).toBeTruthy();
  expect(history.list).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: '2026-10-14: workout completed' }));
  await fireEvent.press(screen.getByRole('button', { name: /^Test workout, / }));
  expect(onOpen).toHaveBeenCalledWith(recorded().id);
  await fireEvent.press(screen.getByRole('button', { name: 'History' }));
  await waitFor(() => expect(history.list).toHaveBeenCalledTimes(1));
});
test('history rows only open records; filters are genuine server filters', async () => {
  const row = recorded();
  history.list
    .mockResolvedValueOnce({
      rows: [
        {
          id: row.id,
          name: row.name,
          mode: 'timed',
          local_date: row.localDate,
          started_at: row.startedAt,
          duration_seconds: 20,
          version: 1,
          exercises: 1,
          sets: 1,
          reps: 8,
          volume_kg: 160,
          unknown_weight_sets: 0,
        },
      ],
      more: false,
      unit: 'kg',
    })
    .mockResolvedValue({ rows: [], more: false, unit: 'kg' });
  await render(
    <FeedbackTestRoot>
      <HistoryScreen {...props} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'History' }));
  await fireEvent.press(await screen.findByRole('button', { name: /^Test workout, / }));
  expect(props.onOpen).toHaveBeenCalledWith(row.id);
  // Deleting is offered only inside the recorded workout.
  expect(screen.queryByRole('button', { name: 'Delete recorded Test workout' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Log Only' }));
  await waitFor(() =>
    expect(history.list).toHaveBeenLastCalledWith(sessionOwner, {
      offset: 0,
      query: '',
      mode: 'log_only',
    }),
  );
});
test('a recorded workout is deleted from inside it after confirmation, using its revision', async () => {
  const row = recorded();
  await render(
    <FeedbackTestRoot>
      <HistoryScreen {...props} id={row.id} />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(
    await screen.findByRole('button', { name: 'Delete recorded Test workout' }),
  );
  expect(history.remove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep recorded workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete recorded Test workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete recorded workout' }));
  await waitFor(() => expect(history.remove).toHaveBeenCalledWith(sessionOwner, row.id, 1));
  await waitFor(() => expect(props.onBack).toHaveBeenCalledTimes(1));
});
