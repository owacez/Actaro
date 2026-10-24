import { useCallback, useRef } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthCard, AuthText } from '@/features/auth/auth-components';
import { useRecords, RecordLoadFeedback } from '@/hooks/use-records';
import { useAppTheme } from '@/features/profile/theme-context';
import { actaroColors } from '@/constants/actaro-theme';
import { trainingService } from './training-service';
import { workoutService } from './workout-service';
import { prestartTotals } from './session-model';
import { shiftDate } from './training-overview';
import { todayWorkoutRecords } from './today-workout';
import { TodayWorkoutCard } from './today-workout-card';

export function ScheduledTraining({
  userId,
  onStart,
  onResume,
}: {
  userId: string;
  onStart: (id: string) => void;
  onResume?: () => void;
}) {
  const load = useCallback(async () => {
      const context = await trainingService.load(userId),
        weekday = (new Date(context.today + 'T12:00:00').getDay() + 6) % 7,
        day = context.plan?.days[weekday],
        workout =
          day?.workoutId && !day.isRest ? await workoutService.load(userId, day.workoutId) : null,
        records = await todayWorkoutRecords(userId, context.today);
      return {
        ...context,
        ...records,
        weekday,
        day,
        workout: workout?.draft ? { draft: workout.draft, ...prestartTotals(workout.draft) } : null,
      };
    }, [userId]),
    resource = useRecords(load),
    refresh = resource.refresh,
    { colors } = useAppTheme(),
    initial = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (initial.current) initial.current = false;
      else refresh();
    }, [refresh]),
  );
  const data = resource.data;
  return (
    <View style={{ gap: 12 }}>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && (
        <>
          {data.plan && (
            <AuthCard>
              <AuthText kind="eyebrow">THIS WEEK · {data.plan.name}</AuthText>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {data.plan.days.map((day, index) => {
                  const date = shiftDate(data.today, index - data.weekday),
                    completed = data.overview.days.some(
                      (row) => row.date === date && row.sessions > 0,
                    ),
                    current = index === data.weekday;
                  return (
                    <View key={index} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
                      <AuthText kind="muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</AuthText>
                      <View
                        accessible
                        accessibilityLabel={
                          date +
                          ': ' +
                          (completed
                            ? 'Workout completed'
                            : day.isRest
                              ? 'Rest day'
                              : 'Workout planned')
                        }
                        style={{
                          width: '100%',
                          minHeight: 38,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 12,
                          backgroundColor: completed
                            ? colors.volt
                            : current
                              ? colors.text
                              : colors.fill,
                        }}
                      >
                        <Text
                          style={{
                            color: completed
                              ? actaroColors.text
                              : current
                                ? colors.background
                                : colors.muted,
                            fontSize: 18,
                          }}
                        >
                          {completed ? '✓' : day.isRest ? '☾' : '•'}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </AuthCard>
          )}
          {(data.plan || data.session || data.completed.length > 0) && (
            <TodayWorkoutCard
              eyebrow="TODAY"
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
              restDay={!!data.day?.isRest}
              onResume={onResume}
              onStart={onStart}
              onView={(id) => router.push({ pathname: '/workouts/history', params: { id } })}
            />
          )}
        </>
      )}
    </View>
  );
}
