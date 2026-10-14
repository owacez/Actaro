import type { Tables } from '@/lib/supabase/database.types';
import { weightProgress, type WeightPoint } from '@/features/body/weight-progress-model';
import { totalNutrition, normalizeFoodLog } from '@/features/nutrition/nutrition-model';
import { macroAdherence } from '@/features/goals/goal-model';
import { periodDays, type ProgressRange } from './progress-period';
import type { TrainingOverview } from '@/features/workouts/training-overview';
import { estimated1rm } from '@/features/workouts/training-metrics';
import {
  monday,
  habitPeriods,
  habitToday,
  habitVersion,
  type HabitRecord,
} from '@/features/habits/habit-model';
import { shiftDate } from '@/features/workouts/training-overview';

export type SummarySources = {
  logs: Tables<'food_logs'>[];
  targets: Tables<'nutrition_target_history'>[];
  training: TrainingOverview;
  activity: Tables<'daily_activity'>[];
  habits: HabitRecord[];
  weights: WeightPoint[];
};
type PeriodSummary = ProgressRange & {
  partial: boolean;
  days: number;
  nutrition: ReturnType<typeof nutritionProgress>;
  steps: ReturnType<typeof stepsProgress>;
  habits: ReturnType<typeof habitsProgress>;
  weight: ReturnType<typeof weightProgress>;
  workouts: number;
  sets: number;
  volumeKg: number;
  unknownWeightSets: number;
};
export function periodSummaries(
  sources: SummarySources,
  range: ProgressRange,
  group: 'week' | 'month',
  now = new Date(),
) {
  const rows: PeriodSummary[] = [];
  for (let from = range.from; from <= range.to;) {
    const start = group === 'week' ? monday(from) : from.slice(0, 7) + '-01',
      next =
        group === 'week'
          ? shiftDate(start, 7)
          : new Date(Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)), 1, 12))
              .toISOString()
              .slice(0, 10),
      end = shiftDate(next, -1),
      to = end < range.to ? end : range.to,
      bounds = { from, to };
    const nutrition = nutritionProgress(sources.logs, sources.targets, bounds),
      steps = stepsProgress(sources.activity, bounds),
      habits = habitsProgress(sources.habits, bounds, now),
      weight = weightProgress(sources.weights, from, to),
      training = sources.training.days.filter((day) => day.date >= from && day.date <= to),
      days = periodDays(from, to);
    const row = {
      from,
      to,
      partial: from !== start || to !== end,
      days,
      nutrition,
      steps,
      habits,
      weight,
      workouts: training.reduce((sum, day) => sum + day.sessions, 0),
      sets: training.reduce((sum, day) => sum + day.sets, 0),
      volumeKg: training.reduce((sum, day) => sum + day.volumeKg, 0),
      unknownWeightSets: training.reduce((sum, day) => sum + day.unknownWeightSets, 0),
    };
    rows.push(row);
    from = next;
  }
  const percent = (current: number | null, previous: number | null) =>
    current === null || previous === null || previous === 0
      ? null
      : ((current - previous) / previous) * 100;
  return rows.map((row, index) => {
    const previous = rows[index - 1],
      comparable = previous && !previous.partial && !row.partial;
    return {
      ...row,
      comparison: comparable
        ? {
            from: previous.from,
            to: previous.to,
            energy: percent(
              row.nutrition.average?.calories ?? null,
              previous.nutrition.average?.calories ?? null,
            ),
            steps: percent(row.steps.average, previous.steps.average),
            workoutRate: percent(row.workouts / row.days, previous.workouts / previous.days),
          }
        : null,
    };
  });
}

export function stepsProgress(rows: Tables<'daily_activity'>[], range: ProgressRange) {
  const days = [...rows]
    .filter((row) => row.local_date >= range.from && row.local_date <= range.to)
    .sort((a, b) => a.local_date.localeCompare(b.local_date));
  const steps = days.filter((row): row is typeof row & { steps: number } => row.steps !== null);
  if (steps.some((row) => !Number.isInteger(row.steps) || row.steps < 0 || row.steps > 1000000))
    throw new Error('Recorded steps unavailable. Retry.');
  const total = steps.reduce((sum, row) => sum + row.steps, 0),
    distance = days.filter((row) => row.distance_km !== null);
  return {
    days,
    count: steps.length,
    calendarDays: periodDays(range.from, range.to),
    total,
    average: steps.length ? total / steps.length : null,
    best: steps.length ? Math.max(...steps.map((row) => row.steps)) : null,
    recordedDistance: distance.length
      ? distance.reduce((sum, row) => sum + (row.distance_km ?? 0), 0)
      : null,
  };
}
export function habitsProgress(records: HabitRecord[], range: ProgressRange, now = new Date()) {
  const rows = records
    .filter((record) => !record.archived)
    .map((record) => {
      const today = habitToday(record, now),
        until = range.to < today ? range.to : today;
      if (until < range.from)
        return {
          record,
          periods: [],
          completed: 0,
          expected: 0,
          percentage: null,
          streak: 0,
          atLeast: false,
          motivation: 'none',
        };
      const periods = habitPeriods(record, until, periodDays(range.from, until)).map((period) => {
        const partial = period.partial || (record.kind === 'frequency' && period.end > range.to);
        return {
          ...period,
          partial,
          status:
            period.status === 'pending' && period.end < today ? ('missed' as const) : period.status,
        };
      });
      const eligible = periods.filter(
          (period) => !period.partial && (period.status === 'done' || period.status === 'missed'),
        ),
        completed = eligible.filter((period) => period.status === 'done').length;
      let streak = 0;
      for (const period of [...periods].reverse()) {
        if (period.partial || period.status === 'rest' || period.status === 'pending') continue;
        if (period.status === 'missed') break;
        streak++;
      }
      return {
        record,
        periods,
        completed,
        expected: eligible.length,
        percentage: eligible.length ? (completed / eligible.length) * 100 : null,
        streak,
        atLeast:
          streak > 0 &&
          !eligible.some((period) => period.status === 'missed') &&
          record.start_date < range.from,
        motivation: habitVersion(record, until)?.motivation ?? 'none',
      };
    });
  const completed = rows.reduce((sum, row) => sum + row.completed, 0),
    expected = rows.reduce((sum, row) => sum + row.expected, 0);
  return {
    rows,
    completed,
    expected,
    percentage: expected ? (completed / expected) * 100 : null,
    archivedExcluded: records.filter((record) => record.archived).length,
  };
}

