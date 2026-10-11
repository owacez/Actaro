import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/features/profile/theme-context';

// Dot marker and selected pill verified from the approved PDF's navigation page.
export function NavigationTabLabel({ title, focused }: { title: string; focused: boolean }) {
  const { colors } = useAppTheme();
  const color = focused ? colors.text : colors.muted;
  return (
    <View
      style={[styles.container, { backgroundColor: focused ? colors.background : 'transparent' }]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 12,
    minWidth: 54,
    minHeight: 36,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 10 },
});
