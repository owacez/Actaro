import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  BackLink,
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
import { historyService, type HistoryFilters } from './history-service';
import { sessionStore } from './session-store';
import { emptyPerformance, sessionPayload, timerText, type SessionDraft } from './session-model';
import { displayWeight } from './workout-model';
import { exerciseRecords, trainingVolume } from './training-metrics';
import { WorkoutCalendar } from './workout-calendar';
import { RecordLoadFeedback, useRecords } from '@/hooks/use-records';
import { ScreenHeader, Segments, ProductIcon } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
import { displayDate, plural } from '@/lib/format';
type Page = Awaited<ReturnType<typeof historyService.list>>;
export function HistoryScreen({
  userId,
  id,
  onBack,
  onOpen,
}: {
  userId: string;
  id?: string;
  onBack: () => void;
  onOpen: (id: string) => void;
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
    [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
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
    setError(null);
    setAttempt((value) => value + 1);
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
  // A recorded workout is a read-only log; its stats and records come from the saved sets.
  let preview: ReturnType<typeof sessionPayload> | null = null;
  if (draft) {
    try {
      preview = sessionPayload(draft);
    } catch {
      /* A stored record that no longer validates still shows its sets without totals. */
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
      <BackLink label={id ? 'Workout history' : 'My workouts'} disabled={busy} onPress={onBack} />
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
            <AuthCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
                      draft.mode === 'timed'
                        ? { ios: 'stopwatch', android: 'timer', web: 'timer' }
                        : { ios: 'list.bullet', android: 'list', web: 'list' }
                    }
                    size={20}
                    color="#ffffff"
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <AuthText kind="eyebrow">
                    {displayDate(draft.localDate).toUpperCase()} ·{' '}
                    {draft.mode === 'timed' ? timerText(draft.clock.elapsedMs) : 'LOG ONLY'}
                  </AuthText>
                  <AuthText kind="title">{draft.name || 'Recorded workout'}</AuthText>
                </View>
              </View>
              {totals && (
                <View
                  style={{
                    flexDirection: 'row',
                    paddingTop: 12,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.border,
                  }}
                >
                  {[
                    ['Exercises', String(preview?.exercises.length ?? 0)],
                    ['Sets', String(totals.sets)],
                    ['Reps', String(totals.reps)],
                    ['Volume', `${displayWeight(totals.volumeKg, draft.unit)} ${draft.unit}`],
                  ].map(([label, value]) => (
                    <View
                      key={label}
                      accessible
                      accessibilityLabel={`${label}: ${value}`}
                      style={{ flex: 1, gap: 2 }}
                    >
                      <AuthText kind="heading">{value}</AuthText>
                      <AuthText kind="muted">{label}</AuthText>
                    </View>
                  ))}
                </View>
              )}
              {!!draft.notes && <NoteLine text={draft.notes} />}
            </AuthCard>
            {draft.exercises.map((exercise, index) => {
              const best =
                draft.exercises.find((entry) => entry.exerciseId === exercise.exerciseId)?.id ===
                exercise.id
                  ? (records.get(exercise.exerciseId) ?? []).filter(
                      (record) => record.kind !== 'Rep PR',
                    )
                  : [];
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
                  {!!best.length && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {best.map((record) => (
                        <View
                          key={record.kind}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            backgroundColor: colors.fill,
                          }}
                        >
                          <ProductIcon
                            name={{ ios: 'trophy', android: 'emoji_events', web: 'emoji_events' }}
                            size={12}
                            color={colors.accent}
                          />
                          <AuthText kind="muted">
                            {record.first ? 'First' : 'New'}{' '}
                            {record.kind === 'Estimated 1RM' ? 'est. 1RM' : 'heaviest'}{' '}
                            {displayWeight(Math.round(record.value * 1000) / 1000, draft.unit)}{' '}
                            {draft.unit}
                          </AuthText>
                        </View>
                      ))}
                    </View>
                  )}
                  {!!exercise.notes && <NoteLine text={exercise.notes} />}
                  <View>
                    {exercise.sets.map((set, position) => (
                      <View
                        key={set.id}
                        accessible
                        accessibilityLabel={`Set ${position + 1}: ${set.weight ? `${set.weight} ${draft.unit}` : 'bodyweight'} × ${set.reps} reps${set.rpe ? `, RPE ${set.rpe}` : ''}`}
                        style={{
                          gap: 2,
                          paddingVertical: 8,
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ width: 22 }}>
                            <AuthText kind="muted">{position + 1}</AuthText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 15,
                                fontFamily: 'Inter_600SemiBold',
                                fontVariant: ['tabular-nums'],
                              }}
                            >
                              {set.weight ? `${set.weight} ${draft.unit}` : 'Bodyweight'} ×{' '}
                              {set.reps}
                            </Text>
                          </View>
                          {!!set.rpe && <AuthText kind="muted">RPE {set.rpe}</AuthText>}
                        </View>
                        {!!set.notes && (
                          <View style={{ paddingLeft: 34 }}>
                            <NoteLine text={set.notes} />
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </AuthCard>
              );
            })}
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
                disabled={busy}
                onPress={() => setDeleting(true)}
              />
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

// A note shows on one line; long notes expand on request.
function NoteLine({ text }: { text: string }) {
  const [open, setOpen] = useState(false),
    { colors } = useAppTheme();
  const long = text.length > 60 || text.includes('\n');
  return (
    <View style={{ gap: 2 }}>
      <Text
        numberOfLines={open ? undefined : 1}
        style={{ fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: colors.muted }}
      >
        {text}
      </Text>
      {long && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Show less of note' : 'Show more of note'}
          onPress={() => setOpen((value) => !value)}
          hitSlop={8}
        >
          <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.accent }}>
            {open ? 'Less' : 'More'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
