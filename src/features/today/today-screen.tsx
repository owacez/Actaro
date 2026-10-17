import { useCallback, useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { habitService } from '@/features/habits/habit-service';
import { habitToday, habitValue, habitVersion, habitReached } from '@/features/habits/habit-model';
import { nutritionService } from '@/features/nutrition/nutrition-service';
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
              onPress={refresh}
              disabled={resource.loading || action.locked}
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
                <AuthLink title="Log steps & activity" onPress={() => router.push('/activity')} />
              </AuthCard>
            </View>
          </View>
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
            <AuthText>
              Habits · {data.completedHabits} of {data.habits.length}
            </AuthText>
            <View style={authStyles.choices}>
              {data.habits.slice(0, 4).map((habit) => {
                const date = habitToday(habit),
                  version = habitVersion(habit, date),
                  value = habitValue(habit, date),
                  done = !!version && habitReached(habit, value, version.target);
                return (
                  <Pressable
                    key={habit.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Log habit ${habit.name}`}
                    accessibilityState={{ disabled: action.locked }}
                    disabled={action.locked}
                    onPress={() => {
                      if (!done && (habit.kind === 'boolean' || habit.kind === 'avoidance'))
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
                        );
                      else
                        router.push({
                          pathname: '/habits/manage',
                          params: { view: 'log', id: habit.id, date },
                        });
                    }}
                    style={{
                      minHeight: 44,
                      padding: 12,
                      borderRadius: 24,
                      backgroundColor: done ? colors.text : colors.fill,
                    }}
                  >
                    <Text style={{ color: done ? colors.background : colors.text, fontSize: 13 }}>
                      {done ? '✓ ' : '+ '}
                      {habit.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!data.habits.length && <AuthText>No scheduled habits today.</AuthText>}
            <AuthLink title="Manage all habits" onPress={() => router.push('/habits')} />
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
            <AuthLink title="Manage all goals" onPress={() => router.push('/goals')} />
          </AuthCard>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
