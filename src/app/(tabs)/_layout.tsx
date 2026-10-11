import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/profile/theme-context';
import { NavigationTabLabel } from '@/components/navigation-tab-label';

const tabs = [
  { name: 'today', title: 'Today', icon: { ios: 'calendar', android: 'today', web: 'today' } },
  {
    name: 'fitness',
    title: 'Fitness',
    icon: { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' },
  },
  {
    name: 'nutrition',
    title: 'Nutrition',
    icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  },
  {
    name: 'progress',
    title: 'Progress',
    icon: { ios: 'chart.xyaxis.line', android: 'show_chart', web: 'show_chart' },
  },
  {
    name: 'more',
    title: 'More',
    icon: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  },
] as const;

// User-requested tab icons; product screens remain scoped to their releases.
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
        // The combined label owns icon/label spacing and the selected pill.
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarHideOnKeyboard: true,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarLabel: ({ focused }) => (
              <NavigationTabLabel title={title} focused={focused} icon={icon} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
