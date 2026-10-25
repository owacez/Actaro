// Body-map regions and the RepDB muscle slugs each one covers. This mapping is Actaro's own,
// written against our catalogue's taxonomy.
export const muscleRegions = [
  { slug: 'chest', label: 'Chest', catalog: ['pectoralis-major'] },
  {
    slug: 'deltoids',
    label: 'Shoulders',
    catalog: ['anterior-deltoid', 'lateral-deltoid', 'posterior-deltoid', 'supraspinatus'],
  },
  { slug: 'trapezius', label: 'Traps', catalog: ['trapezius'] },
  { slug: 'upper-back', label: 'Upper back', catalog: ['latissimus-dorsi', 'rhomboids'] },
  { slug: 'lower-back', label: 'Lower back', catalog: ['erector-spinae', 'quadratus-lumborum'] },
  { slug: 'serratus', label: 'Serratus', catalog: ['serratus-anterior'] },
  { slug: 'biceps', label: 'Biceps', catalog: ['biceps-brachii', 'brachialis'] },
  { slug: 'triceps', label: 'Triceps', catalog: ['triceps-brachii'] },
  {
    slug: 'forearm',
    label: 'Forearms',
    catalog: ['brachioradialis', 'forearm-extensors', 'forearm-flexors', 'forearms'],
  },
  { slug: 'abs', label: 'Abs', catalog: ['rectus-abdominis', 'transverse-abdominis'] },
  { slug: 'obliques', label: 'Obliques', catalog: ['obliques'] },
  { slug: 'gluteal', label: 'Glutes', catalog: ['gluteus-maximus', 'gluteus-medius', 'abductors'] },
  { slug: 'hip-flexors', label: 'Hip flexors', catalog: ['hip-flexors'] },
  { slug: 'adductors', label: 'Adductors', catalog: ['adductors'] },
  { slug: 'quadriceps', label: 'Quads', catalog: ['quadriceps'] },
  { slug: 'hamstring', label: 'Hamstrings', catalog: ['hamstrings'] },
  { slug: 'calves', label: 'Calves', catalog: ['gastrocnemius', 'soleus'] },
  { slug: 'tibialis', label: 'Shins', catalog: ['tibialis-anterior'] },
] as const;
export type MuscleRegion = (typeof muscleRegions)[number]['slug'];
export function regionOf(slug: string) {
  return muscleRegions.find((region) => region.slug === slug) ?? null;
}

export type MuscleLink = {
  role: 'primary' | 'secondary';
  exercise: { id: string; name: string };
};
export type RegionExercise = { id: string; name: string; primary: boolean };

// One row per exercise: primary if it targets any of the region's muscles directly. Primary
// targets lead, then names alphabetically; an optional name filter narrows the list.
export function regionExercises(links: readonly MuscleLink[], query = ''): RegionExercise[] {
  const byId = new Map<string, RegionExercise>();
  for (const link of links) {
    const current = byId.get(link.exercise.id);
    const primary = link.role === 'primary' || !!current?.primary;
    byId.set(link.exercise.id, { ...link.exercise, primary });
  }
  const needle = query.trim().toLowerCase();
  return [...byId.values()]
    .filter((row) => !needle || row.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.name.localeCompare(b.name));
}

// The body figure that matches the profile; other or unset answers keep the choice open.
export function figureForSex(sex: string | null | undefined): 'male' | 'female' | null {
  return sex === 'male' || sex === 'female' ? sex : null;
}
