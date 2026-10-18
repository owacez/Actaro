import { getSupabase } from '@/lib/supabase/client';
import type { Database, Tables } from '@/lib/supabase/database.types';

export type CatalogEntry = Pick<Tables<'equipment'>, 'id' | 'name'>;
export type ExerciseSummary =
  Database['public']['Functions']['search_exercises']['Returns'][number] & {
    imageUrl: string | null;
  };
export type SearchFilters = {
  query: string;
  muscleId?: string;
  equipmentId?: string;
  bodyweight: boolean;
  availableOnly: boolean;
  offset: number;
};
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function validExerciseId(value: unknown): value is string {
  return typeof value === 'string' && uuidPattern.test(value);
}

async function safe<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch {
    throw new Error('Unable to load or save exercises. Check your connection and try again.');
  }
}
async function identity(expectedUserId: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== expectedUserId) throw new Error('Account changed');
  return data.user.id;
}
export async function mediaUrls(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const { data, error } = await getSupabase()
    .storage.from('exercise-media')
    .createSignedUrls(unique, 3600);
  // Reference data remains useful if Storage fails; the screen offers refresh.
  if (error) return new Map<string, string>();
  return new Map(
    (data ?? []).flatMap((entry) =>
      entry.path && entry.signedUrl && !entry.error ? [[entry.path, entry.signedUrl]] : [],
    ),
  );
}

export const exerciseService = {
  image(id: string) {
    return safe(async () => {
      if (!validExerciseId(id)) throw new Error('Invalid exercise');
      const { data, error } = await getSupabase()
        .from('exercise_media')
        .select('storage_path,pose')
        .eq('exercise_id', id);
      if (error || !data) throw new Error('Exercise media unavailable');
      const media = data.find((item) => item.pose === 'start') ?? data[0];
      if (!media) return null;
      const urls = await mediaUrls([media.storage_path]);
      return urls.get(media.storage_path) ?? null;
    });
  },
  catalogs() {
    return safe(async () => {
      const [muscles, equipment] = await Promise.all([
        getSupabase().from('muscles').select('id,name').order('name'),
        getSupabase().from('equipment').select('id,name').order('name'),
      ]);
      if (muscles.error || equipment.error || !muscles.data || !equipment.data)
        throw new Error('Catalog unavailable');
      return { muscles: muscles.data, equipment: equipment.data };
    });
  },
  search(filters: SearchFilters, userId: string) {
    return safe(async () => {
      if (
        filters.query.length > 120 ||
        !Number.isInteger(filters.offset) ||
        filters.offset < 0 ||
        (filters.muscleId && !validExerciseId(filters.muscleId)) ||
        (filters.equipmentId && !validExerciseId(filters.equipmentId))
      )
        throw new Error('Invalid search');
      if (filters.availableOnly) await identity(userId);
      const { data, error } = await getSupabase().rpc('search_exercises', {
        p_query: filters.query.trim(),
        p_muscle_id: filters.muscleId,
        p_equipment_id: filters.equipmentId,
        p_bodyweight: filters.bodyweight,
        p_available_only: filters.availableOnly,
        p_offset: filters.offset,
        p_limit: 24,
      });
      if (error || !data) throw new Error('Search failed');
      const urls = await mediaUrls(data.map((entry) => entry.thumbnail_path));
      return data.map((entry) => ({ ...entry, imageUrl: urls.get(entry.thumbnail_path) ?? null }));
    });
  },
  detail(id: string) {
    return safe(async () => {
      if (!validExerciseId(id)) throw new Error('Invalid exercise');
      const { data, error } = await getSupabase()
        .from('exercises')
        .select(
          '*,exercise_muscles(role,muscles(id,name)),exercise_equipment(equipment(id,name)),exercise_media(*)',
        )
        .eq('id', id)
        .maybeSingle();
      if (error || !data) throw new Error('Exercise unavailable');
      const urls = await mediaUrls(data.exercise_media.map((entry) => entry.storage_path));
      return {
        ...data,
        exercise_media: data.exercise_media.map((entry) => ({
          ...entry,
          imageUrl: urls.get(entry.storage_path) ?? null,
        })),
      };
    });
  },
  equipmentProfile(userId: string) {
    return safe(async () => {
      const id = await identity(userId);
      const { data, error } = await getSupabase()
        .from('user_equipment')
        .select('equipment_id')
        .eq('user_id', id);
      if (error || !data) throw new Error('Equipment unavailable');
      return data.map((entry) => entry.equipment_id);
    });
  },
  saveEquipment(ids: string[], userId: string) {
    return safe(async () => {
      if (ids.length > 100 || ids.some((id) => !validExerciseId(id)))
        throw new Error('Invalid equipment');
      await identity(userId);
      const { data, error } = await getSupabase().rpc('save_equipment_profile', {
        p_equipment_ids: [...new Set(ids)],
      });
      if (error || !data) throw new Error('Save failed');
      return data.map((entry) => entry.equipment_id);
    });
  },
};
export type ExerciseDetail = Awaited<ReturnType<typeof exerciseService.detail>>;
