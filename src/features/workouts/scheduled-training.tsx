import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthButton, AuthCard, AuthText } from '@/features/auth/auth-components';
import { useRecords, RecordLoadFeedback } from '@/hooks/use-records';
import { useAppTheme } from '@/features/profile/theme-context';
import { actaroColors } from '@/constants/actaro-theme';
import { trainingService } from './training-service';
import { workoutService } from './workout-service';
import { prestartTotals } from './session-model';
import { shiftDate } from './training-overview';
import { plural } from '@/lib/format';

export function ScheduledTraining({
  userId,
  onStart,
}: {
  userId: string;
  onStart: (id: string) => void;
}) {
  const load = useCallback(async () => {
      const context = await trainingService.load(userId),
        weekday = (new Date(context.today + 'T12:00:00').getDay() + 6) % 7,
        day = context.plan?.days[weekday],
        workout =
          day?.workoutId && !day.isRest ? await workoutService.load(userId, day.workoutId) : null;
      return {
        ...context,
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
          {data.workout ? (
            <View
              style={{
                backgroundColor: colors.accent,
                padding: 20,
                borderRadius: 28,
                gap: 20,
                overflow: 'hidden',
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  width: 230,
                  height: 230,
                  right: -80,
                  top: -120,
                  borderRadius: 120,
                  backgroundColor: actaroColors.surface + '26',
                }}
              />
              <Text style={{ color: actaroColors.text, fontSize: 11 }}>TODAY</Text>
              <Text
                style={{ color: actaroColors.text, fontFamily: 'Inter_600SemiBold', fontSize: 25 }}
              >
                {data.workout.draft.name}
              </Text>
              <Text style={{ color: actaroColors.text, fontSize: 14 }}>
                {plural(data.workout.draft.exercises.length, 'exercise')} ·{' '}
                {plural(data.workout.sets, 'set')} · ~{data.workout.estimatedMinutes} min
              </Text>
              <AuthButton
                title="Start today's workout"
                outlined
                onPress={() => {
                  if (data.workout?.draft.id) onStart(data.workout.draft.id);
                }}
              />
            </View>
          ) : (
            data.plan && (
              <AuthCard>
                <AuthText kind="eyebrow">TODAY</AuthText>
                <AuthText kind="heading">
                  {data.day?.isRest ? 'Scheduled rest day' : 'No workout assigned'}
                </AuthText>
              </AuthCard>
            )
          )}
        </>
      )}
    </View>
  );
}
