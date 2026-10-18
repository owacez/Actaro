import { useState, type PropsWithChildren, type ReactNode } from 'react';
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

export function AuthFrame({
  children,
  header,
  footer,
  pinnedHeader = false,
}: PropsWithChildren<{ header?: ReactNode; footer?: ReactNode; pinnedHeader?: boolean }>) {
  const { colors } = useAppTheme();
  const screenStyle = [styles.screen, { backgroundColor: colors.background }];
  return (
    <SafeAreaView style={screenStyle}>
      <KeyboardAvoidingView
        style={screenStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {pinnedHeader && header && <View style={styles.pinnedHeader}>{header}</View>}
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            {!pinnedHeader && header}
            {children}
          </View>
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthText({
  children,
  kind = 'body',
}: PropsWithChildren<{ kind?: 'body' | 'title' | 'heading' | 'eyebrow' | 'muted' | 'metric' }>) {
  const { colors } = useAppTheme();
  const color =
    kind === 'body' || kind === 'muted' || kind === 'eyebrow' ? colors.muted : colors.text;
  return (
    <Text
      accessibilityRole={kind === 'title' || kind === 'heading' ? 'header' : undefined}
      style={[styles.text, styles[kind], { color, fontVariant: ['tabular-nums'] }]}
    >
      {children}
    </Text>
  );
}

export function AuthInput({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  const { colors, scheme } = useAppTheme();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: actaroLayout.fieldRadius,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          {...props}
          secureTextEntry={props.secureTextEntry && !visible}
          accessibilityLabel={props.accessibilityLabel ?? label}
          keyboardAppearance={props.keyboardAppearance ?? scheme}
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              color: colors.text,
              flex: 1,
              minWidth: 0,
              borderWidth: 0,
              backgroundColor: colors.surface,
            },
            props.style,
          ]}
        />
        {props.secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={(visible ? 'Hide ' : 'Show ') + label.toLowerCase()}
            onPress={() => setVisible(!visible)}
            style={{ minHeight: 44, minWidth: 48, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: colors.muted, fontSize: 12 }}>{visible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        )}
      </View>
      {error && (
        <Text accessibilityRole="alert" style={{ color: colors.danger, fontSize: 12 }}>
          {error}
        </Text>
      )}
    </View>
  );
}

export function AuthButton({
  title,
  accessibilityLabel,
  onPress,
  busy = false,
  disabled = false,
  outlined = false,
  selected,
}: {
  title: string;
  accessibilityLabel?: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  outlined?: boolean;
  selected?: boolean;
}) {
  const { colors } = useAppTheme();
  const foreground = outlined ? colors.text : actaroColors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || busy, busy, selected }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outlined && styles.outlined,
        {
          backgroundColor: outlined ? colors.surface : colors.accent,
          borderColor: outlined ? colors.border : colors.accent,
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
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={[styles.linkText, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

export function AuthChoice({
  title,
  selected,
  disabled = false,
  onPress,
}: {
  title: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.choiceTarget, (disabled || pressed) && styles.dimmed]}
    >
      <View
        style={[
          styles.choice,
          {
            backgroundColor: selected ? colors.text : colors.surface,
            borderColor: selected ? colors.text : colors.border,
          },
        ]}
      >
        <Text style={[styles.choiceText, { color: selected ? colors.background : colors.text }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function AuthLoading({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[authStyles.row, { justifyContent: 'flex-start' }]}
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator color={colors.accent} />
      <AuthText>{children}</AuthText>
    </View>
  );
}

export function AuthCard({ children }: PropsWithChildren) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {children}
    </View>
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
        style={[styles.errorText, { color: colors.danger }]}
      >
        {children}
      </Text>
    );
  return (
    <AuthCard>
      <Text
        accessibilityRole={error ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={[styles.noticeText, { color: colors.muted }]}
      >
        {children}
      </Text>
    </AuthCard>
  );
}

export const authStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  divider: { height: 1, backgroundColor: authColors.border },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: authColors.background },
  scroll: { flexGrow: 1, alignItems: 'center' },
  pinnedHeader: {
    width: '100%',
    maxWidth: actaroLayout.contentWidth,
    alignSelf: 'center',
    paddingHorizontal: actaroLayout.screenPadding,
    paddingTop: 12,
    paddingBottom: 12,
  },
  content: {
    width: '100%',
    maxWidth: actaroLayout.contentWidth,
    padding: actaroLayout.screenPadding,
    paddingBottom: 120,
    gap: actaroLayout.contentGap,
  },
  text: { fontFamily: 'Inter_400Regular', color: authColors.text },
  ...actaroTypography,
  field: { gap: 5 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 14, color: authColors.muted },
  input: {
    minHeight: actaroLayout.minimumTouchHeight,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: actaroLayout.fieldRadius,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.surface,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
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
  choiceTarget: {
    minHeight: actaroLayout.minimumTouchHeight,
    minWidth: actaroLayout.minimumTouchHeight,
    justifyContent: 'center',
  },
  choice: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  choiceText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  buttonText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: authColors.background },
  outlinedText: { color: authColors.text },
  link: { minHeight: actaroLayout.minimumTouchHeight, justifyContent: 'center' },
  linkText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: authColors.text },
  notice: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: authColors.border,
    padding: 16,
    gap: 10,
    backgroundColor: authColors.surface,
  },
  noticeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: authColors.muted,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 18,
    color: authColors.text,
  },
});
