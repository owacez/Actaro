import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionSheet, IconButton } from './product-ui';
import { AuthButton, AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';

function asDate(value: string) {
  return new Date(value + 'T12:00:00');
}
function iso(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
export function DatePicker({
  value,
  onChange,
  max,
  label = 'Choose date',
  disabled = false,
}: {
  value: string;
  onChange: (date: string) => void;
  max?: string;
  label?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [month, setMonth] = useState(value.slice(0, 7)),
    { colors } = useAppTheme();
  const start = asDate(month + '-01'),
    offset = (start.getDay() + 6) % 7,
    count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  function shift(direction: number) {
    setMonth(iso(new Date(start.getFullYear(), start.getMonth() + direction, 1)).slice(0, 7));
  }
  return (
    <>
      <AuthButton
        title={label + ': ' + value}
        outlined
        disabled={disabled}
        onPress={() => {
          setMonth(value.slice(0, 7));
          setOpen(true);
        }}
      />
      <ActionSheet title={label} visible={open} onClose={() => setOpen(false)}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <IconButton
            label="Previous month"
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            onPress={() => shift(-1)}
          />
          <AuthText kind="heading">
            {start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </AuthText>
          <IconButton
            label="Next month"
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            onPress={() => shift(1)}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <Text key={i} style={{ width: '14.2857%', color: colors.muted, textAlign: 'center' }}>
              {day}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {Array.from({ length: offset + count }, (_, i) => {
            const day = i - offset + 1,
              date = month + '-' + String(day).padStart(2, '0'),
              selected = date === value,
              unavailable = !!max && date > max;
            return day < 1 ? (
              <View key={i} style={{ width: '14.2857%', height: 44 }} />
            ) : (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={date}
                accessibilityState={{ selected, disabled: unavailable }}
                hitSlop={2}
                disabled={unavailable}
                onPress={() => {
                  onChange(date);
                  setOpen(false);
                }}
                style={{
                  width: '14.2857%',
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: selected ? colors.text : 'transparent',
                  opacity: unavailable ? 0.4 : 1,
                }}
              >
                <Text style={{ color: selected ? colors.background : colors.text, fontSize: 14 }}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ActionSheet>
    </>
  );
}

export function WeekStrip({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme(),
    start = asDate(value);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 3 }}>
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const key = iso(date),
            selected = key === value;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={key}
              accessibilityState={{ selected, disabled }}
              hitSlop={3}
              disabled={disabled}
              onPress={() => onChange(key)}
              style={{
                flex: 1,
                minHeight: 62,
                justifyContent: 'center',
                alignItems: 'center',
                gap: 8,
                borderRadius: 14,
                backgroundColor: selected ? colors.text : 'transparent',
              }}
            >
              <Text style={{ fontSize: 11, color: selected ? colors.background : colors.muted }}>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </Text>
              <Text style={{ fontSize: 16, color: selected ? colors.background : colors.text }}>
                {date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <DatePicker value={value} onChange={onChange} disabled={disabled} />
    </View>
  );
}
