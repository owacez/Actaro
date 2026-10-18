import { Pressable, Text, View } from 'react-native';
import { AuthCard, AuthText } from '@/features/auth/auth-components';
import { IconButton } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';

export function WorkoutCalendar({
  month,
  today,
  dates,
  selected,
  onMonth,
  onSelect,
}: {
  month: string;
  today: string;
  dates: string[];
  selected: string;
  onMonth: (month: string) => void;
  onSelect: (date: string) => void;
}) {
  const { colors } = useAppTheme();
  const first = new Date(month + '-01T12:00:00Z');
  const offset = (first.getUTCDay() + 6) % 7;
  const days = new Date(first.getUTCFullYear(), first.getUTCMonth() + 1, 0).getUTCDate();
  const marked = new Set(dates);
  function move(delta: number) {
    const date = new Date(first);
    date.setUTCMonth(date.getUTCMonth() + delta);
    onMonth(date.toISOString().slice(0, 7));
  }
  return (
    <AuthCard>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton
          label="Previous workout month"
          name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          onPress={() => move(-1)}
        />
        <AuthText kind="heading">
          {first.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        </AuthText>
        <IconButton
          label="Next workout month"
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          disabled={month >= today.slice(0, 7)}
          onPress={() => move(1)}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <Text key={index} style={{ width: '14.2857%', textAlign: 'center', color: colors.muted }}>
            {day}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: offset + days }, (_, index) => {
          const day = index - offset + 1,
            date = month + '-' + String(day).padStart(2, '0'),
            done = marked.has(date);
          return day < 1 ? (
            <View key={index} style={{ width: '14.2857%', height: 48 }} />
          ) : (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={date + (done ? ': workout completed' : ': no workout')}
              accessibilityState={{ selected: selected === date, disabled: date > today }}
              disabled={date > today}
              hitSlop={2}
              onPress={() => onSelect(date)}
              style={{
                width: '14.2857%',
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderRadius: 12,
                backgroundColor: selected === date ? colors.text : 'transparent',
                opacity: date > today ? 0.4 : 1,
              }}
            >
              <Text
                style={{ color: selected === date ? colors.background : colors.text, fontSize: 15 }}
              >
                {day}
              </Text>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 4,
                  backgroundColor: done
                    ? selected === date
                      ? colors.volt
                      : colors.accent
                    : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <AuthText kind="muted">
        Dots mark completed workouts. Unmarked dates are not failures.
      </AuthText>
    </AuthCard>
  );
}
