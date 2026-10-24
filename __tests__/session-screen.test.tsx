import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SessionScreen } from '@/features/workouts/session-screen';
import { sessionStore } from '@/features/workouts/session-store';
import { sessionService } from '@/features/workouts/session-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
let mockPreventRemove = false;
let mockRemoval: (options: { data: { action: { type: string } } }) => void = () => {};
const mockDispatch = jest.fn();
const mockNavigation = { dispatch: mockDispatch };
jest.mock('expo-router', () => ({ useNavigation: () => mockNavigation }));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (prevent: boolean, callback: typeof mockRemoval) => {
    mockPreventRemove = prevent;
    mockRemoval = callback;
  },
}));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000007' }));
jest.mock('@/features/workouts/session-store', () => ({
  sessionStore: { read: jest.fn(), write: jest.fn(), discard: jest.fn() },
}));
jest.mock('@/features/workouts/session-service', () => ({ sessionService: { save: jest.fn() } }));
const store = jest.mocked(sessionStore),
  service = jest.mocked(sessionService),
  onBack = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  mockPreventRemove = false;
  store.read.mockResolvedValue(sessionFixture());
  store.write.mockResolvedValue(undefined);
  store.discard.mockResolvedValue(undefined);
  service.save.mockResolvedValue(1);
});
afterEach(() => {
  jest.restoreAllMocks();
});
test('Log Only completes sets, controls independent rest and preserves frozen failed saves for retry', async () => {
  // Image resolution/rendering must not consume the first second of this assertion.
  jest.spyOn(Date, 'now').mockReturnValue(Date.now());
  store.read.mockResolvedValue({
    ...sessionFixture(),
    mode: 'log_only',
    clock: { elapsedMs: 0, runningSince: null },
  });
  service.save.mockRejectedValueOnce(new Error('offline'));
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Complete set 1' });
  expect(screen.queryByRole('button', { name: 'Pause workout timer' })).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Reps · set 1'), '10');
  await fireEvent.press(screen.getByRole('button', { name: 'Complete set 1' }));
  await screen.findByText('1:30');
  await fireEvent.press(screen.getByRole('button', { name: 'Pause rest' }));
  await screen.findByRole('button', { name: 'Resume rest' });
  await fireEvent.press(screen.getByRole('button', { name: '+15 sec' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Skip rest' }));
  expect(screen.queryByText(/Rest:/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Finish workout' }));
  await screen.findByRole('button', { name: 'Retry workout save' });
  const failed = service.save.mock.calls[0][0];
  expect(failed.status).toBe('pending');
  expect(failed.exercises[0].sets[0].reps).toBe('10');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry workout save' }));
  await screen.findByText('Workout complete');
  expect(service.save.mock.calls[1][0]).toEqual(failed);
  // Summary tiles and each completed set, as logged.
  expect(screen.getByText('200 kg·reps')).toBeTruthy();
  expect(screen.getByText('20 kg × 10')).toBeTruthy();
  expect(screen.queryByText(/Duration:/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
  await waitFor(() => expect(onBack).toHaveBeenCalled());
});
test('pause/resume, add/remove, empty completion and cancellation remain real actions', async () => {
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Pause workout timer' });
  await fireEvent.press(screen.getByRole('button', { name: 'Pause workout timer' }));
  await screen.findByRole('button', { name: 'Resume workout timer' });
  await fireEvent.press(screen.getByRole('button', { name: 'Add set' }));
  await screen.findByRole('button', { name: 'Complete set 2' });
  // Unlogged sets have a visible remove control; the last remaining set cannot be removed.
  expect(
    screen.getByRole('button', { name: 'Exercise 1: Test exercise, 0 of 2 sets logged' }),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Remove set 2' }));
  expect(screen.queryByRole('button', { name: 'Complete set 2' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Remove set 1' })).toBeNull();
  // Finishing with unlogged exercises asks first; skipping everything still needs one set.
  await fireEvent.press(screen.getByRole('button', { name: 'Finish workout' }));
  expect(screen.getByText('1. Test exercise · not started')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Mark as skipped and finish' }));
  await screen.findByText('Complete at least one set.');
  expect(service.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel workout' }));
  expect(store.discard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Discard workout' }));
  await waitFor(() => expect(store.discard).toHaveBeenCalledWith(sessionOwner));
});

test('all planned rows stay visible, inline edits validate, primary logging advances and undo never leaves', async () => {
  jest.spyOn(Date, 'now').mockReturnValue(Date.now());
  const fixture = sessionFixture();
  fixture.exercises[0].sets = [1, 2, 3].map((number) => ({
    ...fixture.exercises[0].sets[0],
    id: `00000000-0000-4000-8000-00000000000${number + 5}`,
  }));
  store.read.mockResolvedValue(fixture);
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Complete set 1' });
  expect(screen.getByRole('button', { name: 'Complete set 2' })).toBeTruthy();
  expect(screen.getByText('0 of 3 sets logged')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Reps · set 1'), '');
  await fireEvent.press(screen.getByRole('button', { name: 'Log set 1' }));
  expect(screen.getByRole('button', { name: 'Log set 1' })).toBeTruthy();
  expect(screen.getByText('0 of 3 sets logged')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Reps · set 1'), '8');
  await fireEvent.changeText(screen.getByLabelText('Weight (kg) · set 1'), '22.5');
  await fireEvent.press(screen.getByRole('button', { name: 'Log set 1' }));
  await screen.findByRole('button', { name: 'Log set 2' });
  // A logged set keeps its data: it has no remove control until undone.
  expect(screen.queryByRole('button', { name: 'Remove set 1' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Remove set 2' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'View set 1, logged' })).toBeTruthy();
  // Logged values are locked until the set is undone.
  expect(screen.getByLabelText('Weight (kg) · set 1')).toHaveProp('editable', false);
  expect(screen.getByLabelText('Reps · set 1')).toHaveProp('editable', false);
  expect(screen.getByLabelText('Weight (kg) · set 2')).toHaveProp('editable', true);
  expect(screen.getByText('1 of 3 sets logged')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Undo last set' }));
  await screen.findByRole('button', { name: 'Log set 1' });
  expect(screen.getByText('0 of 3 sets logged')).toBeTruthy();
  expect(screen.getByLabelText('Weight (kg) · set 1')).toHaveProp('editable', true);
  expect(onBack).not.toHaveBeenCalled();
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(service.save).not.toHaveBeenCalled();
  for (const number of [1, 2, 3]) {
    await fireEvent.press(screen.getByRole('button', { name: `Log set ${number}` }));
  }
  expect(screen.getByText('3 of 3 sets logged')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Unmark set 3' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Unmark set 1' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'View set 1, logged' }));
  expect(screen.getByRole('button', { name: 'Unmark set 1' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Finish workout' })).toBeTruthy();
  await screen.findByRole('button', { name: 'Select set 1, logged' });
  await fireEvent.press(screen.getByRole('button', { name: 'Select set 1, logged' }));
  for (const number of [1, 2, 3])
    expect(screen.getByRole('button', { name: `Unmark set ${number}` })).toBeTruthy();
  const saved = store.write.mock.calls.at(-1)?.[0];
  expect(saved?.exercises[0].sets.map((set) => !!set.completedAt)).toEqual([true, true, true]);
  expect(saved?.exercises[0].sets[0].weight).toBe('22.5');
  await fireEvent.press(screen.getByRole('button', { name: 'Unmark set 1' }));
  await screen.findByRole('button', { name: 'Log set 1' });
  await fireEvent.press(screen.getByRole('button', { name: 'View set 3, logged' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Continue to set 1' }));
  expect(screen.getByRole('button', { name: 'Log set 1' })).toBeTruthy();
});

test('system back opens a choice, cancel stays, and saving a draft waits for local acknowledgement', async () => {
  const fixture = sessionFixture();
  store.read.mockResolvedValue(fixture);
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Complete set 1' });
  expect(mockPreventRemove).toBe(true);
  await act(() => mockRemoval({ data: { action: { type: 'GO_BACK' } } }));
  await screen.findByText('Leave workout?');
  await fireEvent.press(screen.getByRole('button', { name: 'Continue workout' }));
  expect(screen.queryByText('Leave workout?')).toBeNull();
  expect(mockDispatch).not.toHaveBeenCalled();
  await act(() => mockRemoval({ data: { action: { type: 'GO_BACK' } } }));
  store.write.mockRejectedValueOnce(new Error('disk full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Save as draft' }));
  await screen.findByText('Draft could not be saved on this device. Stay here and retry.');
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(mockPreventRemove).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Save as draft' }));
  await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' }));
  expect(mockPreventRemove).toBe(false);
  const saved = store.write.mock.calls.at(-1)?.[0];
  expect(saved?.status).toBe('active');
  expect(saved?.clock.runningSince).toBeNull();
  expect(saved?.exercises).toEqual(fixture.exercises);
  expect(service.save).not.toHaveBeenCalled();
  expect(store.discard).not.toHaveBeenCalled();
});

test('the back link uses the same dialog and discard failure cannot navigate or finish', async () => {
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Complete set 1' });
  await fireEvent.press(screen.getByRole('button', { name: 'Back to My workouts' }));
  await screen.findByText('Leave workout?');
  store.discard.mockRejectedValueOnce(new Error('disk error'));
  await fireEvent.press(screen.getByRole('button', { name: 'Discard workout' }));
  await screen.findByText('Unable to clear this device draft. Retry.');
  expect(onBack).not.toHaveBeenCalled();
  expect(mockPreventRemove).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Discard workout' }));
  await waitFor(() => expect(onBack).toHaveBeenCalledTimes(1));
  expect(service.save).not.toHaveBeenCalled();
});
test('after the last exercise, unlogged earlier exercises come back first and can be skipped', async () => {
  const fixture = sessionFixture();
  const first = fixture.exercises[0];
  const second = {
    ...first,
    id: '00000000-0000-4000-8000-000000000031',
    name: 'Second exercise',
    sets: [{ ...first.sets[0], id: '00000000-0000-4000-8000-000000000032' }],
  };
  store.read.mockResolvedValue({
    ...fixture,
    mode: 'log_only',
    clock: { elapsedMs: 0, runningSince: null },
    exercises: [first, second],
  });
  await render(
    <FeedbackTestRoot>
      <SessionScreen userId={sessionOwner} onBack={onBack} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Complete set 1' });
  // Jump straight to the second exercise and log it.
  await fireEvent.press(
    screen.getByRole('button', { name: 'Exercise 2: Second exercise, 0 of 1 sets logged' }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Complete set 1' }));
  // The first exercise was passed over, so it is offered before finishing.
  await screen.findByRole('button', { name: 'Go to Test exercise' });
  expect(screen.queryByRole('button', { name: 'Finish workout' })).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Go to Test exercise' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Skip Test exercise' }));
  expect(
    screen.getByRole('button', { name: 'Exercise 1: Test exercise, 0 of 1 sets logged, skipped' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Undo skip' })).toBeTruthy();
  // With only skipped work left, finishing saves the logged set without asking again.
  await fireEvent.press(screen.getByRole('button', { name: 'Finish workout' }));
  await waitFor(() => expect(service.save).toHaveBeenCalled());
  expect(service.save.mock.calls[0][0].exercises[0].skipped).toBe(true);
});
