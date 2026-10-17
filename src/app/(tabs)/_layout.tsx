import { useEffect, useState } from 'react';
import { Keyboard, Pressable, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/features/profile/theme-context';
import { NavigationTabLabel } from '@/components/navigation-tab-label';
import { NavigationSurface, ProductIcon } from '@/components/product-ui';
import { QuickLogSheet } from '@/components/quick-log-sheet';
const tabs = [
  { name: 'today', title: 'Today', icon: { ios: 'calendar', android: 'today', web: 'today' } },
  {
    name: 'fitness',
    title: 'Train',
    icon: { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' },
  },
  {
    name: 'nutrition',
    title: 'Food',
    icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  },
  {
    name: 'progress',
    title: 'Progress',
    icon: { ios: 'chart.xyaxis.line', android: 'show_chart', web: 'show_chart' },
  },
  {
    name: 'more',
    title: 'You',
    icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  },
] as const;
export default function MainTabs() {
  const { session, recovery } = useAuth(),
    { colors } = useAppTheme(),
    insets = useSafeAreaInsets();
  const [quickLog, setQuickLog] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <>
      <Tabs
        initialRouteName="today"
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
        tabBar={({ state, navigation }) =>
          keyboardOpen ? null : (
            <View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                bottom: Math.max(12, insets.bottom),
                left: 12,
                right: 12,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  maxWidth: 440,
                }}
              >
                <NavigationSurface
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    borderRadius: 40,
                    padding: 5,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  {tabs.map((tab) => {
                    const index = state.routes.findIndex((route) => route.name === tab.name),
                      route = state.routes[index],
                      focused = state.index === index;
                    if (!route) return null;
                    return (
                      <Pressable
                        key={tab.name}
                        accessibilityRole="tab"
                        accessibilityLabel={tab.title}
                        accessibilityState={{ selected: focused }}
                        style={{ flex: 1 }}
                        onPress={() => {
                          const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                          });
                          if (!event.defaultPrevented) {
                            Keyboard.dismiss();
                            navigation.navigate(route.name);
                          }
                        }}
                        onLongPress={() =>
                          navigation.emit({ type: 'tabLongPress', target: route.key })
                        }
                      >
                        <NavigationTabLabel title={tab.title} focused={focused} icon={tab.icon} />
                      </Pressable>
                    );
                  })}
                </NavigationSurface>
                <NavigationSurface
                  style={{ borderRadius: 40, borderWidth: 1, borderColor: colors.border }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Quick log"
                    onPress={() => {
                      Keyboard.dismiss();
                      setQuickLog(true);
                    }}
                    style={{
                      width: 52,
                      height: 58,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ProductIcon
                      name={{ ios: 'plus', android: 'add', web: 'add' }}
                      color={colors.accent}
                      size={28}
                    />
                  </Pressable>
                </NavigationSurface>
              </View>
            </View>
          )
        }
      >
        {tabs.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </Tabs>
      <QuickLogSheet
        userId={session.user.id}
        visible={quickLog}
        onClose={() => setQuickLog(false)}
      />
    </>
  );
}
