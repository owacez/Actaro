// Read-only health import used to prefill setup. Nothing is written back to the platform.
export type HealthSource = 'Apple Health' | 'Health Connect';
export type HealthImport = {
  source: HealthSource;
  sex: 'male' | 'female' | null;
  /** YYYY-MM-DD in the device's calendar. */
  birthDate: string | null;
  heightCm: number | null;
  weight: { kg: number; date: string } | null;
  restingHeartRate: number | null;
  /** Workouts recorded in the last 30 days. */
  workouts: { count: number; minutes: number };
};
export type HealthResult =
  | { status: 'imported'; data: HealthImport }
  | { status: 'unavailable'; reason: string }
  | { status: 'error'; reason: string };

export const workoutWindowDays = 30;

// A calendar date for the device's own day, not the UTC day.
export function localDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0'),
    day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

// The newest reading among samples that may arrive in any order; implausible values are
// ignored rather than imported into setup.
export function latest<T>(
  samples: readonly T[],
  time: (sample: T) => Date,
  value: (sample: T) => number,
  range: [number, number],
) {
  let best: { at: Date; value: number } | null = null;
  for (const sample of samples) {
    const at = time(sample),
      reading = value(sample);
    if (!Number.isFinite(reading) || reading < range[0] || reading > range[1]) continue;
    if (Number.isNaN(at.getTime())) continue;
    if (!best || at > best.at) best = { at, value: reading };
  }
  return best;
}

export function workoutSummary(durationsSeconds: readonly number[]) {
  const valid = durationsSeconds.filter((seconds) => Number.isFinite(seconds) && seconds > 0);
  return {
    count: valid.length,
    minutes: Math.round(valid.reduce((sum, seconds) => sum + seconds, 0) / 60),
  };
}

export const round1 = (value: number) => Math.round(value * 10) / 10;

// One sentence for the setup screen describing what was found.
export function importSummary(data: HealthImport, weightUnit: string, factor: number) {
  const parts = [
    data.weight && `weight ${round1(data.weight.kg * factor)} ${weightUnit}`,
    data.heightCm !== null && 'height',
    data.sex && 'sex',
    data.birthDate && 'date of birth',
    data.workouts.count > 0 &&
      `${data.workouts.count} workout${data.workouts.count === 1 ? '' : 's'} in the last ${workoutWindowDays} days`,
    data.restingHeartRate !== null && `resting heart rate ${Math.round(data.restingHeartRate)} bpm`,
  ].filter(Boolean);
  return parts.length
    ? `Imported from ${data.source}: ${parts.join(', ')}.`
    : `${data.source} had no matching data, or access was not allowed. Enter your details below.`;
}
