import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/profile/theme-context';
import { NavigationTabLabel } from '@/components/navigation-tab-label';

// PDF-verified navigation treatment; product screens remain scoped to their releases.
export default function MainTabs() {
  const { session, recovery } = useAuth();
  const { colors } = useAppTheme();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabel: ({ children, focused }) => (
          <NavigationTabLabel title={children} focused={focused} />
        ),
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="today" options={{ title: 'Today' }} />
      <Tabs.Screen name="fitness" options={{ title: 'Fitness' }} />
      <Tabs.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
