import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/profile/theme-context';

// Functional navigation using approved existing styling; Figma parity is pending.
export default function MainTabs() {
  const { session, recovery } = useAuth();
  const { colors } = useAppTheme();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
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
