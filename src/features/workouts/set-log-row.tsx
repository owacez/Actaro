import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Animated, PanResponder, Text, View, type PanResponderInstance } from 'react-native';
import { AuthLink, AuthText, authStyles } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { CompletionMark } from '@/components/completion-mark';
import { IconButton } from '@/components/product-ui';

export function SetLogRow({
  number,
  reps,
  weight,
  unit,
  previous,
  completed,
  onLog,
  onUndo,
  children,
}: PropsWithChildren<{
  number: number;
  reps: string;
  weight: string;
  unit: string;
  previous: string;
  completed: boolean;
  onLog: () => void;
  onUndo: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const { colors } = useAppTheme();
  const actions = useRef({ completed, onLog, onUndo });
  useLayoutEffect(() => {
    actions.current = { completed, onLog, onUndo };
  }, [completed, onLog, onUndo]);
  // Keep the responder alive across timer renders, including during a drag.
  const [pan, setPan] = useState<PanResponderInstance | null>(null);
  useLayoutEffect(() => {
    const reset = () => offset.setValue(0);
    setPan(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_, gesture) =>
          offset.setValue(Math.max(-90, Math.min(90, gesture.dx))),
        onPanResponderRelease: (_, gesture) => {
          const current = actions.current;
          if (gesture.dx >= 72 && !current.completed) current.onLog();
          if (gesture.dx <= -72 && current.completed) current.onUndo();
          reset();
        },
        onPanResponderTerminate: reset,
      }),
    );
  }, [offset]);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.fill }}>
        <View
          pointerEvents="none"
          accessible={false}
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.text }}>Log →</Text>
          <Text style={{ color: colors.text }}>← Undo</Text>
        </View>
        <Animated.View
          {...pan?.panHandlers}
          accessibilityHint="Swipe right to log this set. Swipe left to undo a completed set. Buttons provide the same actions."
          style={{
            transform: [{ translateX: offset }],
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 12,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: completed ? colors.success : colors.border,
            borderRadius: 20,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <AuthText kind="muted">
              SET {number} · {completed ? 'LOGGED' : 'READY'}
            </AuthText>
            <AuthText kind="heading">
              {reps || '—'} reps · {weight || '—'} {unit}
            </AuthText>
            <AuthText kind="muted">Previous: {previous}</AuthText>
          </View>
          <IconButton
            label={`${completed ? 'Unmark' : 'Complete'} set ${number}`}
            name={
              completed
                ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                : {
                    ios: 'arrow.right.circle',
                    android: 'arrow_circle_right',
                    web: 'arrow_circle_right',
                  }
            }
            onPress={completed ? onUndo : onLog}
          />
        </Animated.View>
      </View>
      <View style={authStyles.row}>
        <AuthLink
          title={`${editing ? 'Close editor for' : 'Edit'} set ${number}`}
          onPress={() => setEditing((value) => !value)}
        />
        <CompletionMark done={completed} label="Logged" />
      </View>
      {editing && (
        <View style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.fill }}>
          {children}
        </View>
      )}
    </View>
  );
}
