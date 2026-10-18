import { useLayoutEffect, useRef, useState, type PropsWithChildren } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  View,
  type PanResponderInstance,
} from 'react-native';
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
  undoAvailable = completed,
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
  undoAvailable?: boolean;
  onLog: () => void;
  onUndo: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [offset] = useState(() => new Animated.Value(0));
  const [width, setWidth] = useState(320);
  const { colors } = useAppTheme();
  const actions = useRef({ completed, undoAvailable, onLog, onUndo, width });
  useLayoutEffect(() => {
    actions.current = { completed, undoAvailable, onLog, onUndo, width };
  }, [completed, undoAvailable, onLog, onUndo, width]);
  // Keep the responder alive across timer renders, including during a drag.
  const [pan, setPan] = useState<PanResponderInstance | null>(null);
  useLayoutEffect(() => {
    let furthest = 0;
    const reset = () => {
      furthest = 0;
      Animated.spring(offset, {
        toValue: 0,
        useNativeDriver: true,
        tension: 180,
        friction: 22,
      }).start();
    };
    const horizontal = (_: unknown, gesture: { dx: number; dy: number }) =>
      Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.1;
    setPan(
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: horizontal,
        onMoveShouldSetPanResponder: horizontal,
        onPanResponderGrant: () => {
          offset.stopAnimation();
          furthest = 0;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, gesture) => {
          if (Math.abs(gesture.dx) > Math.abs(furthest)) furthest = gesture.dx;
          const travel = Math.max(90, actions.current.width - 32);
          offset.setValue(Math.max(-travel, Math.min(travel, gesture.dx)));
        },
        onPanResponderRelease: (_, gesture) => {
          const current = actions.current;
          const threshold = Math.max(90, Math.min(140, current.width * 0.32));
          const committed =
            Math.abs(gesture.dx) >= threshold ||
            (Math.abs(furthest) >= threshold &&
              gesture.dx * furthest > 0 &&
              Math.abs(gesture.dx) >= threshold * 0.7);
          if (committed && gesture.dx < 0 && !current.completed) current.onLog();
          if (committed && gesture.dx > 0 && current.undoAvailable) current.onUndo();
          reset();
        },
        onPanResponderTerminate: reset,
      }),
    );
    return () => offset.stopAnimation();
  }, [offset]);
  return (
    <View style={{ gap: 8 }}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: colors.fill }}
      >
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
          <Text style={{ color: colors.text }}>Undo →</Text>
          <Text style={{ color: colors.text }}>← Log</Text>
        </View>
        <Animated.View
          {...pan?.panHandlers}
          accessibilityHint="Swipe left to log. Swipe right to undo. Tap the card to edit. Buttons provide the same actions."
          style={{
            transform: [{ translateX: offset }],
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: completed ? colors.success : colors.border,
            borderRadius: 20,
          }}
        >
          <Pressable
            accessible={false}
            onPress={() => setEditing((value) => !value)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 4, paddingVertical: 8 }}>
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
                      ios: 'arrow.left.circle',
                      android: 'arrow_circle_left',
                      web: 'arrow_circle_left',
                    }
              }
              onPress={completed ? onUndo : onLog}
            />
          </Pressable>
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