export type ProgressSession = Pick<
  Tables<'workout_sessions'>,
  'id' | 'local_date' | 'mode' | 'duration_seconds'
>;
export function workoutFrequency(
  overview: TrainingOverview,
  sessions: ProgressSession[],
  range: ProgressRange,
) {
  if (sessions.length !== overview.sessions) throw new Error('Workout history changed. Retry.');
  const days = periodDays(range.from, range.to),
    timed = sessions.filter((session) => session.mode === 'timed');
  return {
    count: overview.sessions,
    activeDays: overview.activeDays,
    calendarDays: days,
    perWeek: (overview.sessions * 7) / days,
    timed: timed.length,
    logOnly: sessions.filter((session) => session.mode === 'log_only').length,
    timedSeconds: timed.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0),
  };
}
export type StrengthSet = {
  date: string;
  exerciseId: string;
  name: string;
  reps: number;
  weightKg: number | null;
};
export function strengthProgress(sets: StrengthSet[]) {
  const exercises = new Map<
    string,
    {
      id: string;
      name: string;
      sets: number;
      unknown: number;
      days: Map<string, { date: string; heaviest: number | null; estimate: number | null }>;
    }
  >();
  for (const set of sets) {
    if (
      !Number.isInteger(set.reps) ||
      set.reps < 1 ||
      (set.weightKg !== null && (!Number.isFinite(set.weightKg) || set.weightKg < 0))
    )
      throw new Error('Recorded set unavailable. Retry.');
    const exercise = exercises.get(set.exerciseId) ?? {
      id: set.exerciseId,
      name: set.name,
      sets: 0,
      unknown: 0,
      days: new Map(),
    };
    const day = exercise.days.get(set.date) ?? { date: set.date, heaviest: null, estimate: null },
      estimate = estimated1rm({ reps: set.reps, weightKg: set.weightKg });
    exercise.sets++;
    if (set.weightKg === null) exercise.unknown++;
    if (set.weightKg !== null && set.weightKg > 0)
      day.heaviest = Math.max(day.heaviest ?? 0, set.weightKg);
    if (estimate !== null) day.estimate = Math.max(day.estimate ?? 0, estimate);
    exercise.days.set(set.date, day);
    exercises.set(set.exerciseId, exercise);
  }
  return [...exercises.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((exercise) => {
      const days = [...exercise.days.values()].sort((a, b) => a.date.localeCompare(b.date)),
        loaded = days.filter((day) => day.heaviest !== null),
        estimates = days.filter((day) => day.estimate !== null);
      return {
        ...exercise,
        days,
        bestKg: loaded.length
          ? loaded.reduce((max, day) => Math.max(max, day.heaviest ?? 0), 0)
          : null,
        bestEstimate: estimates.length
          ? estimates.reduce((max, day) => Math.max(max, day.estimate ?? 0), 0)
          : null,
        first: loaded[0] ?? null,
        latest: loaded.at(-1) ?? null,
        change:
          loaded.length > 1 ? (loaded.at(-1)?.heaviest ?? 0) - (loaded[0].heaviest ?? 0) : null,
      };
    });
}

export function nutritionProgress(
  logs: Tables<'food_logs'>[],
  targets: Tables<'nutrition_target_history'>[],
  range: ProgressRange,
) {
  const groups = new Map<string, ReturnType<typeof normalizeFoodLog>[]>();
  for (const log of logs) {
    if (log.local_date < range.from || log.local_date > range.to) continue;
    const rows = groups.get(log.local_date) ?? [];
    rows.push(normalizeFoodLog(log));
    groups.set(log.local_date, rows);
  }
  const history = [...targets].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const days = [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, rows]) => {
      const total = totalNutrition(rows),
        target = history.filter((row) => row.effective_date <= date).at(-1) ?? null;
      return {
        date,
        ...total,
        target,
        adherence: macroAdherence(total, target, 10),
        proteinReached: target && target.protein > 0 ? total.protein >= target.protein : null,
      };
    });
  const count = days.length,
    total = totalNutrition(days),
    eligible = days.filter((day) => day.adherence !== null),
    proteinDays = days.filter((day) => day.proteinReached !== null);
  return {
    days,
    count,
    calendarDays: periodDays(range.from, range.to),
    total,
    average: count
      ? {
          calories: total.calories / count,
          protein: total.protein / count,
          carbs: total.carbs / count,
          fat: total.fat / count,
        }
      : null,
    adherence: eligible.length
      ? eligible.reduce((sum, day) => sum + (day.adherence ?? 0), 0) / eligible.length
      : null,
    eligibleDays: eligible.length,
    proteinDays: proteinDays.length,
    proteinReachedDays: proteinDays.filter((day) => day.proteinReached).length,
  };
}
