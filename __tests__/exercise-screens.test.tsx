import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LibraryScreen } from '@/features/exercises/library-screen';
import { EquipmentScreen } from '@/features/exercises/equipment-screen';
import { DetailScreen } from '@/features/exercises/detail-screen';
import {
  exerciseService,
  type ExerciseDetail,
  type ExerciseSummary,
} from '@/features/exercises/exercise-service';
import { FeedbackTestRoot as FeedbackRoot } from './helpers/feedback-root';

jest.mock('@/features/exercises/exercise-service', () => ({
  exerciseService: {
    catalogs: jest.fn(),
    search: jest.fn(),
    detail: jest.fn(),
    equipmentProfile: jest.fn(),
    saveEquipment: jest.fn(),
  },
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => () => void) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(callback, [callback]);
  },
}));
jest.mock('@/features/exercises/exercise-image', () => ({ ExerciseImage: () => null }));
const mocks = jest.mocked(exerciseService);
const owner = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const summary: ExerciseSummary = {
  id: itemId,
  name: 'Fixture press',
  difficulty: 'beginner',
  muscles: ['Fixture muscle'],
  equipment: ['Fixture bar'],
  thumbnail_path: '',
  total_count: 25,
  imageUrl: null,
};
beforeEach(() => {
  jest.clearAllMocks();
  mocks.catalogs.mockResolvedValue({
    muscles: [{ id: itemId, name: 'Fixture muscle' }],
    equipment: [{ id: itemId, name: 'Fixture bar' }],
  });
  mocks.search.mockResolvedValue([summary]);
  mocks.equipmentProfile.mockResolvedValue([]);
  mocks.saveEquipment.mockResolvedValue([itemId]);
});
test('library searches, paginates, filters and opens the actual exercise ID', async () => {
  const open = jest.fn();
  const add = jest.fn();
  await render(
    <LibraryScreen userId={owner} onOpen={open} onEquipment={() => {}} onAddToWorkout={add} />,
  );
  await screen.findByText('Fixture press');
  await fireEvent.press(screen.getByLabelText('View Fixture press'));
  expect(open).toHaveBeenCalledWith(itemId, summary);
  await fireEvent.press(screen.getByRole('button', { name: 'Add Fixture press to workout' }));
  expect(add).toHaveBeenCalledWith(itemId);
  expect(open).toHaveBeenCalledTimes(1);
  await fireEvent.changeText(screen.getByLabelText('Search exercises'), 'press');
  await fireEvent.press(screen.getByText('Search'));
  await waitFor(() =>
    expect(mocks.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'press', offset: 0 }),
      owner,
    ),
  );
  await screen.findByText('Fixture press');
  await fireEvent.press(screen.getByText('Next'));
  await waitFor(() =>
    expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 24 }), owner),
  );
  await fireEvent.press(screen.getByText('Filters'));
  await fireEvent.press(screen.getByText('Fixture muscle'));
  await waitFor(() =>
    expect(mocks.search).toHaveBeenLastCalledWith(
      expect.objectContaining({ muscleId: itemId, offset: 0 }),
      owner,
    ),
  );
});
test('library shows recoverable errors and an honest empty result', async () => {
  mocks.search.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([]);
  await render(<LibraryScreen userId={owner} onOpen={() => {}} onEquipment={() => {}} />);
  await screen.findByText('Unable to load exercises. Check your connection and retry.');
  await fireEvent.press(screen.getByText('Retry'));
  await screen.findByText('No exercises match. Try another search or clear the filters.');
});
test('equipment blocks duplicate saves, keeps failed drafts, retries and reloads persisted choices', async () => {
  let rejectSave: (error: Error) => void = () => {};
  mocks.saveEquipment.mockImplementationOnce(
    () =>
      new Promise((_, reject) => {
        rejectSave = reject;
      }),
  );
  const result = await render(
    <FeedbackRoot>
      <EquipmentScreen userId={owner} onBack={() => {}} />
    </FeedbackRoot>,
  );
  await screen.findByText('Fixture bar');
  await fireEvent.press(screen.getByText('Fixture bar'));
  await fireEvent.press(screen.getByText('Save equipment'));
  await fireEvent.press(screen.getByLabelText('Save equipment'));
  expect(mocks.saveEquipment).toHaveBeenCalledTimes(1);
  await act(() => rejectSave(new Error('offline')));
  await screen.findByText('Unable to save equipment. Your selection is kept; try again.');
  expect(screen.getByText('1 selected')).toBeTruthy();
  await fireEvent.press(screen.getByText('Save equipment'));
  await waitFor(() => expect(mocks.saveEquipment).toHaveBeenCalledTimes(2));
  mocks.equipmentProfile.mockResolvedValue([itemId]);
  await result.unmount();
  await render(
    <FeedbackRoot>
      <EquipmentScreen userId={owner} onBack={() => {}} />
    </FeedbackRoot>,
  );
  await screen.findByText('1 selected');
});
test('detail shows persisted instructions, muscles, equipment and attribution', async () => {
  const record: ExerciseDetail = {
    id: itemId,
    name: 'Fixture press',
    description: null,
    difficulty: 'beginner',
    category: 'strength',
    movement_pattern: 'push',
    source: 'repdb',
    source_external_id: 'fixture',
    source_revision: 'fixture',
    license: 'Fixture license',
    attribution: 'Exercise data by RepDB (repdb.co)',
    created_at: '2026-01-01',
    instructions: ['Move with control.'],
    exercise_media: [],
    exercise_equipment: [{ equipment: { id: itemId, name: 'Fixture bar' } }],
    exercise_muscles: [{ role: 'primary', muscles: { id: itemId, name: 'Fixture muscle' } }],
  };
  mocks.detail.mockResolvedValue(record);
  const add = jest.fn();
  await render(<DetailScreen id={itemId} onBack={() => {}} onAddToWorkout={add} />);
  await screen.findByText('Fixture press');
  expect(screen.getByText('1. Move with control.')).toBeTruthy();
  expect(screen.getByText('Fixture muscle · primary')).toBeTruthy();
  expect(screen.getByText('Exercise data by RepDB (repdb.co)')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Add to workout' }));
  expect(add).toHaveBeenCalledWith(itemId);
});
