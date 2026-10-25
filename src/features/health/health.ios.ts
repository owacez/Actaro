import {
  latest,
  localDate,
  workoutSummary,
  workoutWindowDays,
  type HealthResult,
} from './health-model';

type HealthKit = typeof import('@kingstinct/react-native-healthkit');
let kit: HealthKit | null | undefined;
// Expo Go and builds without the HealthKit native module cannot load the library; requiring
// it lazily keeps setup working there with manual entry.
function load() {
  if (kit === undefined) {
    try {
      // A static import would crash Expo Go at startup; this stays conditional.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded: HealthKit = require('@kingstinct/react-native-healthkit');
      kit = loaded;
    } catch {
      kit = null;
    }
  }
  return kit;
}

const unavailable: HealthResult = {
  status: 'unavailable',
  reason: 'Apple Health is not available in this build. Enter your details manually.',
};

export const health = {
  source: 'Apple Health' as const,
  async available() {
    const healthKit = load();
    if (!healthKit) return false;
    try {
      return await healthKit.isHealthDataAvailableAsync();
    } catch {
      return false;
    }
  },
  async importForSetup(): Promise<HealthResult> {
    const healthKit = load();
    if (!healthKit || !(await health.available())) return unavailable;
    try {
      // iOS never reveals which read permissions were declined; declined types read as empty.
      await healthKit.requestAuthorization({
        toRead: [
          'HKCharacteristicTypeIdentifierBiologicalSex',
          'HKCharacteristicTypeIdentifierDateOfBirth',
          'HKQuantityTypeIdentifierBodyMass',
          'HKQuantityTypeIdentifierHeight',
          'HKQuantityTypeIdentifierRestingHeartRate',
          'HKWorkoutTypeIdentifier',
        ],
      });
      const since = new Date(Date.now() - workoutWindowDays * 86400000);
      const [sex, birth, mass, height, resting, workouts] = await Promise.all([
        healthKit.getBiologicalSexAsync().catch(() => null),
        healthKit.getDateOfBirthAsync().catch(() => undefined),
        healthKit
          .queryQuantitySamples('HKQuantityTypeIdentifierBodyMass', {
            limit: 1,
            ascending: false,
            unit: 'kg',
          })
          .catch(() => []),
        healthKit
          .queryQuantitySamples('HKQuantityTypeIdentifierHeight', {
            limit: 1,
            ascending: false,
            unit: 'cm',
          })
          .catch(() => []),
        healthKit
          .queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', {
            limit: 1,
            ascending: false,
          })
          .catch(() => []),
        healthKit
          .queryWorkoutSamples({ limit: 0, filter: { date: { startDate: since } } })
          .catch(() => []),
      ]);
      const weight = latest(
        mass,
        (sample) => sample.startDate,
        (sample) => sample.quantity,
        [25, 455],
      );
      const tall = latest(
        height,
        (sample) => sample.startDate,
        (sample) => sample.quantity,
        [90, 275],
      );
      const pulse = latest(
        resting,
        (sample) => sample.startDate,
        (sample) => sample.quantity,
        [25, 220],
      );
      return {
        status: 'imported',
        data: {
          source: 'Apple Health',
          sex:
            sex === healthKit.BiologicalSex.male
              ? 'male'
              : sex === healthKit.BiologicalSex.female
                ? 'female'
                : null,
          birthDate: birth && birth < new Date() ? localDate(birth) : null,
          heightCm: tall?.value ?? null,
          weight: weight ? { kg: weight.value, date: localDate(weight.at) } : null,
          restingHeartRate: pulse?.value ?? null,
          workouts: workoutSummary(
            workouts.map((workout) =>
              workout.duration.unit === 's'
                ? workout.duration.quantity
                : (workout.endDate.getTime() - workout.startDate.getTime()) / 1000,
            ),
          ),
        },
      };
    } catch {
      return {
        status: 'error',
        reason: 'Unable to read Apple Health. Enter your details manually or try again.',
      };
    }
  },
};
