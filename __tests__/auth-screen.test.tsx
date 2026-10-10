import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthScreen } from '@/features/auth/auth-screen';
import { authService } from '@/features/auth/auth-service';

jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ finishRecovery: jest.fn() }),
}));
jest.mock('@/features/auth/auth-service', () => ({
  ...jest.requireActual<typeof import('@/features/auth/auth-service')>(
    '@/features/auth/auth-service',
  ),
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    requestReset: jest.fn(),
    resendConfirmation: jest.fn(),
    updatePassword: jest.fn(),
    signOut: jest.fn(),
  },
}));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

const service = jest.mocked(authService);
beforeEach(() => {
  jest.resetAllMocks();
});

async function enterEmailAndPassword(password = 'test-password-123') {
  await fireEvent.changeText(screen.getByLabelText('Email'), 'tester@example.com');
  await fireEvent.changeText(screen.getByLabelText('Password'), password);
}

test('rejects invalid input before requesting sign-in', async () => {
  await render(<AuthScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(screen.getByText('Enter a valid email address.')).toBeTruthy();
  expect(service.signIn).not.toHaveBeenCalled();
});

test('guards pending sign-in and renders a safe server error', async () => {
  let rejectRequest: (reason: unknown) => void = () => {};
  service.signIn.mockImplementation(
    () =>
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
  );
  await render(<AuthScreen />);
  await enterEmailAndPassword();
  const button = screen.getByRole('button', { name: 'Sign in' });
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(service.signIn).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Email')).toHaveProp('editable', false);
  await act(() =>
    rejectRequest({ code: 'invalid_credentials', message: 'sensitive raw response' }),
  );
  expect(await screen.findByText('Email or password is incorrect.')).toBeTruthy();
  expect(screen.queryByText('sensitive raw response')).toBeNull();
  expect(screen.getByLabelText('Email')).toHaveProp('editable', true);
});

test('requires matching signup passwords then clears them for verification', async () => {
  service.signUp.mockResolvedValue({ needsConfirmation: true });
  await render(<AuthScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  await enterEmailAndPassword();
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'different-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(screen.getByText('Your passwords do not match.')).toBeTruthy();
  expect(service.signUp).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'test-password-123');
  await fireEvent.press(screen.getByRole('button', { name: 'Create account' }));
  expect(await screen.findByText('Check your email')).toBeTruthy();
  expect(screen.queryByLabelText('Password')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Already have an account? Sign in' }));
  expect(screen.getByLabelText('Password')).toHaveProp('value', '');
});

test('reset success does not reveal account existence', async () => {
  service.requestReset.mockResolvedValue(undefined);
  await render(<AuthScreen />);
  await fireEvent.press(screen.getByRole('button', { name: 'Forgot password?' }));
  await fireEvent.changeText(screen.getByLabelText('Email'), 'unknown@example.com');
  await fireEvent.press(screen.getByRole('button', { name: 'Send reset link' }));
  expect(service.requestReset).toHaveBeenCalledWith('unknown@example.com');
  expect(await screen.findByText(/If this email has an account/)).toBeTruthy();
});

test('password recovery validates confirmation before updating the user', async () => {
  service.updatePassword.mockResolvedValue(undefined);
  await render(<AuthScreen recovery />);
  expect(screen.queryByLabelText('Email')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Password'), 'replacement-password');
  await fireEvent.changeText(screen.getByLabelText('Confirm password'), 'replacement-password');
  await fireEvent.press(screen.getByRole('button', { name: 'Update password' }));
  await waitFor(() => expect(service.updatePassword).toHaveBeenCalledWith('replacement-password'));
  expect(screen.getByLabelText('Password')).toHaveProp('value', '');
});
