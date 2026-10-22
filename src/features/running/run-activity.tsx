import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, monospacedDigit, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity } from 'expo-widgets';
import type { RunLiveProps } from './run-live-model';

// iOS Live Activity for an active run (Lock Screen and Dynamic Island). The function is
// compiled into the widget extension: it may use only @expo/ui/swift-ui and its props,
// so colours are declared inside. The timer counts on its own between updates.
function RunActivity(props: RunLiveProps) {
  'widget';
  const accent = '#FF5A1F';
  const timer = {
    lower: new Date(props.startedAt),
    upper: new Date(props.startedAt + 86400000),
  };
  const paused = props.pausedAt === null ? undefined : new Date(props.pausedAt);
  return {
    banner: (
      <VStack modifiers={[padding({ all: 16 })]}>
        <HStack>
          <Image systemName="figure.run" color={accent} />
          <Text modifiers={[font({ weight: 'semibold' }), foregroundStyle(accent)]}>
            {props.status}
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 13 })]}>Actaro</Text>
        </HStack>
        <HStack>
          <Text
            timerInterval={timer}
            pauseTime={paused}
            modifiers={[font({ size: 36, weight: 'bold' }), monospacedDigit()]}
          />
          <Spacer />
          <VStack>
            <Text modifiers={[font({ size: 20, weight: 'semibold' }), monospacedDigit()]}>
              {props.distance} {props.unit}
            </Text>
            <Text modifiers={[font({ size: 13 }), monospacedDigit()]}>{props.pace} avg</Text>
          </VStack>
        </HStack>
      </VStack>
    ),
    compactLeading: <Image systemName="figure.run" color={accent} />,
    compactTrailing: (
      <Text modifiers={[monospacedDigit()]}>
        {props.distance} {props.unit}
      </Text>
    ),
    minimal: <Image systemName="figure.run" color={accent} />,
    expandedLeading: (
      <Text
        timerInterval={timer}
        pauseTime={paused}
        modifiers={[font({ size: 24, weight: 'bold' }), monospacedDigit()]}
      />
    ),
    expandedTrailing: (
      <Text modifiers={[font({ size: 20, weight: 'semibold' }), monospacedDigit()]}>
        {props.distance} {props.unit}
      </Text>
    ),
    expandedBottom: (
      <Text modifiers={[font({ size: 13 })]}>
        {props.status} · {props.pace} avg
      </Text>
    ),
  };
}

export default createLiveActivity('RunActivity', RunActivity);
