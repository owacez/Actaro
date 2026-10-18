import type { Database } from '@/lib/supabase/database.types';
import {
  numeric,
  nutritionDate as validDate,
  localNutritionDate as localDate,
} from '@/features/nutrition/nutrition-model';
import { shiftDate } from '@/features/workouts/training-overview';
export type Habit = Database['public']['Tables']['habits']['Row'];
export type HabitVersion = Database['public']['Tables']['habit_versions']['Row'];
export type HabitLog = Database['public']['Tables']['habit_logs']['Row'];
export type HabitRecord = Habit & { habit_versions: HabitVersion[]; habit_logs: HabitLog[] };
export const habitKinds = ['boolean', 'numeric', 'duration', 'frequency', 'avoidance'] as const;
export type HabitKind = (typeof habitKinds)[number];
export const habitTypeInfo = {
  boolean: { label: 'Check off', detail: 'A simple done/not done action, such as stretching.' },
  numeric: {
    label: 'Count or amount',
    detail: 'Track a daily amount, such as glasses of water or pages read.',
  },
  duration: {
    label: 'Minutes',
    detail: 'Record time spent each day, such as 20 minutes of reading.',
  },
  frequency: {
    label: 'Times per week',
    detail: 'Aim for a total number of occurrences from Monday to Sunday.',
  },
  avoidance: {
    label: 'Limit a habit',
    detail: 'Stay at or below a daily limit. Log zero when there were no occurrences.',
  },
};

