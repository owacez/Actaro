import { useEffect, useRef, useState } from 'react';
import { AppState, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { NavigationSurface, ScreenHeader, IconButton, ActionSheet } from '@/components/product-ui';
import { SetLogRow } from './set-log-row';
import { QuickRecovery } from './quick-recovery';
import { ProgressMetrics } from '@/features/progress/progress-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { WorkoutImage } from './workout-image';
import { blankSet, displayWeight, workoutPayload } from './workout-model';
import {
  elapsed,
  exerciseState,
  pauseClock,
  resumeClock,
  sessionPayload,
  timerText,
  type SessionDraft,
  unfinishedExercises,
} from './session-model';
import { sessionStore } from './session-store';
import { sessionService } from './session-service';
import { exerciseRecords, trainingVolume } from './training-metrics';
import { actaroColors, actaroLayout } from '@/constants/actaro-theme';
import { displayDate, plural } from '@/lib/format';

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
// The secondary finish action; reads the clock only when tapped.
function FinishWorkoutLink({
  disabled,
  onFinish,
}: {
  disabled: boolean;
  onFinish: (time: number) => void;
}) {
  return (
    <AuthLink title="Finish workout" disabled={disabled} onPress={() => onFinish(Date.now())} />
  );
}

function SaveDraftButton({
  busy,
  disabled,
  onSave,
}: {
  busy: boolean;
  disabled: boolean;
  onSave: (time: number) => Promise<void>;
}) {
  return (
    <AuthButton
      title="Save as draft"
      busy={busy}
      disabled={disabled}
      onPress={() => void onSave(Date.now())}
    />
  );
}

function LogSetButton({ number, onLog }: { number: number; onLog: (time: number) => void }) {
  return (
    <AuthButton
      title={`Log set ${number}`}
      onPress={() => {
        Keyboard.dismiss();
        onLog(Date.now());
      }}
    />
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
  const [showOptions, setShowOptions] = useState(false);
  const [focusedSet, setFocusedSet] = useState<{ exerciseId: string; setId: string } | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false),
    [exitApproved, setExitApproved] = useState(false),
    [exitAction, setExitAction] = useState<NavigationAction | null>(null);
  const navigation = useNavigation();
  const alive = useRef(true),
    pending = useRef(false),
    revision = useRef(0);
  const { colors } = useAppTheme(),
    { notify } = useAuthFeedback();
  usePreventRemove(
    !exitApproved && (loading || (!!draft && draft.status !== 'saved')),
    ({ data }) => {
      if (pending.current) return;
      setExitAction(data.action);
      setExitOpen(true);
    },
  );
  // Wait for removal prevention to be disabled before repeating the confirmed action.
  useEffect(() => {
    if (!exitApproved) return;
    if (exitAction) navigation.dispatch(exitAction);
    else onBack();
  }, [exitApproved, exitAction, navigation, onBack]);
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
      if (alive.current) {
        setExitOpen(false);
        setExitApproved(true);
      }
    } catch {
      if (alive.current) setError('Unable to clear this device draft. Retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function saveDraft(time: number) {
    const previous = current.current;
    if (!previous || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await persist(
        previous.status === 'active'
          ? {
              ...previous,
              clock: pauseClock(previous.clock, time),
              rest: previous.rest ? pauseClock(previous.rest, time) : null,
            }
          : previous,
      );
      if (alive.current) {
        setExitOpen(false);
        setExitApproved(true);
      }
    } catch {
      if (alive.current) setError('Draft could not be saved on this device. Stay here and retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function continueWorkout() {
    if (pending.current) return;
    setExitOpen(false);
    setExitAction(null);
  }
  const exitDialog = exitOpen && (
    <ActionSheet title="Leave workout?" visible onClose={continueWorkout}>
      <AuthText>
        Save a draft on this device to resume later. Discard removes the local copy only; saved
        history is kept.
      </AuthText>
      {error && <AuthNotice error>{error}</AuthNotice>}
      <SaveDraftButton busy={busy} disabled={loading || !draft} onSave={saveDraft} />
      <AuthButton
        title="Discard workout"
        outlined
        disabled={busy || loading}
        onPress={() => void leave()}
      />
      <AuthButton title="Continue workout" outlined disabled={busy} onPress={continueWorkout} />
    </ActionSheet>
  );
  if (loading)
    return (
      <AuthFrame>
        <AuthLoading>Restoring workout…</AuthLoading>
        {exitDialog}
      </AuthFrame>
    );
  if (!draft)
    return (
      <AuthFrame>
        {exitDialog}
        <BackLink label="My workouts" onPress={onBack} />
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
        {exitDialog}
        <AuthNotice error>Exercise unavailable. Reopen the saved workout.</AuthNotice>
      </AuthFrame>
    );
  const chosen =
    focusedSet?.exerciseId === exercise.id
      ? exercise.sets.findIndex((set) => set.id === focusedSet.setId)
      : -1;
  const firstReady = exercise.sets.findIndex((set) => !set.completedAt);
  const activeSet = chosen >= 0 ? chosen : firstReady >= 0 ? firstReady : exercise.sets.length - 1;
  const loggedSets = exercise.sets.filter((set) => set.completedAt).length;
  // The next exercise still to log, searching from the start so skipped-over ones return.
  const nextUp = unfinishedExercises(draft.exercises, index)[0];
  function requestFinish(time: number) {
    const latest = current.current;
    if (latest && unfinishedExercises(latest.exercises).length) setFinishOpen(true);
    else void finish(time);
  }
  const lastLoggedSet = exercise.sets.reduce(
    (last, set, position) =>
      set.completedAt && (last < 0 || set.completedAt >= (exercise.sets[last].completedAt ?? ''))
        ? position
        : last,
    -1,
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
  function done(position: number, time: number, complete: boolean) {
    const previous = current.current;
    if (!previous || previous.status !== 'active' || pending.current) return;
    const entry = previous.exercises[index],
      set = entry.sets[position];
    if (!!set.completedAt === complete) return;
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
    const completing = complete;
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
              skipped: completing ? false : item.skipped,
              sets: item.sets.map((row, place) =>
                place === position
                  ? { ...row, completedAt: completing ? new Date(time).toISOString() : null }
                  : row,
              ),
            }
          : item,
      ),
    }));
    const next = complete
      ? (entry.sets.find((row, at) => at > position && !row.completedAt) ??
        entry.sets.find((row, at) => at !== position && !row.completedAt) ??
        set)
      : set;
    setFocusedSet({ exerciseId: entry.id, setId: next.id });
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
  // One compact rest bar: the pill skips, its fill drains as rest runs out.
  const restPanel = draft.rest ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
      <AuthLink title="-15" accessibilityLabel="-15 sec" onPress={() => adjustRest(-15)} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Skip rest"
        accessibilityHint={`${timerText(remaining)} of rest left`}
        onPress={() => change((value) => ({ ...value, rest: null, restDuration: 0 }))}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.accent,
          overflow: 'hidden',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${draft.restDuration ? Math.min(100, (remaining / draft.restDuration) * 100) : 0}%`,
            backgroundColor: colors.fill,
          }}
        />
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}
        >
          <AuthText kind="heading">
            {draft.rest.runningSince === null ? 'Rest paused' : 'Skip rest'}
          </AuthText>
          <AuthText kind="heading">{timerText(remaining)}</AuthText>
        </View>
      </Pressable>
      <AuthLink title="+15" accessibilityLabel="+15 sec" onPress={() => adjustRest(15)} />
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
    </View>
  ) : null;
  return (
    <AuthFrame
      pinnedHeader
      header={
        <ScreenHeader
          title={summary ? 'Workout complete' : draft.name}
          subtitle={
            summary
              ? displayDate(draft.localDate)
              : (draft.mode === 'timed'
                  ? timerText(elapsed(draft.clock, now)) + ' · TIMED'
                  : 'LOG ONLY') +
                ' · ' +
                String(index + 1) +
                ' OF ' +
                String(draft.exercises.length)
          }
        />
      }
      footer={
        !summary && draft.status === 'active' ? (
          <NavigationSurface
            style={{
              width: '100%',
              maxWidth: actaroLayout.contentWidth,
              alignSelf: 'center',
              paddingHorizontal: 20,
              paddingBottom: 12,
              gap: 6,
            }}
          >
            {restPanel}
            {exercise.sets[activeSet].completedAt ? (
              firstReady >= 0 ? (
                <AuthButton
                  title={`Continue to set ${firstReady + 1}`}
                  onPress={() =>
                    setFocusedSet({ exerciseId: exercise.id, setId: exercise.sets[firstReady].id })
                  }
                />
              ) : nextUp ? (
                <AuthButton title={`Go to ${nextUp.name}`} onPress={() => setIndex(nextUp.index)} />
              ) : (
                <FinishWorkoutButton busy={busy} onFinish={finish} />
              )
            ) : (
              <LogSetButton number={activeSet + 1} onLog={(time) => done(activeSet, time, true)} />
            )}
            {firstReady >= 0 || nextUp ? (
              <FinishWorkoutLink disabled={busy} onFinish={requestFinish} />
            ) : null}
          </NavigationSurface>
        ) : undefined
      }
    >
      {exitDialog}
      <ActionSheet
        title="Finish with exercises left?"
        visible={finishOpen}
        onClose={() => {
          if (!busy) setFinishOpen(false);
        }}
      >
        <AuthText>These exercises still have sets that were not logged:</AuthText>
        {unfinishedExercises(draft.exercises).map((item) => (
          <AuthText key={item.index}>
            {item.index + 1}. {item.name} ·{' '}
            {item.state === 'not_started'
              ? 'not started'
              : `${plural(item.remaining, 'set')} not logged`}
          </AuthText>
        ))}
        {unfinishedExercises(draft.exercises)[0] && (
          <AuthButton
            title={`Go to ${unfinishedExercises(draft.exercises)[0].name}`}
            disabled={busy}
            onPress={() => {
              setIndex(unfinishedExercises(draft.exercises)[0].index);
              setFinishOpen(false);
            }}
          />
        )}
        <AuthButton
          title="Mark as skipped and finish"
          outlined
          busy={busy}
          onPress={() => {
            const left = new Set(unfinishedExercises(draft.exercises).map((item) => item.index));
            change((value) => ({
              ...value,
              exercises: value.exercises.map((entry, at) =>
                left.has(at) ? { ...entry, skipped: true } : entry,
              ),
            }));
            setFinishOpen(false);
            void finish(Date.now());
          }}
        />
        <AuthLink title="Keep training" disabled={busy} onPress={() => setFinishOpen(false)} />
      </ActionSheet>
      <BackLink
        label="My workouts"
        disabled={busy}
        onPress={() => {
          if (draft.status === 'saved') onBack();
          else {
            setExitAction(null);
            setExitOpen(true);
          }
        }}
      />
      {error && !exitOpen && <AuthNotice error>{error}</AuthNotice>}
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
          <AuthText kind="title">{draft.name}</AuthText>
          <ProgressMetrics
            metrics={[
              ...(draft.mode === 'timed'
                ? [{ title: 'Duration', value: timerText((summary.duration_seconds ?? 0) * 1000) }]
                : []),
              { title: 'Sets', value: String(totals.sets) },
              { title: 'Reps', value: String(totals.reps) },
              {
                title: 'Training Volume',
                value: displayWeight(totals.volumeKg, draft.unit) + ' ' + draft.unit + '·reps',
              },
            ]}
          />
          <AuthText kind="muted">
            Training Volume is external load × reps; bodyweight counts as zero load.
            {totals.unknownWeightSets
              ? ` ${totals.unknownWeightSets} sets with unknown weight are excluded.`
              : ''}
          </AuthText>
          {summary.exercises.map((entry) => {
            const original = draft.exercises.find((item) => item.id === entry.id);
            const records =
              summary.exercises.find((item) => item.exercise_id === entry.exercise_id)?.id ===
              entry.id
                ? (recordsByExercise.get(entry.exercise_id) ?? [])
                : [];
            return (
              <AuthCard key={entry.id}>
                <AuthText kind="heading">{original?.name}</AuthText>
                {entry.sets.map((set, at) => (
                  <View key={at} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 20 }}>
                      <AuthText kind="muted">{at + 1}</AuthText>
                    </View>
                    <AuthText>
                      {set.weight_kg === null
                        ? 'Unknown load'
                        : `${displayWeight(set.weight_kg, draft.unit)} ${draft.unit}`}{' '}
                      × {set.reps}
                    </AuthText>
                  </View>
                ))}
                {records.map((record, at) => (
                  <View
                    key={`record-${at}`}
                    style={{
                      alignSelf: 'flex-start',
                      borderRadius: 10,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      backgroundColor: actaroColors.volt,
                    }}
                  >
                    <Text style={{ color: actaroColors.text, fontFamily: 'Inter_600SemiBold' }}>
                      {record.first ? 'First recorded' : 'New'} {record.kind}:{' '}
                      {record.kind === 'Rep PR'
                        ? `${record.value} reps at ${displayWeight(record.weightKg ?? null, draft.unit)} ${draft.unit}`
                        : `${displayWeight(Math.round(record.value * 1000) / 1000, draft.unit)} ${draft.unit}`}
                    </Text>
                  </View>
                ))}
              </AuthCard>
            );
          })}
          <AuthText kind="muted">
            Estimated 1RM uses Epley for 2–10 reps, or the actual one-rep load. It is an estimate,
            not a measured maximum.
          </AuthText>
          {!!draft.notes && <AuthText>Note: {draft.notes}</AuthText>}
          <QuickRecovery userId={userId} date={draft.localDate} timeZone={draft.timeZone} />
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
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
              padding: 14,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AuthText kind="eyebrow">
                  {draft.mode === 'timed'
                    ? draft.clock.runningSince === null
                      ? 'WORKOUT TIME · PAUSED'
                      : 'WORKOUT TIME'
                    : 'LOG ONLY'}
                </AuthText>
                {draft.mode === 'timed' ? (
                  <AuthText kind="metric">{timerText(elapsed(draft.clock, now))}</AuthText>
                ) : (
                  <AuthText>No workout timer. Sets and rest still record.</AuthText>
                )}
              </View>
              {draft.mode === 'timed' && (
                <IconButton
                  label={
                    draft.clock.runningSince === null
                      ? 'Resume workout timer'
                      : 'Pause workout timer'
                  }
                  name={
                    draft.clock.runningSince === null
                      ? { ios: 'play', android: 'play_arrow', web: 'play_arrow' }
                      : { ios: 'pause', android: 'pause', web: 'pause' }
                  }
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
              )}
            </View>
            {/* Every exercise with its progress; tap to jump without stepping through the list. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {draft.exercises.map((entry, at) => {
                  const logged = entry.sets.filter((set) => set.completedAt).length;
                  const selected = at === index;
                  return (
                    <Pressable
                      key={entry.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Exercise ${at + 1}: ${entry.name}, ${logged} of ${entry.sets.length} sets logged${exerciseState(entry) === 'skipped' ? ', skipped' : ''}`}
                      accessibilityState={{ selected }}
                      onPress={() => setIndex(at)}
                      style={{
                        maxWidth: 170,
                        minHeight: 44,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: selected ? colors.accent : colors.border,
                        backgroundColor: selected ? colors.fill : colors.background,
                      }}
                    >
                      <AuthText kind="eyebrow">
                        {at + 1} · {logged}/{entry.sets.length}
                        {exerciseState(entry) === 'done'
                          ? ' ✓'
                          : exerciseState(entry) === 'skipped'
                            ? ' · Skipped'
                            : ''}
                      </AuthText>
                      <AuthText>{entry.name}</AuthText>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
          <WorkoutImage
            key={exercise.id}
            exerciseId={exercise.exerciseId}
            url={exercise.imageUrl}
            label={`${exercise.name} technique`}
            large
            size={224}
            framed={false}
          />
          <View style={{ gap: 4 }}>
            <AuthText kind="title">{exercise.name}</AuthText>
            <AuthText kind="muted">
              {[
                exercise.metadata,
                exercise.performance.heaviestKg === null
                  ? 'No recorded best load'
                  : `Best ${displayWeight(exercise.performance.heaviestKg, draft.unit)} ${draft.unit}`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AuthText>
          </View>
          <View style={authStyles.row}>
            <AuthText kind="eyebrow">
              {loggedSets} of {exercise.sets.length} sets logged
            </AuthText>
            {lastLoggedSet >= 0 && (
              <AuthLink title="Undo last set" onPress={() => done(lastLoggedSet, now, false)} />
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {exercise.sets.map((set, position) => (
              <Pressable
                key={set.id}
                accessibilityRole="button"
                accessibilityLabel={`View set ${position + 1}, ${set.completedAt ? 'logged' : 'not logged'}`}
                accessibilityState={{ selected: position === activeSet }}
                onPress={() => setFocusedSet({ exerciseId: exercise.id, setId: set.id })}
                style={{ flex: 1, minHeight: 28, justifyContent: 'center' }}
              >
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: set.completedAt
                      ? colors.accent
                      : position === activeSet
                        ? colors.text
                        : colors.fill,
                  }}
                />
              </Pressable>
            ))}
          </View>
          {loggedSets === exercise.sets.length && (
            <AuthText>
              All sets logged. Continue to the next exercise or finish your workout.
            </AuthText>
          )}
          {exercise.sets.map((set, position) => (
            <SetLogRow
              key={set.id}
              number={position + 1}
              reps={set.reps}
              weight={set.weight}
              unit={draft.unit}
              completed={!!set.completedAt}
              selected={position === activeSet}
              onSelect={() => setFocusedSet({ exerciseId: exercise.id, setId: set.id })}
              onChange={(field, value) => setField(position, field, value)}
              previous={
                exercise.performance.previous[position]
                  ? exercise.performance.previous[position].reps +
                    ' x ' +
                    (displayWeight(exercise.performance.previous[position].weightKg, draft.unit) ||
                      '?') +
                    ' ' +
                    draft.unit
                  : 'No previous set'
              }
              onLog={() => {
                done(position, Date.now(), true);
              }}
              onUndo={() => {
                done(position, Date.now(), false);
              }}
              onRemove={
                set.completedAt || exercise.sets.length === 1
                  ? undefined
                  : () =>
                      change((value) => ({
                        ...value,
                        exercises: value.exercises.map((entry, at) =>
                          at === index
                            ? { ...entry, sets: entry.sets.filter((row) => row.id !== set.id) }
                            : entry,
                        ),
                      }))
              }
            >
              {(['rpe', 'notes'] as const).map((field) => (
                <AuthInput
                  key={field}
                  label={field.toUpperCase() + ' · set ' + (position + 1)}
                  value={set[field]}
                  keyboardType={field === 'rpe' ? 'decimal-pad' : 'default'}
                  maxLength={field === 'rpe' ? 4 : 2000}
                  onChangeText={(value) => setField(position, field, value)}
                />
              ))}
            </SetLogRow>
          ))}
          <AuthButton
            title="Add set"
            outlined
            disabled={exercise.sets.length >= 100}
            onPress={() => {
              const setId = randomUUID();
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
                            id: setId,
                            completedAt: null,
                            rpe: '',
                          },
                        ],
                      }
                    : entry,
                ),
              }));
              setFocusedSet({ exerciseId: exercise.id, setId });
            }}
          />
          {exerciseState(exercise) === 'skipped' ? (
            <View style={authStyles.row}>
              <AuthText kind="muted">Skipped. Unlogged sets are left out when you finish.</AuthText>
              <AuthLink
                title="Undo skip"
                onPress={() =>
                  change((value) => ({
                    ...value,
                    exercises: value.exercises.map((entry, at) =>
                      at === index ? { ...entry, skipped: false } : entry,
                    ),
                  }))
                }
              />
            </View>
          ) : (
            exerciseState(exercise) !== 'done' && (
              <AuthLink
                title="Skip exercise"
                accessibilityLabel={`Skip ${exercise.name}`}
                onPress={() => {
                  change((value) => ({
                    ...value,
                    exercises: value.exercises.map((entry, at) =>
                      at === index ? { ...entry, skipped: true } : entry,
                    ),
                  }));
                  if (nextUp) setIndex(nextUp.index);
                }}
              />
            )
          )}
          <AuthLink
            title={showOptions ? 'Hide workout options' : 'Rest and workout notes'}
            onPress={() => setShowOptions((value) => !value)}
          />
          {showOptions && (
            <>
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
            </>
          )}
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
          <AuthLink
            title="Cancel workout"
            onPress={() => {
              setExitAction(null);
              setExitOpen(true);
            }}
          />
        </>
      )}
    </AuthFrame>
  );
}
