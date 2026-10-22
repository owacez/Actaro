import { useState, type PropsWithChildren } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { IconButton, ProductIcon } from '@/components/product-ui';

export function SetLogRow({
  number,
  reps,
  weight,
  unit,
  previous,
  completed,
  selected,
  onSelect,
  onChange,
  onLog,
  onUndo,
  onRemove,
  children,
}: PropsWithChildren<{
  number: number;
  reps: string;
  weight: string;
  unit: string;
  previous: string;
  completed: boolean;
  selected: boolean;
  onSelect: () => void;
  onChange: (field: 'weight' | 'reps', value: string) => void;
  onLog: () => void;
  onUndo: () => void;
  /** Present only for sets that may be removed from this session (unlogged, not the last). */
  onRemove?: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const { colors, scheme } = useAppTheme();
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: selected ? colors.accent : completed ? colors.success : colors.border,
        backgroundColor: selected ? colors.fill : colors.surface,
        padding: 8,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove set ${number}`}
            accessibilityHint="Removes this planned set from the current workout only."
            hitSlop={4}
            onPress={onRemove}
            style={({ pressed }) => ({
              width: 28,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <ProductIcon
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={16}
              color={colors.muted}
            />
          </Pressable>
        ) : (
          <View style={{ width: 28 }} />
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Select set ${number}, ${completed ? 'logged' : 'not logged'}`}
          accessibilityState={{ selected }}
          onPress={onSelect}
          style={{ minWidth: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
        >
          <AuthText kind="title">{number}</AuthText>
        </Pressable>
        {(['weight', 'reps'] as const).map((field) => (
          <TextInput
            key={field}
            accessibilityLabel={
              field === 'weight' ? `Weight (${unit}) · set ${number}` : `Reps · set ${number}`
            }
            accessibilityHint="Tap to replace the planned value. Logging saves this actual value."
            value={field === 'weight' ? weight : reps}
            onFocus={onSelect}
            onChangeText={(value) => onChange(field, value)}
            keyboardType={field === 'weight' ? 'decimal-pad' : 'number-pad'}
            keyboardAppearance={scheme}
            selectTextOnFocus
            placeholder="—"
            placeholderTextColor={colors.muted}
            maxLength={field === 'weight' ? 12 : 4}
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 48,
              borderRadius: 10,
              textAlign: 'center',
              fontSize: 24,
              fontFamily: 'Inter_600SemiBold',
              fontVariant: ['tabular-nums'],
              color: colors.text,
              backgroundColor: colors.background,
            }}
          />
        ))}
        <IconButton
          label={`${completed ? 'Unmark' : 'Complete'} set ${number}`}
          name={
            completed
              ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
              : { ios: 'circle', android: 'radio_button_unchecked', web: 'radio_button_unchecked' }
          }
          onPress={completed ? onUndo : onLog}
        />
      </View>
      {(selected || editing) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <AuthText kind="muted">
              {completed ? 'Logged' : selected ? 'Current set' : 'Planned'}
            </AuthText>
            {selected && <AuthText kind="muted">Previous: {previous}</AuthText>}
          </View>
          <IconButton
            label={`${editing ? 'Close editor for' : 'Edit'} set ${number}`}
            name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
            onPress={() => setEditing((value) => !value)}
          />
        </View>
      )}
      {editing && <View style={{ gap: 8, padding: 4 }}>{children}</View>}
    </View>
  );
}