// Patch only after the server acknowledges the date-keyed log; never optimistic success.
export function acknowledgedHabitLog(
  record: HabitRecord,
  date: string,
  value: number,
  notes = '',
): HabitRecord {
  const version = habitVersion(record, date);
  if (!version) return record;
  const old = record.habit_logs.find((log) => log.local_date === date);
  const now = new Date().toISOString();
  return {
    ...record,
    habit_logs: [
      ...record.habit_logs.filter((log) => log.local_date !== date),
      {
        habit_id: record.id,
        user_id: record.user_id,
        local_date: date,
        value,
        notes,
        version_id: version.id,
        created_at: old?.created_at ?? now,
        updated_at: now,
      },
    ],
  };
}
export const motivationModes = [
  { key: 'streak', label: 'Streaks' },
  { key: 'weekly', label: 'Weekly consistency' },
  { key: 'percentage', label: 'Completion %' },
  { key: 'none', label: 'None' },
] as const;
export const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export function isoWeekday(date: string) {
  return ((new Date(validDate(date) + 'T12:00:00Z').getUTCDay() + 6) % 7) + 1;
}
export function monday(date: string) {
  return shiftDate(date, 1 - isoWeekday(date));
}
export function habitVersion(habit: HabitRecord, date: string) {
  return (
    habit.habit_versions
      .filter((version) => version.effective_from <= date)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ?? null
  );
}
export function habitToday(habit: HabitRecord, now = new Date()) {
  return localDate(habit.time_zone, now);
}
export function habitActive(habit: HabitRecord, date: string) {
  const version = habitVersion(habit, date);
  return (
    !habit.archived &&
    date >= habit.start_date &&
    version !== null &&
    (version.end_date === null || date <= version.end_date)
  );
}
export function habitValue(habit: HabitRecord, date: string, notBefore?: string): number | null {
  if (habit.kind === 'frequency') {
    const from = monday(date),
      version = habitVersion(habit, date);
    return habit.habit_logs
      .filter(
        (log) =>
          log.local_date >= from &&
          log.local_date <= date &&
          log.local_date >= habit.start_date &&
          (!notBefore || log.local_date >= notBefore) &&
          (!version?.end_date || log.local_date <= version.end_date),
      )
      .reduce((sum, log) => sum + log.value, 0);
  }
  return habit.habit_logs.find((log) => log.local_date === date)?.value ?? null;
}
export function habitReached(habit: HabitRecord, value: number | null, target: number) {
  return value !== null && (habit.kind === 'avoidance' ? value <= target : value >= target);
}
export type HabitPeriod = {
  date: string;
  end: string;
  value: number | null;
  target: number;
  status: 'done' | 'missed' | 'pending' | 'rest';
  partial: boolean;
};
export function habitPeriods(habit: HabitRecord, today: string, days = 90): HabitPeriod[] {
  const from = shiftDate(today, 1 - days),
    periods: HabitPeriod[] = [],
    seen = new Set<string>();
  for (let day = from; day <= today; day = shiftDate(day, 1)) {
    const weekly = habit.kind === 'frequency',
      start = weekly ? monday(day) : day,
      end = weekly ? shiftDate(start, 6) : day;
    if (seen.has(start)) continue;
    seen.add(start);
    const asOf = end < today ? end : today,
      version = habitVersion(habit, asOf);
    if (
      !version ||
      asOf < habit.start_date ||
      (version.end_date !== null && start > version.end_date)
    )
      continue;
    const partial =
      weekly &&
      (habit.start_date > start || (!!version.end_date && version.end_date < end) || start < from);
    const scheduled = weekly || version.weekdays.includes(isoWeekday(day));
    const value = weekly
      ? habit.habit_logs
          .filter(
            (log) =>
              log.local_date >= start &&
              log.local_date <= asOf &&
              log.local_date >= habit.start_date &&
              (!version.end_date || log.local_date <= version.end_date),
          )
          .reduce((sum, log) => sum + log.value, 0)
      : habitValue(habit, day);
    periods.push({
      date: start,
      end,
      value,
      target: version.target,
      partial,
      status: !scheduled
        ? 'rest'
        : habitReached(habit, value, version.target)
          ? 'done'
          : end < today
            ? 'missed'
            : 'pending',
    });
  }
  return periods;
}
export function habitConsistency(habit: HabitRecord, today: string) {
  const periods = habitPeriods(habit, today),
    eligible = periods.filter(
      (period) => !period.partial && (period.status === 'done' || period.status === 'missed'),
    );
  let streak = 0;
  for (const period of [...periods].reverse()) {
    if (period.partial || period.status === 'rest' || period.status === 'pending') continue;
    if (period.status === 'missed') break;
    streak++;
  }
  const completed = eligible.filter((period) => period.status === 'done').length,
    lastWeekStart = shiftDate(monday(today), -7),
    lastWeekEnd = shiftDate(lastWeekStart, 6),
    week = eligible.filter((period) => period.date >= lastWeekStart && period.date <= lastWeekEnd);
  return {
    periods,
    streak,
    atLeast:
      streak > 0 &&
      !eligible.some((period) => period.status === 'missed') &&
      habit.start_date < shiftDate(today, -89),
    completed,
    expected: eligible.length,
    percentage: eligible.length ? (completed / eligible.length) * 100 : null,
    lastWeekPercentage: week.length
      ? (week.filter((period) => period.status === 'done').length / week.length) * 100
      : null,
  };
}
export function reminderDue(habit: HabitRecord, now = new Date()) {
  const date = habitToday(habit, now),
    version = habitVersion(habit, date);
  if (
    !version?.reminder_time ||
    !habitActive(habit, date) ||
    !version.weekdays.includes(isoWeekday(date)) ||
    habitReached(habit, habitValue(habit, date), version.target)
  )
    return false;
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: habit.time_zone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return time >= version.reminder_time;
}
export type HabitForm = {
  name: string;
  kind: HabitKind;
  unit: string;
  start: string;
  zone: string;
  target: string;
  days: number[];
  end: string;
  motivation: string;
  reminder: string;
};
export function habitPayload(form: HabitForm) {
  if (!form.name.trim() || form.name.trim().length > 120)
    throw new Error('Enter a habit name up to 120 characters.');
  if (!habitKinds.includes(form.kind)) throw new Error('Choose a habit type.');
  const target =
    form.kind === 'boolean'
      ? 1
      : numeric(form.target, 'target', 1000000, form.kind === 'avoidance');
  if (['frequency', 'avoidance'].includes(form.kind) && !Number.isInteger(target))
    throw new Error('Use a whole-number occurrence target.');
  const unit =
    form.kind === 'boolean'
      ? 'done'
      : form.kind === 'duration'
        ? 'minutes'
        : ['frequency', 'avoidance'].includes(form.kind)
          ? 'times'
          : form.unit.trim();
  if (!unit || unit.length > 40) throw new Error('Enter a unit up to 40 characters.');
  if (
    !form.days.length ||
    new Set(form.days).size !== form.days.length ||
    form.days.some((day) => !Number.isInteger(day) || day < 1 || day > 7)
  )
    throw new Error('Choose at least one distinct scheduled weekday.');
  const start = validDate(form.start),
    end = form.end.trim() ? validDate(form.end) : null;
  if (end !== null && end < start) throw new Error('End date cannot precede start.');
  if (!motivationModes.some((mode) => mode.key === form.motivation))
    throw new Error('Choose a progress style.');
  if (form.reminder && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.reminder))
    throw new Error('Enter reminder time as HH:MM (24-hour).');
  return {
    name: form.name.trim(),
    kind: form.kind,
    unit,
    start,
    zone: form.zone,
    target,
    days: [...form.days].sort(),
    end,
    motivation: form.motivation,
    reminder: form.reminder || null,
  };
}
export function logValue(habit: HabitRecord, input: string) {
  const value = numeric(input, 'logged value', 1000000, true);
  if (habit.kind === 'boolean' && ![0, 1].includes(value))
    throw new Error('Choose Done or Not done.');
  if (['frequency', 'avoidance'].includes(habit.kind) && !Number.isInteger(value))
    throw new Error('Enter a whole-number count.');
  return value;
}
