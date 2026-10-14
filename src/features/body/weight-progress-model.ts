import type { Tables } from '@/lib/supabase/database.types';
import { nutritionDate } from '@/features/nutrition/nutrition-model';
import { shiftDate } from '@/features/workouts/training-overview';
export type WeightPoint = Pick<Tables<'body_weights'>, 'local_date' | 'weight_kg'>;
export function weightPeriod(from: string, to: string, today: string) {
  nutritionDate(from);
  nutritionDate(to);
  nutritionDate(today);
  if (from > to) throw new Error('Start date must be on or before the end date.');
  if (to > today) throw new Error('Progress cannot include future dates.');
  return { from, to };
}
const dateNumber = (date: string) => Date.parse(date + 'T12:00:00Z');
export function weightProgress(rows: WeightPoint[], from: string, to: string) {
  weightPeriod(from, to, to);
  const sorted = rows
    .filter((row) => row.local_date >= from && row.local_date <= to)
    .sort((a, b) => a.local_date.localeCompare(b.local_date));
  const dates = new Set<string>();
  for (const row of sorted) {
    nutritionDate(row.local_date);
    if (
      !Number.isFinite(row.weight_kg) ||
      row.weight_kg <= 0 ||
      row.weight_kg > 1000 ||
      dates.has(row.local_date)
    )
      throw new Error('Weight history is unavailable. Reload it.');
    dates.add(row.local_date);
  }
  const days = Math.round((dateNumber(to) - dateNumber(from)) / 86400000) + 1,
    binDays = Math.ceil(days / 60);
  const bins = Array.from({ length: Math.ceil(days / binDays) }, (_, index) => ({
    from: shiftDate(from, index * binDays),
    to: shiftDate(from, Math.min(days - 1, (index + 1) * binDays - 1)),
    total: 0,
    count: 0,
  }));
  for (const row of sorted) {
    const index = Math.floor((dateNumber(row.local_date) - dateNumber(from)) / 86400000 / binDays);
    bins[index].total += row.weight_kg;
    bins[index].count++;
  }
  const first = sorted[0] ?? null,
    latest = sorted.at(-1) ?? null,
    change = first && latest && sorted.length > 1 ? latest.weight_kg - first.weight_kg : null;
  return {
    rows: sorted,
    first,
    latest,
    change,
    changePercent: change !== null && first ? (change / first.weight_kg) * 100 : null,
    count: sorted.length,
    days,
    binDays,
    average: sorted.length
      ? sorted.reduce((sum, row) => sum + row.weight_kg, 0) / sorted.length
      : null,
    low: sorted.length ? sorted.reduce((low, row) => Math.min(low, row.weight_kg), Infinity) : null,
    high: sorted.length
      ? sorted.reduce((high, row) => Math.max(high, row.weight_kg), -Infinity)
      : null,
    bins: bins.map((bin) => ({
      from: bin.from,
      to: bin.to,
      count: bin.count,
      value: bin.count ? bin.total / bin.count : null,
    })),
  };
}
