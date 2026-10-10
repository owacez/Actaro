import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileError, type Preferences } from '@/features/profile/profile-model';
import { PreferencesScreen } from '@/features/profile/preferences-screen';
import { profileService } from '@/features/profile/profile-service';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn(), updatePreferences: jest.fn() },
}));
const service = jest.mocked(profileService);
const preferences: Preferences = {
  user_id: 'test-user-a',
  weight_unit: 'kg',
  length_unit: 'cm',
  distance_unit: 'km',
  energy_unit: 'kcal',
  theme: 'system',
  time_zone: 'UTC',
  notifications_enabled: false,
  gamification_enabled: false,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
const onBack = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  service.getPreferences.mockResolvedValue(preferences);
});
async function open() {
  await render(<PreferencesScreen userId={preferences.user_id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  await screen.findByLabelText('Time zone');
}
async function press(name: string) {
  await fireEvent.press(screen.getByRole('button', { name }));
}

test('loads saved values, removes reverted changes and discards without a write', async () => {
  await open();
  expect(service.getPreferences).toHaveBeenCalledWith(preferences.user_id);
  expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
  await press('Weight: kg');
  await press('Weight: lb');
  expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Time zone'), 'Europe/London');
  await press('Discard changes');
  expect(screen.getByLabelText('Time zone')).toHaveProp('value', 'UTC');
  expect(service.updatePreferences).not.toHaveBeenCalled();
});

test('failed loading hides the form, keeps diagnostics private and supports retry', async () => {
  service.getPreferences.mockRejectedValueOnce(new Error('private diagnostic'));
  await render(<PreferencesScreen userId={preferences.user_id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  expect(await screen.findByText('Unable to load or save preferences. Try again.')).toBeTruthy();
  expect(screen.queryByLabelText('Time zone')).toBeNull();
  expect(screen.queryByText('private diagnostic')).toBeNull();
  await press('Retry');
  expect(await screen.findByLabelText('Time zone')).toHaveProp('value', 'UTC');
});

test('rejects invalid time zones before a mutation', async () => {
  await open();
  await fireEvent.changeText(screen.getByLabelText('Time zone'), 'Mars/Olympus');
  await press('Save preferences');
  expect(screen.getByText('Choose a valid time zone.')).toBeTruthy();
  expect(service.updatePreferences).not.toHaveBeenCalled();
});

test('sends only changed fields, blocks duplicate saves and awaits server success', async () => {
  let resolveSave: (record: Preferences) => void = () => {};
  service.updatePreferences.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  await open();
  await press('Weight: kg');
  await press('Notifications preference: Off');
  const submit = screen.getByRole('button', { name: 'Save preferences' });
  await fireEvent.press(submit);
  await fireEvent.press(submit);
  expect(service.updatePreferences).toHaveBeenCalledTimes(1);
  expect(service.updatePreferences).toHaveBeenCalledWith(
    { weight_unit: 'lb', notifications_enabled: true },
    preferences.user_id,
  );
  expect(screen.getByLabelText('Time zone')).toHaveProp('editable', false);
  expect(screen.getByRole('button', { name: '← More' })).toBeDisabled();
  expect(screen.queryByText('Preferences saved.')).toBeNull();
  await act(() => resolveSave({ ...preferences, weight_unit: 'lb', notifications_enabled: true }));
  expect(screen.getByText('Preferences saved.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Save preferences' })).toBeDisabled();
});

test('failed save preserves edits and retries against the same account', async () => {
  service.updatePreferences
    .mockRejectedValueOnce(new ProfileError('REQUEST_FAILED', 'Unable to save. Try again.'))
    .mockResolvedValueOnce({ ...preferences, gamification_enabled: true });
  await open();
  await press('Gamification preference: Off');
  await press('Save preferences');
  expect(await screen.findByText('Unable to save. Try again.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Gamification preference: On' })).toBeTruthy();
  expect(screen.queryByText('Preferences saved.')).toBeNull();
  await press('Save preferences');
  expect(await screen.findByText('Preferences saved.')).toBeTruthy();
});

test('account remount ignores old data and late success notifications', async () => {
  let resolveSave: (record: Preferences) => void = () => {};
  service.updatePreferences.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  const view = await render(
    <PreferencesScreen key="a" userId={preferences.user_id} onBack={onBack} />,
    {
      wrapper: FeedbackTestRoot,
    },
  );
  await screen.findByLabelText('Time zone');
  await press('Weight: kg');
  await press('Save preferences');
  service.getPreferences.mockResolvedValue({
    ...preferences,
    user_id: 'test-user-b',
    time_zone: 'Europe/London',
  });
  await view.rerender(<PreferencesScreen key="b" userId="test-user-b" onBack={onBack} />);
  expect(await screen.findByLabelText('Time zone')).toHaveProp('value', 'Europe/London');
  await act(() => resolveSave({ ...preferences, weight_unit: 'lb' }));
  expect(screen.queryByText('Preferences saved.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Weight: kg' })).toBeTruthy();
});
