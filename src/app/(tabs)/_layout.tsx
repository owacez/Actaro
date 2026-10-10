import { Redirect, Tabs } from 'expo-router';

import { actaroColors } from '@/constants/actaro-theme';
import { useAuth } from '@/features/auth/auth-provider';

// Functional navigation using approved existing styling; Figma parity is pending.
export default function MainTabs() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: actaroColors.accent,
        tabBarInactiveTintColor: actaroColors.muted,
        tabBarStyle: { backgroundColor: actaroColors.surface, borderTopColor: actaroColors.border },
        tabBarLabelStyle: { fontFamily: 'Inter_500Medium', fontSize: 12 },
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: actaroColors.background },
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
