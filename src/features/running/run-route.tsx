import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '@/features/profile/theme-context';
import { AuthText } from '@/features/auth/auth-components';
import type { RunPoint } from './run-model';

export function routePath(points: readonly RunPoint[]) {
  if (points.length < 2) return '';
  const origin = points[0];
  const projected = points.map((point) => ({
    x:
      (((point.longitude - origin.longitude + 540) % 360) - 180) *
      Math.cos((origin.latitude * Math.PI) / 180),
    y: -point.latitude,
    segment: point.segment,
  }));
  const xs = projected.map((point) => point.x),
    ys = projected.map((point) => point.y);
  const left = Math.min(...xs),
    right = Math.max(...xs),
    top = Math.min(...ys),
    bottom = Math.max(...ys);
  const scale = Math.min(
    280 / Math.max(right - left, 0.0001),
    140 / Math.max(bottom - top, 0.0001),
  );
  const stride = Math.max(1, Math.ceil(points.length / 500));
  let path = '';
  for (let index = 0; index < projected.length; index++) {
    const point = projected[index],
      previous = projected[index - 1],
      next = projected[index + 1];
    const boundary = !previous || previous.segment !== point.segment;
    if (index % stride && !boundary && next && next.segment === point.segment) continue;
    const x = 160 + (point.x - (left + right) / 2) * scale;
    const y = 90 + (point.y - (top + bottom) / 2) * scale;
    path += `${boundary ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return path.trim();
}
export function RunRoute({
  points,
  compact = false,
}: {
  points: readonly RunPoint[];
  compact?: boolean;
}) {
  const { colors } = useAppTheme();
  const path = useMemo(() => routePath(points), [points]);
  return (
    <View
      style={{ backgroundColor: colors.fill, borderRadius: 20, overflow: 'hidden', padding: 12 }}
    >
      <View
        accessible
        accessibilityLabel="Recorded GPS route outline. Gaps show pauses or missing GPS signal."
      >
        <Svg width="100%" height={compact ? 90 : 180} viewBox="0 0 320 180" aria-hidden>
          <Path
            d={path}
            fill="none"
            stroke={colors.accent}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      {!compact && (
        <AuthText kind="muted">
          {path
            ? 'Recorded route · north up · gaps are not joined'
            : 'Waiting for movement and an accurate GPS signal.'}
        </AuthText>
      )}
    </View>
  );
}
