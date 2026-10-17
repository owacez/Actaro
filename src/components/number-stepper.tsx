import { View } from 'react-native';
import { AuthInput } from '@/features/auth/auth-components';
import { IconButton } from './product-ui';

export function NumberStepper({
  label,
  value,
  onChange,
  disabled = false,
  step = 1,
  min = 0,
  max = 100000,
  large = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  step?: number;
  min?: number;
  max?: number;
  large?: boolean;
}) {
  function change(delta: number) {
    const number = Number(value);
    if (Number.isFinite(number))
      onChange(String(Math.round(Math.min(max, Math.max(min, number + delta)) * 1000) / 1000));
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <IconButton
        label={'Decrease ' + label.toLowerCase()}
        name={{ ios: 'minus', android: 'remove', web: 'remove' }}
        disabled={disabled || (!!value && Number(value) <= min)}
        onPress={() => change(-step)}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AuthInput
          label={label}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          editable={!disabled}
          style={{
            fontSize: large ? 42 : 20,
            textAlign: 'center',
            fontFamily: 'Inter_600SemiBold',
            fontVariant: ['tabular-nums'],
          }}
        />
      </View>
      <IconButton
        label={'Increase ' + label.toLowerCase()}
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        disabled={disabled || Number(value) >= max}
        onPress={() => change(step)}
      />
    </View>
  );
}
