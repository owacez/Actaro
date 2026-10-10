import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authColors } from './auth-components';

type Tone = 'error' | 'success' | 'info';
type Notification = { id: number; message: string; tone: Tone };
type Feedback = { notify: (message: string, tone: Tone) => void; clear: () => void };
const FeedbackContext = createContext<Feedback | null>(null);

export function AuthFeedbackProvider({ children }: PropsWithChildren) {
  const [notification, setNotification] = useState<Notification | null>(null);
  const nextId = useRef(0);
  const notify = useCallback((message: string, tone: Tone) => {
    setNotification({ id: ++nextId.current, message, tone });
  }, []);
  const clear = useCallback(() => setNotification(null), []);
  const dismiss = useCallback((id: number) => {
    setNotification((current) => (current?.id === id ? null : current));
  }, []);
  return (
    <FeedbackContext.Provider value={{ notify, clear }}>
      <View style={styles.root}>
        {children}
        {notification && (
          <FeedbackNotification
            key={notification.id}
            notification={notification}
            dismiss={dismiss}
          />
        )}
      </View>
    </FeedbackContext.Provider>
  );
}

function FeedbackNotification({
  notification,
  dismiss,
}: {
  notification: Notification;
  dismiss: (id: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const web = Platform.OS === 'web';
  useEffect(() => {
    if (hovered || focused) return;
    const timer = setTimeout(
      () => dismiss(notification.id),
      notification.tone === 'error' ? 10000 : 8000,
    );
    return () => clearTimeout(timer);
  }, [notification, dismiss, hovered, focused]);

  return (
    <KeyboardAvoidingView
      pointerEvents="box-none"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[
        styles.overlay,
        web ? styles.web : styles.mobile,
        {
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + (web ? 16 : 112),
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        },
      ]}
    >
      <View
        testID="auth-feedback"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onAccessibilityEscape={() => dismiss(notification.id)}
        style={[styles.notification, web ? styles.toast : styles.snackbar]}
      >
        <View style={styles.message}>
          <Text style={styles.label}>
            {notification.tone === 'error'
              ? 'Error'
              : notification.tone === 'success'
                ? 'Success'
                : 'Notice'}
          </Text>
          <Text
            accessibilityRole={notification.tone === 'error' ? 'alert' : undefined}
            accessibilityLiveRegion={notification.tone === 'error' ? 'assertive' : 'polite'}
            style={styles.text}
          >
            {notification.message}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss notification"
          onPress={() => dismiss(notification.id)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.dismiss}
        >
          <Text style={styles.close}>×</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

export function useAuthFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useAuthFeedback requires AuthFeedbackProvider');
  return value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 1000 },
  web: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  mobile: { alignItems: 'center', justifyContent: 'flex-end' },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 16,
    paddingVertical: 10,
    paddingRight: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: authColors.accent,
    backgroundColor: authColors.text,
    boxShadow: '0 4px 16px rgba(18,18,17,0.18)',
  },
  toast: { width: '100%', maxWidth: 360 },
  snackbar: { width: '100%', maxWidth: 430 },
  message: { flex: 1, gap: 4 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: authColors.accent },
  text: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, color: authColors.surface },
  dismiss: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  close: { fontFamily: 'Inter_400Regular', fontSize: 22, color: authColors.surface },
});
