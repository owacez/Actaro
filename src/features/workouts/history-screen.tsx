import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { LibraryScreen } from '@/features/exercises/library-screen';
import { historyService, type HistoryFilters } from './history-service';
import { sessionService } from './session-service';
import { sessionStore } from './session-store';
import { sessionPayload, timerText, emptyPerformance, type SessionDraft } from './session-model';
import { displayWeight } from './workout-model';
import { exerciseRecords, trainingVolume } from './training-metrics';
type Page = Awaited<ReturnType<typeof historyService.list>>;
export function HistoryScreen({
  userId,
  id,
  onBack,
  onOpen,
  onEquipment,
}: {
  userId: string;
  id?: string;
  onBack: () => void;
  onOpen: (id: string) => void;
  onEquipment: () => void;
}) {
  const [page, setPage] = useState<Page | null>(null),
    [filters, setFilters] = useState<HistoryFilters>({ offset: 0, query: '', mode: null }),
    [search, setSearch] = useState('');
  const [draft, setDraft] = useState<SessionDraft | null>(null),
    [baseline, setBaseline] = useState(''),
    [attempt, setAttempt] = useState(0);
  const [savedExerciseIds, setSavedExerciseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false);
  const [frozen, setFrozen] = useState<SessionDraft | null>(null),
    [discard, setDiscard] = useState(false),
    [picking, setPicking] = useState(false),
    [deleting, setDeleting] = useState<Page['rows'][number] | null>(null);
  const pending = useRef(false),
    alive = useRef(true),
    generation = useRef(0),
    { notify } = useAuthFeedback();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!id) return;
    let active = true;
    void historyService
      .load(userId, id)
      .then((value) => {
        if (!active) return;
        if (!value) throw new Error('Recorded workout unavailable.');
        setDraft(value);
        setSavedExerciseIds(value.exercises.map((exercise) => exercise.id));
        setBaseline(JSON.stringify(value));
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Unable to load workout. Retry.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, id, attempt]);
  useFocusEffect(
    useCallback(() => {
      if (id) return;
      const request = ++generation.current;
      void historyService
        .list(userId, filters)
        .then((value) => {
          if (request === generation.current) {
            setPage(value);
            setLoading(false);
          }
        })
        .catch(() => {
          if (request === generation.current) {
            setError('Unable to load history. Retry.');
            setLoading(false);
          }
        });
      return () => {
        generation.current = request + 1;
      };
    }, [userId, id, filters]),
  );
  function refresh(next: HistoryFilters) {
    setLoading(true);
    setError(null);
    setFilters(next);
  }
  function reload() {
    setLoading(true);
    setDraft(null);
    setFrozen(null);
    setError(null);
    setDiscard(false);
    setAttempt((value) => value + 1);
  }
  function edit(update: (previous: SessionDraft) => SessionDraft) {
    if (draft && !busy && !frozen) setDraft(update(draft));
  }
  async function save() {
    if (!draft || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const next = frozen ?? draft;
      sessionPayload(next);
      setFrozen(next);
      await sessionService.save(next);
      await sessionStore.forgetSaved(userId, next.id);
      if (alive.current) {
        notify('Recorded workout updated.', 'success');
        reload();
      }
    } catch (reason) {
      if (alive.current)
        setError(
          reason instanceof Error
            ? reason.message
            : 'Unable to save. Keep this screen open and retry.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await historyService.remove(userId, deleting.id, deleting.version);
      await sessionStore.forgetSaved(userId, deleting.id);
      if (alive.current) {
        setDeleting(null);
        notify('Recorded workout deleted. Calculations use the remaining logs.', 'success');
        refresh({
          ...filters,
          offset:
            page?.rows.length === 1 && filters.offset > 0 ? filters.offset - 10 : filters.offset,
        });
      }
    } catch (reason) {
      if (alive.current)
        setError(reason instanceof Error ? reason.message : 'Unable to delete. Retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const dirty = !!draft && JSON.stringify(draft) !== baseline;
  if (picking && draft)
    return (
      <View style={{ flex: 1 }}>
        <AuthLink title="← Recorded workout" onPress={() => setPicking(false)} />
        <LibraryScreen
          userId={userId}
          onEquipment={onEquipment}
          onOpen={(exerciseId, entry) => {
            edit((value) => ({
              ...value,
              exercises: [
                ...value.exercises,
                {
                  id: randomUUID(),
                  exerciseId,
                  name: entry.name,
                  imageUrl: entry.imageUrl,
                  metadata: entry.muscles.join(', '),
                  notes: '',
                  performance: emptyPerformance(),
                  sets: [
                    {
                      id: randomUUID(),
                      reps: '',
                      weight: '',
                      rest: '90',
                      rpe: '',
                      notes: '',
                      completedAt: value.endedAt,
                    },
                  ],
                },
              ],
            }));
            setPicking(false);
          }}
        />
      </View>
    );
  let preview: ReturnType<typeof sessionPayload> | null = null;
  if (draft) {
    try {
      preview = sessionPayload(draft);
    } catch {
      /* Invalid edit fields remain editable until Save validates them. */
    }
  }
  const totals = preview
    ? trainingVolume(
        preview.exercises.flatMap((exercise) =>
          exercise.sets.map((set) => ({ reps: set.reps, weightKg: set.weight_kg })),
        ),
      )
    : null;
  const records = exerciseRecords(
    preview?.exercises.map((entry) => ({
      exerciseId: entry.exercise_id,
      sets: entry.sets.map((set) => ({ reps: set.reps, weightKg: set.weight_kg })),
      performance:
        draft?.exercises.find((exercise) => exercise.id === entry.id)?.performance ??
        emptyPerformance(),
    })) ?? [],
  );
  return (
    <AuthFrame>
      <AuthLink
        title={id ? '← Workout history' : '← My workouts'}
        disabled={busy}
        onPress={() => (dirty || frozen ? setDiscard(true) : onBack())}
      />
      <AuthText kind="heading">{id ? 'Recorded workout' : 'Workout history'}</AuthText>
      {error && <AuthNotice error>{error}</AuthNotice>}
      {loading ? (
        <AuthLoading>Loading workout history…</AuthLoading>
      ) : id ? (
        draft ? (
          <>
            {discard && (
              <>
                <AuthText>Discard these unsaved history edits?</AuthText>
                <AuthButton
                  title="Keep editing"
                  outlined
                  disabled={busy}
                  onPress={() => setDiscard(false)}
                />
                <AuthButton title="Discard history edits" disabled={busy} onPress={onBack} />
              </>
            )}
            <AuthText>
              {draft.localDate} · {draft.timeZone} ·{' '}
              {draft.mode === 'timed' ? `Timed · ${timerText(draft.clock.elapsedMs)}` : 'Log Only'}
            </AuthText>
            <AuthText>
              Save applies changes to the performed log. Templates stay independent. Metrics below
              preview these edits; incomplete values hide the preview.
            </AuthText>
            {totals && (
              <AuthCard>
                <AuthText>
                  {preview?.exercises.length} exercises · {totals.sets} sets · {totals.reps} reps
                </AuthText>
                <AuthText>
                  Training Volume: {displayWeight(totals.volumeKg, draft.unit)} {draft.unit}·reps ·{' '}
                  {totals.unknownWeightSets} unknown-weight sets excluded
                </AuthText>
              </AuthCard>
            )}
            <AuthInput
              label="Recorded workout name"
              value={draft.name}
              editable={!busy && !frozen}
              maxLength={100}
              onChangeText={(name) => edit((value) => ({ ...value, name }))}
            />
            <AuthInput
              label="Recorded workout note"
              value={draft.notes}
              editable={!busy && !frozen}
              multiline
              maxLength={2000}
              onChangeText={(notes) => edit((value) => ({ ...value, notes }))}
            />
            {draft.exercises.map((exercise, index) => (
              <AuthCard key={exercise.id}>
                <View style={{ gap: 8 }}>
                  <AuthText kind="eyebrow">
                    {index + 1}. {exercise.name}
                  </AuthText>
                  {savedExerciseIds.includes(exercise.id) &&
                    draft.exercises.find((entry) => entry.exerciseId === exercise.exerciseId)
                      ?.id === exercise.id &&
                    (records.get(exercise.exerciseId) ?? []).map((record, at) => (
                      <AuthText key={at}>
                        {record.first ? 'First recorded' : 'New'} {record.kind}:{' '}
                        {record.kind === 'Rep PR'
                          ? `${record.value} reps at ${displayWeight(record.weightKg ?? null, draft.unit)} ${draft.unit}`
                          : `${displayWeight(Math.round(record.value * 1000) / 1000, draft.unit)} ${draft.unit}`}
                      </AuthText>
                    ))}
                  {!savedExerciseIds.includes(exercise.id) && (
                    <AuthText>Save to recalculate records for this added exercise.</AuthText>
                  )}
                  {exercise.sets.map((set, position) => (
                    <View key={set.id} style={{ gap: 8 }}>
                      <AuthText>Set {position + 1}</AuthText>
                      {(['weight', 'reps', 'rpe', 'notes'] as const).map((field) => (
                        <AuthInput
                          key={field}
                          label={`${field === 'weight' ? `Weight (${draft.unit})` : field === 'rpe' ? 'RPE (optional)' : field === 'notes' ? 'Set note' : 'Reps'} · exercise ${index + 1} set ${position + 1}`}
                          value={set[field]}
                          editable={!busy && !frozen}
                          keyboardType={
                            field === 'notes'
                              ? 'default'
                              : field === 'reps'
                                ? 'number-pad'
                                : 'decimal-pad'
                          }
                          maxLength={field === 'notes' ? 2000 : 10}
                          onChangeText={(text) =>
                            edit((value) => ({
                              ...value,
                              exercises: value.exercises.map((entry, at) =>
                                at === index
                                  ? {
                                      ...entry,
                                      sets: entry.sets.map((row, place) =>
                                        place === position ? { ...row, [field]: text } : row,
                                      ),
                                    }
                                  : entry,
                              ),
                            }))
                          }
                        />
                      ))}
                      <AuthLink
                        title={`Remove recorded set ${position + 1} from exercise ${index + 1}`}
                        disabled={busy || !!frozen || exercise.sets.length === 1}
                        onPress={() =>
                          edit((value) => ({
                            ...value,
                            exercises: value.exercises.map((entry, at) =>
                              at === index
                                ? {
                                    ...entry,
                                    sets: entry.sets.filter((_, place) => place !== position),
                                  }
                                : entry,
                            ),
                          }))
                        }
                      />
                    </View>
                  ))}
                  <AuthLink
                    title={`Add recorded set to exercise ${index + 1}`}
                    disabled={busy || !!frozen || exercise.sets.length >= 100}
                    onPress={() =>
                      edit((value) => ({
                        ...value,
                        exercises: value.exercises.map((entry, at) =>
                          at === index
                            ? {
                                ...entry,
                                sets: [
                                  ...entry.sets,
                                  {
                                    id: randomUUID(),
                                    reps: '',
                                    weight: '',
                                    rest: '90',
                                    rpe: '',
                                    notes: '',
                                    completedAt: value.endedAt,
                                  },
                                ],
                              }
                            : entry,
                        ),
                      }))
                    }
                  />
                  <AuthLink
                    title={`Remove recorded exercise ${index + 1}`}
                    disabled={busy || !!frozen || draft.exercises.length === 1}
                    onPress={() =>
                      edit((value) => ({
                        ...value,
                        exercises: value.exercises.filter((_, at) => at !== index),
                      }))
                    }
                  />
                </View>
              </AuthCard>
            ))}
            <AuthButton
              title="Add recorded exercise"
              outlined
              disabled={busy || !!frozen || draft.exercises.length >= 100}
              onPress={() => setPicking(true)}
            />
            <AuthButton
              title={frozen ? 'Retry history save' : 'Save recorded workout'}
              busy={busy}
              disabled={!frozen && !dirty}
              onPress={() => void save()}
            />
            {frozen && (
              <>
                <AuthText>
                  The attempted edit is kept unchanged for retry. Reloading discards that attempted
                  copy and fetches the saved record.
                </AuthText>
                <AuthButton
                  title="Discard edits and reload saved record"
                  outlined
                  disabled={busy}
                  onPress={reload}
                />
              </>
            )}
          </>
        ) : (
          <AuthButton title="Retry recorded workout" onPress={reload} />
        )
      ) : (
        <>
          <AuthText>
            Completed sessions only. Open a record to edit its actual sets or delete it.
          </AuthText>
          <AuthInput
            label="Search recorded workouts"
            value={search}
            maxLength={120}
            editable={!busy}
            onChangeText={setSearch}
          />
          <AuthButton
            title="Search history"
            disabled={busy}
            onPress={() => refresh({ ...filters, query: search, offset: 0 })}
          />
          <View style={authStyles.choices}>
            {([null, 'timed', 'log_only'] as const).map((mode) => (
              <AuthChoice
                key={mode ?? 'all'}
                title={
                  mode === 'timed' ? 'Timed' : mode === 'log_only' ? 'Log Only' : 'All sessions'
                }
                selected={filters.mode === mode}
                disabled={busy}
                onPress={() => refresh({ ...filters, mode, offset: 0 })}
              />
            ))}
          </View>
          {!page?.rows.length && (
            <AuthText>No recorded workouts match. Finish a workout to add a log.</AuthText>
          )}
          {page?.rows.map((row) => (
            <AuthCard key={row.id}>
              <AuthLink
                title={`${row.local_date} · ${row.name}`}
                disabled={busy}
                onPress={() => onOpen(row.id)}
              />
              <AuthText>
                {row.sets} sets · {displayWeight(row.volume_kg, page.unit)} {page.unit}·reps ·{' '}
                {row.mode === 'timed' ? timerText((row.duration_seconds ?? 0) * 1000) : 'Log Only'}
              </AuthText>
              <AuthLink
                title={`Delete recorded ${row.name}`}
                disabled={busy}
                onPress={() => setDeleting(row)}
              />
              {deleting?.id === row.id && (
                <>
                  <AuthText>
                    Delete this performed log? Its sets are removed and calculations use the
                    remaining logs. Templates and splits stay.
                  </AuthText>
                  <AuthButton
                    title="Keep recorded workout"
                    outlined
                    disabled={busy}
                    onPress={() => setDeleting(null)}
                  />
                  <AuthButton
                    title="Delete recorded workout"
                    busy={busy}
                    onPress={() => void remove()}
                  />
                </>
              )}
            </AuthCard>
          ))}
          {error && <AuthButton title="Retry history" onPress={() => refresh({ ...filters })} />}
          <AuthButton
            title="Previous sessions"
            outlined
            disabled={busy || filters.offset === 0}
            onPress={() => refresh({ ...filters, offset: Math.max(0, filters.offset - 10) })}
          />
          <AuthText>Page {filters.offset / 10 + 1}</AuthText>
          <AuthButton
            title="Next sessions"
            outlined
            disabled={busy || !page?.more}
            onPress={() => refresh({ ...filters, offset: filters.offset + 10 })}
          />
        </>
      )}
    </AuthFrame>
  );
}
