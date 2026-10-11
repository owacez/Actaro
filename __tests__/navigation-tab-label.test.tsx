import { expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { NavigationTabLabel } from '@/components/navigation-tab-label';
import { actaroDarkColors } from '@/constants/actaro-theme';
import { ThemeContext } from '@/features/profile/theme-context';

jest.mock('expo-symbols', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { SymbolView: () => <View /> };
});
const todayIcon = { ios: 'calendar', android: 'today', web: 'today' } as const;
const fitnessIcon = { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' } as const;

test('selected and inactive navigation labels remain readable in dark mode', async () => {
  const view = await render(
    <ThemeContext.Provider
      value={{ colors: actaroDarkColors, scheme: 'dark', applySavedPreferences: () => {} }}
    >
      <NavigationTabLabel title="Today" focused icon={todayIcon} />
      <NavigationTabLabel title="Fitness" focused={false} icon={fitnessIcon} />
    </ThemeContext.Provider>,
  );
  expect(screen.getByText('Today')).toHaveStyle({ color: '#fffdf8' });
  expect(screen.getByText('Fitness')).toHaveStyle({ color: '#ddd5c8' });
  await view.rerender(<NavigationTabLabel title="Today" focused={false} icon={todayIcon} />);
  expect(screen.getByText('Today')).toHaveStyle({ color: '#6d6961' });
});
