import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthLink,
  AuthText,
} from '@/features/auth/auth-components';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import { formatNumber, energy, localNutritionDate } from '@/features/nutrition/nutrition-model';
import { weightSummary, unitFactor, goalUnit } from '@/features/body/body-model';
import { useAppTheme } from '@/features/profile/theme-context';
import { habitService } from '@/features/habits/habit-service';
import {
  habitToday,
  habitValue,
  habitVersion,
  habitReached,
  reminderDue,
} from '@/features/habits/habit-model';
import { todayService } from './today-service';
export function TodayScreen({ userId }: { userId: string }) {
  const load = useCallback(() => todayService.load(userId), [userId]),
    resource = useRecords(load),
    action = useRecordAction(),
    refresh = resource.refresh,
    { colors } = useAppTheme(),
    data = resource.data;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const zone = data?.context.preferences.time_zone,
    today = data?.context.today;
  useEffect(() => {
    if (!zone || !today) return;
    const timer = setInterval(() => {
      if (localNutritionDate(zone) !== today) refresh();
    }, 60000);
    return () => clearInterval(timer);
  }, [zone, today, refresh]);
  const weight = data ? weightSummary(data.body.weights, data.context.today) : null,
    steps = data?.activity.current?.steps ?? null,
    target = data?.activity.target?.steps_target ?? null,
    unit = data?.body.preferences.weight_unit ?? 'kg';
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">{today ?? 'ACTARO'}</AuthText>
      <AuthText kind="title">Today</AuthText>
      <AuthLink
        title="Refresh Today"
        disabled={resource.loading || action.locked}
        onPress={refresh}
      />
      <RecordLoadFeedback {...resource} retry={refresh} />
      {data && !resource.loading && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <AuthCard>
                <AuthText kind="eyebrow">Bodyweight</AuthText>
                <AuthText kind="heading">
                  {weight?.latest
                    ? formatNumber(weight.latest.weight_kg * unitFactor(unit)) + ' ' + unit
                    : 'Not logged'}
                </AuthText>
                <AuthText>
                  {weight?.latest
                    ? 'Last recorded ' + weight.latest.local_date
                    : 'Record your first weigh-in.'}
                </AuthText>
                <AuthText>
                  {weight?.change === null || weight?.change === undefined
                    ? 'This-week change needs two dated records.'
                    : `This week ${weight.change > 0 ? '+' : ''}${formatNumber(weight.change * unitFactor(unit))} ${unit} (from ${weight.baseline?.local_date})`}
                </AuthText>
                {weight && weight.trend.some((point) => point.value !== null) && (
                  <View
                    accessibilityRole="image"
                    accessibilityLabel={
                      'Seven-day weight trend. ' +
                      weight.trend
                        .map(
                          (point) =>
                            point.date +
                            ': ' +
                            (point.value === null
                              ? 'not logged'
                              : formatNumber(point.value * unitFactor(unit)) + ' ' + unit),
                        )
                        .join('; ')
                    }
                    style={{ height: 52, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}
                  >
                    {weight.trend.map((point) => {
                      const values = weight.trend.flatMap((item) =>
                          item.value === null ? [] : [item.value],
                        ),
                        min = Math.min(...values),
                        max = Math.max(...values);
                      return (
                        <View
                          key={point.date}
                          style={{
                            flex: 1,
                            height:
                              point.value === null
                                ? 2
                                : max === min
                                  ? 32
                                  : 10 + ((point.value - min) / (max - min)) * 38,
                            backgroundColor:
                              point.value === null
                                ? colors.border
                                : point.date === data.context.today
                                  ? colors.text
                                  : colors.border,
                            borderRadius: 3,
                          }}
                        />
                      );
                    })}
                  </View>
                )}
                <AuthLink
                  title="Log bodyweight"
                  disabled={action.locked}
                  onPress={() => router.push('/body')}
                />
              </AuthCard>
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <AuthCard>
                <AuthText kind="eyebrow">Steps</AuthText>
                <AuthText kind="heading">
                  {steps === null ? 'Not recorded' : formatNumber(steps)}
                </AuthText>
                <AuthText>
                  {target === null ? 'Set a daily target' : formatNumber(target) + ' daily target'}
                </AuthText>
                <AuthText>
                  {steps === null || target === null
                    ? 'Progress needs a count and target.'
                    : `${formatNumber((steps / target) * 100)}% · ${formatNumber(Math.max(0, target - steps))} remaining`}
                </AuthText>
                {data.activity.current && (
                  <AuthText>
                    {data.activity.current.steps_source === 'ios_pedometer'
                      ? 'iPhone pedometer'
                      : 'Manual daily record'}
                  </AuthText>
                )}
                <AuthLink
                  title="Log steps & activity"
                  disabled={action.locked}
                  onPress={() => router.push('/activity')}
                />
              </AuthCard>
            </View>
          </View>
          <AuthCard>
            <AuthText kind="eyebrow">Calories & macros</AuthText>
            <AuthText kind="heading">
              {formatNumber(energy(data.total.calories, data.context.preferences.energy_unit))}{' '}
              {data.context.preferences.energy_unit}
              {data.nutrition.targets
                ? ' / ' +
                  formatNumber(
                    energy(data.nutrition.targets.calories, data.context.preferences.energy_unit),
                  )
                : ''}
            </AuthText>
            {!data.nutrition.logs.length && <AuthText>No food logged today.</AuthText>}
            {(['protein', 'carbs', 'fat'] as const).map((key) => (
              <AuthText key={key}>
                {key === 'protein' ? 'Protein' : key === 'carbs' ? 'Carbs' : 'Fat'}{' '}
                {formatNumber(data.total[key])} g
                {data.nutrition.targets
                  ? ' / ' + formatNumber(data.nutrition.targets[key]) + ' g'
                  : ''}
              </AuthText>
            ))}
            {!data.nutrition.targets && (
              <AuthText>Set nutrition targets to see your daily goals.</AuthText>
            )}
            <AuthText>
              Hydration {formatNumber(data.waterMl)} ml
              {data.nutrition.targets
                ? ' / ' + formatNumber(data.nutrition.targets.water_ml) + ' ml'
                : ''}
            </AuthText>
            <AuthLink
              title="Open nutrition diary"
              disabled={action.locked}
              onPress={() => router.push('/(tabs)/nutrition')}
            />
          </AuthCard>
          <AuthCard>
            <AuthText kind="eyebrow">Today’s training</AuthText>
            <AuthText kind="heading">
              {data.workout?.draft.name ??
                (data.splitDay?.isRest
                  ? 'Scheduled rest day'
                  : data.training.plan
                    ? 'No workout assigned today'
                    : 'Choose a workout or split')}
            </AuthText>
            {data.workout && (
              <AuthText>
                {data.workout.draft.exercises.length} exercises · {data.workout.sets} working sets ·
                ~{data.workout.estimatedMinutes} min estimate
              </AuthText>
            )}
            {data.session ? (
              <>
                <AuthText>
                  {data.session.status === 'active'
                    ? 'Workout in progress on this device'
                    : 'Workout awaiting save on this device'}
                  : {data.session.name}
                </AuthText>
                <AuthButton
                  title="Resume saved workout"
                  disabled={action.locked}
                  onPress={() => router.push('/workouts/session')}
                />
              </>
            ) : (
              data.workout && (
                <AuthButton
                  title="Start today's workout"
                  disabled={action.locked}
                  onPress={() =>
                    router.push({
                      pathname: '/workouts/start',
                      params: { id: data.workout?.draft.id },
                    })
                  }
                />
              )
            )}
            <AuthLink
              title="Choose a workout"
              disabled={action.locked}
              onPress={() => router.push('/workouts')}
            />
            <AuthLink
              title="Manage training split"
              disabled={action.locked}
              onPress={() => router.push('/workouts/splits')}
            />
            <AuthText kind="heading">Training Status</AuthText>
            {data.status.map((status) => (
              <View key={status.label}>
                <AuthText kind="heading">{status.label}</AuthText>
                <AuthText>{status.reason}</AuthText>
              </View>
            ))}
          </AuthCard>
          <AuthCard>
            <AuthText kind="eyebrow">Habits</AuthText>
            <AuthText kind="heading">
              {data.completedHabits} of {data.habits.length} scheduled today
            </AuthText>
            {!data.habits.length && <AuthText>No scheduled habits today.</AuthText>}
            {data.habits.slice(0, 4).map((habit) => {
              const date = habitToday(habit),
                version = habitVersion(habit, date),
                value = habitValue(habit, date),
                done = !!version && habitReached(habit, value, version.target);
              return (
                <View key={habit.id}>
                  <AuthText kind="heading">
                    {habit.name}
                    {done ? ' · Done' : reminderDue(habit) ? ' · Reminder due' : ''}
                  </AuthText>
                  <AuthText>
                    {value === null ? 'Not logged' : formatNumber(value) + ' ' + habit.unit}
                    {version ? ' / ' + formatNumber(version.target) : ''}
                  </AuthText>
                  {!done && (habit.kind === 'boolean' || habit.kind === 'avoidance') ? (
                    <AuthLink
                      title={`${habit.kind === 'boolean' ? 'Mark done' : 'No occurrences'}: ${habit.name}`}
                      disabled={action.locked}
                      onPress={() =>
                        void action.run(
                          () =>
                            habitService.log(
                              userId,
                              habit.id,
                              date,
                              habit.kind === 'boolean' ? 1 : 0,
                              '',
                            ),
                          'Habit logged',
                          refresh,
                        )
                      }
                    />
                  ) : (
                    <AuthLink
                      title={`Log habit ${habit.name}`}
                      disabled={action.locked}
                      onPress={() =>
                        router.push({
                          pathname: '/habits/manage',
                          params: { view: 'log', id: habit.id, date },
                        })
                      }
                    />
                  )}
                </View>
              );
            })}
            <AuthLink
              title="Manage all habits"
              disabled={action.locked}
              onPress={() => router.push('/habits')}
            />
          </AuthCard>
          <AuthCard>
            <AuthText kind="eyebrow">Recovery</AuthText>
            <AuthText kind="heading">{data.recovery?.label ?? 'Not checked today'}</AuthText>
            <AuthText>
              {data.recovery?.reason ??
                'Record energy, soreness and sleep to see your manual check-in category.'}
            </AuthText>
            <AuthLink
              title="Open recovery check"
              disabled={action.locked}
              onPress={() => router.push('/workouts/recovery')}
            />
          </AuthCard>
          <AuthCard>
            <AuthText kind="eyebrow">Goals</AuthText>
            {!data.goals.length && <AuthText>No active goals yet.</AuthText>}
            {data.goals.slice(0, 4).map((result) => {
              const unit = goalUnit(result.goal.metric, data.context.preferences);
              return (
                <View key={result.goal.id}>
                  <AuthText kind="heading">{result.goal.name}</AuthText>
                  <AuthText>
                    {result.status} ·{' '}
                    {result.percentage === null
                      ? 'No progress data'
                      : formatNumber(result.percentage) + '%'}{' '}
                    ·{' '}
                    {result.value === null
                      ? 'Not recorded'
                      : formatNumber(result.value * unitFactor(unit)) + ' ' + unit}{' '}
                    / {formatNumber(result.goal.target * unitFactor(unit))} {unit}
                  </AuthText>
                </View>
              );
            })}
            <AuthLink
              title="Manage all goals"
              disabled={action.locked}
              onPress={() => router.push('/goals')}
            />
          </AuthCard>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
