import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { ProductIcon } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
import * as Haptics from 'expo-haptics';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { orderedKeys, shiftPositions } from './reorder-model';

const spring = { damping: 22, stiffness: 260, mass: 0.6 };

// A press-and-hold reorderable list of fixed-height rows. The gesture and every row's motion
// run on the UI thread; the new order is committed once, on release. Screen readers get
// Move up / Move down actions on each row's grip handle instead of dragging.
export function ReorderList<T>({
  items,
  keyOf,
  labelOf,
  rowHeight,
  gap = 10,
  disabled = false,
  renderItem,
  onReorder,
  onDragChange,
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  labelOf: (item: T, index: number) => string;
  rowHeight: number;
  gap?: number;
  disabled?: boolean;
  /** Place `handle` (the grip, which also carries the accessible move actions) in the row. */
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  /** Receives every key in its new order. */
  onReorder: (keys: string[]) => void;
  /** True while a row is held, so a parent can pause its own scrolling. */
  onDragChange?: (dragging: boolean) => void;
}) {
  const slot = rowHeight + gap,
    keys = items.map(keyOf),
    positions = useSharedValue<Record<string, number>>(
      Object.fromEntries(keys.map((key, index) => [key, index])),
    ),
    active = useSharedValue<string | null>(null),
    dragTop = useSharedValue(0);
  const signature = keys.join('|');
  useEffect(() => {
    positions.set(Object.fromEntries(signature.split('|').map((key, index) => [key, index])));
  }, [signature, positions]);
  const move = (key: string, step: number) => {
    const from = keys.indexOf(key),
      to = from + step;
    if (from < 0 || to < 0 || to >= keys.length) return;
    const next = [...keys];
    [next[from], next[to]] = [next[to], next[from]];
    onReorder(next);
  };
  return (
    <View style={{ height: Math.max(0, keys.length * slot - gap) }}>
      {items.map((item, index) => {
        const key = keyOf(item);
        return (
          <ReorderRow
            key={key}
            id={key}
            count={keys.length}
            slot={slot}
            rowHeight={rowHeight}
            disabled={disabled}
            positions={positions}
            active={active}
            dragTop={dragTop}
            onLift={() => {
              onDragChange?.(true);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }}
            onDrop={(order) => {
              onDragChange?.(false);
              void Haptics.selectionAsync().catch(() => {});
              if (order.join('|') !== signature) onReorder(order);
            }}
          >
            {renderItem(
              item,
              index,
              <Grip
                label={labelOf(item, index)}
                first={index === 0}
                last={index === keys.length - 1}
                onMove={(step) => move(key, step)}
              />,
            )}
          </ReorderRow>
        );
      })}
    </View>
  );
}

function ReorderRow({
  id,
  count,
  slot,
  rowHeight,
  disabled,
  positions,
  active,
  dragTop,
  onLift,
  onDrop,
  children,
}: {
  id: string;
  count: number;
  slot: number;
  rowHeight: number;
  disabled: boolean;
  positions: SharedValue<Record<string, number>>;
  active: SharedValue<string | null>;
  dragTop: SharedValue<number>;
  onLift: () => void;
  onDrop: (order: string[]) => void;
  children: ReactNode;
}) {
  const start = useSharedValue(0),
    lifted = useSharedValue(0);
  const gesture = usePanGesture({
    enabled: !disabled,
    activateAfterLongPress: 250,
    onActivate: () => {
      'worklet';
      start.set((positions.get()[id] ?? 0) * slot);
      dragTop.set(start.get());
      active.set(id);
      lifted.set(withTiming(1, { duration: 140 }));
      scheduleOnRN(onLift);
    },
    onUpdate: (event) => {
      'worklet';
      if (active.get() !== id) return;
      const top = Math.min(Math.max(start.get() + event.translationY, 0), (count - 1) * slot);
      dragTop.set(top);
      const from = positions.get()[id] ?? 0,
        to = Math.round(top / slot);
      if (to === from) return;
      positions.set(shiftPositions(positions.get(), id, to));
    },
    onDeactivate: () => {
      'worklet';
      if (active.get() !== id) return;
      const order = orderedKeys(positions.get());
      lifted.set(withTiming(0, { duration: 160 }));
      dragTop.set(
        withSpring((positions.get()[id] ?? 0) * slot, spring, () => {
          active.set(null);
        }),
      );
      scheduleOnRN(onDrop, order);
    },
  });
  const style = useAnimatedStyle(() => {
    const dragging = active.get() === id;
    return {
      top: dragging ? dragTop.get() : withSpring((positions.get()[id] ?? 0) * slot, spring),
      zIndex: dragging ? 10 : 0,
      transform: [{ scale: 1 + lifted.get() * 0.03 }],
      shadowOpacity: lifted.get() * 0.18,
      elevation: lifted.get() * 8,
    };
  });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            height: rowHeight,
            shadowColor: '#000000',
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

// The visible drag hint; for screen readers it is the reorder control.
function Grip({
  label,
  first,
  last,
  onMove,
}: {
  label: string;
  first: boolean;
  last: boolean;
  onMove: (step: number) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={`Reorder ${label}`}
      accessibilityHint="Hold the card and drag, or swipe up or down to move it."
      accessibilityActions={[
        // Swiping up (increment) moves the item up the list.
        ...(first ? [] : [{ name: 'increment', label: 'Move up' }]),
        ...(last ? [] : [{ name: 'decrement', label: 'Move down' }]),
      ]}
      onAccessibilityAction={(event) =>
        onMove(event.nativeEvent.actionName === 'increment' ? -1 : 1)
      }
      style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}
    >
      <ProductIcon
        name={{ ios: 'line.3.horizontal', android: 'drag_indicator', web: 'drag_indicator' }}
        size={18}
        color={colors.muted}
      />
    </View>
  );
}
