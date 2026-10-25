import { getSupabase } from '@/lib/supabase/client';
import { muscleRegions, type MuscleLink, type MuscleRegion } from './muscle-model';

export const muscleService = {
  // Exercise links for every catalogue muscle in a body-map region, primary and secondary.
  async links(region: MuscleRegion): Promise<MuscleLink[]> {
    const entry = muscleRegions.find((item) => item.slug === region);
    if (!entry) throw new Error('Unknown muscle region.');
    const { data, error } = await getSupabase()
      .from('exercise_muscles')
      .select('role,muscles!inner(slug),exercises!inner(id,name)')
      .in('muscles.slug', [...entry.catalog])
      .limit(1000);
    if (error || !data) throw new Error('Unable to load exercises for this muscle. Retry.');
    return data.flatMap((row) =>
      row.role === 'primary' || row.role === 'secondary'
        ? [{ role: row.role, exercise: { id: row.exercises.id, name: row.exercises.name } }]
        : [],
    );
  },
};
