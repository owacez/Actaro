import { useEffect, useState } from 'react';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { displayWeight } from './workout-model';
import { trainingService } from './training-service';
import { shiftDate, trainingStatus } from './training-overview';
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
      <AuthLink title="← My workouts" onPress={onBack} />
      <AuthText kind="heading">Training summary</AuthText>
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
          <AuthText>
            {shiftDate(data.today, -27)}–{data.today} · {data.timeZone}
          </AuthText>
          <AuthText>
            Uses completed sets and each workout’s recorded local date. Changing or deleting a log
            recalculates these totals.
          </AuthText>
          <AuthCard>
            <AuthText>
              {data.overview.sessions} workouts · {data.overview.activeDays} training dates
            </AuthText>
            <AuthText>
              {data.overview.sets} working sets · {data.overview.reps} reps
            </AuthText>
            <AuthText>
              Training Volume: {displayWeight(data.overview.volumeKg, data.unit)} {data.unit}·reps
            </AuthText>
            <AuthText>
              {data.overview.unknownWeightSets} unknown-weight sets excluded from external volume.
              Bodyweight has zero external load.
            </AuthText>
          </AuthCard>
          <AuthText kind="eyebrow">Training status</AuthText>
          {trainingStatus(data.overview, data.today, data.plan).map((status) => (
            <AuthCard key={status.label}>
              <AuthText kind="eyebrow">{status.label}</AuthText>
              <AuthText>{status.reason}</AuthText>
            </AuthCard>
          ))}
          <AuthText kind="eyebrow">Primary-muscle allocation</AuthText>
          <AuthText>
            Sets and known external volume are divided equally across each exercise’s recorded
            primary muscles. Missing muscle data stays Unassigned. This is a description of your
            logs.
          </AuthText>
          {!data.overview.muscles.length && <AuthText>No completed muscle data yet.</AuthText>}
          {data.overview.muscles.map((muscle) => (
            <AuthCard key={muscle.id ?? 'unassigned'}>
              <AuthText kind="eyebrow">{muscle.name}</AuthText>
              <AuthText>
                {Math.round(muscle.sets * 100) / 100} allocated sets ·{' '}
                {displayWeight(muscle.volumeKg, data.unit)} {data.unit}·reps
              </AuthText>
            </AuthCard>
          ))}
          {onRecovery && <AuthButton title="Recovery check" onPress={onRecovery} />}
        </>
      )}
    </AuthFrame>
  );
}
