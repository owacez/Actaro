import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';

export function CompletionMark({
  done,
  label = 'Completed',
  pendingLabel = 'Not logged',
}: {
  done: boolean;
  label?: string;
  pendingLabel?: string;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  const previous = useRef(done);
  const { colors } = useAppTheme();
  useEffect(() => {
    const changed = done && !previous.current;
    previous.current = done;
    if (!changed) return;
    let active = true;
    void (async () => {
      if ((await AccessibilityInfo.isReduceMotionEnabled()) !== false || !active) return;
      scale.setValue(0.75);
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4 }).start();
    })().catch(() => {});
    return () => {
      active = false;
      scale.stopAnimation();
    };
  }, [done, scale]);
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={{
        transform: [{ scale }],
        minHeight: 32,
        minWidth: 32,
        paddingHorizontal: 10,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: done ? colors.volt : colors.fill,
      }}
    >
      <Text
        style={{
          color: done ? '#111311' : colors.muted,
          fontSize: 13,
          fontFamily: 'Inter_500Medium',
        }}
      >
        {done ? '✓ ' + label : pendingLabel}
      </Text>
    </Animated.View>
  );
}
