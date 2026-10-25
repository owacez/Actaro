import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MuscleExplorerScreen } from '@/features/muscles/muscle-explorer-screen';
import { figureForSex, muscleRegions, regionExercises } from '@/features/muscles/muscle-model';
import { profileService } from '@/features/profile/profile-service';
import { muscleService } from '@/features/muscles/muscle-service';
import { bodyPaths } from '@/features/muscles/body-paths';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/muscles/muscle-service', () => ({ muscleService: { links: jest.fn() } }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getProfile: jest.fn() },
}));
const profile = (sex: string | null) => ({
  id: 'owner',
  display_name: null,
  sex,
  date_of_birth: null,
  location: null,
  created_at: '',
  updated_at: '',
});
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
  jest.mocked(profileService.getProfile).mockResolvedValue(profile(null));
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
      <MuscleExplorerScreen userId="owner" onBack={jest.fn()} onOpen={open} />
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

test('the profile picks the figure; other or unset answers keep the choice', async () => {
  expect(figureForSex('male')).toBe('male');
  expect(figureForSex('female')).toBe('female');
  for (const sex of ['intersex', 'prefer_not_to_say', null, undefined])
    expect(figureForSex(sex)).toBeNull();
  for (const [sex, toggle] of [
    ['male', false],
    ['female', false],
    ['intersex', true],
    [null, true],
  ] as const) {
    jest.mocked(profileService.getProfile).mockResolvedValue(profile(sex));
    const view = await render(
      <FeedbackTestRoot>
        <MuscleExplorerScreen userId="owner" onBack={jest.fn()} onOpen={jest.fn()} />
      </FeedbackTestRoot>,
    );
    await waitFor(() => expect(profileService.getProfile).toHaveBeenCalled());
    if (toggle) await screen.findByRole('button', { name: 'Female figure' });
    else expect(screen.queryByRole('button', { name: 'Female figure' })).toBeNull();
    await view.unmount();
    jest.mocked(profileService.getProfile).mockClear();
  }
  // A profile that cannot load keeps the choice available.
  jest.mocked(profileService.getProfile).mockRejectedValue(new Error('offline'));
  await render(
    <FeedbackTestRoot>
      <MuscleExplorerScreen userId="owner" onBack={jest.fn()} onOpen={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByRole('button', { name: 'Male figure' });
});
