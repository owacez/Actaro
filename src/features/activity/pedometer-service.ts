import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { dayRange } from './day-model';
import { localNutritionDate } from '@/features/nutrition/nutrition-model';
export async function readTodaySteps(zone: string) {
  if (Platform.OS !== 'ios')
    throw new Error(
      'Automatic daily step totals are available on iPhone. This platform shows synced history.',
    );
  if (!(await Pedometer.isAvailableAsync()))
    throw new Error('Step sensing is unavailable on this device.');
  let permission = await Pedometer.getPermissionsAsync();
  if (!permission.granted && permission.status === 'undetermined' && permission.canAskAgain)
    permission = await Pedometer.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      'Motion access was not granted. Enable Motion & Fitness access in iPhone Settings.',
    );
  const now = new Date(),
    day = localNutritionDate(zone, now),
    range = dayRange(day, zone),
    result = await Pedometer.getStepCountAsync(range.start, now);
  if (!Number.isInteger(result.steps) || result.steps < 0 || result.steps > 1000000)
    throw new Error('Sensor count unavailable. Actaro will retry when you return.');
  return { day, steps: result.steps };
}
