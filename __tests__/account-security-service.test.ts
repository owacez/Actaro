import { beforeEach, expect, jest, test } from '@jest/globals';
import {
  accountSecurityError,
  accountSecurityService,
} from '@/features/profile/account-security-service';

const mockGetUser =
  jest.fn<() => Promise<{ data: { user: { id: string } | null }; error: Error | null }>>();
const mockUpdateUser =
  jest.fn<
    (
      attributes: unknown,
      options?: unknown,
    ) => Promise<{ data: { user: { email: string } }; error: unknown }>
  >();
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ auth: { getUser: mockGetUser, updateUser: mockUpdateUser } }),
}));
jest.mock('expo-linking', () => ({ createURL: (path: string) => `exp://test-host/--/${path}` }));
beforeEach(() => {
  jest.resetAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
  mockUpdateUser.mockResolvedValue({ data: { user: { email: 'old@example.com' } }, error: null });
});

test('normalizes email and uses the runtime callback; pending confirmation is not success', async () => {
  expect(await accountSecurityService.changeEmail(' NEW@Example.com ', 'user-a')).toEqual({
    confirmed: false,
  });
  expect(mockUpdateUser).toHaveBeenCalledWith(
    { email: 'new@example.com' },
    { emailRedirectTo: 'exp://test-host/--/auth/callback' },
  );
});
test('rejects invalid email and mismatched passwords before making authenticated requests', async () => {
  await expect(accountSecurityService.changeEmail('invalid', 'user-a')).rejects.toThrow(
    'Enter a valid email address.',
  );
  await expect(
    accountSecurityService.changePassword('password-a', 'password-b', 'user-a'),
  ).rejects.toThrow('Your passwords do not match.');
  expect(mockGetUser).not.toHaveBeenCalled();
  expect(mockUpdateUser).not.toHaveBeenCalled();
});
test('a stale account cannot update the current session', async () => {
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-b' } }, error: null });
  await expect(
    accountSecurityService.changePassword('new-password', 'new-password', 'user-a'),
  ).rejects.toThrow('Your account changed.');
  expect(mockUpdateUser).not.toHaveBeenCalled();
});
test('password update sends only the password and propagates a server rejection', async () => {
  const failure = { code: 'reauthentication_needed' };
  mockUpdateUser.mockResolvedValue({
    data: { user: { email: 'old@example.com' } },
    error: failure,
  });
  await expect(
    accountSecurityService.changePassword('new-password', 'new-password', 'user-a'),
  ).rejects.toEqual(failure);
  expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(accountSecurityError(failure)).toBe(
    'Sign out and sign in again, then retry this password change.',
  );
  expect(accountSecurityError(new Error('private data'))).not.toContain('private data');
});
