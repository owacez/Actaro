import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { View } from 'react-native';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthText,
  AuthNotice,
  authStyles,
} from '@/features/auth/auth-components';
import {
  RecordLoadFeedback,
  RecordSaveFeedback,
  useRecords,
  useRecordAction,
} from '@/hooks/use-records';
import { profileService } from '@/features/profile/profile-service';
import {
  formatNumber,
  localNutritionDate as localDate,
  nutritionDate as validDate,
} from '@/features/nutrition/nutrition-model';
import {
  habitActive,
  habitConsistency,
  habitKinds,
  habitPayload,
  habitReached,
  habitToday,
  habitValue,
  habitVersion,
  isoWeekday,
  logValue,
  motivationModes,
  reminderDue,
  weekdays,
  type HabitForm,
  type HabitRecord,
} from './habit-model';
import { habitService } from './habit-service';
type OpenHabit = (view: 'edit' | 'log' | 'history', id?: string, date?: string) => void;
function useHabitRecord(
  userId: string,
  habitId: string,
  asOf: string | undefined,
  onLoaded?: (value: Awaited<ReturnType<typeof habitService.load>>) => void,
) {
  const load = useCallback(() => habitService.load(userId, habitId, asOf), [userId, habitId, asOf]);
  return useRecords(load, onLoaded);
}
function Progress({ record, today }: { record: HabitRecord; today: string }) {
  const result = habitConsistency(record, today),
    mode = habitVersion(record, today)?.motivation;
  if (mode === 'none') return null;
  return (
    <AuthText>
      {mode === 'streak'
        ? `${result.atLeast ? '≥' : ''}${result.streak} scheduled ${record.kind === 'frequency' ? 'week' : 'day'} streak`
        : mode === 'weekly'
          ? result.lastWeekPercentage === null
            ? 'No completed-week evidence yet'
            : `${formatNumber(result.lastWeekPercentage)}% last full week`
          : result.percentage === null
            ? 'No closed or completed actions yet'
            : `${formatNumber(result.percentage)}% recent completion`}{' '}
      · History window: 90 dates. Rest days and open periods are excluded; partial frequency weeks
      are excluded.
    </AuthText>
  );
}
export function HabitsScreen({
  userId,
  onOpen,
  onBack,
}: {
  userId: string;
  onOpen: OpenHabit;
  onBack: () => void;
}) {
  const [offset, setOffset] = useState(0),
    [archived, setArchived] = useState(false),
    [remove, setRemove] = useState<string | null>(null),
    [now, setNow] = useState(() => new Date());
  const load = useCallback(
      () => habitService.list(userId, offset, archived),
      [userId, offset, archived],
    ),
    resource = useRecords(load),
    action = useRecordAction(),
    refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(timer);
    }, [refresh]),
  );
  return (
    <AuthFrame>
      <AuthLink title="← More" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">Habits</AuthText>
      <AuthButton title="Create habit" disabled={action.locked} onPress={() => onOpen('edit')} />
      <View style={authStyles.choices}>
        <AuthChoice
          title="Active habits"
          selected={!archived}
          disabled={action.locked}
          onPress={() => {
            setArchived(false);
            setOffset(0);
          }}
        />
        <AuthChoice
          title="Deleted habits"
          selected={archived}
          disabled={action.locked}
          onPress={() => {
            setArchived(true);
            setOffset(0);
          }}
        />
      </View>
      <RecordLoadFeedback {...resource} retry={refresh} />
      {resource.data && !resource.loading && (
        <>
          {!resource.data.rows.length && (
            <AuthNotice>
              {archived
                ? 'No deleted habits.'
                : 'No habits yet. Create one with a schedule that suits you.'}
            </AuthNotice>
          )}
          {resource.data.rows.map((record) => {
            const today = habitToday(record, now),
              version =
                habitVersion(record, today) ??
                [...record.habit_versions].sort((a, b) =>
                  a.effective_from.localeCompare(b.effective_from),
                )[0],
              value = habitValue(record, today),
              scheduled = version?.weekdays.includes(isoWeekday(today)),
              active = habitActive(record, today);
            return (
              <AuthCard key={record.id}>
                <AuthText kind="heading">{record.name}</AuthText>
                <AuthText>
                  {record.kind} · {record.kind === 'frequency' ? 'weekly target' : 'daily target'}{' '}
                  {formatNumber(version?.target ?? 0)} {record.unit} · {record.time_zone}
                </AuthText>
                <AuthText>
                  {record.start_date > today
                    ? 'Starts ' + record.start_date
                    : !active
                      ? 'Not active today'
                      : !scheduled
                        ? 'Rest / non-action day'
                        : habitReached(record, value, version?.target ?? 0)
                          ? 'Target met'
                          : value === null
                            ? 'Not logged'
                            : `${formatNumber(value)} recorded`}
                  {reminderDue(record, now) ? ' · Reminder due' : ''}
                </AuthText>
                <Progress record={record} today={today} />
                {version?.reminder_time && (
                  <AuthText>In-app reminder {version.reminder_time}</AuthText>
                )}
                <View style={authStyles.choices}>
                  {active && (
                    <>
                      {record.kind === 'boolean' && (
                        <AuthLink
                          title={`Mark ${record.name} done`}
                          disabled={action.locked || value === 1}
                          onPress={() =>
                            void action.run(
                              () => habitService.log(userId, record.id, today, 1, ''),
                              'Habit logged',
                              refresh,
                            )
                          }
                        />
                      )}
                      {record.kind === 'avoidance' && (
                        <AuthLink
                          title={`No occurrences: ${record.name}`}
                          disabled={action.locked || value === 0}
                          onPress={() =>
                            void action.run(
                              () => habitService.log(userId, record.id, today, 0, ''),
                              'Habit logged',
                              refresh,
                            )
                          }
                        />
                      )}
                      <AuthLink
                        title={`Log ${record.name}`}
                        disabled={action.locked}
                        onPress={() => onOpen('log', record.id, today)}
                      />
                    </>
                  )}
                  <AuthLink
                    title={`History: ${record.name}`}
                    disabled={action.locked}
                    onPress={() => onOpen('history', record.id)}
                  />
                  {!archived && (
                    <AuthLink
                      title={`Edit ${record.name}`}
                      disabled={action.locked}
                      onPress={() => onOpen('edit', record.id)}
                    />
                  )}
                  <AuthLink
                    title={`${archived ? 'Restore' : 'Delete'} ${record.name}`}
                    disabled={action.locked}
                    onPress={() =>
                      archived
                        ? void action.run(
                            () => habitService.archive(userId, record.id, false),
                            'Habit restored',
                            refresh,
                          )
                        : setRemove(record.id)
                    }
                  />
                </View>
                {remove === record.id && (
                  <>
                    <AuthText>
                      Remove this habit from active tracking? Its history is retained.
                    </AuthText>
                    <AuthButton
                      title="Confirm habit deletion"
                      disabled={action.locked}
                      busy={action.busy}
                      onPress={() =>
                        void action.run(
                          () => habitService.archive(userId, record.id),
                          'Habit deleted',
                          () => {
                            setRemove(null);
                            refresh();
                          },
                        )
                      }
                    />
                    <AuthLink
                      title="Keep habit"
                      disabled={action.locked}
                      onPress={() => setRemove(null)}
                    />
                  </>
                )}
              </AuthCard>
            );
          })}
          <View style={authStyles.row}>
            <AuthLink
              title="Previous habits"
              disabled={action.locked || offset === 0}
              onPress={() => setOffset((value) => Math.max(0, value - 24))}
            />
            <AuthText>Page {offset / 24 + 1}</AuthText>
            <AuthLink
              title="Next habits"
              disabled={action.locked || resource.data.rows.length < 24}
              onPress={() => setOffset((value) => value + 24)}
            />
          </View>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
export function HabitEditor({
  userId,
  habitId,
  onBack,
  onSaved,
}: {
  userId: string;
  habitId?: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [id] = useState(() => habitId ?? randomUUID()),
    [form, setForm] = useState<HabitForm>({
      name: '',
      kind: 'boolean',
      unit: 'done',
      start: '',
      zone: 'UTC',
      target: '1',
      days: [1, 2, 3, 4, 5, 6, 7],
      end: '',
      motivation: 'weekly',
      reminder: '',
    });
  const load = useCallback(async () => {
    const preferences = await profileService.getPreferences(userId),
      saved = habitId ? await habitService.load(userId, habitId) : null;
    return { preferences, saved };
  }, [userId, habitId]);
  const onLoaded = useCallback((value: Awaited<ReturnType<typeof load>>) => {
      if (value.saved) {
        const record = value.saved.record,
          version = [...record.habit_versions].sort((a, b) =>
            b.effective_from.localeCompare(a.effective_from),
          )[0],
          kind = habitKinds.find((kind) => kind === record.kind);
        if (!version || !kind) throw new Error('Habit settings unavailable.');
        setForm({
          name: record.name,
          kind,
          unit: record.unit,
          start: record.start_date,
          zone: record.time_zone,
          target: String(version.target),
          days: version.weekdays,
          end: version.end_date ?? '',
          motivation: version.motivation,
          reminder: version.reminder_time ?? '',
        });
      } else
        setForm((current) => ({
          ...current,
          start: localDate(value.preferences.time_zone),
          zone: value.preferences.time_zone,
        }));
    }, []),
    resource = useRecords(load, onLoaded),
    action = useRecordAction();
  function save() {
    try {
      habitPayload(form);
      void action.run(() => habitService.save(userId, id, form), 'Habit saved', onSaved);
    } catch (reason) {
      action.setError(reason instanceof Error ? reason.message : 'Check habit settings.');
    }
  }
  return (
    <AuthFrame>
      <AuthLink title="← Habits" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">{habitId ? 'Edit habit' : 'Create habit'}</AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthInput
            label="Habit name"
            value={form.name}
            maxLength={120}
            editable={!action.locked}
            onChangeText={(name) => setForm((current) => ({ ...current, name }))}
          />
          <View style={authStyles.choices}>
            {habitKinds.map((kind) => (
              <AuthChoice
                key={kind}
                title={kind}
                selected={form.kind === kind}
                disabled={action.locked || !!habitId}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    kind,
                    unit:
                      kind === 'boolean'
                        ? 'done'
                        : kind === 'duration'
                          ? 'minutes'
                          : kind === 'numeric'
                            ? 'units'
                            : 'times',
                    target: kind === 'avoidance' ? '0' : '1',
                  }))
                }
              />
            ))}
          </View>
          {form.kind === 'numeric' && (
            <AuthInput
              label="Tracking unit"
              value={form.unit}
              maxLength={40}
              editable={!action.locked && !habitId}
              onChangeText={(unit) => setForm((current) => ({ ...current, unit }))}
            />
          )}
          {form.kind !== 'boolean' && (
            <AuthInput
              label={
                form.kind === 'frequency'
                  ? 'Occurrences per week'
                  : form.kind === 'avoidance'
                    ? 'Maximum occurrences per scheduled day'
                    : `Daily target (${form.unit})`
              }
              value={form.target}
              keyboardType="decimal-pad"
              editable={!action.locked}
              onChangeText={(target) => setForm((current) => ({ ...current, target }))}
            />
          )}
          <AuthText>
            {form.kind === 'frequency'
              ? 'Log occurrence counts on any active date. Weekly targets use Monday–Sunday. Partial first/last weeks are excluded from consistency.'
              : 'Choose your scheduled days. Rest and non-action days never break progress.'}
          </AuthText>
          <View style={authStyles.choices}>
            {weekdays.map((day, index) => (
              <AuthChoice
                key={day}
                title={day}
                selected={form.days.includes(index + 1)}
                disabled={action.locked}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    days: current.days.includes(index + 1)
                      ? current.days.filter((value) => value !== index + 1)
                      : [...current.days, index + 1],
                  }))
                }
              />
            ))}
          </View>
          <AuthInput
            label="Start date (YYYY-MM-DD)"
            value={form.start}
            editable={!action.locked && !habitId}
            onChangeText={(start) => setForm((current) => ({ ...current, start }))}
          />
          <AuthInput
            label="End date (optional YYYY-MM-DD)"
            value={form.end}
            editable={!action.locked}
            onChangeText={(end) => setForm((current) => ({ ...current, end }))}
          />
          <AuthText>
            Schedule time zone: {form.zone}. Type, unit, start and time zone stay fixed after
            creation. Target/schedule edits apply from today; earlier results keep their earlier
            settings.
          </AuthText>
          <AuthInput
            label="In-app reminder (optional HH:MM)"
            value={form.reminder}
            editable={!action.locked}
            onChangeText={(reminder) => setForm((current) => ({ ...current, reminder }))}
          />
          <AuthText>
            Shown as due in the app on scheduled days. Device alerts are not enabled.
          </AuthText>
          <AuthText kind="eyebrow">Progress style</AuthText>
          <View style={authStyles.choices}>
            {motivationModes.map((mode) => (
              <AuthChoice
                key={mode.key}
                title={mode.label}
                selected={form.motivation === mode.key}
                disabled={action.locked}
                onPress={() => setForm((current) => ({ ...current, motivation: mode.key }))}
              />
            ))}
          </View>
          <AuthButton
            title="Save habit"
            disabled={action.locked || resource.data.saved?.record.archived}
            busy={action.busy}
            onPress={save}
          />
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
export function HabitLogScreen({
  userId,
  habitId,
  requestedDate,
  onBack,
}: {
  userId: string;
  habitId: string;
  requestedDate?: string;
  onBack: () => void;
}) {
  const [date, setDate] = useState(requestedDate ?? ''),
    [value, setValue] = useState(''),
    [notes, setNotes] = useState(''),
    [remove, setRemove] = useState(false);
  const onLoaded = useCallback(
      (data: Awaited<ReturnType<typeof habitService.load>>) => {
        const selected = requestedDate ?? data.today,
          log = data.record.habit_logs.find((log) => log.local_date === selected);
        setDate(selected);
        setValue(log ? String(log.value) : '');
        setNotes(log?.notes ?? '');
      },
      [requestedDate],
    ),
    resource = useHabitRecord(userId, habitId, requestedDate, onLoaded),
    action = useRecordAction();
  function save() {
    if (!resource.data) return;
    try {
      const day = validDate(date);
      if (day > resource.data.today) throw new Error('Log today or a previous date.');
      const actual = logValue(resource.data.record, value);
      if (notes.length > 2000) throw new Error('Keep notes within 2,000 characters.');
      void action.run(
        () => habitService.log(userId, habitId, day, actual, notes),
        'Habit logged',
        onBack,
      );
    } catch (reason) {
      action.setError(reason instanceof Error ? reason.message : 'Check the log.');
    }
  }
  return (
    <AuthFrame>
      <AuthLink title="← Habits" disabled={action.locked} onPress={onBack} />
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {resource.data && !resource.loading && (
        <>
          <AuthText kind="title">{resource.data.record.name}</AuthText>
          <AuthText>
            {resource.data.record.kind === 'frequency'
              ? 'Enter the total occurrences for this date; repeat saves replace that date’s count.'
              : 'Record the actual result. An unlogged date is never automatically marked complete.'}
          </AuthText>
          <AuthInput
            label="Log date (YYYY-MM-DD)"
            value={date}
            editable={!action.locked}
            onChangeText={setDate}
          />
          {resource.data.record.kind === 'boolean' ? (
            <View style={authStyles.choices}>
              <AuthChoice
                title="Done"
                selected={value === '1'}
                disabled={action.locked}
                onPress={() => setValue('1')}
              />
              <AuthChoice
                title="Not done"
                selected={value === '0'}
                disabled={action.locked}
                onPress={() => setValue('0')}
              />
            </View>
          ) : (
            <AuthInput
              label={`Logged value (${resource.data.record.unit})`}
              value={value}
              editable={!action.locked}
              keyboardType="decimal-pad"
              onChangeText={setValue}
            />
          )}
          <AuthInput
            label="Habit note (optional)"
            value={notes}
            editable={!action.locked}
            onChangeText={setNotes}
            maxLength={2000}
            multiline
          />
          <AuthButton
            title="Save habit log"
            disabled={action.locked || resource.data.record.archived}
            busy={action.busy}
            onPress={save}
          />
          <AuthLink
            title="Remove this date's log"
            disabled={action.locked}
            onPress={() => setRemove(true)}
          />
          {remove && (
            <AuthCard>
              <AuthText>Remove the saved result for this date?</AuthText>
              <AuthButton
                title="Confirm log removal"
                disabled={action.locked}
                onPress={() => {
                  try {
                    validDate(date);
                    void action.run(
                      () => habitService.removeLog(userId, habitId, date),
                      'Habit log removed',
                      onBack,
                    );
                  } catch (reason) {
                    action.setError(reason instanceof Error ? reason.message : 'Check the date.');
                  }
                }}
              />
              <AuthLink
                title="Keep log"
                disabled={action.locked}
                onPress={() => setRemove(false)}
              />
            </AuthCard>
          )}
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
export function HabitHistoryScreen({
  userId,
  habitId,
  onBack,
  onOpen,
}: {
  userId: string;
  habitId: string;
  onBack: () => void;
  onOpen: OpenHabit;
}) {
  const [until, setUntil] = useState(''),
    [input, setInput] = useState(''),
    load = useCallback(
      () => habitService.load(userId, habitId, until || undefined),
      [userId, habitId, until],
    ),
    resource = useRecords(load),
    [error, setError] = useState<string | null>(null);
  const data = resource.data,
    result = data ? habitConsistency(data.record, data.until) : null;
  return (
    <AuthFrame>
      <AuthLink title="← Habits" onPress={onBack} />
      <AuthText kind="title">Habit history</AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && result && !resource.loading && (
        <>
          <AuthText kind="heading">{data.record.name}</AuthText>
          <AuthInput
            label="History ending date (YYYY-MM-DD)"
            value={input || data.until}
            onChangeText={setInput}
          />
          <AuthButton
            title="Open habit history dates"
            outlined
            onPress={() => {
              try {
                const date = validDate(input || data.until);
                if (date > data.today) throw new Error('History cannot end in the future.');
                setUntil(date);
                setError(null);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Check the date.');
              }
            }}
          />
          {error && <AuthNotice error>{error}</AuthNotice>}
          <Progress record={data.record} today={data.until} />
          {!result.periods.length && <AuthNotice>No habit periods in this window.</AuthNotice>}
          {[...result.periods].reverse().map((period) => (
            <AuthCard key={period.date}>
              <AuthText kind="heading">
                {period.date}
                {data.record.kind === 'frequency' ? ` – ${period.end}` : ''}
              </AuthText>
              <AuthText>
                {period.status}
                {period.partial ? ' · Partial week, excluded from consistency' : ''} ·{' '}
                {period.value === null
                  ? 'Not logged'
                  : `${formatNumber(period.value)} ${data.record.unit}`}{' '}
                / target {formatNumber(period.target)}
              </AuthText>
              {data.record.kind !== 'frequency' && !data.record.archived && (
                <AuthLink
                  title={`Edit log ${period.date}`}
                  onPress={() => onOpen('log', habitId, period.date)}
                />
              )}
              {data.record.kind === 'frequency' &&
                data.record.habit_logs
                  .filter((log) => log.local_date >= period.date && log.local_date <= period.end)
                  .map((log) => (
                    <AuthLink
                      key={log.local_date}
                      title={`Edit log ${log.local_date} (${formatNumber(log.value)} times)`}
                      disabled={data.record.archived}
                      onPress={() => onOpen('log', habitId, log.local_date)}
                    />
                  ))}
            </AuthCard>
          ))}
        </>
      )}
      <AuthNotice>
        These are recorded habits and scheduled actions, not health or readiness scores.
      </AuthNotice>
    </AuthFrame>
  );
}
