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
  const { colors, scheme } = useAppTheme();
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        color: colors.muted,
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
      }}
    >
      Reminder time
      <input
        type="time"
        aria-label="Reminder time"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          colorScheme: scheme,
          minHeight: 44,
          borderRadius: 16,
          border: '1px solid ' + colors.border,
          background: colors.surface,
          color: colors.text,
          font: 'inherit',
          padding: '0 12px',
          boxSizing: 'border-box',
          width: '100%',
        }}
      />
    </label>
  );
}
