import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { IconButton } from '@/components/product-ui';
import { AuthText } from '@/features/auth/auth-components';
import type { HabitRecord } from '@/features/habits/habit-model';
import { TodayHabit } from './today-habit';

export function TodayHabits({
  userId,
  habits,
  onLogged,
}: {
  userId: string;
  habits: HabitRecord[];
  onLogged: (habitId: string, date: string, value: number, notes: string) => void;
}) {
  const [width, setWidth] = useState(0);
  const [page, setPage] = useState(0);
  const currentPage = useRef(0);
  const scroll = useRef<ScrollView>(null);
  const index = Math.max(0, Math.min(page, habits.length - 1));
  // Keep the visible card aligned on rotation and when the current list shrinks.
  useEffect(() => {
    scroll.current?.scrollTo({
      x: Math.max(0, Math.min(currentPage.current, habits.length - 1)) * width,
      animated: false,
    });
  }, [width, habits.length]);
  function select(next: number) {
    currentPage.current = next;
    setPage(next);
    scroll.current?.scrollTo({ x: next * width, animated: false });
  }
  if (!habits.length) return <AuthText>No scheduled habits today.</AuthText>;
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <AuthText kind="eyebrow">
          Habit {index + 1} of {habits.length}
        </AuthText>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <IconButton
            label="Previous habit"
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            disabled={index === 0}
            onPress={() => select(index - 1)}
          />
          <IconButton
            label="Next habit"
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            disabled={index === habits.length - 1}
            onPress={() => select(index + 1)}
          />
        </View>
      </View>
      <View
        testID="habit-carousel"
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ minHeight: 140 }}
      >
        {width > 0 && (
          <ScrollView
            ref={scroll}
            testID="habit-cards"
            horizontal
            pagingEnabled
            scrollEnabled={habits.length > 1}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            directionalLockEnabled
            scrollEventThrottle={16}
            onScroll={(event) => {
              const next = Math.max(
                0,
                Math.min(habits.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)),
              );
              currentPage.current = next;
              setPage(next);
            }}
            style={{ flexGrow: 0 }}
          >
            {habits.map((habit, position) => (
              <View
                key={habit.id}
                style={{ width, minHeight: 140, paddingHorizontal: 2 }}
                aria-hidden={position !== index}
                accessibilityElementsHidden={position !== index}
                importantForAccessibility={position !== index ? 'no-hide-descendants' : 'auto'}
              >
                <TodayHabit
                  userId={userId}
                  habit={habit}
                  onLogged={(date, value, notes) => onLogged(habit.id, date, value, notes)}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
