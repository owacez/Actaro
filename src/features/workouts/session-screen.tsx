import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, Text, TextInput, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { NavigationSurface, ScreenHeader, Meter, IconButton } from '@/components/product-ui';
import { ProgressMetrics } from '@/features/progress/progress-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { ExerciseImage } from '@/features/exercises/exercise-image';
import { blankSet, displayWeight, workoutPayload } from './workout-model';
import {
  elapsed,
  pauseClock,
  resumeClock,
  sessionPayload,
  timerText,
  type SessionDraft,
} from './session-model';
import { sessionStore } from './session-store';
import { sessionService } from './session-service';
import { exerciseRecords, trainingVolume } from './training-metrics';

function FinishWorkoutButton({
  busy,
  onFinish,
}: {
  busy: boolean;
  onFinish: (time: number) => Promise<void>;
}) {
  return (
    <AuthButton title="Finish workout" busy={busy} onPress={() => void onFinish(Date.now())} />
  );
}

export function SessionScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [draft, setDraft] = useState<SessionDraft | null>(null),
    current = useRef<SessionDraft | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [storageError, setStorageError] = useState(false);
  const [busy, setBusy] = useState(false),
    [discard, setDiscard] = useState(false),
    [index, setIndex] = useState(0),
    [query, setQuery] = useState(0),
    [now, setNow] = useState(Date.now);
  const alive = useRef(true),
    pending = useRef(false),
    revision = useRef(0);
  const { colors } = useAppTheme(),
    { notify } = useAuthFeedback();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    void sessionStore
      .read(userId)
      .then((saved) => {
        if (active) {
          current.current = saved;
          setDraft(saved);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(
            'Saved workout could not be restored. Its data has been kept on this device. Retry before discarding.',
          );
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, query]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(Date.now());
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
  async function persist(next: SessionDraft) {
    const writing = ++revision.current;
    current.current = next;
    setDraft(next);
    try {
      await sessionStore.write(next);
      if (alive.current && writing === revision.current) setStorageError(false);
    } catch {
      if (alive.current && writing === revision.current) setStorageError(true);
      throw new Error('Unable to save on this device. Keep the app open and retry.');
    }
  }
  function change(update: (previous: SessionDraft) => SessionDraft) {
    const previous = current.current;
    if (!previous || previous.status !== 'active' || pending.current) return;
    void persist(update(previous)).catch(() => undefined);
  }
  async function finish(time: number) {
    const previous = current.current;
    if (!previous || previous.status === 'saved' || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const next: SessionDraft =
        previous.status === 'pending'
          ? previous
          : {
              ...previous,
              status: 'pending',
              endedAt: new Date(time).toISOString(),
              mutationId: randomUUID(),
              clock: pauseClock(previous.clock, time),
              rest: null,
            };
      sessionPayload(next);
      await persist(next);
      const version = await sessionService.save(next);
      // Keep the acknowledged summary locally until Done; retries use the same mutation.
      await persist({ ...next, status: 'saved', version });
      if (alive.current) notify('Workout saved.', 'success');
    } catch (reason) {
      if (alive.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to save workout. Your local copy is kept.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function leave() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await sessionStore.discard(userId);
      if (alive.current) onBack();
    } catch {
      if (alive.current) setError('Unable to clear this device draft. Retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (loading)
    return (
      <AuthFrame>
        <AuthLoading>Restoring workout…</AuthLoading>
      </AuthFrame>
    );
  if (!draft)
    return (
      <AuthFrame>
        <AuthLink title="← My workouts" onPress={onBack} />
        <AuthText kind="heading">Saved workout</AuthText>
        {error ? (
          <>
            <AuthNotice error>{error}</AuthNotice>
            <AuthButton
              title="Retry saved workout"
              onPress={() => {
                setLoading(true);
                setError(null);
                setQuery((value) => value + 1);
              }}
            />
            <AuthLink title="Discard unreadable device draft" onPress={() => setDiscard(true)} />
            {discard && (
              <>
                <AuthText>
                  This removes only this account’s local workout draft. Saved history stays.
                  Continue?
                </AuthText>
                <AuthButton title="Keep device draft" outlined onPress={() => setDiscard(false)} />
                <AuthButton
                  title="Confirm discard device draft"
                  busy={busy}
                  onPress={() => void leave()}
                />
              </>
            )}
          </>
        ) : (
          <AuthText>No workout is saved on this device. Choose a workout to start.</AuthText>
        )}
      </AuthFrame>
    );
  const exercise = draft.exercises[index];
  if (!exercise)
    return (
      <AuthFrame>
        <AuthNotice error>Exercise unavailable. Reopen the saved workout.</AuthNotice>
      </AuthFrame>
    );
  const remaining = draft.rest ? Math.max(0, draft.restDuration - elapsed(draft.rest, now)) : 0;
  const summary = draft.status === 'saved' ? sessionPayload(draft) : null;
  const totals = summary
    ? trainingVolume(
        summary.exercises.flatMap((entry) =>
          entry.sets.map((set) => ({ reps: set.reps, weightKg: set.weight_kg })),
        ),
      )
    : null;
  const recordsByExercise = exerciseRecords(
    summary?.exercises.map((entry) => ({
      exerciseId: entry.exercise_id,
      sets: entry.sets.map((set) => ({ reps: set.reps, weightKg: set.weight_kg })),
      performance:
        draft.exercises.find((item) => item.id === entry.id)?.performance ?? exercise.performance,
    })) ?? [],
  );
  function setField(
    position: number,
    field: 'weight' | 'reps' | 'rest' | 'rpe' | 'notes',
    value: string,
  ) {
    change((previous) => ({
      ...previous,
      exercises: previous.exercises.map((entry, at) =>
        at === index
          ? {
              ...entry,
              sets: entry.sets.map((set, place) =>
                place === position ? { ...set, [field]: value } : set,
              ),
            }
          : entry,
      ),
    }));
  }
  function done(position: number, time: number) {
    const previous = current.current;
    if (!previous || previous.status !== 'active') return;
    const entry = previous.exercises[index],
      set = entry.sets[position];
    if (!set.completedAt) {
      try {
        workoutPayload(
          {
            id: previous.id,
            name: previous.name,
            notes: '',
            exercises: [{ ...entry, key: entry.id, sets: [set] }],
          },
          previous.unit,
        );
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Check weight and reps.');
        return;
      }
    }
    setError(null);
    const completing = !set.completedAt;
    change((value) => ({
      ...value,
      rest: completing
        ? Number(set.rest) > 0
          ? { elapsedMs: 0, runningSince: time }
          : null
        : value.rest,
      restDuration: completing ? Number(set.rest) * 1000 : value.restDuration,
      exercises: value.exercises.map((item, at) =>
        at === index
          ? {
              ...item,
              sets: item.sets.map((row, place) =>
                place === position
                  ? { ...row, completedAt: completing ? new Date(time).toISOString() : null }
                  : row,
              ),
            }
          : item,
      ),
    }));
  }
  function adjustRest(seconds: number) {
    change((value) => ({
      ...value,
      restDuration: Math.max(
        0,
        Math.min(
          3600000,
          Math.max(0, value.restDuration - (value.rest ? elapsed(value.rest, now) : 0)) +
            seconds * 1000,
        ),
      ),
      rest: value.rest
        ? { elapsedMs: 0, runningSince: value.rest.runningSince === null ? null : now }
        : null,
    }));
  }
  const restPanel = draft.rest ? (
    <View style={{ gap: 8, paddingVertical: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <View>
          <AuthText kind="eyebrow">REST</AuthText>
          <AuthText kind="title">{timerText(remaining)}</AuthText>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[-15, 15].map((seconds) => (
            <AuthLink
              key={seconds}
              title={seconds > 0 ? '+15' : '-15'}
              accessibilityLabel={seconds > 0 ? '+15 sec' : '-15 sec'}
              onPress={() => adjustRest(seconds)}
            />
          ))}
          <IconButton
            label={draft.rest.runningSince === null ? 'Resume rest' : 'Pause rest'}
            name={
              draft.rest.runningSince === null
                ? { ios: 'play', android: 'play_arrow', web: 'play_arrow' }
                : { ios: 'pause', android: 'pause', web: 'pause' }
            }
            onPress={() =>
              change((value) => ({
                ...value,
                rest: value.rest
                  ? value.rest.runningSince === null
                    ? resumeClock(value.rest, Date.now())
                    : pauseClock(value.rest, Date.now())
                  : null,
              }))
            }
          />
          <IconButton
            label="Skip rest"
            name={{ ios: 'forward.end', android: 'skip_next', web: 'skip_next' }}
            onPress={() => change((value) => ({ ...value, rest: null, restDuration: 0 }))}
          />
        </View>
      </View>
      <Meter value={remaining} target={draft.restDuration} color={colors.accent} />
    </View>
  ) : null;
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title={summary ? 'Workout complete' : draft.name}
          subtitle={
            summary
              ? draft.localDate
              : (draft.mode === 'timed'
                  ? timerText(elapsed(draft.clock, now)) + ' · TIMED'
                  : 'LOG ONLY') +
                ' · ' +
                String(index + 1) +
                ' OF ' +
                String(draft.exercises.length)
          }
          action={
            !summary && draft.status === 'active' ? (
              <FinishWorkoutButton busy={busy} onFinish={finish} />
            ) : undefined
          }
        />
      }
      footer={
        !summary && draft.status === 'active' && draft.rest ? (
          <NavigationSurface style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            {restPanel}
          </NavigationSurface>
        ) : undefined
      }
    >
      <AuthLink title="← My workouts (workout kept)" disabled={busy} onPress={onBack} />
      <AuthText kind="heading">{summary ? 'Workout summary' : draft.name}</AuthText>
      {error && <AuthNotice error>{error}</AuthNotice>}
      {storageError && (
        <>
          <AuthNotice error>Unable to save on this device. Keep the app open and retry.</AuthNotice>
          <AuthButton
            title="Retry device save"
            disabled={busy}
            onPress={() => {
              if (current.current) void persist(current.current).catch(() => undefined);
            }}
          />
        </>
      )}
      {summary && totals ? (
        <>
          <AuthText>
            {draft.name} · {draft.localDate}
          </AuthText>
          <ProgressMetrics
            metrics={[
              ...(draft.mode === 'timed'
                ? [{ title: 'Duration', value: timerText((summary.duration_seconds ?? 0) * 1000) }]
                : []),
              { title: 'Sets', value: String(totals.sets) },
              { title: 'Reps', value: String(totals.reps) },
              {
                title: 'Volume',
                value: displayWeight(totals.volumeKg, draft.unit) + ' ' + draft.unit + '·reps',
              },
            ]}
          />
          <AuthText>
            Training Volume: {displayWeight(totals.volumeKg, draft.unit)} {draft.unit}·reps
          </AuthText>
          <AuthText>
            External load × reps; bodyweight uses zero external load. {totals.unknownWeightSets}{' '}
            sets have unknown weight and are excluded from volume.
          </AuthText>
          {draft.mode === 'timed' && (
            <AuthText>Duration: {timerText((summary.duration_seconds ?? 0) * 1000)}</AuthText>
          )}
          {summary.exercises.map((entry) => {
            const original = draft.exercises.find((item) => item.id === entry.id);
            const records =
              summary.exercises.find((item) => item.exercise_id === entry.exercise_id)?.id ===
              entry.id
                ? (recordsByExercise.get(entry.exercise_id) ?? [])
                : [];
            return (
              <AuthCard key={entry.id}>
                <AuthText kind="eyebrow">{original?.name}</AuthText>
                <AuthText>{entry.sets.length} completed sets</AuthText>
                {records.map((record, at) => (
                  <AuthText key={at}>
                    {record.first ? 'First recorded' : 'New'} {record.kind}:{' '}
                    {record.kind === 'Rep PR'
                      ? `${record.value} reps at ${displayWeight(record.weightKg ?? null, draft.unit)} ${draft.unit}`
                      : `${displayWeight(Math.round(record.value * 1000) / 1000, draft.unit)} ${draft.unit}`}
                  </AuthText>
                ))}
              </AuthCard>
            );
          })}
          <AuthText>
            Estimated 1RM uses Epley for 2–10 reps, or the actual one-rep load. It is an estimate,
            not a measured maximum.
          </AuthText>
          {!!draft.notes && <AuthText>Note: {draft.notes}</AuthText>}
          <AuthButton title="Done" busy={busy} onPress={() => void leave()} />
        </>
      ) : draft.status === 'pending' ? (
        <>
          <AuthText>
            Workout finished and kept on this device. It has not been confirmed saved to your
            account. Retry when connected; the same workout will be recovered.
          </AuthText>
          <AuthButton
            title="Retry workout save"
            busy={busy}
            onPress={() => void finish(Date.parse(draft.endedAt ?? draft.startedAt))}
          />
        </>
      ) : (
        <>
          {draft.mode === 'timed' && (
            <>
              <AuthButton
                title={
                  draft.clock.runningSince === null ? 'Resume workout timer' : 'Pause workout timer'
                }
                outlined
                onPress={() =>
                  change((value) => ({
                    ...value,
                    clock:
                      value.clock.runningSince === null
                        ? resumeClock(value.clock, Date.now())
                        : pauseClock(value.clock, Date.now()),
                  }))
                }
              />
            </>
          )}
          <AuthText>
            Exercise {index + 1} of {draft.exercises.length} ·{' '}
            {draft.mode === 'timed' ? 'Timed Workout' : 'Log Only'}
          </AuthText>
          <ExerciseImage
            key={exercise.imageUrl}
            url={exercise.imageUrl}
            label={`${exercise.name} technique`}
            size={112}
          />
          <AuthText kind="eyebrow">{exercise.name}</AuthText>
          <AuthText>{exercise.metadata}</AuthText>
          <AuthText>
            Previous:{' '}
            {exercise.performance.previous.length
              ? exercise.performance.previous
                  .map(
                    (set) =>
                      `${set.reps} × ${displayWeight(set.weightKg, draft.unit) || 'unknown'} ${draft.unit}`,
                  )
                  .join(', ')
              : 'No previous completed sets'}
          </AuthText>
          <AuthText>
            Best load:{' '}
            {exercise.performance.heaviestKg === null
              ? 'No recorded load'
              : `${displayWeight(exercise.performance.heaviestKg, draft.unit)} ${draft.unit}`}
          </AuthText>
          <AuthText>
            Adjust prefilled targets to your actual results, then mark each set Done.
          </AuthText>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={{ width: 25 }}>
              <AuthText>Set</AuthText>
            </View>
            <View style={{ flex: 1 }}>
              <AuthText>Previous</AuthText>
            </View>
            <View style={{ width: 58 }}>
              <AuthText>{draft.unit}</AuthText>
            </View>
            <View style={{ width: 50 }}>
              <AuthText>Reps</AuthText>
            </View>
            <View style={{ width: 45 }}>
              <AuthText>Done</AuthText>
            </View>
          </View>
          {exercise.sets.map((set, position) => (
            <View
              key={set.id}
              style={{
                gap: 4,
                padding: 6,
                borderRadius: 16,
                backgroundColor: set.completedAt ? colors.volt + '24' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <View style={{ width: 25 }}>
                  <AuthText>{position + 1}</AuthText>
                </View>
                <View style={{ flex: 1 }}>
                  <AuthText>
                    {exercise.performance.previous[position]
                      ? `${exercise.performance.previous[position].reps} × ${displayWeight(exercise.performance.previous[position].weightKg, draft.unit) || '?'}`
                      : '—'}
                  </AuthText>
                </View>
                {(['weight', 'reps'] as const).map((field) => (
                  <TextInput
                    key={field}
                    value={set[field]}
                    accessibilityLabel={`${field === 'weight' ? `Weight (${draft.unit})` : 'Reps'} · set ${position + 1}`}
                    keyboardType={field === 'weight' ? 'decimal-pad' : 'number-pad'}
                    maxLength={10}
                    style={{
                      width: field === 'weight' ? 58 : 50,
                      minHeight: 44,
                      padding: 6,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      color: colors.text,
                      backgroundColor: colors.surface,
                      fontFamily: 'Inter_400Regular',
                      fontSize: 16,
                    }}
                    onChangeText={(value) => setField(position, field, value)}
                  />
                ))}
                <View style={{ width: 45 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${set.completedAt ? 'Unmark' : 'Complete'} set ${position + 1}`}
                    accessibilityState={{ selected: !!set.completedAt }}
                    onPress={() => done(position, Date.now())}
                    style={{
                      minHeight: 44,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: set.completedAt ? colors.volt : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        color: set.completedAt ? '#111311' : colors.text,
                        fontSize: 14,
                        fontFamily: 'Inter_500Medium',
                      }}
                    >
                      {set.completedAt ? '✓' : 'Done'}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <AuthLink
                title={`Remove set ${position + 1}`}
                disabled={exercise.sets.length === 1}
                onPress={() =>
                  change((value) => ({
                    ...value,
                    exercises: value.exercises.map((entry, at) =>
                      at === index
                        ? { ...entry, sets: entry.sets.filter((_, place) => place !== position) }
                        : entry,
                    ),
                  }))
                }
              />
            </View>
          ))}
          <AuthButton
            title="Add set"
            outlined
            disabled={exercise.sets.length >= 100}
            onPress={() =>
              change((value) => ({
                ...value,
                exercises: value.exercises.map((entry, at) =>
                  at === index
                    ? {
                        ...entry,
                        sets: [
                          ...entry.sets,
                          {
                            ...blankSet(),
                            ...(entry.sets.at(-1) ?? {}),
                            id: randomUUID(),
                            completedAt: null,
                            rpe: '',
                          },
                        ],
                      }
                    : entry,
                ),
              }))
            }
          />
          <AuthInput
            label="Rest after a set (seconds)"
            value={exercise.sets[0].rest}
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={(rest) =>
              change((value) => ({
                ...value,
                exercises: value.exercises.map((entry, at) =>
                  at === index
                    ? { ...entry, sets: entry.sets.map((set) => ({ ...set, rest })) }
                    : entry,
                ),
              }))
            }
          />
          <AuthInput
            label="Workout note (optional)"
            multiline
            maxLength={2000}
            value={draft.notes}
            onChangeText={(notes) => change((value) => ({ ...value, notes }))}
          />
          <View style={authStyles.choices}>
            <AuthButton
              title="Previous exercise"
              outlined
              disabled={index === 0}
              onPress={() => setIndex((value) => value - 1)}
            />
            <AuthButton
              title="Next exercise"
              outlined
              disabled={index === draft.exercises.length - 1}
              onPress={() => setIndex((value) => value + 1)}
            />
          </View>
          <AuthLink title="Cancel workout" onPress={() => setDiscard(true)} />
          {discard && (
            <>
              <AuthText>
                Discard this local workout and its unsaved sets? It will not be added to history.
              </AuthText>
              <AuthButton title="Keep workout" outlined onPress={() => setDiscard(false)} />
              <AuthButton title="Discard workout" busy={busy} onPress={() => void leave()} />
            </>
          )}
        </>
      )}
    </AuthFrame>
  );
}
