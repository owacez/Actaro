import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BuilderScreen } from '@/features/workouts/builder-screen';
import { WorkoutsScreen } from '@/features/workouts/workouts-screen';
import { workoutService } from '@/features/workouts/workout-service';
import {
  exerciseService,
  type ExerciseDetail,
  type ExerciseSummary,
} from '@/features/exercises/exercise-service';
import {
  blankSet,
  displayWeight,
  workoutPayload,
  type WorkoutDraft,
} from '@/features/workouts/workout-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
const workoutId = '00000000-0000-4000-8000-000000000002';
const exerciseId = '00000000-0000-4000-8000-000000000003';
const userId = '00000000-0000-4000-8000-000000000001';
const selectedId = '00000000-0000-4000-8000-000000000004';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
// The drag gesture runs on the UI thread; here a plain list calls the same onReorder.
jest.mock('@/components/reorder-list', () => {
  const { Pressable, Text, View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    ReorderList: ({
      items,
      keyOf,
      renderItem,
      onReorder,
    }: {
      items: { key: string }[];
      keyOf: (item: { key: string }) => string;
      renderItem: (item: { key: string }, index: number, handle: null) => React.ReactNode;
      onReorder: (keys: string[]) => void;
    }) => (
      <View>
        {items.map((item, index) => (
          <View key={keyOf(item)}>
            {renderItem(item, index, null)}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Drag exercise ${index + 1} up`}
              onPress={() => {
                const keys = items.map(keyOf);
                [keys[index - 1], keys[index]] = [keys[index], keys[index - 1]];
                onReorder(keys);
              }}
            >
              <Text>drag</Text>
            </Pressable>
          </View>
        ))}
      </View>
    ),
  };
});
jest.mock('@/features/workouts/today-workout', () => ({
  todayWorkoutRecords: jest.fn(async () => ({ session: null, completed: [] })),
}));
const selected: ExerciseDetail = {
  id: selectedId,
  name: 'Selected real exercise',
  description: null,
  difficulty: null,
  category: 'strength',
  movement_pattern: null,
  source: 'repdb',
  source_external_id: 'fixture',
  source_revision: 'fixture',
  license: 'Fixture license',
  attribution: 'Fixture attribution',
  created_at: '2026-01-01',
  instructions: ['Controlled movement.'],
  exercise_media: [],
  exercise_equipment: [],
  exercise_muscles: [],
};
const mockDetail = jest.spyOn(exerciseService, 'detail');
jest.mock('expo-crypto', () => ({ randomUUID: () => workoutId }));
jest.mock('@/features/workouts/workout-service', () => ({
  workoutService: { load: jest.fn(), save: jest.fn(), list: jest.fn(), remove: jest.fn() },
}));
jest.mock('@/features/exercises/exercise-image', () => ({ ExerciseImage: () => null }));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/features/exercises/library-screen', () => ({
  LibraryScreen: ({
    onOpen,
    onQuickAdd,
    onEditSelection,
  }: {
    onOpen: (id: string, item: { id: string; name: string; imageUrl: null }) => void;
    onQuickAdd?: (item: ExerciseSummary) => void;
    onEditSelection?: (id: string) => void;
  }) => {
    const { AuthButton } = jest.requireActual<typeof import('@/features/auth/auth-components')>(
      '@/features/auth/auth-components',
    );
    return (
      <>
        <AuthButton
          title="Select real fixture exercise"
          onPress={() =>
            onOpen(exerciseId, { id: exerciseId, name: 'Fixture press', imageUrl: null })
          }
        />
        <AuthButton
          title="Quick add other fixture"
          onPress={() =>
            onQuickAdd?.({
              ...selected,
              difficulty: 'beginner',
              imageUrl: null,
              muscles: [],
              equipment: [],
              thumbnail_path: '',
              total_count: 1,
            })
          }
        />
        <AuthButton title="Edit added fixture" onPress={() => onEditSelection?.(selectedId)} />
      </>
    );
  },
}));
const mocks = jest.mocked(workoutService);
const draft: WorkoutDraft = {
  id: workoutId,
  name: 'Upper A',
  notes: '',
  exercises: [
    {
      key: 'one',
      exerciseId,
      name: 'Fixture press',
      imageUrl: null,
      notes: '',
      sets: [blankSet()],
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  mockDetail.mockReset().mockResolvedValue(selected);
  mocks.load.mockResolvedValue({ unit: 'kg', draft: null });
  mocks.save.mockResolvedValue(workoutId);
});
test('shortcut starts a new editable workout with the real selected exercise', async () => {
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        exerciseId={selectedId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('1. Selected real exercise');
  expect(mockDetail).toHaveBeenCalledWith(selectedId);
  expect(mocks.save).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Workout name'), 'New selected workout');
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        name: 'New selected workout',
        exercises: [
          expect.objectContaining({
            exerciseId: selectedId,
            sets: [blankSet(), blankSet(), blankSet()],
          }),
        ],
      }),
      'kg',
    ),
  );
});
test('shortcut preserves an existing workout and adds once; discard makes no mutation', async () => {
  mocks.load.mockResolvedValue({ unit: 'lb', draft });
  const back = jest.fn();
  const rendered = await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        exerciseId={selectedId}
        onBack={back}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('2. Selected real exercise');
  await fireEvent.press(screen.getByRole('button', { name: 'Back to My workouts' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Discard and leave' }));
  expect(back).toHaveBeenCalledTimes(1);
  expect(mocks.save).not.toHaveBeenCalled();
  await rendered.unmount();
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        exerciseId={selectedId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('2. Selected real exercise');
  await fireEvent.changeText(screen.getByLabelText('Workout notes (optional)'), 'Keep old targets');
  expect(screen.getAllByText('2. Selected real exercise')).toHaveLength(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        exercises: [draft.exercises[0], expect.objectContaining({ exerciseId: selectedId })],
      }),
      'lb',
    ),
  );
});
test('unavailable selection retries without a partial save and full workouts reject additions', async () => {
  mockDetail.mockRejectedValueOnce(new Error('unavailable'));
  const rendered = await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        exerciseId={selectedId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText(/Unable to open the workout or add/);
  expect(screen.queryByRole('button', { name: 'Save workout' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('1. Selected real exercise');
  expect(mocks.save).not.toHaveBeenCalled();
  await rendered.unmount();
  mocks.load.mockResolvedValue({
    unit: 'kg',
    draft: {
      ...draft,
      exercises: Array.from({ length: 100 }, (_, index) => ({
        ...draft.exercises[0],
        key: String(index),
      })),
    },
  });
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        exerciseId={selectedId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText(/100-exercise limit/);
  expect(screen.queryByRole('button', { name: 'Save workout' })).toBeNull();
});
test('workout chooser opens the selected template and keeps deletion out of the selection flow', async () => {
  mocks.list.mockResolvedValue({
    rows: [
      {
        id: workoutId,
        name: 'Upper A',
        updated_at: '2026-10-13',
        workout_template_exercises: [{ count: 1 }],
      },
    ],
    more: false,
  });
  const choose = jest.fn(),
    create = jest.fn();
  await render(
    <FeedbackTestRoot>
      <WorkoutsScreen
        userId={userId}
        selecting
        onBack={() => {}}
        onCreate={create}
        onEdit={choose}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Upper A');
  expect(screen.getByRole('header', { name: 'Add to workout' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Delete Upper A' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Upper A' }));
  expect(choose).toHaveBeenCalledWith(workoutId, 'Upper A');
  await fireEvent.press(screen.getByRole('button', { name: 'Create workout' }));
  expect(create).toHaveBeenCalledTimes(1);
});

test('workout edit, start and delete are separate accessible buttons with independent actions', async () => {
  mocks.list.mockResolvedValue({
    rows: [
      {
        id: workoutId,
        name: 'Upper A',
        updated_at: '2026-10-13',
        workout_template_exercises: [{ count: 1 }],
      },
    ],
    more: false,
  });
  const edit = jest.fn(),
    start = jest.fn();
  await render(
    <FeedbackTestRoot>
      <WorkoutsScreen
        userId={userId}
        onBack={() => {}}
        onCreate={() => {}}
        onEdit={edit}
        onStart={start}
      />
    </FeedbackTestRoot>,
  );
  const startButton = await screen.findByRole('button', { name: 'Start Upper A' });
  const deleteButton = screen.getByRole('button', { name: 'Delete Upper A' });
  for (const button of [startButton, deleteButton]) {
    // Native Pressable maps its host button to <button> on web. An action must
    // never have a second host button ancestor (invalid DOM and hidden actions).
    for (let parent = button.parent; parent; parent = parent.parent) {
      if (typeof parent.type === 'string')
        expect(parent.props.accessibilityRole).not.toBe('button');
    }
  }
  await fireEvent.press(startButton);
  expect(start).toHaveBeenCalledWith(workoutId);
  expect(edit).not.toHaveBeenCalled();
  await fireEvent.press(deleteButton);
  await screen.findByText('Delete workout?');
  expect(mocks.remove).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Upper A' }));
  expect(edit).toHaveBeenCalledWith(workoutId, 'Upper A');
});
test('converts pounds to canonical kilograms and preserves unknown versus zero weight', () => {
  const value = {
    ...draft,
    exercises: [
      {
        ...draft.exercises[0],
        sets: [
          { ...blankSet(), weight: '22.046', rpe: '7.5' },
          { ...blankSet(), weight: '' },
          { ...blankSet(), weight: '0' },
        ],
      },
    ],
  };
  const payload = workoutPayload(value, 'lb');
  expect(payload[0].sets.map((item) => item.weight_kg)).toEqual([10, null, 0]);
  expect(payload[0].sets[0].rpe).toBe(7.5);
  expect(displayWeight(10, 'lb')).toBe('22.046');
});
test('rejects missing exercises, fractional reps, malformed weight and overprecise RPE', () => {
  expect(() => workoutPayload({ ...draft, exercises: [] }, 'kg')).toThrow('Choose');
  for (const patch of [{ reps: '1.5' }, { weight: 'NaN' }, { rpe: '7.55' }, { rest: '-1' }])
    expect(() =>
      workoutPayload(
        { ...draft, exercises: [{ ...draft.exercises[0], sets: [{ ...blankSet(), ...patch }] }] },
        'kg',
      ),
    ).toThrow();
});
test('new workout selects an exercise, validates and saves the entire draft', async () => {
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BuilderScreen userId={userId} onBack={() => {}} onSaved={saved} onEquipment={() => {}} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Add an exercise from the library to begin.');
  await fireEvent.changeText(screen.getByLabelText('Workout name'), 'Upper A');
  await fireEvent.press(screen.getByRole('button', { name: '+ Add exercise' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Select real fixture exercise' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Back to workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Edit exercise 1' }));
  await fireEvent.changeText(screen.getByLabelText('Reps · exercise 1 set 1'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Done editing' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await screen.findByText(/enter a whole number/);
  expect(mocks.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit exercise 1' }));
  await fireEvent.changeText(screen.getByLabelText('Reps · exercise 1 set 1'), '10');
  await fireEvent.changeText(screen.getByLabelText('Weight (kg) · exercise 1 set 1'), '22.5');
  await fireEvent.press(screen.getByRole('button', { name: 'Done editing' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  expect(mocks.save).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({
      id: workoutId,
      name: 'Upper A',
      exercises: [
        expect.objectContaining({
          exerciseId,
          sets: [
            expect.objectContaining({ reps: '10', weight: '22.5' }),
            expect.anything(),
            expect.anything(),
          ],
        }),
      ],
    }),
    'kg',
  );
});
test('quick additions stay in the picker, edit targets in place, and save once through the workout', async () => {
  mocks.load.mockResolvedValue({ unit: 'lb', draft });
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        onBack={jest.fn()}
        onSaved={saved}
        onEquipment={jest.fn()}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByDisplayValue('Upper A');
  await fireEvent.press(screen.getByRole('button', { name: '+ Add exercise' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Quick add other fixture' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Quick add other fixture' }));
  expect(
    screen.getByText('2 exercises in this draft. Return to the workout to save.'),
  ).toBeTruthy();
  expect(mocks.save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit added fixture' }));
  await fireEvent.changeText(screen.getByLabelText('Weight (lb) · exercise 2 set 1'), '45');
  await fireEvent.changeText(screen.getByLabelText('Reps · exercise 2 set 1'), '12');
  await fireEvent.changeText(screen.getByLabelText('Planned sets'), '101');
  expect(screen.getByLabelText('Planned sets').props.value).toBe('3');
  await fireEvent.changeText(screen.getByLabelText('Planned sets'), '4');
  await fireEvent.press(screen.getByRole('button', { name: 'Done editing' }));
  expect(screen.getByRole('button', { name: 'Quick add other fixture' })).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Back to workout' }));
  expect(screen.getByText('4 sets')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  expect(mocks.save).toHaveBeenCalledWith(
    userId,
    expect.objectContaining({
      exercises: [
        draft.exercises[0],
        expect.objectContaining({
          exerciseId: selectedId,
          sets: [
            expect.objectContaining({ weight: '45', reps: '12' }),
            blankSet(),
            blankSet(),
            blankSet(),
          ],
        }),
      ],
    }),
    'lb',
  );
});
test('loads saved workout, keeps a failed save draft and confirms discard', async () => {
  mocks.load.mockResolvedValue({ unit: 'lb', draft });
  mocks.save.mockRejectedValue(new Error('transport'));
  const back = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        onBack={back}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByDisplayValue('Upper A');
  await fireEvent.changeText(screen.getByLabelText('Workout name'), 'Revised A');
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await screen.findByText('Unable to save workout. Your draft is kept; retry.');
  expect(screen.getByLabelText('Workout name').props.value).toBe('Revised A');
  await fireEvent.press(screen.getByRole('button', { name: 'Back to My workouts' }));
  expect(back).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Discard and leave' }));
  expect(back).toHaveBeenCalledTimes(1);
});
test('workout list handles request failure and empty retry', async () => {
  mocks.list
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ rows: [], more: false });
  await render(
    <FeedbackTestRoot>
      <WorkoutsScreen userId={userId} onBack={() => {}} onCreate={() => {}} onEdit={() => {}} />
    </FeedbackTestRoot>,
  );
  await screen.findByText(/Unable to load workouts/);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Build your first workout');
  expect(mocks.list).toHaveBeenCalledTimes(2);
});
test('delete requires confirmation, keeps failed rows and blocks duplicate pending requests', async () => {
  const row = {
    id: workoutId,
    name: 'Upper A',
    updated_at: '2026-10-12',
    workout_template_exercises: [{ count: 1 }],
  };
  mocks.list.mockResolvedValue({ rows: [row], more: false });
  mocks.remove.mockRejectedValueOnce(
    new Error('Unable to delete workout. Check your connection and retry.'),
  );
  const back = jest.fn(),
    create = jest.fn(),
    edit = jest.fn();
  await render(
    <FeedbackTestRoot>
      <WorkoutsScreen userId={userId} onBack={back} onCreate={create} onEdit={edit} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Upper A');
  await fireEvent.press(screen.getByRole('button', { name: 'Delete Upper A' }));
  expect(mocks.remove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep workout' }));
  expect(screen.queryByRole('button', { name: 'Delete workout' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete Upper A' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete workout' }));
  await screen.findByText('Unable to delete workout. Check your connection and retry.');
  expect(screen.getByText('Upper A')).toBeTruthy();
  let finish: (() => void) | undefined;
  mocks.remove.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  mocks.list.mockResolvedValueOnce({ rows: [], more: false });
  await fireEvent.press(screen.getByRole('button', { name: 'Delete workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Keep workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Create workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Upper A' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Back to Train' }));
  expect(mocks.remove).toHaveBeenCalledTimes(2);
  expect(mocks.remove).toHaveBeenLastCalledWith(userId, workoutId);
  expect(back).not.toHaveBeenCalled();
  expect(create).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();
  await act(async () => {
    finish?.();
  });
  await screen.findByText('Build your first workout');
  expect(screen.queryByText('Upper A')).toBeNull();
});
test('deleting the last workout on a later page reloads the previous page', async () => {
  const row = {
    id: workoutId,
    name: 'Upper A',
    updated_at: '2026-10-12',
    workout_template_exercises: [{ count: 1 }],
  };
  mocks.list
    .mockResolvedValueOnce({ rows: [row], more: true })
    .mockResolvedValueOnce({ rows: [row], more: false })
    .mockResolvedValueOnce({ rows: [], more: false });
  mocks.remove.mockResolvedValue(undefined);
  await render(
    <FeedbackTestRoot>
      <WorkoutsScreen userId={userId} onBack={() => {}} onCreate={() => {}} onEdit={() => {}} />
    </FeedbackTestRoot>,
  );
  await screen.findByText('Page 1');
  await fireEvent.press(screen.getByRole('button', { name: 'Next workouts' }));
  await screen.findByText('Page 2');
  await fireEvent.press(screen.getByRole('button', { name: 'Delete Upper A' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Delete workout' }));
  await screen.findByText('Build your first workout');
  expect(mocks.list.mock.calls.map(([, offset]) => offset)).toEqual([0, 10, 0]);
});
test('orders exercises and adds/removes sets and exercises before saving', async () => {
  mocks.load.mockResolvedValue({
    unit: 'kg',
    draft: {
      ...draft,
      exercises: [draft.exercises[0], { ...draft.exercises[0], key: 'two', name: 'Second press' }],
    },
  });
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('2. Second press');
  await fireEvent.press(screen.getByRole('button', { name: 'Edit exercise 2' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Move 2 up' }));
  expect(screen.getByRole('button', { name: 'Move 1 down' })).toBeEnabled();
  await fireEvent.press(screen.getByRole('button', { name: '+ Add set' }));
  await screen.findByText('Set 2');
  await fireEvent.press(screen.getByRole('button', { name: 'Remove set 2' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Remove exercise 1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        exercises: [expect.objectContaining({ key: 'one', sets: [blankSet()] })],
      }),
      'kg',
    ),
  );
});
test('dragging reorders the draft and each row deletes with its bin', async () => {
  mocks.load.mockResolvedValue({
    unit: 'kg',
    draft: {
      ...draft,
      exercises: [draft.exercises[0], { ...draft.exercises[0], key: 'two', name: 'Second press' }],
    },
  });
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        onBack={() => {}}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByText('2. Second press');
  await fireEvent.press(screen.getByRole('button', { name: 'Drag exercise 2 up' }));
  expect(screen.getByText('1. Second press')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete exercise 1' }));
  expect(screen.queryByText(/Second press/)).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await waitFor(() =>
    expect(mocks.save).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        exercises: [expect.objectContaining({ key: draft.exercises[0].key })],
      }),
      'kg',
    ),
  );
});
test('pending save blocks repeated mutation and leaving through discard', async () => {
  mocks.load.mockResolvedValue({ unit: 'kg', draft });
  let finish: ((id: string) => void) | undefined;
  mocks.save.mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const back = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BuilderScreen
        userId={userId}
        id={workoutId}
        onBack={back}
        onSaved={() => {}}
        onEquipment={() => {}}
      />
    </FeedbackTestRoot>,
  );
  await screen.findByDisplayValue('Upper A');
  await fireEvent.changeText(screen.getByLabelText('Workout name'), 'Revised');
  await fireEvent.press(screen.getByRole('button', { name: 'Back to My workouts' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save workout' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Discard and leave' }));
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(back).not.toHaveBeenCalled();
  await act(async () => {
    finish?.(workoutId);
  });
});
