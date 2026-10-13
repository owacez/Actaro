import { getSupabase } from '@/lib/supabase/client';
import { trainingService } from './training-service';
import { shiftDate } from './training-overview';
import { recoveryPayload, type RecoveryInput } from './recovery-model';
export const recoveryService = {
  async load(userId: string) {
    const context = await trainingService.load(userId);
    const { data, error } = await getSupabase()
      .from('recovery_check_ins')
      .select('*')
      .eq('user_id', userId)
      .gte('local_date', shiftDate(context.today, -27))
      .lte('local_date', context.today)
      .order('local_date', { ascending: false })
      .limit(28);
    if (error || !data) throw new Error('Unable to load recovery checks. Retry.');
    return { context, rows: data };
  },
  async save(userId: string, date: string, timeZone: string, input: RecoveryInput) {
    const values = recoveryPayload(input);
    const { data: auth, error: authError } = await getSupabase().auth.getUser();
    if (authError || auth.user?.id !== userId)
      throw new Error('Unable to verify account. Your entries are kept; retry.');
    const { data, error } = await getSupabase().rpc('save_recovery_check', {
      p_user_id: userId,
      p_date: date,
      p_time_zone: timeZone,
      p_energy: values.energy,
      p_soreness: values.soreness,
      p_sleep: values.sleep,
      ...(values.stress !== null ? { p_stress: values.stress } : {}),
      p_notes: values.notes,
    });
    if (error || data !== date)
      throw new Error(
        'Unable to save recovery check. Keep this screen open and retry; reload if the date changed.',
      );
  },
};
