import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { MuscleExplorerScreen } from '@/features/muscles/muscle-explorer-screen';
import { muscleRegions, regionExercises } from '@/features/muscles/muscle-model';
import { muscleService } from '@/features/muscles/muscle-service';
import { bodyPaths } from '@/features/muscles/body-paths';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/muscles/muscle-service', () => ({ muscleService: { links: jest.fn() } }));
const service = jest.mocked(muscleService);

// The 31 muscle slugs in the pinned RepDB snapshot (underscores become hyphens on import).
const catalogMuscles = [
  'abductors',
  'adductors',
  'anterior-deltoid',
  'biceps-brachii',
  'brachialis',
  'brachioradialis',
  'erector-spinae',
  'forearm-extensors',
  'forearm-flexors',
  'forearms',
  'gastrocnemius',
  'gluteus-maximus',
  'gluteus-medius',
  'hamstrings',
  'hip-flexors',
  'lateral-deltoid',
  'latissimus-dorsi',
  'obliques',
  'pectoralis-major',
  'posterior-deltoid',
  'quadratus-lumborum',
  'quadriceps',
  'rectus-abdominis',
  'rhomboids',
  'serratus-anterior',
  'soleus',
  'supraspinatus',
  'tibialis-anterior',
  'transverse-abdominis',
  'trapezius',
  'triceps-brachii',
];

beforeEach(() => {
  jest.clearAllMocks();
  service.links.mockResolvedValue([
    { role: 'secondary', exercise: { id: 'b', name: 'Push-up' } },
    { role: 'primary', exercise: { id: 'a', name: 'Bench Press' } },
    { role: 'secondary', exercise: { id: 'a', name: 'Bench Press' } },
    { role: 'primary', exercise: { id: 'c', name: 'Cable Fly' } },
  ]);
});

test('every catalogue muscle belongs to exactly one body region drawn on the map', () => {
  for (const muscle of catalogMuscles)
    expect(
      muscleRegions.filter((region) => region.catalog.some((slug) => slug === muscle)),
    ).toHaveLength(1);
  const drawn = new Set(
    Object.values(bodyPaths).flatMap((figure) =>
      Object.values(figure).flatMap((side) => Object.keys(side.parts)),
    ),
  );
  for (const region of muscleRegions) expect(drawn.has(region.slug)).toBe(true);
});

test('one row per exercise, primary targets first, then by name, with a name filter', () => {
  const links = [
    { role: 'secondary' as const, exercise: { id: 'b', name: 'Push-up' } },
    { role: 'secondary' as const, exercise: { id: 'a', name: 'Bench Press' } },
    { role: 'primary' as const, exercise: { id: 'a', name: 'Bench Press' } },
    { role: 'primary' as const, exercise: { id: 'c', name: 'Cable Fly' } },
  ];
  expect(regionExercises(links)).toEqual([
    { id: 'a', name: 'Bench Press', primary: true },
    { id: 'c', name: 'Cable Fly', primary: true },
    { id: 'b', name: 'Push-up', primary: false },
  ]);
  expect(regionExercises(links, 'push').map((row) => row.id)).toEqual(['b']);
});

test('choosing a muscle lists its exercises; tapping one opens it', async () => {
  const open = jest.fn();
  await render(
    <FeedbackTestRoot>
      <MuscleExplorerScreen onBack={jest.fn()} onOpen={open} />
    </FeedbackTestRoot>,
  );
  expect(service.links).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Chest' }));
  expect(service.links).toHaveBeenCalledWith('chest');
  await screen.findByText('Chest · 3 exercises');
  expect(screen.getByRole('button', { name: 'Bench Press' })).toBeTruthy();
  expect(screen.getAllByText('Primary target')).toHaveLength(2);
  expect(screen.getByText('Also trains')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Filter Chest exercises'), 'cable');
  expect(screen.queryByRole('button', { name: 'Bench Press' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Cable Fly' }));
  expect(open).toHaveBeenCalledWith('c');
  // Tapping the selected muscle again clears it.
  await fireEvent.press(screen.getByRole('button', { name: 'Chest' }));
  expect(screen.queryByText(/Chest · /)).toBeNull();
});
