import { nutritionDate } from '@/features/nutrition/nutrition-model';
import { shiftDate } from '@/features/workouts/training-overview';

export const progressPresets = ['7D', '30D', '3M', '6M', '1Y', 'All'] as const;
export type ProgressPreset = (typeof progressPresets)[number];
export type ProgressRange = { from: string; to: string };
export function progressRange(
  today: string,
  preset: ProgressPreset,
  earliest?: string | null,
): ProgressRange {
  nutritionDate(today);
  if (preset === 'All')
    return { from: earliest && earliest < today ? nutritionDate(earliest) : today, to: today };
  if (preset === '7D' || preset === '30D')
    return { from: shiftDate(today, preset === '7D' ? -6 : -29), to: today };
  const date = new Date(today + 'T12:00:00Z'),
    day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - (preset === '3M' ? 3 : preset === '6M' ? 6 : 12));
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return { from: shiftDate(date.toISOString().slice(0, 10), 1), to: today };
}
export function validateProgressRange(range: ProgressRange, today: string) {
  nutritionDate(range.from);
  nutritionDate(range.to);
  nutritionDate(today);
  if (range.from > range.to) throw new Error('Start date must be on or before the end date.');
  if (range.to > today) throw new Error('Progress cannot include future dates.');
  return range;
}
export function periodDays(from: string, to: string) {
  validateProgressRange({ from, to }, to);
  return (
    Math.round((Date.parse(to + 'T12:00:00Z') - Date.parse(from + 'T12:00:00Z')) / 86400000) + 1
  );
}
export type ProgressPoint = { date: string; value: number | null };
export function chartBins(
  points: ProgressPoint[],
  range: ProgressRange,
  aggregate: 'mean' | 'sum' = 'mean',
) {
  const days = periodDays(range.from, range.to),
    width = Math.ceil(days / 60);
  const bins = Array.from({ length: Math.ceil(days / width) }, (_, index) => ({
    from: shiftDate(range.from, index * width),
    to: shiftDate(range.from, Math.min(days - 1, (index + 1) * width - 1)),
    total: 0,
    count: 0,
  }));
  for (const point of points) {
    if (point.date < range.from || point.date > range.to || point.value === null) continue;
    nutritionDate(point.date);
    if (!Number.isFinite(point.value) || point.value < 0)
      throw new Error('Progress values unavailable. Retry.');
    const bin =
      bins[
        Math.floor(
          (Date.parse(point.date + 'T12:00:00Z') - Date.parse(range.from + 'T12:00:00Z')) /
            86400000 /
            width,
        )
      ];
    bin.total += point.value;
    bin.count++;
  }
  return {
    width,
    bins: bins.map((bin) => ({
      from: bin.from,
      to: bin.to,
      value: bin.count ? (aggregate === 'sum' ? bin.total : bin.total / bin.count) : null,
    })),
  };
}
