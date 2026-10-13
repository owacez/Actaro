export type TrainingDay = {
  date: string;
  sessions: number;
  sets: number;
  reps: number;
  volumeKg: number;
  unknownWeightSets: number;
};
export type TrainingOverview = {
  sessions: number;
  activeDays: number;
  sets: number;
  reps: number;
  volumeKg: number;
  unknownWeightSets: number;
  firstDate: string | null;
  days: TrainingDay[];
  muscles: { id: string | null; name: string; sets: number; volumeKg: number }[];
};
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function number(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error('Training summary unavailable.');
  return value;
}
function date(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error('Training dates unavailable.');
  return value;
}
export function parseOverview(value: unknown): TrainingOverview {
  if (!object(value) || !Array.isArray(value.days) || !Array.isArray(value.muscles))
    throw new Error('Training summary unavailable.');
  return {
    sessions: number(value.sessions),
    activeDays: number(value.active_days),
    sets: number(value.sets),
    reps: number(value.reps),
    volumeKg: number(value.volume_kg),
    unknownWeightSets: number(value.unknown_weight_sets),
    firstDate: value.first_date === null ? null : date(value.first_date),
    days: value.days.map((day) => {
      if (!object(day)) throw new Error('Training day unavailable.');
      return {
        date: date(day.local_date),
        sessions: number(day.sessions),
        sets: number(day.sets),
        reps: number(day.reps),
        volumeKg: number(day.volume_kg),
        unknownWeightSets: number(day.unknown_weight_sets),
      };
    }),
    muscles: value.muscles.map((muscle) => {
      if (
        !object(muscle) ||
        typeof muscle.name !== 'string' ||
        !(muscle.id === null || typeof muscle.id === 'string')
      )
        throw new Error('Muscle summary unavailable.');
      return {
        id: muscle.id,
        name: muscle.name,
        sets: number(muscle.sets),
        volumeKg: number(muscle.volume_kg),
      };
    }),
  };
}
export function shiftDate(day: string, days: number) {
  return new Date(Date.parse(day + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10);
}
export function trainingStatus(
  overview: TrainingOverview,
  today: string,
  plan: { since: string; days: { isRest: boolean; workoutId: string | null }[] } | null,
) {
  const messages: { label: string; reason: string }[] = [];
  if (plan?.days.length === 7 && plan.days.every((day) => day.isRest))
    messages.push({
      label: 'Recovery Week',
      reason: 'Your active split schedules rest on all seven days.',
    });
  if (plan && plan.days.length === 7) {
    if (plan.days.some((day) => !day.isRest && !day.workoutId))
      messages.push({
        label: 'Plan needs assignment',
        reason:
          'An active split day has no workout. Reassign it or choose rest; unassigned days are excluded from missed-day checks.',
      });
    const monday = shiftDate(today, -((new Date(today + 'T12:00:00Z').getUTCDay() + 6) % 7));
    const due = plan.days
      .map((day, index) => ({ ...day, date: shiftDate(monday, index) }))
      .filter((day) => !day.isRest && day.workoutId && day.date < today && day.date >= plan.since);
    const missed = due.filter(
      (day) => !overview.days.some((logged) => logged.date === day.date && logged.sessions > 0),
    );
    if (missed.length)
      messages.push({
        label: 'Missed Sessions',
        reason: `${missed.length} past scheduled training day(s) this week have no completed log. Days before the latest split change are excluded.`,
      });
    else if (due.length)
      messages.push({
        label: 'On Track',
        reason:
          'Every past scheduled training day since the latest split change has a completed log. This checks training days, not exact workout adherence.',
      });
  }
  const recent = overview.days.filter((day) => day.date >= shiftDate(today, -6)),
    prior = overview.days.filter((day) => day.date < shiftDate(today, -6));
  const baseline = prior.reduce((sum, day) => sum + day.sets, 0) / 3,
    current = recent.reduce((sum, day) => sum + day.sets, 0);
  if (
    baseline > 0 &&
    prior.reduce((sum, day) => sum + day.sessions, 0) >= 4 &&
    overview.firstDate &&
    overview.firstDate <= shiftDate(today, -14)
  ) {
    const ratio = current / baseline;
    messages.push({
      label:
        ratio < 0.5
          ? 'Low Training Volume'
          : ratio > 1.5
            ? 'High Training Volume'
            : 'Steady Training Volume',
      reason: `${current} working sets in the last 7 dates versus ${Math.round(baseline * 10) / 10} per week across the preceding 21 dates. Low is below 50%; high is above 150% of your own baseline.`,
    });
  }
  const known = overview.muscles.filter((muscle) => muscle.id !== null),
    assigned = known.reduce((sum, muscle) => sum + muscle.sets, 0);
  if (known.length >= 3 && assigned >= 12) {
    const concentrated = Math.max(...known.map((muscle) => muscle.sets)) / assigned > 0.6;
    messages.push({
      label: concentrated ? 'Imbalanced Training' : 'Balanced Training',
      reason: concentrated
        ? 'One recorded primary-muscle group receives over 60% of allocated sets. This describes the log distribution; your goal may deliberately favor it.'
        : 'At least three recorded primary-muscle groups share 12 or more allocated sets, with no group above 60%. This describes distribution, not physiological balance.',
    });
  }
  if (!messages.length)
    messages.push({
      label: 'More context needed',
      reason: plan
        ? 'Your split has no past assigned training days to assess yet. More recorded history is needed for volume comparisons.'
        : 'Log more workouts or select a split. No missed-day or volume judgement is made from insufficient history.',
    });
  return messages;
}
