import { localNutritionDate, nutritionDate, numeric } from '@/features/nutrition/nutrition-model';
import { shiftDate } from '@/features/workouts/training-overview';
// Finds the first instant of a calendar date, including DST and non-hour offsets.
export function dayStart(date: string, zone: string) {
  nutritionDate(date);
  let low = Date.parse(date + 'T00:00:00Z') - 36 * 3600000;
  let high = low + 72 * 3600000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localNutritionDate(zone, new Date(middle)) < date) low = middle;
    else high = middle;
  }
  if (localNutritionDate(zone, new Date(high)) !== date)
    throw new Error('This calendar date does not exist in this time zone.');
  return new Date(high);
}
export function dayRange(date: string, zone: string) {
  return { start: dayStart(date, zone), end: dayStart(shiftDate(date, 1), zone) };
}
export function wholeSteps(value: string) {
  const result = numeric(value, 'steps', 1000000, true);
  if (!Number.isInteger(result)) throw new Error('Steps must be a whole number.');
  return result;
}
