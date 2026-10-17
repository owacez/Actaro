import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/components/product-ui';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { ExerciseImage } from '@/features/exercises/exercise-image';
import { prestartTotals, type SessionDraft } from './session-model';
import { sessionService, type PreparedWorkout } from './session-service';
import { sessionStore } from './session-store';
export function PrestartScreen({
  userId,
  templateId,
  exerciseId,
  onBack,
  onSession,
}: {
  userId: string;
  templateId?: string;
  exerciseId?: string;
  onBack: () => void;
  onSession: () => void;
}) {
  const [prepared, setPrepared] = useState<PreparedWorkout | null>(null),
    [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null),
    [query, setQuery] = useState(0),
    [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false),
    [existing, setExisting] = useState(false),
    pending = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    void sessionStore
      .read(userId)
      .then(async (draft) => {
        if (draft) {
          if (current) {
            setExisting(true);
            setLoading(false);
          }
          return;
        }
        const details = await sessionService.prepare(userId, templateId, exerciseId);
        if (current) {
          setPrepared(details);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (current) {
          setError(reason instanceof Error ? reason.message : 'Unable to load workout. Retry.');
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [userId, templateId, exerciseId, query]);
  async function start(mode: SessionDraft['mode']) {
    if (!prepared || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await sessionStore.start(sessionService.create(userId, prepared, mode));
      if (alive.current) onSession();
    } catch (reason) {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : 'Unable to start workout. Retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const totals = prepared ? prestartTotals(prepared.draft) : null;
  return (
    <AuthFrame>
      <AuthLink title="← My workouts" disabled={busy} onPress={onBack} />
      <AuthText kind="heading">{prepared?.draft.name ?? 'Workout pre-start'}</AuthText>
      {error && !choosing && <AuthNotice error>{error}</AuthNotice>}
      {loading ? (
        <AuthLoading>Loading workout…</AuthLoading>
      ) : existing ? (
        <>
          <AuthText>
            You have a workout saved on this device. Resume or finish it before starting another.
          </AuthText>
          <AuthButton title="Resume saved workout" onPress={onSession} />
        </>
      ) : prepared ? (
        choosing ? (
          <ActionSheet
            title="Choose session mode"
            visible
            onClose={() => {
              if (!busy) setChoosing(false);
            }}
          >
            <AuthText>
              Timed Workout tracks total duration with pause/resume. Log Only records sets without a
              total workout timer. Both include a separate rest timer.
            </AuthText>
            <AuthButton title="Timed Workout" busy={busy} onPress={() => void start('timed')} />
            <AuthButton
              title="Log Only"
              outlined
              disabled={busy}
              onPress={() => void start('log_only')}
            />
            <AuthLink
              title="Back to workout preview"
              disabled={busy}
              onPress={() => setChoosing(false)}
            />
            {error && <AuthNotice error>{error}</AuthNotice>}
          </ActionSheet>
        ) : (
          <>
            <AuthText>
              {prepared.exercises.length} exercises · {totals?.sets} working sets
            </AuthText>
            <AuthText>
              Estimated duration: {totals?.estimatedMinutes} min. Assumes 45 seconds per set plus
              planned rest between sets; excludes warm-up and transitions. Actual time varies.
            </AuthText>
            {prepared.exercises.map((exercise, index) => (
              <AuthCard key={exercise.id}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <ExerciseImage url={exercise.imageUrl} label={exercise.name} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <AuthText kind="eyebrow">
                      {index + 1}. {exercise.name}
                    </AuthText>
                    <AuthText>{exercise.metadata}</AuthText>
                    <AuthText>
                      {exercise.sets.length} working sets · reps:{' '}
                      {exercise.sets.map((set) => set.reps || 'unspecified').join(', ')}
                    </AuthText>
                  </View>
                </View>
              </AuthCard>
            ))}
            <AuthText>
              Review working weights and reps when logging. Only sets you mark complete become
              performed results.
            </AuthText>
            <AuthButton title="Start Workout" onPress={() => setChoosing(true)} />
          </>
        )
      ) : (
        <>
          <AuthButton
            title="Retry workout"
            onPress={() => {
              setError(null);
              setLoading(true);
              setQuery((value) => value + 1);
            }}
          />
          <AuthLink title="Recover saved workout" onPress={onSession} />
        </>
      )}
    </AuthFrame>
  );
}
