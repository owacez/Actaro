import { useCallback, useEffect } from 'react';
import { Text, View } from 'react-native';
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
import { ActionRow, IconButton, Meter, ScreenHeader } from '@/components/product-ui';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import { formatNumber, energy, localNutritionDate } from '@/features/nutrition/nutrition-model';
import { weightSummary, unitFactor, goalUnit } from '@/features/body/body-model';
import { useAppTheme } from '@/features/profile/theme-context';
import { habitToday, habitDoneToday, acknowledgedHabitLog } from '@/features/habits/habit-model';
import { TodayHabits } from './today-habits';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { todayService } from './today-service';
import { useDeviceSteps } from '@/features/activity/step-provider';
import { habitGoalFact, goalProgress } from '@/features/goals/goal-model';
import { TodayRunCard } from '@/features/running/run-cards';
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
              <AuthCard>
                <AuthText>Bodyweight</AuthText>
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
              </AuthCard>
            </View>
            <View style={{ flex: 1 }}>
              <AuthCard>
                <AuthText>Steps</AuthText>
                <AuthText kind="metric">{steps === null ? '—' : formatNumber(steps)}</AuthText>
                <AuthText>
                  {steps === null
                    ? 'Not recorded yet'
                    : target === null
                      ? 'Set a daily target'
                      : formatNumber(Math.max(0, target - steps)) + ' to go'}
                </AuthText>
                {steps !== null && target !== null && <Meter value={steps} target={target} />}
                <AuthLink title="Steps & target" onPress={() => router.push('/activity')} />
              </AuthCard>
            </View>
          </View>
          <TodayRunCard
            userId={userId}
            unit={data.context.preferences.distance_unit === 'mi' ? 'mi' : 'km'}
          />
          <View
            style={{
              backgroundColor: data.workout || data.session ? colors.accent : colors.surface,
              borderRadius: 28,
              padding: 20,
              gap: 18,
              overflow: 'hidden',
            }}
          >
            {data.workout && (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 230,
                  height: 230,
                  right: -70,
                  top: -90,
                  borderRadius: 120,
                  backgroundColor: '#ffffff26',
                }}
              />
            )}
            <Text
              style={{
                color: data.workout || data.session ? '#111311' : colors.muted,
                fontSize: 12,
              }}
            >
              TODAY · {titleDate}
            </Text>
            <Text
              style={{
                color: data.workout || data.session ? '#111311' : colors.text,
                fontFamily: 'Inter_600SemiBold',
                fontSize: 25,
                lineHeight: 31,
              }}
            >
              {data.session?.name ??
                data.workout?.draft.name ??
                (data.splitDay?.isRest ? 'Scheduled rest day' : 'No workout scheduled')}
            </Text>
            {data.workout && (
              <Text style={{ color: '#111311', fontSize: 14 }}>
                {data.workout.draft.exercises.length} exercises · {data.workout.sets} sets · ~
                {data.workout.estimatedMinutes} min
              </Text>
            )}
            {data.session ? (
              <AuthButton
                title="Resume saved workout"
                outlined
                disabled={action.locked}
                onPress={() => router.push('/workouts/session')}
              />
            ) : data.workout ? (
              <AuthButton
                title="Start today's workout"
                outlined
                disabled={action.locked}
                onPress={() =>
                  router.push({
                    pathname: '/workouts/start',
                    params: { id: data.workout?.draft.id },
                  })
                }
              />
            ) : (
              <AuthButton
                title="Browse plans"
                outlined
                onPress={() => router.push('/workouts/plans')}
              />
            )}
          </View>
          <AuthCard>
            <ActionRow
              title="Calories"
              detail={`${formatNumber(energy(data.total.calories, data.context.preferences.energy_unit))}${data.nutrition.targets ? ' / ' + formatNumber(energy(data.nutrition.targets.calories, data.context.preferences.energy_unit)) : ''} ${data.context.preferences.energy_unit}`}
              onPress={() => router.push('/nutrition')}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['protein', 'carbs', 'fat'] as const).map((key) => (
                <View key={key} style={{ flex: 1, gap: 5 }}>
                  <AuthText kind="muted">{key[0].toUpperCase() + key.slice(1)}</AuthText>
                  <AuthText>{formatNumber(data.total[key])} g</AuthText>
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
          </AuthCard>
          <AuthCard>
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
          </AuthCard>
          <AuthCard>
            <ActionRow
              title="Recovery"
              detail={data.recovery?.label ?? 'Not checked today'}
              onPress={() => router.push('/workouts/recovery')}
            />
            {data.recovery && <AuthText>{data.recovery.reason}</AuthText>}
            <AuthText kind="eyebrow">Training status</AuthText>
            {data.status.map((status) => (
              <View key={status.label}>
                <AuthText kind="heading">{status.label}</AuthText>
                <AuthText>{status.reason}</AuthText>
              </View>
            ))}
            <AuthLink
              title="Manage training split"
              onPress={() => router.push('/workouts/splits')}
            />
            <AuthLink title="Choose a workout" onPress={() => router.push('/workouts')} />
          </AuthCard>
          <AuthCard>
            <AuthText kind="heading">Goals</AuthText>
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
                    <Meter value={result.percentage} target={100} color={colors.accent} />
                  )}
                </View>
              );
            })}
            <AuthButton outlined title="Manage all goals" onPress={() => router.push('/goals')} />
          </AuthCard>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
