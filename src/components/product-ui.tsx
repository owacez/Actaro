import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/features/profile/theme-context';
import { AuthText } from '@/features/auth/auth-components';
import { actaroLayout } from '@/constants/actaro-theme';

export function ProductIcon({
  name,
  color,
  size = 22,
}: {
  name: SymbolViewProps['name'];
  color?: string;
  size?: number;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SymbolView name={name} size={size} tintColor={color ?? colors.muted} />
    </View>
  );
}

// Glass stays on navigation. Unsupported devices and Reduce Transparency use a solid surface.
export function NavigationSurface({ children, style, ...props }: ViewProps) {
  const { colors, scheme } = useAppTheme();
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    void (async () => {
      const value = await AccessibilityInfo.isReduceTransparencyEnabled();
      if (mounted) setReduce(value !== false);
    })().catch(() => {
      /* Keep the solid fallback if the platform query fails. */
    });
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduce);
    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);
  const glass =
    Platform.OS === 'ios' && !reduce && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return glass ? (
    <GlassView {...props} colorScheme={scheme} glassEffectStyle="regular" style={style}>
      {children}
    </GlassView>
  ) : (
    <View {...props} style={[{ backgroundColor: colors.surface + 'f5' }, style]}>
      {children}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={ui.headerContent}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        {subtitle && <AuthText kind="eyebrow">{subtitle}</AuthText>}
        <AuthText kind="title">{title}</AuthText>
      </View>
      {action}
    </View>
  );
}

export function IconButton({
  label,
  name,
  onPress,
  disabled = false,
}: {
  label: string;
  name: SymbolViewProps['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={(event) => {
        event?.stopPropagation();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 44,
        minWidth: 44,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: disabled || pressed ? 0.5 : 1,
      })}
    >
      <ProductIcon name={name} color={colors.text} />
    </Pressable>
  );
}

export function ActionRow({
  title,
  detail,
  icon,
  onPress,
  disabled = false,
  trailing,
}: {
  title: string;
  detail?: string;
  icon?: SymbolViewProps['name'];
  onPress: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        ui.row,
        { borderBottomColor: colors.border, opacity: disabled || pressed ? 0.5 : 1 },
      ]}
    >
      {icon && (
        <View style={[ui.iconTile, { backgroundColor: colors.fill }]}>
          <ProductIcon name={icon} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <AuthText kind="heading">{title}</AuthText>
        {detail && <AuthText>{detail}</AuthText>}
      </View>
      {trailing ?? (
        <ProductIcon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
        />
      )}
    </Pressable>
  );
}

export function ActionSheet({
  title,
  visible,
  onClose,
  children,
}: PropsWithChildren<{ title: string; visible: boolean; onClose: () => void }>) {
  const { colors } = useAppTheme(),
    insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={ui.modal}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Close ' + title}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          accessibilityViewIsModal
          style={[
            ui.sheet,
            { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 4,
              backgroundColor: colors.border,
              alignSelf: 'center',
            }}
          />
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <AuthText kind="heading">{title}</AuthText>
            <IconButton
              label={'Dismiss ' + title}
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              onPress={onClose}
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Segments<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  label?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[ui.segments, { backgroundColor: colors.fill }]}>
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityLabel={label ? label + ': ' + option.label : option.label}
          accessibilityState={{ selected: option.value === value, disabled }}
          disabled={disabled}
          onPress={() => onChange(option.value)}
          style={{
            flex: 1,
            minHeight: 44,
            padding: 5,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: option.value === value ? colors.surface : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_500Medium',
              color: value === option.value ? colors.text : colors.muted,
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Meter({ value, target, color }: { value: number; target: number; color?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ height: 6, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.fill }}>
      <View
        style={{
          height: '100%',
          width: `${target > 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 0}%`,
          backgroundColor: color ?? colors.text,
          borderRadius: 6,
        }}
      />
    </View>
  );
}

export const ui = StyleSheet.create({
  headerContent: {
    maxWidth: actaroLayout.contentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    padding: 20,
    gap: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  segments: { flexDirection: 'row', borderRadius: 16, padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
