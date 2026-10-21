import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User, AuthError } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  deleteOwnAccount,
  exportAccount,
  exportTables,
} from '@/features/profile/account-data-service';
import { sessionStore } from '@/features/workouts/session-store';
const user: User = {
  id: '09000000-0000-4000-8000-000000000001',
  email: 'fixture@example.invalid',
  created_at: '2026-10-01',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
};
// DOM, React Native and Node can add different overloads to global fetch.
// Accept every input shape, as in the other Supabase request-mock tests.
const mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<Response>>();
const makeClient = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof makeClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
jest.mock('@/features/workouts/session-store', () => ({ sessionStore: { read: jest.fn() } }));
jest.mock('@/features/running/run-store', () => ({ runStore: { read: async () => null } }));
beforeEach(() => {
  mockClient = makeClient();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
  jest.spyOn(mockClient.auth, 'getSession').mockResolvedValue({
    data: {
      session: {
        user,
        access_token: 'fixture-token',
        refresh_token: 'fixture-refresh',
        expires_in: 3600,
        token_type: 'bearer',
      },
    },
    error: null,
  });
  jest.mocked(sessionStore.read).mockResolvedValue(null);
  mockFetch.mockImplementation(
    async () =>
      new Response('[]', {
        headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
      }),
  );
});
test('export covers all 29 owned tables with deterministic ordering, owner filters and no auth secrets', async () => {
  const result = await exportAccount(user.id);
  expect(Object.keys(result.records)).toHaveLength(29);
  expect(Object.keys(result.records).sort()).toEqual(Object.keys(exportTables).sort());
  for (const [input] of mockFetch.mock.calls) {
    const url = new URL(String(input));
    expect(url.searchParams.get(url.pathname.endsWith('/profiles') ? 'id' : 'user_id')).toBe(
      'eq.' + user.id,
    );
    expect(url.searchParams.get('order')).toBeTruthy();
  }
  expect(result.account).toEqual({ id: user.id, email: user.email, createdAt: user.created_at });
  expect(JSON.stringify(result)).not.toMatch(/access_token|refresh_token|publishable|password/);
});
test('export refuses account changes and incomplete pages instead of delivering a partial archive', async () => {
  jest
    .mocked(mockClient.auth.getUser)
    .mockResolvedValueOnce({ data: { user: null }, error: new AuthError('invalid', 401) });
  await expect(exportAccount(user.id)).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
  mockFetch.mockImplementation(
    async () =>
      new Response('[]', {
        headers: { 'Content-Type': 'application/json', 'Content-Range': '*/2' },
      }),
  );
  await expect(exportAccount(user.id)).rejects.toThrow('incomplete');
});
test('deletion requires deliberate confirmation and never sends an account ID or accepts an unacknowledged response', async () => {
  mockFetch.mockImplementation(
    async () =>
      new Response('{"deleted":true}', { headers: { 'Content-Type': 'application/json' } }),
  );
  await expect(deleteOwnAccount(user.id, 'password', 'delete')).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
  await deleteOwnAccount(user.id, 'password', 'DELETE');
  expect(String(mockFetch.mock.calls[0][0])).toContain('/functions/v1/delete-account');
  const options = mockFetch.mock.calls[0][1];
  if (
    !options ||
    typeof options !== 'object' ||
    !('headers' in options) ||
    !(options.headers instanceof Headers)
  )
    throw new Error('Expected fetch options with Headers.');
  expect(options).toMatchObject({
    body: JSON.stringify({ password: 'password', confirmation: 'DELETE' }),
  });
  expect(options.headers.get('authorization')).toBe('Bearer fixture-token');
  mockFetch.mockImplementationOnce(
    async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }),
  );
  await expect(deleteOwnAccount(user.id, 'password', 'DELETE')).rejects.toThrow('not confirmed');
});
