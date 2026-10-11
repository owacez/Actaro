import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { actaroColors, actaroLayout, actaroTypography } from '@/constants/actaro-theme';
import { useAppTheme } from '@/features/profile/theme-context';

// Preserve current consumers while sharing the verified foundation with navigation.
export const authColors = actaroColors;

export function AuthFrame({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  const screenStyle = [styles.screen, { backgroundColor: colors.background }];
  return (
    <SafeAreaView style={screenStyle}>
      <KeyboardAvoidingView
        style={screenStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthText({
  children,
  kind = 'body',
}: PropsWithChildren<{ kind?: 'body' | 'title' | 'heading' | 'eyebrow' | 'muted' }>) {
  const { colors } = useAppTheme();
  const color =
    kind === 'eyebrow'
      ? colors.accent
      : kind === 'body' || kind === 'muted'
        ? colors.muted
        : colors.text;
  return <Text style={[styles.text, styles[kind], { color }]}>{children}</Text>;
}

export function AuthInput({ label, ...props }: TextInputProps & { label: string }) {
  const { colors, scheme } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        keyboardAppearance={props.keyboardAppearance ?? scheme}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      />
    </View>
  );
}

export function AuthButton({
  title,
  onPress,
  busy = false,
  disabled = false,
  outlined = false,
  selected,
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  outlined?: boolean;
  selected?: boolean;
}) {
  const { colors, scheme } = useAppTheme();
  const foreground = outlined
    ? colors.text
    : scheme === 'dark'
      ? actaroColors.text
      : authColors.background;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy, selected }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outlined && styles.outlined,
        {
          backgroundColor: outlined ? 'transparent' : colors.accent,
          borderColor: outlined ? colors.border : colors.text,
        },
        (pressed || disabled || busy) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={foreground} accessibilityLabel="Please wait" />
      ) : (
        <Text style={[styles.buttonText, { color: foreground }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function AuthLink({
  title,
  onPress,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.linkText, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function AuthNotice({
  children,
  error = false,
  announce = true,
}: PropsWithChildren<{ error?: boolean; announce?: boolean }>) {
  const { colors } = useAppTheme();
  if (error)
    return (
      <Text
        accessibilityRole={announce ? 'alert' : undefined}
        accessibilityLiveRegion={announce ? 'polite' : undefined}
        style={[styles.errorText, { color: colors.text }]}
      >
        {children}
      </Text>
    );
  return (
    <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text
        accessibilityRole={error ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={[styles.noticeText, { color: colors.muted }]}
      >
        {children}
      </Text>
    </View>
  );
}

export const authStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { height: 1, backgroundColor: authColors.border },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: authColors.background },
  scroll: { flexGrow: 1, alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: actaroLayout.contentWidth,
    padding: actaroLayout.screenPadding,
    gap: actaroLayout.contentGap,
  },
  text: { fontFamily: 'Inter_400Regular', color: authColors.text },
  ...actaroTypography,
  field: { gap: 5 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 11, color: authColors.text },
  input: {
    minHeight: actaroLayout.minimumTouchHeight,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: actaroLayout.fieldRadius,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.surface,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: authColors.text,
  },
  button: {
    minHeight: actaroLayout.minimumTouchHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: authColors.text,
    borderRadius: actaroLayout.controlRadius,
    backgroundColor: authColors.accent,
  },
  outlined: { borderColor: authColors.border, backgroundColor: 'transparent' },
  dimmed: { opacity: 0.65 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: authColors.background },
  outlinedText: { color: authColors.text },
  link: { minHeight: actaroLayout.minimumTouchHeight, justifyContent: 'center' },
  linkText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: authColors.text },
  notice: {
    borderRadius: actaroLayout.fieldRadius,
    borderWidth: 1,
    borderColor: authColors.border,
    padding: 12,
    backgroundColor: authColors.surface,
  },
  noticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
    color: authColors.muted,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: authColors.text,
  },
});
