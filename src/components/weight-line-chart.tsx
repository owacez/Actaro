import { useState } from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';

export function WeightLineChart({
  rows,
  from,
  to,
  description,
}: {
  rows: { local_date: string; weight_kg: number }[];
  from: string;
  to: string;
  description: string;
}) {
  const [width, setWidth] = useState(0),
    { colors } = useAppTheme(),
    values = rows.map((row) => row.weight_kg),
    low = Math.min(...values),
    high = Math.max(...values),
    start = Date.parse(from),
    span = Math.max(86400000, Date.parse(to) - start),
    height = 120;
  const points = rows.map((row) => ({
    x: 8 + ((Date.parse(row.local_date) - start) / span) * Math.max(0, width - 16),
    y: high === low ? height / 2 : 10 + ((high - row.weight_kg) / (high - low)) * (height - 20),
  }));
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={description}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ height }}
    >
      {[10, height - 10].map((top) => (
        <View
          key={top}
          style={{
            position: 'absolute',
            top,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.border,
          }}
        />
      ))}
      {width > 0 &&
        points.map((point, index) => {
          const next = points[index + 1],
            dx = next ? next.x - point.x : 0,
            dy = next ? next.y - point.y : 0,
            length = Math.hypot(dx, dy);
          return (
            <View key={rows[index].local_date}>
              {next && (
                <View
                  style={{
                    position: 'absolute',
                    left: (point.x + next.x - length) / 2,
                    top: (point.y + next.y) / 2,
                    width: length,
                    height: 2,
                    backgroundColor: colors.text,
                    transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }],
                  }}
                />
              )}
              <View
                style={{
                  position: 'absolute',
                  left: point.x - 4,
                  top: point.y - 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: index === points.length - 1 ? colors.accent : colors.text,
                  backgroundColor: index === points.length - 1 ? colors.accent : colors.surface,
                }}
              />
            </View>
          );
        })}
    </View>
  );
}
