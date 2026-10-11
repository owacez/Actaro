import { expect, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { NavigationTabLabel } from '@/components/navigation-tab-label';
import { actaroDarkColors } from '@/constants/actaro-theme';
import { ThemeContext } from '@/features/profile/theme-context';

test('selected and inactive navigation labels remain readable in dark mode', async () => {
  const view = await render(
    <ThemeContext.Provider
      value={{ colors: actaroDarkColors, scheme: 'dark', applySavedPreferences: () => {} }}
    >
      <NavigationTabLabel title="Today" focused />
      <NavigationTabLabel title="Fitness" focused={false} />
    </ThemeContext.Provider>,
  );
  expect(screen.getByText('Today')).toHaveStyle({ color: '#fffdf8' });
  expect(screen.getByText('Fitness')).toHaveStyle({ color: '#ddd5c8' });
  await view.rerender(<NavigationTabLabel title="Today" focused={false} />);
  expect(screen.getByText('Today')).toHaveStyle({ color: '#6d6961' });
});
