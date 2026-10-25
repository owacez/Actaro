import { View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { useAppTheme } from '@/features/profile/theme-context';
import { bodyPaths, type BodyFigure, type BodySide } from './body-paths';
import { regionOf, type MuscleRegion } from './muscle-model';

// Front and back figures side by side. Muscles are tappable; silhouette parts are drawn but
// inert. Screen readers use the labelled muscle chips beside the map instead.
export function BodyMap({
  figure,
  selected,
  onSelect,
  height,
}: {
  figure: BodyFigure;
  selected: MuscleRegion | null;
  onSelect: (region: MuscleRegion) => void;
  height: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}
    >
      {(['front', 'back'] as const).map((side) => (
        <Figure
          key={side}
          figure={figure}
          side={side}
          selected={selected}
          onSelect={onSelect}
          height={height}
        />
      ))}
    </View>
  );
}

function Figure({
  figure,
  side,
  selected,
  onSelect,
  height,
}: {
  figure: BodyFigure;
  side: BodySide;
  selected: MuscleRegion | null;
  onSelect: (region: MuscleRegion) => void;
  height: number;
}) {
  const { colors, scheme } = useAppTheme();
  const { viewBox, parts } = bodyPaths[figure][side];
  const [, , width, tall] = viewBox.split(' ').map(Number);
  const muscle = scheme === 'dark' ? '#3a3f39' : '#d3d7cf',
    inert = scheme === 'dark' ? '#262a25' : '#e6e8e3';
  return (
    <Svg width={(height * width) / tall} height={height} viewBox={viewBox}>
      {Object.entries(parts).map(([slug, paths]) => {
        const region = regionOf(slug);
        const active = !!region && region.slug === selected;
        return (
          <G
            key={slug}
            onPress={region ? () => onSelect(region.slug) : undefined}
            fill={active ? colors.accent : region ? muscle : inert}
            stroke={colors.background}
            strokeWidth={2}
          >
            {paths.map((d, index) => (
              <Path key={index} d={d} />
            ))}
          </G>
        );
      })}
    </Svg>
  );
}
