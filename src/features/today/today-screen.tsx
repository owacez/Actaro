import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
  AuthLink,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { ActionRow, IconButton, Meter, ScreenHeader, TintCard } from '@/components/product-ui';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import {
  formatEnergy,
  formatNumber,
  localNutritionDate,
} from '@/features/nutrition/nutrition-model';
import { weightSummary, unitFactor, goalUnit } from '@/features/body/body-model';
import { useAppTheme } from '@/features/profile/theme-context';
import { habitToday, habitDoneToday, acknowledgedHabitLog } from '@/features/habits/habit-model';
import { TodayHabits } from './today-habits';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { todayService } from './today-service';
import { useDeviceSteps } from '@/features/activity/step-provider';
import { habitGoalFact, goalProgress } from '@/features/goals/goal-model';
import { TodayRunCard } from '@/features/running/run-cards';
import { TodayWorkoutCard } from '@/features/workouts/today-workout-card';
export function TodayScreen({ userId }: { userId: string }) {
  const deviceSteps = useDeviceSteps();
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
    steps =
      deviceSteps?.reading && deviceSteps.reading.day === today
        ? deviceSteps.reading.steps
        : (data?.activity.current?.steps ?? null),
    target = data?.activity.target?.steps_target ?? null,
    unit = data?.body.preferences.weight_unit ?? 'kg';
  const titleDate = today
    ? new Date(today + 'T12:00:00')
        .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
        .toUpperCase()
    : undefined;
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title="Today"
          subtitle={titleDate}
          action={
            <IconButton
              label="Refresh Today"
              name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
              onPress={resource.reload}
              disabled={resource.loading || resource.refreshing || action.locked}
            />
          }
        />
      }
    >
      <RecordLoadFeedback {...resource} retry={refresh} />
      {data && !resource.loading && (
        <>
          {!weight?.latest && !data.nutrition.targets && !data.training.plan && (
            <AuthCard>
              <AuthText kind="heading">Welcome to Actaro</AuthText>
              <AuthText>Three steps make Today useful.</AuthText>
              <ActionRow
                title="Set daily targets"
                detail="Calories, protein, carbs and fat"
                onPress={() =>
                  router.push({ pathname: '/nutrition/manage', params: { view: 'targets' } })
                }
              />
              <ActionRow
                title="Choose a training split"
                detail="Or start from a plan"
                onPress={() => router.push('/workouts/plans')}
              />
              <ActionRow
                title="Log a weigh-in"
                detail="Starts your weight trend"
                onPress={() => router.push('/body')}
              />
            </AuthCard>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <TintCard
                tint={colors.protein}
                icon={{ ios: 'scalemass', android: 'monitor_weight', web: 'monitor_weight' }}
                title="Weight"
              >
                <AuthText kind="metric">
                  {weight?.latest ? formatNumber(weight.latest.weight_kg * unitFactor(unit)) : '—'}
                  <AuthText kind="muted"> {unit}</AuthText>
                </AuthText>
                <AuthText>
                  {weight?.change === null || weight?.change === undefined
                    ? 'Needs two dated records'
                    : `${weight.change > 0 ? '+' : ''}${formatNumber(weight.change * unitFactor(unit))} ${unit} this week`}
                </AuthText>
                <AuthLink title="Log bodyweight" onPress={() => router.push('/body')} />
              </TintCard>
            </View>
            <View style={{ flex: 1 }}>
              <TintCard
                tint={colors.success}
                icon={{ ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' }}
                title="Steps"
              >
                <AuthText kind="metric">{steps === null ? '—' : formatNumber(steps)}</AuthText>
                <AuthText>
                  {steps === null
                    ? 'Not recorded yet'
                    : target === null
                      ? 'Set a daily target'
                      : formatNumber(Math.max(0, target - steps)) + ' to go'}
                </AuthText>
                {steps !== null && target !== null && (
                  <Meter value={steps} target={target} color={colors.success} />
                )}
                <AuthLink title="Steps & target" onPress={() => router.push('/activity')} />
              </TintCard>
            </View>
          </View>
          <TodayRunCard
            userId={userId}
            unit={data.context.preferences.distance_unit === 'mi' ? 'mi' : 'km'}
          />
          <TodayWorkoutCard
            eyebrow={`TODAY · ${titleDate}`}
            session={data.session}
            completed={data.completed}
            workout={
              data.workout
                ? {
                    id: data.workout.draft.id,
                    name: data.workout.draft.name,
                    exercises: data.workout.draft.exercises.length,
                    sets: data.workout.sets,
                    minutes: data.workout.estimatedMinutes,
                  }
                : null
            }
            restDay={!!data.splitDay?.isRest}
            locked={action.locked}
            onResume={() => router.push('/workouts/session')}
            onStart={(id) => router.push({ pathname: '/workouts/start', params: { id } })}
            onView={(id) => router.push({ pathname: '/workouts/history', params: { id } })}
            onBrowse={() => router.push('/workouts/plans')}
          />
          <TintCard
            tint={colors.accent}
            icon={{ ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' }}
            title="Calories"
            action={<AuthLink title="Open Food" onPress={() => router.push('/nutrition')} />}
          >
            {data.nutrition.targets ? (
              <>
                <AuthText kind="metric">
                  {formatEnergy(
                    Math.abs(data.nutrition.targets.calories - data.total.calories),
                    data.context.preferences.energy_unit,
                  )}
                  <AuthText kind="muted">
                    {' '}
                    {data.context.preferences.energy_unit}{' '}
                    {data.total.calories > data.nutrition.targets.calories ? 'over' : 'left'}
                  </AuthText>
                </AuthText>
                <AuthText>
                  {formatEnergy(data.total.calories, data.context.preferences.energy_unit)} eaten /{' '}
                  {formatEnergy(
                    data.nutrition.targets.calories,
                    data.context.preferences.energy_unit,
                  )}{' '}
                  target
                </AuthText>
                <Meter
                  value={data.total.calories}
                  target={data.nutrition.targets.calories}
                  color={colors.accent}
                />
              </>
            ) : (
              <>
                <AuthText>
                  {formatEnergy(data.total.calories, data.context.preferences.energy_unit)}{' '}
                  {data.context.preferences.energy_unit} eaten · no daily target yet
                </AuthText>
                <AuthButton
                  title="Set my calorie target"
                  onPress={() =>
                    router.push({ pathname: '/nutrition/manage', params: { view: 'targets' } })
                  }
                />
              </>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['protein', 'carbs', 'fat'] as const).map((key) => (
                <View key={key} style={{ flex: 1, gap: 5 }}>
                  <AuthText kind="muted">{key[0].toUpperCase() + key.slice(1)}</AuthText>
                  <AuthText>
                    {formatNumber(data.total[key])}
                    {data.nutrition.targets
                      ? ' / ' + formatNumber(data.nutrition.targets[key])
                      : ''}{' '}
                    g
                  </AuthText>
                  <Meter
                    value={data.total[key]}
                    target={data.nutrition.targets?.[key] ?? 0}
                    color={colors[key]}
                  />
                </View>
              ))}
            </View>
            {!data.nutrition.logs.length && <AuthText kind="muted">No food logged today.</AuthText>}
            <View style={authStyles.row}>
              <View style={{ flex: 1 }}>
                <AuthText>
                  Water {formatNumber(data.waterMl)}
                  {data.nutrition.targets
                    ? ' / ' + formatNumber(data.nutrition.targets.water_ml)
                    : ''}{' '}
                  ml
                </AuthText>
              </View>
              <AuthLink
                title="+250 ml"
                disabled={action.locked}
                onPress={() => {
                  const id = randomUUID();
                  void action.run(
                    () =>
                      nutritionService.water(
                        userId,
                        id,
                        data.context.today,
                        data.context.preferences.time_zone,
                        250,
                      ),
                    'Water logged',
                    refresh,
                  );
                }}
              />
            </View>
          </TintCard>
          <TintCard
            tint={colors.volt}
            darkIcon
            icon={{ ios: 'checkmark.square', android: 'check_box', web: 'check_box' }}
            title="Habits"
          >
            <TodayHabits
              userId={userId}
              habits={data.habits}
              onLogged={(habitId, date, value, notes) =>
                resource.updateData((current) => {
                  const habits = current.habits.map((row) =>
                    row.id === habitId ? acknowledgedHabitLog(row, date, value, notes) : row,
                  );
                  return {
                    ...current,
                    habits,
                    completedHabits: habits.filter((row) => habitDoneToday(row, habitToday(row)))
                      .length,
                    goals: current.goals.map((result) => {
                      const source = habits.find((row) => row.id === result.goal.habit_id);
                      if (!source || source.id !== habitId) return result;
                      const fact = habitGoalFact(result.goal, source);
                      return {
                        ...result,
                        ...fact,
                        ...goalProgress(
                          result.goal,
                          fact.value,
                          localNutritionDate(result.goal.time_zone),
                        ),
                      };
                    }),
                  };
                })
              }
            />
            {data.habits.length > 0 && (
              <AuthText kind="muted">{data.completedHabits} completed today</AuthText>
            )}
          </TintCard>
          <TintCard
            tint={colors.fat}
            icon={{ ios: 'heart', android: 'favorite', web: 'favorite' }}
            title="Recovery & training"
            action={<AuthLink title="Check in" onPress={() => router.push('/workouts/recovery')} />}
          >
            <AuthText kind="heading">{data.recovery?.label ?? 'Not checked today'}</AuthText>
            {data.recovery && <AuthText>{data.recovery.reason}</AuthText>}
            {data.status.map((status) => (
              <View key={status.label}>
                <AuthText kind="eyebrow">{status.label.toUpperCase()}</AuthText>
                <AuthText>{status.reason}</AuthText>
              </View>
            ))}
            <View style={authStyles.row}>
              <AuthLink
                title="Manage training split"
                onPress={() => router.push('/workouts/splits')}
              />
              <AuthLink title="Choose a workout" onPress={() => router.push('/workouts')} />
            </View>
          </TintCard>
          <TintCard
            tint={colors.carbs}
            darkIcon
            icon={{ ios: 'target', android: 'my_location', web: 'my_location' }}
            title="Goals"
            action={
              <AuthLink
                title="Manage"
                accessibilityLabel="Manage all goals"
                onPress={() => router.push('/goals')}
              />
            }
          >
            {!data.goals.length && <AuthText>No active goals yet.</AuthText>}
            {data.goals.slice(0, 4).map((result) => {
              const goalUnitLabel = goalUnit(result.goal.metric, data.context.preferences);
              return (
                <View key={result.goal.id} style={{ gap: 8 }}>
                  <AuthText kind="heading">{result.goal.name}</AuthText>
                  <AuthText>
                    {result.status} ·{' '}
                    {result.percentage === null
                      ? 'No progress data'
                      : formatNumber(result.percentage) + '%'}{' '}
                    ·{' '}
                    {result.value === null
                      ? 'Not recorded'
                      : formatNumber(result.value * unitFactor(goalUnitLabel)) +
                        ' ' +
                        goalUnitLabel}{' '}
                    / {formatNumber(result.goal.target * unitFactor(goalUnitLabel))} {goalUnitLabel}
                  </AuthText>
                  {result.percentage !== null && (
                    <Meter value={result.percentage} target={100} color={colors.carbs} />
                  )}
                </View>
              );
            })}
          </TintCard>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
