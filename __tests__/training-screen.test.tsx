import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TrainingScreen } from '@/features/workouts/training-screen';
import { trainingService } from '@/features/workouts/training-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/training-service', () => ({ trainingService: { load: jest.fn() } }));
test('training summary shows headline tiles, status and muscle balance largest first', async () => {
  jest.mocked(trainingService.load).mockResolvedValue({
    overview: {
      sessions: 4,
      activeDays: 3,
      sets: 30,
      reps: 240,
      volumeKg: 9600,
      unknownWeightSets: 2,
      firstDate: '2026-10-01',
      days: [],
      muscles: [
        { id: 'quads', name: 'Quads', sets: 6, volumeKg: 3000 },
        { id: 'chest', name: 'Chest', sets: 12, volumeKg: 4800 },
      ],
    },
    plan: null,
    today: '2026-10-22',
    unit: 'kg',
    timeZone: 'UTC',
  });
  const recovery = jest.fn();
  await render(
    <FeedbackTestRoot>
      <TrainingScreen
        userId="00000000-0000-4000-8000-000000000001"
        onBack={jest.fn()}
        onRecovery={recovery}
      />
    </FeedbackTestRoot>,
  );
  expect(await screen.findByLabelText('Workouts: 4')).toBeTruthy();
  expect(screen.getByLabelText('Training days: 3')).toBeTruthy();
  expect(screen.getByLabelText('Working sets: 30 · 240 reps')).toBeTruthy();
  expect(screen.getByLabelText('Training Volume: 9600 kg·reps')).toBeTruthy();
  expect(screen.getByText(/2 sets with unknown weight are excluded\.$/)).toBeTruthy();
  // Muscles are ordered by allocated sets, largest first.
  const muscles = screen
    .getAllByLabelText(/allocated sets/)
    .map((node) => node.props.accessibilityLabel);
  expect(muscles).toEqual([
    'Chest: 12 allocated sets, 4800 kg·reps',
    'Quads: 6 allocated sets, 3000 kg·reps',
  ]);
  await fireEvent.press(screen.getByRole('button', { name: 'Recovery check' }));
  expect(recovery).toHaveBeenCalled();
});
