import { getSupabase } from '@/lib/supabase/client';
import { recordResult, requireOwner, recordInput } from '@/lib/owned-data';
import { profileService } from '@/features/profile/profile-service';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { localNutritionDate, totalNutrition } from '@/features/nutrition/nutrition-model';
import { habitService } from '@/features/habits/habit-service';
import { monday } from '@/features/habits/habit-model';
import { parseOverview, shiftDate } from '@/features/workouts/training-overview';
import { parsePerformance } from '@/features/workouts/session-model';
import { dayStart } from '@/features/activity/day-model';
import type { Database, Tables } from '@/lib/supabase/database.types';
import type { TrainingOverview } from '@/features/workouts/training-overview';
import {
  goalPayload,
  goalProgress,
  habitGoalFact,
  macroAdherence,
  type Goal,
  type GoalForm,
} from './goal-model';
export type GoalFact = { value: number | null; detail: string };
export const goalService = {
  async list(userId: string, archived = false) {
    await requireOwner(userId);
    const preferences = await profileService.getPreferences(userId),
      today = localNutritionDate(preferences.time_zone),
      rows: Goal[] = [];
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await getSupabase()
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', archived)
        .order('name')
        .order('id')
        .range(offset, offset + 99);
      const page = recordResult(data, error);
      rows.push(...page);
      if (page.length < 100) break;
    }
    return { preferences, today, rows };
  },
  async load(userId: string, id?: string) {
    await requireOwner(userId);
    const preferences = await profileService.getPreferences(userId),
      today = localNutritionDate(preferences.time_zone);
    if (!id) return { preferences, today, goal: null };
    const { data, error } = await getSupabase()
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .single();
    return { preferences, today, goal: recordResult(data, error) };
  },
  async save(userId: string, id: string, form: GoalForm) {
    const payload = recordInput(() => goalPayload(form));
    await requireOwner(userId);
    const { data, error } = await getSupabase().rpc('save_goal', {
      p_user_id: userId,
      p_goal: { ...payload, id, user_id: userId },
    });
    if (recordResult(data, error) !== id) throw new Error('Goal save was not acknowledged. Retry.');
  },
  async archive(userId: string, id: string, archived = true) {
    await requireOwner(userId);
    const { data, error } = await getSupabase()
      .from('goals')
      .update({ archived })
      .eq('user_id', userId)
      .eq('id', id)
      .select('id')
      .single();
    recordResult(data, error);
  },
  async facts(userId: string, goals: Goal[]) {
    await requireOwner(userId);
    const exerciseCache = new Map<
        string,
        Promise<Database['public']['Functions']['get_exercise_performance']['Returns']>
      >(),
      habitCache = new Map<string, Promise<Awaited<ReturnType<typeof habitService.load>>>>(),
      nutritionCache = new Map<
        string,
        Promise<Awaited<ReturnType<typeof nutritionService.diary>>>
      >(),
      activityCache = new Map<string, Promise<Tables<'daily_activity'>[]>>(),
      trainingCache = new Map<string, Promise<TrainingOverview>>();
    function shared<T>(
      cache: Map<string, Promise<T>>,
      key: string,
      load: () => Promise<T>,
    ): Promise<T> {
      const existing = cache.get(key);
      if (existing) return existing;
      const promise = load();
      cache.set(key, promise);
      return promise;
    }
    async function fact(goal: Goal): Promise<GoalFact> {
      const today = localNutritionDate(goal.time_zone),
        date = goal.end_date && goal.end_date < today ? goal.end_date : today,
        from = monday(date);
      if (today < goal.start_date) return { value: null, detail: 'Starts ' + goal.start_date };
      if (goal.metric === 'body_weight' || goal.metric === 'body_measurement') {
        const query =
          goal.metric === 'body_weight'
            ? getSupabase()
                .from('body_weights')
                .select('local_date,weight_kg')
                .eq('user_id', userId)
            : getSupabase()
                .from('body_measurements')
                .select('local_date,value_cm')
                .eq('user_id', userId)
                .eq('measurement', goal.measurement ?? '');
        const { data, error } = await query
          .gte('local_date', goal.start_date)
          .lte('local_date', date)
          .order('local_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw new Error('Body goal data unavailable. Retry.');
        return {
          value: data
            ? 'weight_kg' in data && typeof data.weight_kg === 'number'
              ? data.weight_kg
              : 'value_cm' in data && typeof data.value_cm === 'number'
                ? data.value_cm
                : null
            : null,
          detail: data
            ? 'Last recorded ' + data.local_date
            : 'Log a body record after the goal start.',
        };
      }
      if (goal.metric === 'lift_weight' || goal.metric === 'exercise_pr') {
        const rows = await shared(
          exerciseCache,
          'exercise:' + goal.exercise_id + ':' + date + ':' + goal.time_zone,
          async () => {
            const { data, error } = await getSupabase().rpc('get_exercise_performance', {
              p_exercise_ids: [goal.exercise_id ?? ''],
              p_before: dayStart(shiftDate(date, 1), goal.time_zone).toISOString(),
            });
            return recordResult(data, error);
          },
        );
        const row = rows[0];
        if (!row) throw new Error('Exercise performance unavailable.');
        const performance = parsePerformance(row.previous, row.best);
        return {
          value: goal.metric === 'lift_weight' ? performance.heaviestKg : performance.estimated1rm,
          detail:
            goal.metric === 'exercise_pr'
              ? 'All-time estimated 1RM through ' +
                date +
                '. Epley estimate uses recorded sets of 1–10 reps; not a tested maximum.'
              : 'Heaviest completed external load through ' +
                date +
                '; bodyweight alone has no external-load value.',
        };
      }
      if (goal.metric.startsWith('habit_')) {
        if (!goal.habit_id) throw new Error('Habit source unavailable.');
        const { record } = await shared(habitCache, 'habit:' + goal.habit_id + ':' + date, () =>
          habitService.load(userId, goal.habit_id ?? '', date),
        );
        return habitGoalFact(goal, record, today);
      }
      if (['calories_day', 'protein_day', 'macro_adherence_day'].includes(goal.metric)) {
        const diary = await shared(nutritionCache, 'nutrition:' + date, () =>
          nutritionService.diary(userId, date),
        );
        if (!diary.logs.length)
          return {
            value: null,
            detail: 'No food logged on ' + date + '. Missing entries are not zero intake.',
          };
        const total = totalNutrition(diary.logs);
        return {
          value:
            goal.metric === 'calories_day'
              ? total.calories
              : goal.metric === 'protein_day'
                ? total.protein
                : macroAdherence(total, diary.targets, goal.tolerance),
          detail:
            goal.metric === 'macro_adherence_day'
              ? `Share of calories/protein/carbs/fat within ±${goal.tolerance}% of that date’s saved nutrition targets.`
              : 'Logged intake on ' + date + '. Today’s totals can still change.',
        };
      }
      const activity = await shared(activityCache, 'activity:' + date, async () => {
        const { data, error } = await getSupabase()
          .from('daily_activity')
          .select('*')
          .eq('user_id', userId)
          .gte('local_date', from)
          .lte('local_date', date);
        return recordResult(data, error);
      });
      const day = activity.find((row) => row.local_date === date);
      if (goal.metric === 'steps_day')
        return { value: day?.steps ?? null, detail: 'Recorded daily steps on ' + date };
      if (goal.metric === 'distance_day')
        return {
          value: day?.distance_km ?? null,
          detail: 'Manually recorded daily distance on ' + date + '. GPS is a later release.',
        };
      const training = await shared(
        trainingCache,
        'training:' + date + ':' + goal.start_date,
        async () => {
          const { data, error } = await getSupabase().rpc('get_training_overview', {
            p_from: from > goal.start_date ? from : goal.start_date,
            p_to: date,
          });
          return parseOverview(recordResult(data, error));
        },
      );
      if (goal.metric === 'workouts_week')
        return {
          value: training.sessions,
          detail: 'Completed workout logs this week through ' + date,
        };
      if (goal.metric === 'active_days_week') {
        const dates = new Set([
          ...training.days.filter((day) => day.sessions > 0).map((day) => day.date),
          ...activity
            .filter(
              (row) =>
                row.local_date >= goal.start_date &&
                ((row.steps ?? 0) > 0 || (row.distance_km ?? 0) > 0),
            )
            .map((row) => row.local_date),
        ]);
        return {
          value: dates.size,
          detail:
            'Distinct days this week with completed workouts, positive recorded steps or distance.',
        };
      }
      throw new Error('Unsupported goal source.');
    }
    return Promise.all(
      goals.map(async (goal) => {
        const result = await fact(goal);
        return {
          goal,
          ...result,
          ...goalProgress(goal, result.value, localNutritionDate(goal.time_zone)),
        };
      }),
    );
  },
};
