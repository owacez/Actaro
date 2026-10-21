import { getSupabase } from '@/lib/supabase/client';
import { RecordRequestError, recordResult, requireOwner } from '@/lib/owned-data';
import { progressContext, progressPages } from '@/features/progress/progress-service';
import type { ProgressPreset, ProgressRange } from '@/features/progress/progress-period';
import type { Tables } from '@/lib/supabase/database.types';
import { readRunPoints, restoreRun, runSeconds, type RunDraft } from './run-model';

const metricColumns =
  'id,user_id,started_at,ended_at,local_date,time_zone,duration_seconds,moving_seconds,distance_meters,notes,created_at' as const;
const columns = `${metricColumns},route_preview` as const;
export type RunSummary = Omit<Tables<'run_sessions'>, 'route' | 'distance_meters'> & {
  distance_meters: number;
};
function normalize<
  T extends { distance_meters: number | null; duration_seconds: number; moving_seconds: number },
>(row: T) {
  const distance = row.distance_meters;
  if (
    distance === null ||
    !Number.isFinite(distance) ||
    distance < 0 ||
    !Number.isInteger(row.duration_seconds) ||
    row.duration_seconds < 1 ||
    !Number.isInteger(row.moving_seconds) ||
    row.moving_seconds < 0 ||
    row.moving_seconds > row.duration_seconds
  )
    throw new Error('Run metrics are unavailable. Retry.');
  return { ...row, distance_meters: distance };
}
export const runService = {
  async save(userId: string, value: RunDraft) {
    const draft = restoreRun(JSON.stringify(value), userId);
    if (
      draft.status !== 'review' ||
      !draft.endedAt ||
      runSeconds(draft, Date.parse(draft.endedAt)) < 1
    )
      throw new RecordRequestError('Stop and review a run of at least one second before saving.');
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('run_sessions')
      .upsert({
        id: draft.id,
        user_id: userId,
        started_at: draft.startedAt,
        ended_at: draft.endedAt,
        local_date: draft.localDate,
        time_zone: draft.timeZone,
        duration_seconds: runSeconds(draft, Date.parse(draft.endedAt)),
        route: draft.route,
        notes: draft.notes.trim(),
      })
      .select('id')
      .single();
    if (recordResult(data, error).id !== draft.id)
      throw new RecordRequestError('Run save was not acknowledged. Retry the same request.', true);
  },
  async history(userId: string, page = 0) {
    if (!Number.isInteger(page) || page < 0) throw new Error('Invalid run history page.');
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('run_sessions')
      .select(columns)
      .eq('user_id', userId)
      .order('local_date', { ascending: false })
      .order('started_at', { ascending: false })
      .order('id')
      .range(page * 20, page * 20 + 19);
    return recordResult(data, error).map(normalize);
  },
  async recent(userId: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('run_sessions')
      .select(columns)
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error('Recent run is unavailable. Retry.');
    return data ? normalize(data) : null;
  },
  async detail(userId: string, id: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('run_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    const row = normalize(recordResult(data, error));
    return { ...row, points: readRunPoints(row.route) };
  },
  async remove(userId: string, id: string) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('run_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('id', id)
      .select('id');
    recordResult(data, error);
  },
  async progress(userId: string, preset: ProgressPreset, custom?: ProgressRange) {
    const context = await progressContext(userId, 'run_sessions', preset, custom);
    const rows = await progressPages((from, to) =>
      getSupabase()
        .from('run_sessions')
        .select(metricColumns, { count: 'exact' })
        .eq('user_id', userId)
        .gte('local_date', context.from)
        .lte('local_date', context.to)
        .order('local_date')
        .order('id')
        .range(from, to),
    );
    return { ...context, rows: rows.map(normalize) };
  },
};
