import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { QuickRecovery } from '@/features/workouts/quick-recovery';
import { recoveryService } from '@/features/workouts/recovery-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/recovery-service', () => ({ recoveryService: { save: jest.fn() } }));
const owner = '00000000-0000-4000-8000-000000000001';
beforeEach(() => {
  jest.mocked(recoveryService.save).mockResolvedValue(undefined);
});
test('the summary recovery check needs three answers and saves the same daily check-in', async () => {
  await render(
    <FeedbackTestRoot>
      <QuickRecovery userId={owner} date="2026-10-22" timeZone="UTC" />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save recovery check' }));
  expect(screen.getByText('Choose energy.')).toBeTruthy();
  expect(recoveryService.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Energy: High' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Soreness: Mild' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Sleep last night: Good' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save recovery check' }));
  await screen.findByText('Check-in saved');
  await waitFor(() =>
    expect(recoveryService.save).toHaveBeenCalledWith(owner, '2026-10-22', 'UTC', {
      energy: 3,
      soreness: 1,
      sleep: 3,
      stress: null,
      notes: '',
    }),
  );
});
