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

// Verified Sign In / Password Reset Figma values; limited to this auth feature.
export const authColors = {
  background: '#f4f0e8',
  surface: '#fffdf8',
  text: '#121211',
  muted: '#6d6961',
  accent: '#ff681e',
  border: '#ddd5c8',
};

export function AuthFrame({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
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
  return <Text style={[styles.text, styles[kind]]}>{children}</Text>;
}

export function AuthInput({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={authColors.muted}
        style={styles.input}
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
}: {
  title: string;
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  outlined?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        outlined && styles.outlined,
        (pressed || disabled || busy) && styles.dimmed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={authColors.text} accessibilityLabel="Please wait" />
      ) : (
        <Text style={[styles.buttonText, outlined && styles.outlinedText]}>{title}</Text>
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.link}
    >
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

export function AuthNotice({
  children,
  error = false,
  announce = true,
}: PropsWithChildren<{ error?: boolean; announce?: boolean }>) {
  if (error)
    return (
      <Text
        accessibilityRole={announce ? 'alert' : undefined}
        accessibilityLiveRegion={announce ? 'polite' : undefined}
        style={styles.errorText}
      >
        {children}
      </Text>
    );
  return (
    <View style={styles.notice}>
      <Text
        accessibilityRole={error ? 'alert' : undefined}
        accessibilityLiveRegion="polite"
        style={styles.noticeText}
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
  content: { width: '100%', maxWidth: 430, padding: 20, gap: 14 },
  text: { fontFamily: 'Inter_400Regular', color: authColors.text },
  body: { fontSize: 12, lineHeight: 18, color: authColors.muted },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 22, lineHeight: 28 },
  eyebrow: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: authColors.accent,
  },
  muted: { fontSize: 10, color: authColors.muted },
  field: { gap: 5 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 11, color: authColors.text },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: authColors.border,
    backgroundColor: authColors.surface,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: authColors.text,
  },
  button: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: authColors.text,
    borderRadius: 12,
    backgroundColor: authColors.accent,
  },
  outlined: { borderColor: authColors.border, backgroundColor: 'transparent' },
  dimmed: { opacity: 0.65 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: authColors.background },
  outlinedText: { color: authColors.text },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: 'Inter_500Medium', fontSize: 10, color: authColors.text },
  notice: {
    borderRadius: 13,
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
