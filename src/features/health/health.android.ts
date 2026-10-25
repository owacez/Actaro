import {
  latest,
  workoutSummary,
  workoutWindowDays,
  localDate,
  type HealthResult,
} from './health-model';

type HealthConnect = typeof import('react-native-health-connect');
let client: HealthConnect | null | undefined;
// Expo Go and builds without the Health Connect native module cannot load the library;
// requiring it lazily keeps setup working there with manual entry.
function load() {
  if (client === undefined) {
    try {
      // A static import would crash Expo Go at startup; this stays conditional.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded: HealthConnect = require('react-native-health-connect');
      client = loaded;
    } catch {
      client = null;
    }
  }
  return client;
}

const unavailable: HealthResult = {
  status: 'unavailable',
  reason:
    'Health Connect is not available on this phone or build. Install or update Health Connect, or enter your details manually.',
};
const read = ['Weight', 'Height', 'RestingHeartRate', 'ExerciseSession'] as const;

export const health = {
  source: 'Health Connect' as const,
  async available() {
    const connect = load();
    if (!connect) return false;
    try {
      return (await connect.getSdkStatus()) === connect.SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  },
  async importForSetup(): Promise<HealthResult> {
    const connect = load();
    if (!connect || !(await health.available())) return unavailable;
    try {
      if (!(await connect.initialize())) return unavailable;
      const granted = await connect.requestPermission(
        read.map((recordType) => ({ accessType: 'read' as const, recordType })),
      );
      const allowed = new Set(
        granted.flatMap((permission) =>
          'recordType' in permission && permission.accessType === 'read'
            ? [permission.recordType]
            : [],
        ),
      );
      const now = new Date().toISOString(),
        year = new Date(Date.now() - 365 * 86400000).toISOString(),
        month = new Date(Date.now() - workoutWindowDays * 86400000).toISOString();
      const between = (startTime: string) => ({
        timeRangeFilter: { operator: 'between' as const, startTime, endTime: now },
        ascendingOrder: false,
        pageSize: 200,
      });
      const [weights, heights, resting, sessions] = await Promise.all([
        allowed.has('Weight') ? connect.readRecords('Weight', between(year)) : null,
        allowed.has('Height') ? connect.readRecords('Height', between(year)) : null,
        allowed.has('RestingHeartRate')
          ? connect.readRecords('RestingHeartRate', between(month))
          : null,
        allowed.has('ExerciseSession')
          ? connect.readRecords('ExerciseSession', between(month))
          : null,
      ]);
      const weight = latest(
        weights?.records ?? [],
        (record) => new Date(record.time),
        (record) => record.weight.inKilograms,
        [25, 455],
      );
      const height = latest(
        heights?.records ?? [],
        (record) => new Date(record.time),
        (record) => record.height.inMeters * 100,
        [90, 275],
      );
      const pulse = latest(
        resting?.records ?? [],
        (record) => new Date(record.time),
        (record) => record.beatsPerMinute,
        [25, 220],
      );
      return {
        status: 'imported',
        data: {
          source: 'Health Connect',
          // Health Connect does not store sex or date of birth.
          sex: null,
          birthDate: null,
          heightCm: height?.value ?? null,
          weight: weight ? { kg: weight.value, date: localDate(weight.at) } : null,
          restingHeartRate: pulse?.value ?? null,
          workouts: workoutSummary(
            (sessions?.records ?? []).map(
              (record) =>
                (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 1000,
            ),
          ),
        },
      };
    } catch {
      return {
        status: 'error',
        reason: 'Unable to read Health Connect. Enter your details manually or try again.',
      };
    }
  },
};
