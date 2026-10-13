import { getSupabase } from '@/lib/supabase/client';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { splitPayload, type SplitDraft } from './split-model';
async function owner(expected: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== expected)
    throw new Error('Account changed. Reopen training splits.');
  return data.user.id;
}
export const splitService = {
  async list(userId: string, offset: number) {
    await owner(userId);
    if (!Number.isInteger(offset) || offset < 0) throw new Error('Invalid page.');
    const { data, error } = await getSupabase()
      .from('training_splits')
      .select('id,name,is_active')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .order('id')
      .range(offset, offset + 10);
    if (error || !data) throw new Error('Unable to load splits. Retry.');
    return { rows: data.slice(0, 10), more: data.length > 10 };
  },
  async load(userId: string, id: string): Promise<SplitDraft | null> {
    if (!validExerciseId(id)) throw new Error('Invalid split.');
    await owner(userId);
    const { data, error } = await getSupabase()
      .from('training_splits')
      .select('*,training_split_days(weekday,is_rest,workout_id,workout_templates(name))')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error('Unable to load split. Retry.');
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      active: data.is_active,
      days: Array.from({ length: 7 }, (_, index) => {
        const day = data.training_split_days.find((entry) => entry.weekday === index);
        return {
          isRest: day?.is_rest ?? false,
          workoutId: day?.workout_id ?? null,
          workoutName: day?.workout_templates?.name ?? null,
        };
      }),
    };
  },
  async save(userId: string, draft: SplitDraft) {
    const days = splitPayload(draft);
    await owner(userId);
    const { data, error } = await getSupabase().rpc('save_training_split', {
      p_id: draft.id,
      p_name: draft.name.trim(),
      p_is_active: draft.active,
      p_days: days,
    });
    if (error || data !== draft.id)
      throw new Error('Unable to save split. Your draft is kept; retry.');
  },
  async remove(userId: string, id: string) {
    if (!validExerciseId(id)) throw new Error('Invalid split.');
    await owner(userId);
    const { data, error } = await getSupabase()
      .from('training_splits')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .select('id');
    if (error || data?.length !== 1)
      throw new Error('Unable to delete split. Reopen the list or retry.');
  },
};
