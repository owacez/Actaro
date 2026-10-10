import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import { ProfileError, type Profile } from '@/features/profile/profile-model';
import { ProfileScreen } from '@/features/profile/profile-screen';
import { profileService } from '@/features/profile/profile-service';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getProfile: jest.fn(), updateProfile: jest.fn() },
}));
jest.mock('@/features/profile/account-security-service', () => ({
  accountSecurityService: { changeEmail: jest.fn(), changePassword: jest.fn() },
  accountSecurityError: () => 'Unable to update your account. Try again.',
}));
const service = jest.mocked(profileService);
const profile: Profile = {
  id: 'test-user-a',
  display_name: 'Athlete',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};
const onBack = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
  service.getProfile.mockResolvedValue(profile);
});
afterEach(() => {
  jest.restoreAllMocks();
});
async function open() {
  await render(<ProfileScreen userId={profile.id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  await screen.findByLabelText('Display name');
}

test('loads the real service result and does not submit unchanged values', async () => {
  await open();
  expect(service.getProfile).toHaveBeenCalledWith(profile.id);
  expect(screen.getByLabelText('Display name')).toHaveProp('value', 'Athlete');
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  expect(service.updateProfile).not.toHaveBeenCalled();
});

test('failed loading hides the form, allows retry and hides unexpected diagnostics', async () => {
  service.getProfile.mockRejectedValueOnce(new Error('private details'));
  await render(<ProfileScreen userId={profile.id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  expect(await screen.findByText('Unable to load or save your profile. Try again.')).toBeTruthy();
  expect(screen.queryByLabelText('Display name')).toBeNull();
  expect(screen.queryByText('private details')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByLabelText('Display name')).toHaveProp('value', 'Athlete');
  expect(service.getProfile).toHaveBeenCalledTimes(2);
});

test('discard restores the saved name without making a mutation', async () => {
  await open();
  await fireEvent.changeText(screen.getByLabelText('Display name'), 'Draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Discard changes' }));
  expect(screen.getByLabelText('Display name')).toHaveProp('value', 'Athlete');
  expect(service.updateProfile).not.toHaveBeenCalled();
});

test('validation rejects overly long names before any mutation', async () => {
  await open();
  await fireEvent.changeText(screen.getByLabelText('Display name'), 'a'.repeat(81));
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  expect(screen.getByText('Use a display name of 80 characters or fewer.')).toBeTruthy();
  expect(service.updateProfile).not.toHaveBeenCalled();
});

test('blocks duplicate saves/editing/navigation and reports success only after server confirmation', async () => {
  let resolveSave: (record: Profile) => void = () => {};
  service.updateProfile.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  await open();
  await fireEvent.changeText(screen.getByLabelText('Display name'), ' New name ');
  const submit = screen.getByRole('button', { name: 'Save profile' });
  await fireEvent.press(submit);
  await fireEvent.press(submit);
  expect(service.updateProfile).toHaveBeenCalledTimes(1);
  expect(service.updateProfile).toHaveBeenCalledWith({ display_name: 'New name' }, profile.id);
  expect(screen.getByLabelText('Display name')).toHaveProp('editable', false);
  expect(screen.getByRole('button', { name: '← More' })).toBeDisabled();
  expect(screen.queryByText('Profile saved.')).toBeNull();
  await act(() => resolveSave({ ...profile, display_name: 'New name' }));
  expect(within(screen.getByTestId('auth-feedback')).getByText('Profile saved.')).toBeTruthy();
  expect(screen.getByLabelText('Display name')).toHaveProp('value', 'New name');
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
});

test('save failure preserves the draft and supports a successful retry', async () => {
  service.updateProfile
    .mockRejectedValueOnce(new ProfileError('REQUEST_FAILED', 'Unable to save. Try again.'))
    .mockResolvedValueOnce({ ...profile, display_name: 'Draft' });
  await open();
  await fireEvent.changeText(screen.getByLabelText('Display name'), 'Draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByText('Unable to save. Try again.')).toBeTruthy();
  expect(screen.getByLabelText('Display name')).toHaveProp('value', 'Draft');
  expect(screen.queryByText('Profile saved.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  expect(await screen.findByText('Profile saved.')).toBeTruthy();
});

test('blanking a name saves null', async () => {
  service.updateProfile.mockResolvedValue({ ...profile, display_name: null });
  await open();
  await fireEvent.changeText(screen.getByLabelText('Display name'), ' ');
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  await waitFor(() =>
    expect(service.updateProfile).toHaveBeenCalledWith({ display_name: null }, profile.id),
  );
  expect(screen.getByLabelText('Display name')).toHaveProp('value', '');
});

test('loading hides the form and an unnamed profile opens with an empty field', async () => {
  let resolveLoad: (record: Profile) => void = () => {};
  service.getProfile.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
  );
  await render(<ProfileScreen userId={profile.id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  expect(screen.getByText('Loading your profile…')).toBeTruthy();
  expect(screen.queryByLabelText('Display name')).toBeNull();
  await act(() => resolveLoad({ ...profile, display_name: null }));
  expect(screen.getByLabelText('Display name')).toHaveProp('value', '');
  expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
});

test('account remount discards the previous draft and ignores a late save notification', async () => {
  let resolveSave: (record: Profile) => void = () => {};
  service.updateProfile.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
  );
  const view = await render(<ProfileScreen key="a" userId={profile.id} onBack={onBack} />, {
    wrapper: FeedbackTestRoot,
  });
  await screen.findByLabelText('Display name');
  await fireEvent.changeText(screen.getByLabelText('Display name'), 'Old draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save profile' }));
  service.getProfile.mockResolvedValue({
    ...profile,
    id: 'test-user-b',
    display_name: 'Other account',
  });
  await view.rerender(<ProfileScreen key="b" userId="test-user-b" onBack={onBack} />);
  await waitFor(() =>
    expect(screen.getByLabelText('Display name')).toHaveProp('value', 'Other account'),
  );
  await act(() => resolveSave({ ...profile, display_name: 'Old draft' }));
  expect(screen.queryByText('Profile saved.')).toBeNull();
  expect(screen.getByLabelText('Display name')).toHaveProp('value', 'Other account');
});
