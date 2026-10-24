import { useState } from 'react';
import { Text, View } from 'react-native';
import { ActionSheet, IconButton, ProductIcon } from '@/components/product-ui';
import { AuthButton, AuthText, authStyles } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { todayWorkoutState, type CompletedToday } from '@/features/today/today-model';
import { timerText } from './session-model';
import { plural } from '@/lib/format';

// Today's workout on Today and Train: resume, done (with Train again in the ⋯ menu),
// the scheduled workout, or rest/nothing planned.
export function TodayWorkoutCard({
  eyebrow,
  session,
  completed,
  workout,
  restDay,
  locked = false,
  onResume,
  onStart,
  onView,
  onBrowse,
}: {
  eyebrow: string;
  session: { name: string; status: 'active' | 'pending' | 'saved' } | null;
  completed: CompletedToday[];
  workout: { id: string; name: string; exercises: number; sets: number; minutes: number } | null;
  restDay: boolean;
  locked?: boolean;
  onResume?: () => void;
  onStart: (id: string) => void;
  onView: (id: string) => void;
  /** Shown when nothing is planned today. */
  onBrowse?: () => void;
}) {
  const { colors } = useAppTheme(),
    [menu, setMenu] = useState(false);
  const state = todayWorkoutState({ session, completed, scheduled: !!workout }),
    latest = completed[0],
    filled = state === 'resume' || state === 'scheduled',
    ink = filled ? '#111311' : colors.text;
  const trainAgain = () => {
    setMenu(false);
    if (workout) onStart(workout.id);
    else onBrowse?.();
  };
  return (
    <View
      style={{
        backgroundColor: filled ? colors.accent : colors.surface,
        borderRadius: 28,
        borderWidth: filled ? 0 : 1,
        borderColor: colors.border,
        padding: 20,
        gap: 14,
        overflow: 'hidden',
      }}
    >
      {state === 'scheduled' && (
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
      <View style={authStyles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Text style={{ color: filled ? ink : colors.muted, fontSize: 12 }}>{eyebrow}</Text>
          {state === 'done' && (
            <View
              accessible
              accessibilityLabel="Workout completed today"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 4,
                backgroundColor: colors.success,
              }}
            >
              <ProductIcon
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={14}
                color="#ffffff"
              />
              <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                Done
              </Text>
            </View>
          )}
        </View>
        {state === 'done' && (workout || onBrowse) && (
          <IconButton
            label="Workout options"
            name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
            disabled={locked}
            onPress={() => setMenu(true)}
          />
        )}
      </View>
      <Text
        style={{
          color: state === 'none' ? colors.text : ink,
          fontFamily: 'Inter_600SemiBold',
          fontSize: 25,
          lineHeight: 31,
        }}
      >
        {state === 'resume'
          ? session?.name
          : state === 'done'
            ? latest?.name
            : state === 'scheduled'
              ? workout?.name
              : restDay
                ? 'Scheduled rest day'
                : 'No workout scheduled'}
      </Text>
      {state === 'done' && latest && (
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          {latest.mode === 'timed'
            ? `Completed in ${timerText((latest.duration_seconds ?? 0) * 1000)}`
            : 'Logged'}
          {completed.length > 1 ? ` · ${plural(completed.length, 'workout')} today` : ''}
        </Text>
      )}
      {state === 'scheduled' && workout && (
        <Text style={{ color: ink, fontSize: 14 }}>
          {plural(workout.exercises, 'exercise')} · {plural(workout.sets, 'set')} · ~
          {workout.minutes} min
        </Text>
      )}
      {state === 'resume' && onResume ? (
        <AuthButton title="Resume saved workout" outlined disabled={locked} onPress={onResume} />
      ) : state === 'done' && latest ? (
        <AuthButton title="View workout" onPress={() => onView(latest.id)} />
      ) : state === 'scheduled' && workout ? (
        <AuthButton
          title="Start today's workout"
          outlined
          disabled={locked}
          onPress={() => onStart(workout.id)}
        />
      ) : state === 'none' && onBrowse ? (
        <AuthButton title="Browse plans" outlined onPress={onBrowse} />
      ) : null}
      <ActionSheet title="Workout options" visible={menu} onClose={() => setMenu(false)}>
        <AuthText>
          Training again starts {workout ? `“${workout.name}”` : 'a new workout'}; today’s completed
          log stays in history.
        </AuthText>
        <AuthButton title="Train again" disabled={locked} onPress={trainAgain} />
        <AuthButton title="Cancel" outlined onPress={() => setMenu(false)} />
      </ActionSheet>
    </View>
  );
}
