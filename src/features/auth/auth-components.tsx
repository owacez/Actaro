import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
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
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { actaroColors, actaroLayout, actaroTypography } from '@/constants/actaro-theme';
import { useAppTheme } from '@/features/profile/theme-context';

// Preserve current consumers while sharing the verified foundation with navigation.
export const authColors = actaroColors;

export function AuthFrame({
  children,
  header,
  footer,
  pinnedHeader = false,
  scrollEnabled = true,
}: PropsWithChildren<{
  header?: ReactNode;
  footer?: ReactNode;
  pinnedHeader?: boolean;
  /** Paused while a row is being dragged so the page does not scroll under the finger. */
  scrollEnabled?: boolean;
}>) {
  const { colors } = useAppTheme();
  const screenStyle = [styles.screen, { backgroundColor: colors.background }];
  const items = Children.toArray(children),
    leading = items.filter(leadsFrame),
    body = items.filter((child) => !leadsFrame(child));
  return (
    <SafeAreaView style={screenStyle}>
      <KeyboardAvoidingView
        style={screenStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {pinnedHeader && header && <View style={styles.pinnedHeader}>{header}</View>}
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.content}>
            {leading}
            {!pinnedHeader && header}
            {body}
          </View>
        </ScrollView>
        {footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function leadsFrame(child: ReactNode) {
  return isValidElement(child) && typeof child.type === 'function' && 'leadsFrame' in child.type;
}

// A small glyph that never reaches screen readers; the surrounding control carries the text.
function Glyph({
  name,
  color,
  size = 16,
}: {
  name: SymbolViewProps['name'];
  color: string;
  size?: number;
}) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      <SymbolView name={name} size={size} tintColor={color} />
    </View>
  );
}

// The one back control: a chevron and the destination, always first on its screen.
export function BackLink({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const name = label === 'Back' ? 'Back' : `Back to ${label}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.back,
        { backgroundColor: colors.surface, borderColor: colors.border },
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Glyph
        name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
        color={colors.text}
      />
      <Text numberOfLines={1} style={[styles.backText, { color: colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}
// AuthFrame reads this marker to place the back control above the screen header.
BackLink.leadsFrame = true;

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
  hideLabel = false,
  ...props
}: TextInputProps & {
  label: string;
  error?: string;
  /** The caller shows its own heading; the label remains the accessible name. */
  hideLabel?: boolean;
}) {
  const { colors, scheme } = useAppTheme();
  const [visible, setVisible] = useState(false),
    [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      {!hideLabel && <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: focused || error ? 1.5 : 1,
          borderRadius: actaroLayout.fieldRadius,
          borderColor: error ? colors.danger : focused ? colors.accent : colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <TextInput
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
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
        <View style={styles.inlineMessage}>
          <Glyph
            name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
            color={colors.danger}
            size={14}
          />
          <Text
            accessibilityRole="alert"
            style={[styles.errorText, { color: colors.danger, flex: 1 }]}
          >
            {error}
          </Text>
        </View>
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
        pressed && styles.pressed,
        (disabled || busy) && styles.disabled,
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
  const items = Children.toArray(children);
  return (
    <View style={[styles.notice, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      {items.map((child, index) =>
        index === items.length - 1 &&
        isValidElement<{ last?: boolean }>(child) &&
        typeof child.type === 'function' &&
        'closesCard' in child.type
          ? cloneElement(child, { last: true })
          : child,
      )}
    </View>
  );
}

export function AuthNotice({
  children,
  error = false,
  announce = true,
}: PropsWithChildren<{ error?: boolean; announce?: boolean }>) {
  const { colors } = useAppTheme();
  const tone = error ? colors.danger : colors.muted;
  return (
    <View
      style={[
        styles.message,
        {
          backgroundColor: error ? colors.danger + '14' : colors.surface,
          borderColor: error ? colors.danger + '40' : colors.border,
        },
      ]}
    >
      <Glyph
        name={
          error
            ? { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }
            : { ios: 'info.circle', android: 'info', web: 'info' }
        }
        color={tone}
      />
      <Text
        accessibilityRole={error && announce ? 'alert' : undefined}
        accessibilityLiveRegion={!error || announce ? 'polite' : undefined}
        style={[
          error ? styles.errorText : styles.noticeText,
          { color: error ? colors.danger : colors.muted, flex: 1 },
        ]}
      >
        {children}
      </Text>
    </View>
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
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.45 },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    minHeight: 36,
    maxWidth: '100%',
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  backText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  inlineMessage: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
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
    fontSize: 13,
    lineHeight: 19,
    color: authColors.muted,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: authColors.text,
  },
});
