import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RunSessionScreen, RunStartScreen } from '@/features/running/run-screen';
import { runTracker } from '@/features/running/run-tracker';
import { runStore } from '@/features/running/run-store';
import { runService } from '@/features/running/run-service';
import { finishRun, pauseRun, type RunDraft } from '@/features/running/run-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { runFixture, runId, runOwner, runTime } from './helpers/run-fixture';
import { nutritionContext } from './helpers/nutrition-fixture';
let mockCurrent: RunDraft | null;
jest.mock('@/features/running/run-map', () => ({ RunMap: () => null }));
let mockRemoval: (value: { data: { action: { type: string } } }) => void;
const mockDispatch = jest.fn(),
  mockNavigation = { dispatch: mockDispatch };
jest.mock('expo-router', () => ({ useNavigation: () => mockNavigation }));
jest.mock('expo-router/react-navigation', () => ({
  usePreventRemove: (_prevent: boolean, callback: typeof mockRemoval) => {
    mockRemoval = callback;
  },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => '12000000-0000-4000-8000-000000000003' }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/running/run-tracker', () => ({
  backgroundRunSupported: () => false,
  runTracker: {
    begin: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    finish: jest.fn(),
    discard: jest.fn(),
  },
}));
jest.mock('@/features/running/run-store', () => ({ runStore: { update: jest.fn() } }));
jest.mock('@/features/running/run-service', () => ({ runService: { save: jest.fn() } }));
jest.mock('@/features/running/use-run-draft', () => ({
  useRunDraft: () => ({
    draft: mockCurrent,
    loading: false,
    error: null,
    now: 1792576860000,
    retry: jest.fn(),
  }),
}));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: {
    getPreferences: async () =>
      jest
        .requireActual<typeof import('./helpers/nutrition-fixture')>('./helpers/nutrition-fixture')
        .nutritionContext().preferences,
  },
}));
const tracker = jest.mocked(runTracker),
  store = jest.mocked(runStore),
  service = jest.mocked(runService);
beforeEach(() => {
  jest.resetAllMocks();
  mockCurrent = runFixture();
  store.update.mockImplementation(async (_owner, change) => {
    if (!mockCurrent) throw Error('No run');
    mockCurrent = change(mockCurrent);
    return mockCurrent;
  });
  tracker.pause.mockImplementation(async () => {
    if (mockCurrent) mockCurrent = pauseRun(mockCurrent, runTime + 60000);
  });
  tracker.finish.mockImplementation(async () => {
    if (mockCurrent) mockCurrent = finishRun(mockCurrent, runTime + 60000);
  });
  tracker.discard.mockImplementation(async () => {
    mockCurrent = null;
  });
  service.save.mockResolvedValue(undefined);
});
test('stopping requires confirmation, opens review and never saves automatically', async () => {
  await render(<RunSessionScreen userId={runOwner} onBack={jest.fn()} onSaved={jest.fn()} />, {
    wrapper: FeedbackTestRoot,
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Stop run' }));
  expect(tracker.finish).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Stop and review' }));
  await screen.findByRole('button', { name: 'Save run' });
  expect(mockCurrent?.status).toBe('review');
  expect(service.save).not.toHaveBeenCalled();
});
test('failed save freezes notes and retries the identical reviewed run before clearing its draft', async () => {
  mockCurrent = runFixture(true);
  service.save.mockRejectedValueOnce(new Error('offline'));
  const saved = jest.fn();
  await render(<RunSessionScreen userId={runOwner} onBack={jest.fn()} onSaved={saved} />, {
    wrapper: FeedbackTestRoot,
  });
  await fireEvent.changeText(screen.getByLabelText('Run notes (optional)'), 'Park loop');
  await fireEvent.press(screen.getByRole('button', { name: 'Save run' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Run notes (optional)')).toHaveProp('editable', false);
  expect(tracker.discard).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(runId));
  expect(service.save.mock.calls[1]).toEqual(service.save.mock.calls[0]);
  expect(tracker.discard).toHaveBeenCalledWith(runOwner, runId);
});
test('native back offers draft/discard and failed storage cannot approve navigation', async () => {
  store.update.mockRejectedValueOnce(new Error('device full'));
  await render(<RunSessionScreen userId={runOwner} onBack={jest.fn()} onSaved={jest.fn()} />, {
    wrapper: FeedbackTestRoot,
  });
  await act(() => mockRemoval({ data: { action: { type: 'GO_BACK' } } }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save draft and return' }));
  expect(mockDispatch).not.toHaveBeenCalled();
  await screen.findByText(
    'Unable to confirm this action. Your saved run is kept; retry before leaving.',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save draft and return' }));
  await waitFor(() => expect(mockDispatch).toHaveBeenCalledWith({ type: 'GO_BACK' }));
  expect(tracker.pause).toHaveBeenCalledWith(runOwner);
});
test('start explains permission before invoking GPS and foreground fallback is explicit', async () => {
  mockCurrent = null;
  tracker.begin.mockResolvedValue(runFixture());
  const start = jest.fn();
  await render(<RunStartScreen userId={runOwner} onStart={start} onHistory={jest.fn()} />, {
    wrapper: FeedbackTestRoot,
  });
  await screen.findByRole('button', { name: 'Start run' });
  expect(tracker.begin).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Start run' }));
  expect(tracker.begin).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Allow location and start' }));
  await waitFor(() => expect(start).toHaveBeenCalled());
  expect(tracker.begin).toHaveBeenCalledWith(
    runOwner,
    runId,
    nutritionContext().preferences.time_zone,
    false,
    'km',
  );
});
