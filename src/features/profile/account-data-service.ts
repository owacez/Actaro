import { getSupabase } from '@/lib/supabase/client';
import { requireOwner } from '@/lib/owned-data';
import { progressPages } from '@/features/progress/progress-service';
import { sessionStore } from '@/features/workouts/session-store';
import type { Database } from '@/lib/supabase/database.types';

// Explicit allowlist: no auth tokens, shared catalogs, storage credentials or other owners.
export const exportTables = {
  profiles: ['id'],
  user_preferences: ['user_id'],
  user_equipment: ['equipment_id'],
  workout_templates: ['id'],
  workout_template_exercises: ['id'],
  workout_template_sets: ['id'],
  workout_sessions: ['id'],
  workout_session_exercises: ['id'],
  workout_sets: ['id'],
  training_splits: ['id'],
  training_split_days: ['split_id', 'weekday'],
  recovery_check_ins: ['local_date'],
  foods: ['id'],
  food_logs: ['id'],
  food_favorites: ['food_id'],
  saved_meals: ['id'],
  nutrition_copy_requests: ['id'],
  nutrition_targets: ['user_id'],
  nutrition_target_history: ['effective_date'],
  water_logs: ['id'],
  habits: ['id'],
  habit_versions: ['id'],
  habit_logs: ['habit_id', 'local_date'],
  goals: ['id'],
  body_weights: ['local_date'],
  body_measurements: ['local_date', 'measurement'],
  daily_activity: ['local_date'],
  activity_targets: ['user_id'],
} as const satisfies Partial<{
  [
    K in keyof Database['public']['Tables']
  ]: readonly (keyof Database['public']['Tables'][K]['Row'])[];
}>;

export async function exportAccount(userId: string) {
  await requireOwner(userId);
  const startedAt = new Date().toISOString(),
    client = getSupabase();
  const account = await client.auth.getUser();
  if (account.error || account.data.user?.id !== userId) throw new Error('Sign in again.');
  const records: Record<string, unknown[]> = {};
  // Sequential bounded pages avoid a burst of requests on a personal/free project.
  for (const table of Object.keys(exportTables) as (keyof typeof exportTables)[]) {
    records[table] = await progressPages((from, to) => {
      let query = client
        .from(table)
        .select('*', { count: 'exact' })
        .filter(table === 'profiles' ? 'id' : 'user_id', 'eq', userId);
      for (const column of exportTables[table]) query = query.order(column);
      return query.range(from, to);
    });
  }
  const activeWorkout = await sessionStore.read(userId);
  await requireOwner(userId);
  return {
    format: 'actaro-export',
    version: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    note: 'Records collected during this interval, not a transactional backup. Avoid editing while exporting. Shared reference catalogs are excluded. Active workout is from this device only.',
    account: {
      id: userId,
      email: account.data.user.email,
      createdAt: account.data.user.created_at,
    },
    records,
    activeWorkout,
  };
}

export async function deleteOwnAccount(userId: string, password: string, confirmation: string) {
  if (confirmation !== 'DELETE' || !password || password.length > 256)
    throw new Error('Enter your password and type DELETE.');
  const client = getSupabase(),
    saved = await client.auth.getSession(),
    session = saved.data.session;
  if (saved.error || !session || session.user.id !== userId)
    throw new Error('Your account changed. Sign in again.');
  const verified = await client.auth.getUser(session.access_token);
  if (verified.error || verified.data.user?.id !== userId) throw new Error('Sign in again.');
  const { data, error } = await client.functions.invoke('delete-account', {
    // Bind the destructive request to the verified session even if another tab changes accounts.
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: { password, confirmation },
  });
  if (error || data?.deleted !== true)
    throw new Error(
      'Deletion was not confirmed. Check your password and connection. If access was lost, sign in again to check before retrying.',
    );
}
