import { useCallback, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Meter, ScreenHeader } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
import { router, useFocusEffect } from 'expo-router';
import { DatePicker } from '@/components/date-picker';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import { formatNumber } from '@/features/nutrition/nutrition-model';
import { goalUnit, unitFactor, canonicalInput } from '@/features/body/body-model';
import { exerciseService } from '@/features/exercises/exercise-service';
import { habitService } from '@/features/habits/habit-service';
import { goalService } from './goal-service';
import { goalMetrics, goalPayload, metricInfo, type GoalForm, type GoalMetric } from './goal-model';
export function GoalsScreen({
  userId,
  onBack,
  onEdit,
}: {
  userId: string;
  onBack: () => void;
  onEdit: (id?: string) => void;
}) {
  const { colors } = useAppTheme();
  const [archived, setArchived] = useState(false),
    [remove, setRemove] = useState<string | null>(null);
  const load = useCallback(async () => {
      const list = await goalService.list(userId, archived);
      return { ...list, facts: await goalService.facts(userId, list.rows) };
    }, [userId, archived]),
    resource = useRecords(load),
    action = useRecordAction(),
    refresh = resource.refresh,
    data = resource.data;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  return (
    <AuthFrame header={<ScreenHeader title="Goals" />}>
      <AuthLink title="← You" disabled={action.locked} onPress={onBack} />
      <AuthCard>
        <AuthText kind="heading">A goal measures your progress</AuthText>
        <AuthText>
          Choose an outcome, such as 3 workouts a week or a target bodyweight. Keep logging in
          Train, Food, Steps, Body records or Habits; your goal updates from those records
          automatically.
        </AuthText>
        <AuthText kind="muted">
          A habit is the action you repeat. A goal is the result you want to reach.
        </AuthText>
      </AuthCard>
      <AuthButton title="Create goal" disabled={action.locked} onPress={() => onEdit()} />
      <View style={authStyles.choices}>
        <AuthChoice
          title="Active goals"
          selected={!archived}
          disabled={action.locked}
          onPress={() => setArchived(false)}
        />
        <AuthChoice
          title="Deleted goals"
          selected={archived}
          disabled={action.locked}
          onPress={() => setArchived(true)}
        />
      </View>
      <RecordLoadFeedback {...resource} retry={refresh} />
      {data && !resource.loading && (
        <>
          {!data.rows.length && (
            <AuthNotice>
              No {archived ? 'deleted' : 'active'} goals. Create a measurable target to begin.
            </AuthNotice>
          )}
          {data.facts.map((result) => {
            const goal = result.goal,
              unit = goalUnit(goal.metric, data.preferences),
              factor = unitFactor(unit);
            return (
              <AuthCard key={goal.id}>
                <AuthText kind="heading">{goal.name}</AuthText>
                <AuthText>
                  {metricInfo(goal.metric).label} ·{' '}
                  {goal.direction === 'at_most' ? 'At most' : 'At least'}{' '}
                  {formatNumber(goal.target * factor)} {unit}
                </AuthText>
                <AuthText kind="metric">
                  {result.value === null
                    ? 'Not recorded'
                    : formatNumber(result.value * factor) + ' ' + unit}
                </AuthText>
                <AuthText>
                  {result.status}
                  {result.percentage === null
                    ? ''
                    : ' · ' + formatNumber(result.percentage) + '% from your starting value'}
                </AuthText>
                {result.percentage !== null && (
                  <Meter value={result.percentage} target={100} color={colors.accent} />
                )}
                <AuthText>{result.detail}</AuthText>
                <AuthText>
                  Baseline {formatNumber(goal.baseline * factor)} {unit} · {goal.start_date}
                  {goal.end_date ? ' → ' + goal.end_date : ' · No target date'}
                </AuthText>
                {goal.direction === 'at_most' && goal.metric === 'calories_day' && (
                  <AuthText>
                    This shows logged intake so far, not proof of a complete day’s diet.
                  </AuthText>
                )}
                <View style={authStyles.choices}>
                  {!archived && (
                    <AuthLink
                      title={`Update records for ${goal.name}`}
                      disabled={action.locked}
                      onPress={() => {
                        const category = metricInfo(goal.metric).category;
                        router.push(
                          category === 'Body'
                            ? '/body'
                            : category === 'Training'
                              ? '/workouts'
                              : category === 'Activity'
                                ? '/activity'
                                : category === 'Nutrition'
                                  ? '/nutrition'
                                  : '/habits',
                        );
                      }}
                    />
                  )}
                  {!archived && (
                    <AuthLink
                      title={`Edit goal ${goal.name}`}
                      disabled={action.locked}
                      onPress={() => onEdit(goal.id)}
                    />
                  )}
                  <AuthLink
                    title={`${archived ? 'Restore' : 'Delete'} goal ${goal.name}`}
                    disabled={action.locked}
                    onPress={() =>
                      archived
                        ? void action.run(
                            () => goalService.archive(userId, goal.id, false),
                            'Goal restored',
                            refresh,
                          )
                        : setRemove(goal.id)
                    }
                  />
                </View>
                {remove === goal.id && (
                  <>
                    <AuthText>
                      Remove this goal from active tracking? Its target is retained and source
                      records stay intact.
                    </AuthText>
                    <AuthButton
                      title="Confirm goal deletion"
                      disabled={action.locked}
                      onPress={() =>
                        void action.run(
                          () => goalService.archive(userId, goal.id),
                          'Goal deleted',
                          () => {
                            setRemove(null);
                            refresh();
                          },
                        )
                      }
                    />
                    <AuthLink
                      title="Keep goal"
                      disabled={action.locked}
                      onPress={() => setRemove(null)}
                    />
                  </>
                )}
              </AuthCard>
            );
          })}
        </>
      )}
      <AuthText kind="muted">
        Daily and weekly goals use the current period. Meeting a target today does not complete
        future days or weeks.
      </AuthText>
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
function HabitSource({
  userId,
  metric,
  selected,
  onSelect,
  disabled,
}: {
  userId: string;
  metric: GoalMetric;
  selected: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const load = useCallback(() => habitService.all(userId), [userId]),
    resource = useRecords(load);
  const rows = resource.data?.filter((row) =>
    metric === 'habit_frequency_week' ? row.kind === 'frequency' : row.kind !== 'frequency',
  );
  return (
    <AuthCard>
      <AuthText kind="heading">Choose a habit</AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {rows?.length === 0 && <AuthNotice>Create an active compatible habit first.</AuthNotice>}
      {rows?.map((row) => (
        <AuthChoice
          key={row.id}
          title={row.name}
          selected={selected === row.id}
          disabled={disabled}
          onPress={() => onSelect(row.id)}
        />
      ))}
    </AuthCard>
  );
}
function ExerciseSource({
  userId,
  selected,
  onSelect,
  disabled,
}: {
  userId: string;
  selected: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState(''),
    [submitted, setSubmitted] = useState(''),
    [offset, setOffset] = useState(0);
  const load = useCallback(
      () =>
        exerciseService.search(
          { query: submitted, bodyweight: false, availableOnly: false, offset },
          userId,
        ),
      [submitted, offset, userId],
    ),
    resource = useRecords(load),
    selectedLoad = useCallback(
      async () => (selected ? exerciseService.detail(selected) : null),
      [selected],
    ),
    chosen = useRecords(selectedLoad);
  return (
    <AuthCard>
      <AuthText kind="heading">Choose an exercise</AuthText>
      {selected && (
        <>
          <AuthText>Selected: {chosen.data?.name ?? 'Loading selected exercise…'}</AuthText>
          <RecordLoadFeedback {...chosen} retry={chosen.refresh} />
        </>
      )}
      <AuthInput
        label="Search goal exercise"
        value={query}
        maxLength={120}
        editable={!disabled}
        onChangeText={setQuery}
      />
      <AuthButton
        title="Search goal exercises"
        outlined
        disabled={disabled}
        onPress={() => {
          setOffset(0);
          setSubmitted(query);
        }}
      />
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {resource.data?.length === 0 && <AuthNotice>No matching exercises.</AuthNotice>}
      {resource.data?.map((row) => (
        <AuthChoice
          key={row.id}
          title={row.name}
          selected={selected === row.id}
          disabled={disabled}
          onPress={() => onSelect(row.id)}
        />
      ))}
      <View style={authStyles.row}>
        <AuthLink
          title="Previous goal exercises"
          disabled={disabled || offset === 0}
          onPress={() => setOffset((current) => Math.max(0, current - 24))}
        />
        <AuthLink
          title="Next goal exercises"
          disabled={disabled || !resource.data || resource.data.length < 24}
          onPress={() => setOffset((current) => current + 24)}
        />
      </View>
    </AuthCard>
  );
}
export function GoalEditor({
  userId,
  goalId,
  onBack,
}: {
  userId: string;
  goalId?: string;
  onBack: () => void;
}) {
  const [category, setCategory] = useState('Training');
  const [id] = useState(() => goalId ?? randomUUID()),
    [form, setForm] = useState<GoalForm>({
      name: '',
      metric: 'workouts_week',
      baseline: '0',
      target: '3',
      direction: 'at_least',
      tolerance: '10',
      start: '',
      end: '',
      zone: 'UTC',
      habitId: '',
      exerciseId: '',
      measurement: 'waist',
    });
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof goalService.load>>) => {
      const g = data.goal;
      if (g) {
        const metric = goalMetrics.find((item) => item.key === g.metric);
        if (!metric) throw new Error('Unsupported goal.');
        setCategory(metric.category);
        const factor = unitFactor(goalUnit(g.metric, data.preferences));
        setForm({
          name: g.name,
          metric: metric.key,
          baseline: String(g.baseline * factor),
          target: String(g.target * factor),
          direction: g.direction === 'at_most' ? 'at_most' : 'at_least',
          tolerance: String(g.tolerance),
          start: g.start_date,
          end: g.end_date ?? '',
          zone: g.time_zone,
          habitId: g.habit_id ?? '',
          exerciseId: g.exercise_id ?? '',
          measurement: g.measurement ?? 'waist',
        });
      } else
        setForm((current) => ({ ...current, start: data.today, zone: data.preferences.time_zone }));
    }, []),
    resource = useGoalRecord(userId, goalId, onLoaded),
    action = useRecordAction();
  const data = resource.data,
    unit = data ? goalUnit(form.metric, data.preferences) : metricInfo(form.metric).unit;
  function save() {
    if (!data) return;
    try {
      const canonical = {
        ...form,
        baseline: String(canonicalInput(form.baseline, unit, 1000000, true)),
        target: String(canonicalInput(form.target, unit)),
      };
      goalPayload(canonical);
      void action.run(() => goalService.save(userId, id, canonical), 'Goal saved', onBack);
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check your goal.');
    }
  }
  return (
    <AuthFrame>
      <AuthLink title="← Goals" disabled={action.locked} onPress={onBack} />
      <AuthText kind="title">{goalId ? 'Edit goal' : 'Create goal'}</AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <AuthInput
            label="Goal name"
            value={form.name}
            maxLength={120}
            editable={!action.locked}
            onChangeText={(name) => setForm((current) => ({ ...current, name }))}
          />
          <AuthText kind="eyebrow">CATEGORY</AuthText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Body', 'Training', 'Activity', 'Nutrition', 'Habits'].map((value) => (
                <AuthChoice
                  key={value}
                  title={value}
                  selected={category === value}
                  disabled={action.locked}
                  onPress={() => setCategory(value)}
                />
              ))}
            </View>
          </ScrollView>
          {[category].map((category) => (
            <View key={category}>
              <AuthText kind="heading">{category}</AuthText>
              <View style={authStyles.choices}>
                {goalMetrics
                  .filter((metric) => metric.category === category)
                  .map((metric) => (
                    <AuthChoice
                      key={metric.key}
                      title={metric.label}
                      selected={form.metric === metric.key}
                      disabled={action.locked}
                      onPress={() =>
                        setForm((current) => ({
                          ...current,
                          metric: metric.key,
                          baseline: '0',
                          target:
                            metric.unit === '%'
                              ? '100'
                              : metric.key === 'active_days_week'
                                ? '3'
                                : '1',
                          direction: 'at_least',
                          habitId: '',
                          exerciseId: '',
                        }))
                      }
                    />
                  ))}
              </View>
            </View>
          ))}
          {form.metric.startsWith('habit_') && (
            <HabitSource
              userId={userId}
              metric={form.metric}
              selected={form.habitId}
              disabled={action.locked}
              onSelect={(habitId) => setForm((current) => ({ ...current, habitId }))}
            />
          )}
          {['lift_weight', 'exercise_pr'].includes(form.metric) && (
            <ExerciseSource
              userId={userId}
              selected={form.exerciseId}
              disabled={action.locked}
              onSelect={(exerciseId) => setForm((current) => ({ ...current, exerciseId }))}
            />
          )}
          {form.metric === 'body_measurement' && (
            <AuthInput
              label="Goal measurement name"
              value={form.measurement}
              maxLength={80}
              editable={!action.locked}
              onChangeText={(measurement) => setForm((current) => ({ ...current, measurement }))}
            />
          )}
          <AuthText>
            Your baseline is where you started; your target is where you want to get. Actual
            progress comes from your saved records, not from editing these two values.
          </AuthText>
          <AuthInput
            label={`Baseline (${unit})`}
            value={form.baseline}
            keyboardType="decimal-pad"
            editable={!action.locked}
            onChangeText={(baseline) => setForm((current) => ({ ...current, baseline }))}
          />
          <AuthInput
            label={`Target (${unit})`}
            value={form.target}
            keyboardType="decimal-pad"
            editable={!action.locked}
            onChangeText={(target) => setForm((current) => ({ ...current, target }))}
          />
          {['body_weight', 'body_measurement', 'calories_day'].includes(form.metric) && (
            <View style={authStyles.choices}>
              <AuthChoice
                title="Increase to at least"
                selected={form.direction === 'at_least'}
                disabled={action.locked}
                onPress={() => setForm((current) => ({ ...current, direction: 'at_least' }))}
              />
              <AuthChoice
                title="Decrease to at most"
                selected={form.direction === 'at_most'}
                disabled={action.locked}
                onPress={() => setForm((current) => ({ ...current, direction: 'at_most' }))}
              />
            </View>
          )}
          {form.metric === 'macro_adherence_day' && (
            <AuthInput
              label="Macro tolerance (%)"
              value={form.tolerance}
              editable={!action.locked}
              keyboardType="decimal-pad"
              onChangeText={(tolerance) => setForm((current) => ({ ...current, tolerance }))}
            />
          )}
          <DatePicker
            label="Goal start date"
            value={form.start}
            disabled={action.locked}
            onChange={(start) => setForm((current) => ({ ...current, start }))}
          />
          <DatePicker
            label="Goal target date (optional)"
            value={form.end}
            referenceDate={form.start}
            disabled={action.locked}
            onChange={(end) => setForm((current) => ({ ...current, end }))}
          />
          {!!form.end && (
            <AuthLink
              title="No target date"
              disabled={action.locked}
              onPress={() => setForm((current) => ({ ...current, end: '' }))}
            />
          )}
          <AuthText>
            Schedule time zone: {form.zone}. Daily and weekly goals read their current period; a
            past target date freezes the source date at that deadline. Edit targets freely; source
            logs are never rewritten.
          </AuthText>
          <AuthButton
            title="Save goal"
            busy={action.busy}
            disabled={action.locked}
            onPress={save}
          />
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
function useGoalRecord(
  userId: string,
  goalId: string | undefined,
  onLoaded: (data: Awaited<ReturnType<typeof goalService.load>>) => void,
) {
  const load = useCallback(() => goalService.load(userId, goalId), [userId, goalId]);
  return useRecords(load, onLoaded);
}
