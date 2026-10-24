import { useEffect, useState } from 'react';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthFrame,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { displayWeight } from './workout-model';
import { trainingService } from './training-service';
import { shiftDate, trainingStatus } from './training-overview';
import { displayRange, plural } from '@/lib/format';
import { View } from 'react-native';
import { ActionRow, StatTile } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
type Loaded = Awaited<ReturnType<typeof trainingService.load>>;
export function TrainingScreen({
  userId,
  onBack,
  onRecovery,
}: {
  userId: string;
  onBack: () => void;
  onRecovery?: () => void;
}) {
  const [data, setData] = useState<Loaded | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(false),
    [attempt, setAttempt] = useState(0);
  const { colors } = useAppTheme();
  useEffect(() => {
    let active = true;
    void trainingService
      .load(userId)
      .then((value) => {
        if (active) {
          setData(value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  return (
    <AuthFrame>
      <BackLink label="My workouts" onPress={onBack} />
      <AuthText kind="title">Training summary</AuthText>
      {loading ? (
        <AuthLoading>Loading training summary…</AuthLoading>
      ) : error || !data ? (
        <>
          <AuthNotice error>Unable to load training summary. Retry.</AuthNotice>
          <AuthButton
            title="Retry training summary"
            onPress={() => {
              setError(false);
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      ) : (
        <>
          <AuthText kind="muted">
            Last 28 days · {displayRange(shiftDate(data.today, -27), data.today)} · {data.timeZone}
          </AuthText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <StatTile
              icon={{ ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }}
              label="Workouts"
              value={String(data.overview.sessions)}
            />
            <StatTile
              icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              label="Training days"
              value={String(data.overview.activeDays)}
            />
            <StatTile
              icon={{
                ios: 'list.number',
                android: 'format_list_numbered',
                web: 'format_list_numbered',
              }}
              label="Working sets"
              value={`${data.overview.sets} · ${plural(data.overview.reps, 'rep')}`}
            />
            <StatTile
              icon={{ ios: 'scalemass', android: 'monitor_weight', web: 'monitor_weight' }}
              label="Training Volume"
              value={`${displayWeight(data.overview.volumeKg, data.unit)} ${data.unit}·reps`}
            />
          </View>
          <AuthText kind="muted">
            {`From completed sets on each workout’s recorded date; editing or deleting a log recalculates these totals. Bodyweight counts as zero external load${data.overview.unknownWeightSets ? `; ${plural(data.overview.unknownWeightSets, 'set')} with unknown weight are excluded` : ''}.`}
          </AuthText>
          <AuthText kind="eyebrow">TRAINING STATUS</AuthText>
          {trainingStatus(data.overview, data.today, data.plan).map((status) => (
            <AuthCard key={status.label}>
              <AuthText kind="heading">{status.label}</AuthText>
              <AuthText>{status.reason}</AuthText>
            </AuthCard>
          ))}
          <AuthText kind="eyebrow">MUSCLE BALANCE</AuthText>
          <AuthCard>
            {!data.overview.muscles.length && <AuthText>No completed muscle data yet.</AuthText>}
            {[...data.overview.muscles]
              .sort((a, b) => b.sets - a.sets)
              .map((muscle, _, sorted) => (
                <View
                  key={muscle.id ?? 'unassigned'}
                  accessible
                  accessibilityLabel={`${muscle.name}: ${Math.round(muscle.sets * 100) / 100} allocated sets, ${displayWeight(muscle.volumeKg, data.unit)} ${data.unit}·reps`}
                  style={{ gap: 4 }}
                >
                  <View style={authStyles.row}>
                    <AuthText kind="heading">{muscle.name}</AuthText>
                    <AuthText kind="muted">
                      {Math.round(muscle.sets * 100) / 100} sets ·{' '}
                      {displayWeight(muscle.volumeKg, data.unit)} {data.unit}·reps
                    </AuthText>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.fill }}>
                    <View
                      style={{
                        width: `${Math.max(4, (muscle.sets / Math.max(sorted[0].sets, 1)) * 100)}%`,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.accent,
                      }}
                    />
                  </View>
                </View>
              ))}
            {!!data.overview.muscles.length && (
              <AuthText kind="muted">
                Sets and known volume are split equally across each exercise’s primary muscles;
                missing muscle data stays Unassigned. This describes your logs only.
              </AuthText>
            )}
          </AuthCard>
          {onRecovery && (
            <AuthCard>
              <ActionRow
                title="Recovery check"
                detail="How you feel today: energy, soreness and sleep"
                icon={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
                onPress={onRecovery}
              />
            </AuthCard>
          )}
        </>
      )}
    </AuthFrame>
  );
}
