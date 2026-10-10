import { beforeEach, expect, jest, test } from '@jest/globals';

import { authService, exchangeAuthCode } from '@/features/auth/auth-service';

const mockSignIn = jest.fn<(...args: unknown[]) => Promise<{ error: null }>>();
const mockReset = jest.fn<(...args: unknown[]) => Promise<{ error: null }>>();
const mockSignOut = jest.fn<(...args: unknown[]) => Promise<{ error: null }>>();
const mockSignUp =
  jest.fn<(...args: unknown[]) => Promise<{ data: { session: unknown }; error: null }>>();
const mockResend = jest.fn<(...args: unknown[]) => Promise<{ error: null }>>();
const mockUpdate = jest.fn<(...args: unknown[]) => Promise<{ error: null }>>();
const mockExchange = jest.fn<(...args: unknown[]) => Promise<{ error: unknown }>>();
jest.mock('expo-linking', () => ({ createURL: (path: string) => `actaro://${path}` }));
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      resetPasswordForEmail: mockReset,
      signOut: mockSignOut,
      signUp: mockSignUp,
      resend: mockResend,
      updateUser: mockUpdate,
      exchangeCodeForSession: mockExchange,
    },
  }),
}));

beforeEach(() => {
  mockSignIn.mockResolvedValue({ error: null });
  mockReset.mockResolvedValue({ error: null });
  mockSignOut.mockResolvedValue({ error: null });
  mockExchange.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ data: { session: null }, error: null });
  mockResend.mockResolvedValue({ error: null });
  mockUpdate.mockResolvedValue({ error: null });
});

test('signup waits for confirmation and resends to the same app callback', async () => {
  await expect(authService.signUp('Tester@Example.com', 'test-password')).resolves.toEqual({
    needsConfirmation: true,
  });
  expect(mockSignUp).toHaveBeenCalledWith({
    email: 'tester@example.com',
    password: 'test-password',
    options: { emailRedirectTo: 'actaro://auth/callback' },
  });
  await authService.resendConfirmation('Tester@Example.com');
  expect(mockResend).toHaveBeenCalledWith({
    type: 'signup',
    email: 'tester@example.com',
    options: { emailRedirectTo: 'actaro://auth/callback' },
  });
});

test('updates the authenticated password without normalizing its contents', async () => {
  await authService.updatePassword(' replacement-password ');
  expect(mockUpdate).toHaveBeenCalledWith({ password: ' replacement-password ' });
});

test('normalizes email while preserving the exact password', async () => {
  await authService.signIn('  Tester@Example.com ', ' password-with-spaces ');
  expect(mockSignIn).toHaveBeenCalledWith({
    email: 'tester@example.com',
    password: ' password-with-spaces ',
  });
});
test('requests recovery at the app callback URL and signs out this device', async () => {
  await authService.requestReset('Tester@Example.com');
  expect(mockReset).toHaveBeenCalledWith('tester@example.com', {
    redirectTo: 'actaro://auth/recovery',
  });
  await authService.signOut();
  expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
});
test('deduplicates a one-use callback and forwards its native PKCE flow id', async () => {
  const first = exchangeAuthCode('test-single-use-code', 'test-flow-id');
  const replay = exchangeAuthCode('test-single-use-code', 'test-flow-id');
  expect(first).toBe(replay);
  await first;
  expect(mockExchange).toHaveBeenCalledTimes(1);
  expect(mockExchange).toHaveBeenCalledWith('test-single-use-code', { flowId: 'test-flow-id' });
});
test('does not exchange an empty callback and propagates an exchange failure', async () => {
  await expect(exchangeAuthCode('')).rejects.toThrow('Invalid callback');
  expect(mockExchange).not.toHaveBeenCalled();
  const error = { code: 'flow_state_expired' };
  mockExchange.mockResolvedValue({ error });
  await expect(exchangeAuthCode('expired-test-code')).rejects.toBe(error);
});
