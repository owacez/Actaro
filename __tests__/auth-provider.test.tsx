import { beforeEach, expect, jest, test } from '@jest/globals';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '@/features/auth/auth-provider';

type SessionResult = { data: { session: Session | null }; error: null };
let mockOnAuth: (event: AuthChangeEvent, session: Session | null) => void;
const mockRestore = jest.fn<() => Promise<SessionResult>>();
const mockUnsubscribe = jest.fn();
const mockStopRefresh = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({
    auth: {
      getSession: () => mockRestore(),
      onAuthStateChange: (callback: typeof mockOnAuth) => {
        mockOnAuth = callback;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  }),
  startSupabaseSessionRefresh: () => mockStopRefresh,
}));
const session: Session = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: {
    id: 'test-user',
    email: 'tester@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-10-09T00:00:00Z',
  },
};
beforeEach(() => {
  mockRestore.mockReset();
});

test('restores a session and cleans up its subscription and refresh listener', async () => {
  mockRestore.mockResolvedValue({ data: { session }, error: null });
  const { result, unmount } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.initializing).toBe(false));
  expect(result.current.session).toBe(session);
  await unmount();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  expect(mockStopRefresh).toHaveBeenCalledTimes(1);
});

test('a newer sign-in event wins over a late empty restoration result', async () => {
  let resolveRestore: (result: SessionResult) => void = () => {};
  mockRestore.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRestore = resolve;
      }),
  );
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await act(() => mockOnAuth('SIGNED_IN', session));
  await act(() => resolveRestore({ data: { session: null }, error: null }));
  expect(result.current.session).toBe(session);
});

test('recovery requires the SDK event and sign-out clears session and recovery', async () => {
  mockRestore.mockResolvedValue({ data: { session: null }, error: null });
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await act(() => mockOnAuth('PASSWORD_RECOVERY', session));
  expect(result.current.recovery).toBe(true);
  await act(() => mockOnAuth('SIGNED_OUT', null));
  expect(result.current.session).toBeNull();
  expect(result.current.recovery).toBe(false);
});

test('restoration failure offers a retry without logging tokens', async () => {
  mockRestore.mockRejectedValue(new Error('private provider response'));
  const { result } = await renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.error).toBeTruthy());
  expect(result.current.error).not.toContain('private provider response');
  mockRestore.mockResolvedValue({ data: { session }, error: null });
  await act(() => result.current.retry());
  await waitFor(() => expect(result.current.session).toBe(session));
  expect(result.current.error).toBeNull();
});
