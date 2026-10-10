import { beforeEach, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import IndexScreen from '@/app/index';
import MainTabs from '@/app/(tabs)/_layout';

let mockSession: object | null = {};
let mockRecovery = false;
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ session: mockSession, recovery: mockRecovery }),
}));
jest.mock('@/features/auth/auth-screen', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthScreen: ({ recovery }: { recovery?: boolean }) => (
      <Text>{recovery ? 'Recovery form' : 'Sign in form'}</Text>
    ),
  };
});
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Tabs.Screen = ({ name }: { name: string }) => <Text>{name}</Text>;
  return { Tabs, Redirect: ({ href }: { href: string }) => <Text>Redirect: {href}</Text> };
});
beforeEach(() => {
  mockSession = {};
  mockRecovery = false;
});

test('normal sign-in lands on Today and exposes all five module routes', async () => {
  const result = await render(<IndexScreen />);
  expect(screen.getByText('Redirect: /today')).toBeTruthy();
  await result.rerender(<MainTabs />);
  for (const route of ['today', 'fitness', 'nutrition', 'progress', 'more'])
    expect(screen.getByText(route)).toBeTruthy();
});
test('signed-out access to tabs returns to sign-in', async () => {
  mockSession = null;
  const result = await render(<MainTabs />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
  await result.rerender(<IndexScreen />);
  expect(screen.getByText('Sign in form')).toBeTruthy();
});
test('recovery sessions cannot enter tabs or skip their password form', async () => {
  mockRecovery = true;
  const result = await render(<MainTabs />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
  await result.rerender(<IndexScreen />);
  expect(screen.getByText('Recovery form')).toBeTruthy();
});
