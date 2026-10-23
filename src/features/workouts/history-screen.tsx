import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { WorkoutCalendar } from './workout-calendar';
import { RecordLoadFeedback, useRecords } from '@/hooks/use-records';
import { ScreenHeader, Segments, ProductIcon, StatTile } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
import { displayDate, plural } from '@/lib/format';
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
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [month, setMonth] = useState(''),
    [selectedDay, setSelectedDay] = useState('');
  const calendarLoad = useCallback(
    async () => (id || view !== 'calendar' ? null : historyService.calendar(userId, month)),
    [id, view, userId, month],
  );
  const calendar = useRecords(calendarLoad),
    refreshCalendar = calendar.refresh;
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
    [deleting, setDeleting] = useState(false);
  const pending = useRef(false),
    alive = useRef(true),
    generation = useRef(0),
    { notify } = useAuthFeedback(),
    { colors } = useAppTheme();
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
      if (view === 'calendar') {
        refreshCalendar();
        return;
      }
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
    }, [userId, id, filters, view, refreshCalendar]),
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
    if (!id || !draft || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await historyService.remove(userId, id, draft.version);
      await sessionStore.forgetSaved(userId, id);
      if (alive.current) {
        setDeleting(false);
        notify('Recorded workout deleted. Calculations use the remaining logs.', 'success');
        onBack();
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
    <AuthFrame header={<ScreenHeader title={id ? 'Recorded workout' : 'Workout history'} />}>
      <AuthLink
        title={id ? '← Workout history' : '← My workouts'}
        disabled={busy}
        onPress={() => (dirty || frozen ? setDiscard(true) : onBack())}
      />
      {!id && (
        <Segments
          options={[
            { value: 'calendar', label: 'Calendar' },
            { value: 'list', label: 'History' },
          ]}
          value={view}
          onChange={setView}
        />
      )}
      {error && <AuthNotice error>{error}</AuthNotice>}
      {loading && (id || view === 'list') ? (
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
            <View
              style={{
                gap: 6,
                padding: 18,
                borderRadius: 24,
                backgroundColor: colors.accent,
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>
                {displayDate(draft.localDate).toUpperCase()} ·{' '}
                {draft.mode === 'timed' ? 'TIMED' : 'LOG ONLY'}
              </Text>
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 25,
                  lineHeight: 32,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {draft.name || 'Recorded workout'}
              </Text>
              <Text style={{ color: '#ffffff', fontSize: 14 }}>
                {draft.mode === 'timed'
                  ? `Duration ${timerText(draft.clock.elapsedMs)}`
                  : 'Logged without a timer'}{' '}
                · {draft.timeZone}
              </Text>
            </View>
            {totals && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <StatTile
                  icon={{ ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }}
                  label="Exercises"
                  value={String(preview?.exercises.length ?? 0)}
                />
                <StatTile
                  icon={{ ios: 'square.stack', android: 'layers', web: 'layers' }}
                  label="Sets"
                  value={String(totals.sets)}
                />
                <StatTile
                  icon={{ ios: 'repeat', android: 'repeat', web: 'repeat' }}
                  label="Reps"
                  value={String(totals.reps)}
                />
                <StatTile
                  icon={{ ios: 'scalemass', android: 'monitor_weight', web: 'monitor_weight' }}
                  label="Training volume"
                  value={`${displayWeight(totals.volumeKg, draft.unit)} ${draft.unit}·reps`}
                />
              </View>
            )}
            {!!totals?.unknownWeightSets && (
              <AuthText kind="muted">
                {plural(totals.unknownWeightSets, 'set')} without a weight are excluded from volume.
              </AuthText>
            )}
            <AuthText kind="muted">
              Edits here change this performed log only; templates stay independent. Stats preview
              your edits and hide while a value is incomplete.
            </AuthText>
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
            {draft.exercises.map((exercise, index) => {
              const shown =
                savedExerciseIds.includes(exercise.id) &&
                draft.exercises.find((entry) => entry.exerciseId === exercise.exerciseId)?.id ===
                  exercise.id
                  ? (records.get(exercise.exerciseId) ?? [])
                  : [];
              const setFields = [
                ['weight', `Weight (${draft.unit})`, 'decimal-pad'],
                ['reps', 'Reps', 'number-pad'],
                ['rpe', 'RPE', 'decimal-pad'],
              ] as const;
              return (
                <AuthCard key={exercise.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.fill,
                      }}
                    >
                      <AuthText kind="heading">{index + 1}</AuthText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AuthText kind="heading">{exercise.name}</AuthText>
                      <AuthText kind="muted">{plural(exercise.sets.length, 'set')}</AuthText>
                    </View>
                  </View>
                  {!!shown.length && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {shown.map((record, at) => (
                        <View
                          key={at}
                          style={{
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            backgroundColor: colors.fill,
                          }}
                        >
                          <AuthText kind="muted">
                            {record.first ? 'First recorded' : 'New'} {record.kind}:{' '}
                            {record.kind === 'Rep PR'
                              ? `${record.value} reps at ${displayWeight(record.weightKg ?? null, draft.unit)} ${draft.unit}`
                              : `${displayWeight(Math.round(record.value * 1000) / 1000, draft.unit)} ${draft.unit}`}
                          </AuthText>
                        </View>
                      ))}
                    </View>
                  )}
                  {!savedExerciseIds.includes(exercise.id) && (
                    <AuthText kind="muted">
                      Save to recalculate records for this added exercise.
                    </AuthText>
                  )}
                  {exercise.sets.map((set, position) => {
                    const change = (field: 'weight' | 'reps' | 'rpe' | 'notes', text: string) =>
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
                      }));
                    const where = `exercise ${index + 1} set ${position + 1}`;
                    return (
                      <View
                        key={set.id}
                        style={{
                          gap: 6,
                          paddingTop: 8,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        }}
                      >
                        <View style={authStyles.row}>
                          <AuthText kind="eyebrow">SET {position + 1}</AuthText>
                          <AuthLink
                            title="Remove"
                            accessibilityLabel={`Remove recorded set ${position + 1} from exercise ${index + 1}`}
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
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {setFields.map(([field, title, keyboard]) => (
                            <View key={field} style={{ flex: 1, gap: 4 }}>
                              <AuthText kind="muted">{title}</AuthText>
                              <AuthInput
                                hideLabel
                                label={`${field === 'rpe' ? 'RPE (optional)' : title} · ${where}`}
                                value={set[field]}
                                editable={!busy && !frozen}
                                keyboardType={keyboard}
                                maxLength={10}
                                onChangeText={(text) => change(field, text)}
                              />
                            </View>
                          ))}
                        </View>
                        <AuthInput
                          hideLabel
                          label={`Set note · ${where}`}
                          placeholder="Set note (optional)"
                          value={set.notes}
                          editable={!busy && !frozen}
                          maxLength={2000}
                          onChangeText={(text) => change('notes', text)}
                        />
                      </View>
                    );
                  })}
                  <View style={authStyles.row}>
                    <AuthLink
                      title="+ Add set"
                      accessibilityLabel={`Add recorded set to exercise ${index + 1}`}
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
                      title="Remove exercise"
                      accessibilityLabel={`Remove recorded exercise ${index + 1}`}
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
              );
            })}
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
            {deleting ? (
              <AuthCard>
                <AuthText>
                  Delete this performed log? Its sets are removed and calculations use the remaining
                  logs. Templates and splits stay.
                </AuthText>
                <AuthButton
                  title="Keep recorded workout"
                  outlined
                  disabled={busy}
                  onPress={() => setDeleting(false)}
                />
                <AuthButton
                  title="Delete recorded workout"
                  busy={busy}
                  onPress={() => void remove()}
                />
              </AuthCard>
            ) : (
              <AuthLink
                title="Delete this workout"
                accessibilityLabel={`Delete recorded ${draft.name}`}
                disabled={busy || !!frozen}
                onPress={() => setDeleting(true)}
              />
            )}
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
      ) : view === 'calendar' ? (
        <>
          <RecordLoadFeedback {...calendar} retry={calendar.refresh} />
          {calendar.data && (
            <>
              <AuthText>
                {plural(calendar.data.rows.length, 'completed workout')} this month
              </AuthText>
              <WorkoutCalendar
                month={calendar.data.month}
                today={calendar.data.today}
                dates={calendar.data.rows.map((row) => row.local_date)}
                selected={selectedDay}
                onMonth={(value) => {
                  setMonth(value);
                  setSelectedDay('');
                }}
                onSelect={setSelectedDay}
              />
              <View style={authStyles.row}>
                <AuthText kind="heading">
                  {selectedDay ? displayDate(selectedDay) : 'This month'}
                </AuthText>
                {!!selectedDay && (
                  <AuthLink title="Show whole month" onPress={() => setSelectedDay('')} />
                )}
              </View>
              {/* The month's sessions show by default; choosing a day narrows the list. */}
              {calendar.data.rows.filter((row) => !selectedDay || row.local_date === selectedDay)
                .length === 0 && (
                <AuthText>
                  {selectedDay
                    ? 'No completed workouts on this date.'
                    : 'No completed workouts this month yet.'}
                </AuthText>
              )}
              {calendar.data.rows
                .filter((row) => !selectedDay || row.local_date === selectedDay)
                .sort((a, b) => b.local_date.localeCompare(a.local_date))
                .map((row) => (
                  <SessionCard key={row.id} row={row} onPress={() => onOpen(row.id)} />
                ))}
            </>
          )}
        </>
      ) : (
        <>
          <AuthInput
            label="Search recorded workouts"
            value={search}
            maxLength={120}
            editable={!busy}
            onChangeText={setSearch}
            onSubmitEditing={() => refresh({ ...filters, query: search, offset: 0 })}
          />
          <AuthButton
            title="Search history"
            outlined
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
            <SessionCard
              key={row.id}
              row={row}
              stats={[
                plural(row.sets, 'set'),
                `${displayWeight(row.volume_kg, page.unit)} ${page.unit}·reps`,
              ]}
              disabled={busy}
              onPress={() => onOpen(row.id)}
            />
          ))}
          {error && <AuthButton title="Retry history" onPress={() => refresh({ ...filters })} />}
          {(filters.offset > 0 || !!page?.more) && (
            <View style={authStyles.row}>
              <AuthLink
                title="Previous sessions"
                disabled={busy || filters.offset === 0}
                onPress={() => refresh({ ...filters, offset: Math.max(0, filters.offset - 10) })}
              />
              <AuthText>Page {filters.offset / 10 + 1}</AuthText>
              <AuthLink
                title="Next sessions"
                disabled={busy || !page?.more}
                onPress={() => refresh({ ...filters, offset: filters.offset + 10 })}
              />
            </View>
          )}
        </>
      )}
    </AuthFrame>
  );
}
// One recorded session: date and mode, name, then compact stats; the whole card opens it.
function SessionCard({
  row,
  stats = [],
  disabled = false,
  onPress,
}: {
  row: { name: string; local_date: string; mode: string; duration_seconds: number | null };
  stats?: string[];
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const time = row.mode === 'timed' ? timerText((row.duration_seconds ?? 0) * 1000) : 'Log Only';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.name}, ${displayDate(row.local_date)}, ${[...stats, time].join(', ')}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        opacity: pressed || disabled ? 0.6 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.accent,
        }}
      >
        <ProductIcon
          name={
            row.mode === 'timed'
              ? { ios: 'stopwatch', android: 'timer', web: 'timer' }
              : { ios: 'list.bullet', android: 'list', web: 'list' }
          }
          size={20}
          color="#ffffff"
        />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <AuthText kind="eyebrow">{displayDate(row.local_date).toUpperCase()}</AuthText>
        <AuthText kind="heading">{row.name}</AuthText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {[...stats, time].map((value) => (
            <View
              key={value}
              style={{
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 3,
                backgroundColor: colors.fill,
              }}
            >
              <AuthText kind="muted">{value}</AuthText>
            </View>
          ))}
        </View>
      </View>
      <ProductIcon
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
      />
    </Pressable>
  );
}
