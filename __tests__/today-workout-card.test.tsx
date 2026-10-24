import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TodayWorkoutCard } from '@/features/workouts/today-workout-card';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

const workout = { id: 'w1', name: 'Full Body', exercises: 4, sets: 12, minutes: 45 },
  completed = [{ id: 's1', name: 'Full Body', mode: 'timed', duration_seconds: 3120 }];

test('a completed workout shows Done and View workout; Train again sits in the ⋯ menu', async () => {
  const onStart = jest.fn(),
    onView = jest.fn();
  await render(
    <FeedbackTestRoot>
      <TodayWorkoutCard
        eyebrow="TODAY"
        session={null}
        completed={completed}
        workout={workout}
        restDay={false}
        onStart={onStart}
        onView={onView}
      />
    </FeedbackTestRoot>,
  );
  expect(screen.getByLabelText('Workout completed today')).toBeTruthy();
  expect(screen.getByText('Completed in 52:00')).toBeTruthy();
  expect(screen.queryByRole('button', { name: "Start today's workout" })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Train again' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'View workout' }));
  expect(onView).toHaveBeenCalledWith('s1');
  await fireEvent.press(screen.getByRole('button', { name: 'Workout options' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Train again' }));
  expect(onStart).toHaveBeenCalledWith('w1');
});

test('before completion the scheduled workout starts from the card', async () => {
  const onStart = jest.fn();
  await render(
    <FeedbackTestRoot>
      <TodayWorkoutCard
        eyebrow="TODAY"
        session={null}
        completed={[]}
        workout={workout}
        restDay={false}
        onStart={onStart}
        onView={jest.fn()}
      />
    </FeedbackTestRoot>,
  );
  expect(screen.queryByRole('button', { name: 'Workout options' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: "Start today's workout" }));
  expect(onStart).toHaveBeenCalledWith('w1');
});
