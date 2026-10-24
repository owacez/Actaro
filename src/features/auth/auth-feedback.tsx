import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

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
  const insets = useSafeAreaInsets(),
    { height } = useWindowDimensions();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const web = Platform.OS === 'web';
  const tone =
    notification.tone === 'error'
      ? {
          label: 'Error',
          color: authColors.danger,
          icon: { ios: 'exclamationmark', android: 'priority_high', web: 'priority_high' } as const,
        }
      : notification.tone === 'success'
        ? {
            label: 'Success',
            color: authColors.success,
            icon: { ios: 'checkmark', android: 'check', web: 'check' } as const,
          }
        : {
            label: 'Notice',
            color: authColors.accent,
            icon: { ios: 'info', android: 'info_i', web: 'info_i' } as const,
          };
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
          // On phones the snackbar sits just over a third of the screen up, well clear of the tab
          // bar and bottom actions on any screen size.
          paddingBottom: insets.bottom + (web ? 16 : Math.round(height * 0.36)),
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
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          style={[styles.badge, { backgroundColor: tone.color }]}
        >
          <SymbolView name={tone.icon} size={14} tintColor="#ffffff" />
        </View>
        <View style={styles.message}>
          <Text
            accessibilityRole={notification.tone === 'error' ? 'alert' : undefined}
            accessibilityLiveRegion={notification.tone === 'error' ? 'assertive' : 'polite'}
            accessibilityLabel={`${tone.label}: ${notification.message}`}
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
    paddingLeft: 12,
    paddingVertical: 8,
    paddingRight: 4,
    borderRadius: 18,
    backgroundColor: authColors.text,
    boxShadow: '0 10px 30px rgba(18,18,17,0.28)',
  },
  toast: { width: '100%', maxWidth: 360 },
  snackbar: { width: '100%', maxWidth: 430 },
  message: { flex: 1, gap: 4 },
  badge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: 'Inter_500Medium', fontSize: 14, lineHeight: 20, color: authColors.surface },
  dismiss: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  close: { fontFamily: 'Inter_400Regular', fontSize: 22, color: authColors.surface },
});
