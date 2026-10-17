import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';
import { AuthText } from '@/features/auth/auth-components';
import { IconButton } from './product-ui';

export function RecordCalendar({
  until,
  today,
  periods,
  onMonth,
  onSelect,
  disabled = false,
}: {
  until: string;
  today: string;
  periods: { date: string; status: string; value: number | null }[];
  onMonth: (date: string) => void;
  onSelect: (date: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme(),
    start = new Date(until.slice(0, 7) + '-01T12:00:00'),
    offset = (start.getDay() + 6) % 7,
    count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(),
    month = until.slice(0, 7);
  function changeMonth(delta: number) {
    const end = new Date(start.getFullYear(), start.getMonth() + delta + 1, 0),
      date = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    onMonth(date > today ? today : date);
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AuthText kind="heading">
          {start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </AuthText>
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            label="Earlier habit month"
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            onPress={() => changeMonth(-1)}
          />
          <IconButton
            label="Later habit month"
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            disabled={month >= today.slice(0, 7)}
            onPress={() => changeMonth(1)}
          />
        </View>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <Text
            key={index}
            style={{ width: '14.2857%', textAlign: 'center', fontSize: 12, color: colors.muted }}
          >
            {day}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: offset + count }, (_, index) => {
          const day = index - offset + 1,
            date = month + '-' + String(day).padStart(2, '0'),
            period = periods.find((row) => row.date === date),
            done = period?.status === 'done',
            available = !disabled && date <= today && !!period;
          return day < 1 ? (
            <View key={index} style={{ width: '14.2857%', height: 44 }} />
          ) : (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`Edit log ${date}`}
              accessibilityHint={
                period
                  ? `${period.status}; ${period.value === null ? 'Not logged' : period.value}`
                  : 'Outside loaded history'
              }
              accessibilityState={{ disabled: !available, selected: done }}
              disabled={!available}
              onPress={() => onSelect(date)}
              style={{ width: '14.2857%', padding: 2 }}
            >
              <View
                style={{
                  minHeight: 40,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: done
                    ? colors.text
                    : period && period.status !== 'rest'
                      ? colors.fill
                      : 'transparent',
                }}
              >
                <Text style={{ color: done ? colors.background : colors.muted, fontSize: 14 }}>
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <AuthText kind="muted">
        Recorded actions only. Tap a day to edit. Rest days never break progress.
      </AuthText>
    </View>
  );
}
