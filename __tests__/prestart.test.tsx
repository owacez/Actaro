import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PrestartScreen } from '@/features/workouts/prestart-screen';
import { sessionService } from '@/features/workouts/session-service';
import { sessionStore } from '@/features/workouts/session-store';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/session-service', () => ({
  sessionService: { prepare: jest.fn(), create: jest.fn() },
}));
jest.mock('@/features/workouts/session-store', () => ({
  sessionStore: { read: jest.fn(), start: jest.fn() },
}));
const service = jest.mocked(sessionService),
  store = jest.mocked(sessionStore),
  onSession = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  const fixture = sessionFixture();
  store.read.mockResolvedValue(null);
  store.start.mockResolvedValue(undefined);
  service.create.mockReturnValue(fixture);
  service.prepare.mockResolvedValue({
    unit: 'kg',
    templateId: fixture.id,
    exercises: fixture.exercises,
    draft: {
      id: fixture.id,
      name: fixture.name,
      notes: '',
      exercises: fixture.exercises.map((exercise) => ({ ...exercise, key: exercise.id })),
    },
  });
});
const props = {
  userId: sessionOwner,
  templateId: sessionFixture().id,
  onBack: jest.fn(),
  onSession,
};
test('shows actual targets, explicit estimate and mode choice; only navigates after durable start', async () => {
  await render(
    <FeedbackTestRoot>
      <PrestartScreen {...props} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('1 exercises · 1 working sets');
  expect(screen.getByText(/Assumes 45 seconds/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Start Workout' }));
  await screen.findByText('Choose session mode');
  store.start.mockRejectedValueOnce(new Error('device full'));
  await fireEvent.press(screen.getByRole('button', { name: 'Log Only' }));
  await screen.findByText('device full');
  expect(onSession).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Log Only' }));
  await waitFor(() => expect(onSession).toHaveBeenCalledTimes(1));
  expect(service.create).toHaveBeenCalledWith(sessionOwner, expect.any(Object), 'log_only');
});
test('an existing draft must resume and is not replaced by a new template', async () => {
  store.read.mockResolvedValue(sessionFixture());
  await render(
    <FeedbackTestRoot>
      <PrestartScreen {...props} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Resume saved workout' });
  expect(service.prepare).not.toHaveBeenCalled();
  expect(store.start).not.toHaveBeenCalled();
});
