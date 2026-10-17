import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { AuthButton, AuthInput, AuthText } from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import type { Preferences } from '@/features/profile/profile-model';
import { profileService } from '@/features/profile/profile-service';
import { useAppTheme } from '@/features/profile/theme-context';
import { AppThemeProvider } from '@/features/profile/theme-provider';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn() },
}));
let mockSystemScheme: 'light' | 'dark' | null = 'light';
jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: () => mockSystemScheme }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

const preferences: Preferences = {
  user_id: 'user-a',
  theme: 'system',
  weight_unit: 'kg',
  length_unit: 'cm',
  distance_unit: 'km',
  energy_unit: 'kcal',
  time_zone: 'UTC',
  notifications_enabled: false,
  gamification_enabled: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
const service = jest.mocked(profileService);

function Probe({ owner = 'user-a' }: { owner?: string }) {
  const { scheme, colors, applySavedPreferences } = useAppTheme();
  const { notify } = useAuthFeedback();
  return (
    <View testID="surface" style={{ backgroundColor: colors.background }}>
      <Text>{`Appearance: ${scheme}`}</Text>
      <AuthText kind="heading">Theme heading</AuthText>
      <AuthInput label="Theme input" />
      <AuthButton
        title="Saved dark"
        onPress={() => applySavedPreferences({ user_id: owner, theme: 'dark' })}
      />
      <AuthButton
        title="Saved system"
        onPress={() => applySavedPreferences({ user_id: owner, theme: 'system' })}
      />
      <AuthButton title="Notify" onPress={() => notify('Signed in successfully.', 'success')} />
    </View>
  );
}
function app(userId?: string, owner?: string) {
  return (
    <AppThemeProvider userId={userId}>
      <FeedbackTestRoot>
        <Probe owner={owner} />
      </FeedbackTestRoot>
    </AppThemeProvider>
  );
}
beforeEach(() => {
  jest.resetAllMocks();
  mockSystemScheme = 'light';
  service.getPreferences.mockResolvedValue(preferences);
});

test('restores the owned theme and gives shared controls readable dark colors', async () => {
  service.getPreferences.mockResolvedValue({ ...preferences, theme: 'dark' });
  await render(app('user-a'));
  expect(await screen.findByText('Appearance: dark')).toBeTruthy();
  expect(service.getPreferences).toHaveBeenCalledWith('user-a');
  expect(screen.getByTestId('surface')).toHaveStyle({ backgroundColor: '#0c0d0c' });
  expect(screen.getByText('Theme heading')).toHaveStyle({ color: '#f1f2ee' });
  expect(screen.getByLabelText('Theme input')).toHaveStyle({
    color: '#f1f2ee',
  });
  expect(screen.getByLabelText('Theme input')).toHaveProp('keyboardAppearance', 'dark');
  expect(screen.getByText('Saved dark')).toHaveStyle({ color: '#111311' });
});

test('System follows device changes, including signed-out state and null fallback', async () => {
  mockSystemScheme = 'dark';
  const view = await render(app());
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
  expect(service.getPreferences).not.toHaveBeenCalled();
  mockSystemScheme = null;
  await view.rerender(app());
  expect(screen.getByText('Appearance: light')).toBeTruthy();
  await view.rerender(app('user-a'));
  mockSystemScheme = 'dark';
  await view.rerender(app('user-a'));
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
});

test('explicit Light ignores device dark mode until System is saved', async () => {
  mockSystemScheme = 'dark';
  service.getPreferences.mockResolvedValue({ ...preferences, theme: 'light' });
  await render(app('user-a'));
  expect(await screen.findByText('Appearance: light')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Saved system' }));
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
});

test('a confirmed save supersedes the older initial load', async () => {
  let resolveLoad: (record: Preferences) => void = () => {};
  service.getPreferences.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  await render(app('user-a'));
  await fireEvent.press(screen.getByRole('button', { name: 'Saved dark' }));
  await act(() => resolveLoad(preferences));
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
});

test('switching accounts rejects old loads and saved records without losing feedback', async () => {
  let resolveLoad: (record: Preferences) => void = () => {};
  service.getPreferences.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  const view = await render(app('user-a'));
  await fireEvent.press(screen.getByRole('button', { name: 'Saved dark' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Notify' }));
  service.getPreferences.mockResolvedValue({ ...preferences, user_id: 'user-b', theme: 'light' });
  await view.rerender(app('user-b', 'user-a'));
  await fireEvent.press(screen.getByRole('button', { name: 'Saved dark' }));
  await act(() => resolveLoad({ ...preferences, theme: 'dark' }));
  expect(screen.getByText('Appearance: light')).toBeTruthy();
  expect(screen.getByText('Signed in successfully.')).toBeTruthy();
  mockSystemScheme = 'dark';
  await view.rerender(app());
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
  mockSystemScheme = 'light';
  await view.rerender(app());
  expect(screen.getByText('Appearance: light')).toBeTruthy();
});

test('failed or invalid preference reads fall back to System and a later valid load can apply', async () => {
  mockSystemScheme = 'dark';
  service.getPreferences.mockRejectedValueOnce(new Error('private diagnostic'));
  const view = await render(app('user-a'));
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
  expect(screen.queryByText('private diagnostic')).toBeNull();
  service.getPreferences.mockResolvedValue({ ...preferences, user_id: 'user-b', theme: 'invalid' });
  await view.rerender(app('user-b', 'user-b'));
  expect(screen.getByText('Appearance: dark')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Saved system' }));
  mockSystemScheme = 'light';
  await view.rerender(app('user-b', 'user-b'));
  expect(screen.getByText('Appearance: light')).toBeTruthy();
});
