import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SessionScreen } from '@/features/workouts/session-screen';
import { sessionStore } from '@/features/workouts/session-store';
import { sessionService } from '@/features/workouts/session-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
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
  store.read.mockResolvedValue(sessionFixture());
  store.write.mockResolvedValue(undefined);
  store.discard.mockResolvedValue(undefined);
  service.save.mockResolvedValue(1);
});
test('Log Only completes sets, controls independent rest and preserves frozen failed saves for retry', async () => {
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
  await fireEvent.press(screen.getByRole('button', { name: 'Edit set 1' }));
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
  await screen.findByText('Workout summary');
  expect(service.save.mock.calls[1][0]).toEqual(failed);
  expect(screen.getByText('Training Volume: 200 kg·reps')).toBeTruthy();
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
  await fireEvent.press(screen.getByRole('button', { name: 'Edit set 2' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Remove set 2' }));
  expect(screen.queryByRole('button', { name: 'Complete set 2' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Finish workout' }));
  await screen.findByText('Complete at least one set.');
  expect(service.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Cancel workout' }));
  expect(store.discard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Discard workout' }));
  await waitFor(() => expect(store.discard).toHaveBeenCalledWith(sessionOwner));
});
