import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthLink, AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import type { HabitRecord } from '@/features/habits/habit-model';
import { TodayHabit } from './today-habit';

const shown = 4;

// Today's habits as a compact checklist in schedule order; the first few show, the rest one
// tap away. Rows stay put when logged so nothing moves under the finger.
export function TodayHabits({
  userId,
  habits,
  onLogged,
}: {
  userId: string;
  habits: HabitRecord[];
  onLogged: (habitId: string, date: string, value: number, notes: string) => void;
}) {
  const { colors } = useAppTheme(),
    [all, setAll] = useState(false);
  if (!habits.length) return <AuthText>No scheduled habits today.</AuthText>;
  const visible = all ? habits : habits.slice(0, shown);
  return (
    <View>
      {visible.map((habit, index) => (
        <View
          key={habit.id}
          style={{
            paddingVertical: 10,
            borderTopWidth: index ? StyleSheet.hairlineWidth : 0,
            borderTopColor: colors.border,
          }}
        >
          <TodayHabit
            userId={userId}
            habit={habit}
            onLogged={(date, value, notes) => onLogged(habit.id, date, value, notes)}
          />
        </View>
      ))}
      {habits.length > shown && (
        <AuthLink
          title={all ? 'Show fewer' : `Show all ${habits.length} habits`}
          onPress={() => setAll((value) => !value)}
        />
      )}
    </View>
  );
}
