import { useState } from 'react';
import { Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthButton } from '@/features/auth/auth-components';
import { ActionSheet } from './product-ui';
import { useAppTheme } from '@/features/profile/theme-context';

export function TimePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { scheme } = useAppTheme();
  const [base] = useState(() => new Date(2000, 0, 1, 9));
  const date = new Date(base);
  if (value) {
    const [hour, minute] = value.split(':').map(Number);
    date.setHours(hour, minute);
  }
  const picker = (
    <DateTimePicker
      value={date}
      mode="time"
      is24Hour
      themeVariant={scheme}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onDismiss={() => setOpen(false)}
      onValueChange={(_event, selected) => {
        if (Platform.OS !== 'ios') setOpen(false);
        onChange(
          String(selected.getHours()).padStart(2, '0') +
            ':' +
            String(selected.getMinutes()).padStart(2, '0'),
        );
      }}
    />
  );
  return (
    <>
      <AuthButton
        title={'Reminder time: ' + (value || 'Not set')}
        outlined
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      {open &&
        (Platform.OS === 'ios' ? (
          <ActionSheet title="Reminder time" visible onClose={() => setOpen(false)}>
            {picker}
            <AuthButton
              title="Done"
              onPress={() => {
                if (!value) onChange('09:00');
                setOpen(false);
              }}
            />
          </ActionSheet>
        ) : (
          picker
        ))}
    </>
  );
}
