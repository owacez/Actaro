import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { dayRange } from './day-model';
import { localNutritionDate } from '@/features/nutrition/nutrition-model';
export async function readTodaySteps(zone: string) {
  if (Platform.OS !== 'ios')
    throw new Error(
      'Daily sensor totals are available on iPhone. Enter a daily count manually on this platform.',
    );
  if (!(await Pedometer.isAvailableAsync()))
    throw new Error('Step sensing is unavailable. You can enter your count manually.');
  let permission = await Pedometer.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain)
    permission = await Pedometer.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Motion access was not granted. Enter steps manually or enable access in device settings.',
    );
  const now = new Date(),
    day = localNutritionDate(zone, now),
    range = dayRange(day, zone),
    result = await Pedometer.getStepCountAsync(range.start, now);
  if (!Number.isInteger(result.steps) || result.steps < 0 || result.steps > 1000000)
    throw new Error('Sensor count unavailable. Try again or enter it manually.');
  return { day, steps: result.steps };
}
