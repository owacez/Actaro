import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RecoveryScreen } from '@/features/workouts/recovery-screen';
import { recoveryService } from '@/features/workouts/recovery-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/recovery-service', () => ({
  recoveryService: { load: jest.fn(), save: jest.fn() },
}));
const service = jest.mocked(recoveryService),
  context = {
    today: '2026-10-13',
    unit: 'kg' as const,
    timeZone: 'UTC',
    plan: null,
    overview: {
      sessions: 0,
      activeDays: 0,
      sets: 0,
      reps: 0,
      volumeKg: 0,
      unknownWeightSets: 0,
      firstDate: null,
      days: [],
      muscles: [],
    },
  };
beforeEach(() => {
  jest.clearAllMocks();
  service.load.mockResolvedValue({ context, rows: [] });
  service.save.mockResolvedValue(undefined);
});
test('missing reports are not saved, failed requests retain selections and retry reloads real saved data', async () => {
  await render(
    <FeedbackTestRoot>
      <RecoveryScreen userId="owner" onBack={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Energy: High' });
  await fireEvent.press(screen.getByRole('button', { name: 'Energy: High' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save recovery check' }));
  await screen.findByText('Choose soreness.');
  expect(service.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Soreness: None' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sleep: Good' }));
  await screen.findByText('Preview: Good');
  service.save.mockRejectedValueOnce(new Error('offline'));
  await fireEvent.press(screen.getByRole('button', { name: 'Save recovery check' }));
  await screen.findByText('offline');
  expect(
    screen.getByRole('button', { name: 'Energy: High' }).props.accessibilityState.selected,
  ).toBe(true);
  await fireEvent.press(screen.getByRole('button', { name: 'Save recovery check' }));
  await waitFor(() => expect(service.load).toHaveBeenCalledTimes(2));
  expect(service.save).toHaveBeenLastCalledWith('owner', '2026-10-13', 'UTC', {
    energy: 3,
    soreness: 0,
    sleep: 3,
    stress: null,
    notes: '',
  });
});
