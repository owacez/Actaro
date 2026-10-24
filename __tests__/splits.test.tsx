import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SplitsScreen } from '@/features/workouts/splits-screen';
import { splitService } from '@/features/workouts/split-service';
import { workoutService } from '@/features/workouts/workout-service';
import { splitPayload, weekdays, type SplitDraft } from '@/features/workouts/split-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000002' }));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/features/workouts/split-service', () => ({
  splitService: { list: jest.fn(), load: jest.fn(), save: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/features/workouts/workout-service', () => ({ workoutService: { list: jest.fn() } }));
const userId = '00000000-0000-4000-8000-000000000001',
  splitId = '00000000-0000-4000-8000-000000000002',
  workoutId = '00000000-0000-4000-8000-000000000003';
const mocks = jest.mocked(splitService),
  workouts = jest.mocked(workoutService);
const draft: SplitDraft = {
  id: splitId,
  name: 'Week A',
  active: true,
  days: weekdays.map(() => ({ isRest: true, workoutId: null, workoutName: null })),
};
beforeEach(() => {
  jest.clearAllMocks();
  mocks.list.mockResolvedValue({ rows: [], more: false });
  mocks.load.mockResolvedValue(draft);
  mocks.save.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  workouts.list.mockResolvedValue({
    rows: [
      {
        id: workoutId,
        name: 'Upper A',
        updated_at: '2026-10-13',
        workout_template_exercises: [{ count: 3 }],
      },
    ],
    more: false,
  });
});
const props = {
  userId,
  onBack: jest.fn(),
  onOpen: jest.fn(),
  onSaved: jest.fn(),
  onCreateWorkout: jest.fn(),
};
test('split validation requires a name and seven explicitly assigned/rest days', () => {
  expect(splitPayload(draft)).toHaveLength(7);
  expect(() => splitPayload({ ...draft, name: '' })).toThrow('name');
  expect(() => splitPayload({ ...draft, days: [] })).toThrow('seven');
  expect(() =>
    splitPayload({
      ...draft,
      days: [{ isRest: false, workoutId: null, workoutName: null }, ...draft.days.slice(1)],
    }),
  ).toThrow('Monday');
});
test('creates a split with a real named workout and six rest days, then saves', async () => {
  await render(
    <FeedbackTestRoot>
      <SplitsScreen {...props} id="new" />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Split name');
  await fireEvent.changeText(screen.getByLabelText('Split name'), 'Week A');
  await fireEvent.press(screen.getByRole('button', { name: 'Save split' }));
  await screen.findByText(
    'Every day needs a workout or rest. Still to set: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.',
  );
  expect(mocks.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Choose Monday workout' }));
  await screen.findByText('Upper A');
  await fireEvent.press(screen.getByRole('button', { name: 'Upper A' }));
  await screen.findByText('Upper A');
  for (const day of weekdays.slice(1))
    await fireEvent.press(screen.getByRole('button', { name: `Rest on ${day}` }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save split' }));
  await waitFor(() => expect(props.onSaved).toHaveBeenCalled());
  expect(mocks.save).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({
      id: splitId,
      name: 'Week A',
      days: [{ isRest: false, workoutId, workoutName: 'Upper A' }, ...draft.days.slice(1)],
    }),
  );
});
test('keeps failed edit drafts and confirms discard', async () => {
  mocks.save.mockRejectedValueOnce(new Error('offline'));
  await render(
    <FeedbackTestRoot>
      <SplitsScreen {...props} id={splitId} />
    </FeedbackTestRoot>,
  );
  await screen.findByDisplayValue('Week A');
  await fireEvent.changeText(screen.getByLabelText('Split name'), 'Changed week');
  await fireEvent.press(screen.getByRole('button', { name: 'Save split' }));
  await screen.findByText('Unable to save split. Your draft is kept; retry.');
  expect(screen.getByLabelText('Split name').props.value).toBe('Changed week');
  await fireEvent.press(screen.getByRole('button', { name: '← Training splits' }));
  expect(props.onBack).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Discard split changes' }));
  expect(props.onBack).toHaveBeenCalledTimes(1);
});
test('delete requires confirmation and guards a pending request before reloading', async () => {
  mocks.list
    .mockResolvedValueOnce({
      rows: [{ id: splitId, name: 'Week A', is_active: true }],
      more: false,
    })
    .mockResolvedValue({ rows: [], more: false });
  let finish: (() => void) | undefined;
  mocks.remove.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await render(
    <FeedbackTestRoot>
      <SplitsScreen {...props} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Week A');
  expect(screen.getByText('Active split')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete split Week A' }));
  expect(mocks.remove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep split' }));
  expect(mocks.remove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete split Week A' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete split' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete split' }));
  expect(mocks.remove).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish?.();
  });
  await screen.findByText('No saved splits yet.');
});
