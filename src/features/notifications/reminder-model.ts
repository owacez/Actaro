import {
  habitActive,
  habitReached,
  habitToday,
  habitValue,
  habitVersion,
  isoWeekday,
  type HabitRecord,
} from '@/features/habits/habit-model';
import { shiftDate } from '@/features/workouts/training-overview';

// Resolve wall time using actual zone offsets. A spring-forward gap is skipped;
// a repeated fall-back time uses its first occurrence, never two notifications.
export function reminderInstant(date: string, time: string, zone: string) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  if (!Number.isFinite(wall) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new Error('Invalid reminder time.');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  function parts(instant: number) {
    const values = Object.fromEntries(
      formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]),
    );
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
  }
  const candidates = new Set<number>();
  for (const hours of [-36, -12, 0, 12, 36]) {
    const sample = wall + hours * 3600000,
      offset = Date.parse(parts(sample) + ':00Z') - sample;
    const candidate = wall - offset;
    if (parts(candidate) === `${date}T${time}`) candidates.add(candidate);
  }
  return candidates.size ? new Date(Math.min(...candidates)) : null;
}
export function reminderPlan(userId: string, habits: HabitRecord[], now = new Date()) {
  const plans: { identifier: string; date: Date; userId: string }[] = [];
  for (const habit of habits) {
    if (habit.user_id !== userId) throw new Error('Reminder account changed.');
    const today = habitToday(habit, now);
    for (let day = 0; day < 7; day++) {
      const date = shiftDate(today, day),
        version = habitVersion(habit, date);
      if (
        !version?.reminder_time ||
        !habitActive(habit, date) ||
        !version.weekdays.includes(isoWeekday(date)) ||
        habitReached(habit, habitValue(habit, date), version.target)
      )
        continue;
      const instant = reminderInstant(date, version.reminder_time, habit.time_zone);
      if (instant && instant > now)
        plans.push({
          identifier: `actaro:habit:${userId}:${habit.id}:${date}`,
          date: instant,
          userId,
        });
    }
  }
  // ponytail: next seven days, earliest 48 reminders; refill on app open/resume/edit.
  // Leaves headroom under iOS's pending-notification limit; no background sync claim.
  return plans
    .sort((a, b) => a.date.getTime() - b.date.getTime() || a.identifier.localeCompare(b.identifier))
    .slice(0, 48);
}
