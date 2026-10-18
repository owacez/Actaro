import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { AppState, type AppStateStatus } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { WorkoutImage } from '@/features/workouts/workout-image';
import { ExerciseImage } from '@/features/exercises/exercise-image';
import { exerciseService } from '@/features/exercises/exercise-service';
import { clearReadCache } from '@/lib/supabase/read-cache';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/features/exercises/exercise-service', () => ({
  exerciseService: { image: jest.fn() },
}));
jest.mock('@/lib/supabase/read-cache', () => ({ clearReadCache: jest.fn() }));
jest.mock('expo-image', () => ({
  Image: ({
    source,
    accessibilityLabel,
    onError,
  }: {
    source: string;
    accessibilityLabel: string;
    onError: () => void;
  }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <Text accessibilityLabel={accessibilityLabel} onPress={onError}>
        {source}
      </Text>
    );
  },
}));
const image = jest.mocked(exerciseService.image);
const first = '00000000-0000-4000-8000-000000000001';
const second = '00000000-0000-4000-8000-000000000002';
beforeEach(() => {
  jest.clearAllMocks();
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('renews saved image links on opening and resume; retry clears reads without changing the workout', async () => {
  let resume: (state: AppStateStatus) => void = () => {};
  const remove = jest.fn();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
    resume = listener;
    return { remove };
  });
  image
    .mockResolvedValueOnce('fresh-main')
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce('renewed-main');
  const view = await render(
    <FeedbackTestRoot>
      <WorkoutImage exerciseId={first} url="expired-link" label="Technique" large />
    </FeedbackTestRoot>,
  );
  await screen.findByText('fresh-main');
  await act(() => resume('active'));
  expect(screen.getByText('fresh-main')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Technique')); // Simulate Expo Image onError.
  await fireEvent.press(screen.getByRole('button', { name: 'Retry image for Technique' }));
  await screen.findByText('renewed-main');
  expect(clearReadCache).toHaveBeenCalledTimes(1);
  expect(image.mock.calls.map(([id]) => id)).toEqual([first, first, first]);
  await view.unmount();
  expect(remove).toHaveBeenCalledTimes(2); // Effect replaced on retry, then removed on unmount.
});

test('a late image from the previous exercise cannot replace the selected exercise image', async () => {
  let resolveFirst: (url: string) => void = () => {};
  image
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    )
    .mockResolvedValueOnce('second-fresh');
  const view = await render(
    <FeedbackTestRoot>
      <WorkoutImage exerciseId={first} url="first-old" label="Technique" />
    </FeedbackTestRoot>,
  );
  await view.rerender(
    <FeedbackTestRoot>
      <WorkoutImage exerciseId={second} url="second-old" label="Technique" />
    </FeedbackTestRoot>,
  );
  await screen.findByText('second-fresh');
  await act(() => resolveFirst('first-late'));
  expect(screen.queryByText('first-late')).toBeNull();
  expect(screen.getByText('second-fresh')).toBeTruthy();
});

test('an image error is tied to its source so a fresh URL recovers without remounting', async () => {
  const view = await render(
    <FeedbackTestRoot>
      <ExerciseImage url="failed-url" label="Technique" />
    </FeedbackTestRoot>,
  );
  await fireEvent.press(screen.getByLabelText('Technique'));
  expect(screen.getByText('No image')).toBeTruthy();
  await view.rerender(
    <FeedbackTestRoot>
      <ExerciseImage url="fresh-url" label="Technique" />
    </FeedbackTestRoot>,
  );
  expect(screen.getByText('fresh-url')).toBeTruthy();
});
