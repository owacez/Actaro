import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/features/profile/theme-context';

// User-requested icons replace PDF dot markers; preserve its label/selected pill.
export function NavigationTabLabel({
  title,
  focused,
  icon,
}: {
  title: string;
  focused: boolean;
  icon: SymbolViewProps['name'];
}) {
  const { colors } = useAppTheme();
  const color = focused ? colors.background : colors.muted;
  return (
    <View style={[styles.container, { backgroundColor: focused ? colors.text : 'transparent' }]}>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SymbolView name={icon} size={22} tintColor={color} />
      </View>
      <Text style={[styles.label, { color }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 32,
    minHeight: 52,
  },
  label: { fontFamily: 'Inter_500Medium', fontSize: 10, lineHeight: 14 },
});
