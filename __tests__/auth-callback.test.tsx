import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthCallbackScreen } from '@/features/auth/auth-callback-screen';
import { exchangeAuthCode } from '@/features/auth/auth-service';

let mockParams: {
  code?: string | string[];
  sb_flow_id?: string | string[];
  error?: string;
  error_code?: string;
  message?: string | string[];
} = {};
const emailChangeMessage =
  'Confirmation link accepted. Please proceed to confirm link sent to the other email';
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (path: string) => mockReplace(path) },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/auth/auth-service', () => ({
  ...jest.requireActual<typeof import('@/features/auth/auth-service')>(
    '@/features/auth/auth-service',
  ),
  exchangeAuthCode: jest.fn(),
}));
const exchange = jest.mocked(exchangeAuthCode);
beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  exchange.mockReset();
  mockParams = {};
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('rejects a missing or ambiguous code without any session exchange', async () => {
  mockParams = { code: ['one', 'two'] };
  await render(<AuthCallbackScreen />);
  expect(screen.getByText('Unable to open this link')).toBeTruthy();
  expect(exchange).not.toHaveBeenCalled();
});
test('exchanges the native flow id and replaces the URL after success', async () => {
  mockParams = { code: 'test-code', sb_flow_id: 'native-test-flow-id' };
  exchange.mockResolvedValue(undefined);
  await render(<AuthCallbackScreen />);
  expect(exchange).toHaveBeenCalledWith('test-code', 'native-test-flow-id');
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/confirmed'));
});
test('recovery callbacks return to the SDK-controlled password recovery flow', async () => {
  mockParams = { code: 'recovery-code' };
  exchange.mockResolvedValue(undefined);
  await render(<AuthCallbackScreen recovery />);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  expect(mockReplace).not.toHaveBeenCalledWith('/auth/confirmed');
});
test('expired links never navigate or expose the provider response', async () => {
  mockParams = { code: 'expired-code' };
  exchange.mockRejectedValue(new Error('private provider response'));
  await render(<AuthCallbackScreen />);
  expect(await screen.findByText('Unable to open this link')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.queryByText('private provider response')).toBeNull();
});

test('missing local PKCE storage explains the original-browser requirement without requesting extra emails', async () => {
  mockParams = { code: 'missing-local-verifier' };
  exchange.mockRejectedValue({
    code: 'pkce_code_verifier_not_found',
    message: 'private diagnostic',
  });
  await render(<AuthCallbackScreen />);
  expect(await screen.findByText(/Open this address in the same browser profile/)).toBeTruthy();
  expect(screen.queryByText('private diagnostic')).toBeNull();
  expect(console.warn).toHaveBeenCalledWith(
    'Auth confirmation could not finish:',
    expect.stringContaining('same browser profile'),
  );
  expect(mockReplace).not.toHaveBeenCalled();
});

test('server expiry and mismatched verifier errors are distinguished safely', async () => {
  mockParams = { error_code: 'otp_expired' };
  const view = await render(<AuthCallbackScreen />);
  expect(screen.getByText('This link has expired or was already used.')).toBeTruthy();
  expect(screen.getByText(/try signing in. Your email may have/)).toBeTruthy();
  expect(screen.queryByText('Email confirmed')).toBeNull();
  expect(exchange).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  mockParams = { code: 'mismatched-verifier' };
  exchange.mockRejectedValue({ code: 'bad_code_verifier' });
  await view.rerender(<AuthCallbackScreen />);
  expect(
    await screen.findByText(/This link belongs to a different confirmation request/),
  ).toBeTruthy();
});

test('expired recovery does not suggest that a password reset succeeded', async () => {
  mockParams = { error_code: 'otp_expired' };
  await render(<AuthCallbackScreen recovery />);
  expect(screen.getByText('Unable to open this link')).toBeTruthy();
  expect(screen.queryByText(/Your email may have/)).toBeNull();
  expect(screen.getByText('Return to sign in and request a new password reset link.')).toBeTruthy();
  expect(exchange).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('first email-change confirmation explains the other inbox without exchanging a session', async () => {
  mockParams = { message: emailChangeMessage };
  await render(<AuthCallbackScreen />);
  expect(screen.getByText('Check your other inbox')).toBeTruthy();
  expect(screen.queryByText('Unable to open this link')).toBeNull();
  expect(screen.queryByText('Email confirmed')).toBeNull();
  expect(exchange).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Return to app' }));
  expect(mockReplace).toHaveBeenCalledWith('/');
});

test.each([
  { message: [emailChangeMessage, emailChangeMessage] },
  { message: emailChangeMessage, error: 'access_denied' },
  { message: emailChangeMessage, error_code: 'otp_expired' },
  { message: emailChangeMessage, code: ['one', 'two'] },
  { message: emailChangeMessage, code: '' },
  { message: 'Untrusted provider text' },
])('malformed/error callbacks cannot impersonate the pending email state: %j', async (params) => {
  mockParams = params;
  await render(<AuthCallbackScreen />);
  expect(screen.getByText('Unable to open this link')).toBeTruthy();
  expect(screen.queryByText('Check your other inbox')).toBeNull();
  expect(screen.queryByText('Untrusted provider text')).toBeNull();
  expect(exchange).not.toHaveBeenCalled();
});

test('an email-change message cannot enable recovery or replace a valid code exchange', async () => {
  mockParams = { message: emailChangeMessage };
  const view = await render(<AuthCallbackScreen recovery />);
  expect(screen.getByText('Unable to open this link')).toBeTruthy();
  expect(exchange).not.toHaveBeenCalled();
  mockParams = { message: emailChangeMessage, code: 'final-email-change-code' };
  exchange.mockResolvedValue(undefined);
  await view.rerender(<AuthCallbackScreen />);
  await waitFor(() => expect(exchange).toHaveBeenCalledWith('final-email-change-code', undefined));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/auth/confirmed'));
});
