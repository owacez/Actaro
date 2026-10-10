import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { AccountSecurity } from '@/features/profile/account-security';
import { accountSecurityService } from '@/features/profile/account-security-service';
import { FeedbackTestRoot } from './helpers/feedback-root';

jest.mock('@/features/profile/account-security-service', () => ({
  accountSecurityService: { changeEmail: jest.fn(), changePassword: jest.fn() },
  accountSecurityError: () => 'Unable to update your account. Try again.',
}));
const service = jest.mocked(accountSecurityService);
const onBusyChange = jest.fn();
beforeEach(() => {
  jest.resetAllMocks();
});
async function open() {
  await render(
    <AccountSecurity
      userId="user-a"
      email="old@example.com"
      blocked={false}
      onBusyChange={onBusyChange}
    />,
    { wrapper: FeedbackTestRoot },
  );
}

test('email confirmation request preserves the current email and never claims it is updated', async () => {
  service.changeEmail.mockResolvedValue({ confirmed: false });
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Change email' }));
  await fireEvent.changeText(screen.getByLabelText('New email'), 'new@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Update email' }));
  expect(service.changeEmail).toHaveBeenCalledWith('new@example.com', 'user-a');
  expect(screen.getByText('old@example.com')).toBeTruthy();
  expect(screen.getByText('Check your email inboxes to confirm the email change.')).toBeTruthy();
  expect(screen.queryByText('Email updated.')).toBeNull();
});

test('password request disables duplicate submission and clears credentials after failure', async () => {
  let rejectRequest: (error: Error) => void = () => {};
  service.changePassword.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
  );
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
  await fireEvent.changeText(screen.getByLabelText('New password'), 'new-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'new-password');
  const submit = screen.getByRole('button', { name: 'Update password' });
  await fireEvent.press(submit);
  await fireEvent.press(submit);
  expect(service.changePassword).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('New password')).toHaveProp('editable', false);
  expect(onBusyChange).toHaveBeenCalledWith(true);
  await act(() => rejectRequest(new Error('private diagnostics')));
  expect(screen.getByLabelText('New password')).toHaveProp('value', '');
  expect(screen.getByLabelText('Confirm new password')).toHaveProp('value', '');
  expect(screen.queryByText('private diagnostics')).toBeNull();
  expect(screen.queryByText('Password updated successfully.')).toBeNull();
  expect(onBusyChange).toHaveBeenLastCalledWith(false);
});

test('confirmed password update closes the form and reports success', async () => {
  service.changePassword.mockResolvedValue(undefined);
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Change password' }));
  await fireEvent.changeText(screen.getByLabelText('New password'), 'new-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm new password'), 'new-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  expect(service.changePassword).toHaveBeenCalledWith('new-password', 'new-password', 'user-a');
  expect(screen.queryByLabelText('New password')).toBeNull();
  expect(screen.getByText('Password updated successfully.')).toBeTruthy();
});
