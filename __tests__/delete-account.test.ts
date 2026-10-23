import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User, type Session, AuthError } from '@supabase/supabase-js';
import { deleteAccount } from '../supabase/functions/delete-account/handler';
const user: User = {
  id: '09000000-0000-4000-8000-000000000001',
  email: 'fixture@example.invalid',
  aud: 'authenticated',
  created_at: '2026-10-01',
  app_metadata: {},
  user_metadata: {},
};
const session: Session = {
  user,
  access_token: 'fixture-token',
  refresh_token: 'fixture-refresh',
  expires_in: 3600,
  token_type: 'bearer',
};
const clients = {
  admin: createClient('https://example.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  passwordClient: createClient('https://example.test', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
};
const getUser = jest.spyOn(clients.admin.auth, 'getUser'),
  signIn = jest.spyOn(clients.passwordClient.auth, 'signInWithPassword'),
  signOut = jest.spyOn(clients.admin.auth.admin, 'signOut'),
  remove = jest.spyOn(clients.admin.auth.admin, 'deleteUser');
const request = (
  body: unknown = { password: 'correct', confirmation: 'DELETE' },
  authorization = 'Bearer token',
) =>
  new Request('https://example.test/delete-account', {
    method: 'POST',
    headers: { Authorization: authorization },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  getUser.mockResolvedValue({ data: { user }, error: null });
  signIn.mockResolvedValue({ data: { user, session }, error: null });
  signOut.mockResolvedValue({ data: null, error: null });
  remove.mockResolvedValue({ data: { user }, error: null });
});
test('missing bearer, arbitrary owner IDs and malformed confirmation cannot reach privileged auth calls', async () => {
  expect((await deleteAccount(request({}, ''), clients)).status).toBe(401);
  expect(
    (
      await deleteAccount(
        request({ password: 'correct', confirmation: 'DELETE', userId: 'other' }),
        clients,
      )
    ).status,
  ).toBe(400);
  expect(
    (await deleteAccount(request({ password: 'correct', confirmation: 'delete' }), clients)).status,
  ).toBe(400);
  expect(getUser).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});
test('authoritative identity and password must match before revocation or deletion', async () => {
  getUser.mockResolvedValueOnce({ data: { user: null }, error: new AuthError('invalid', 401) });
  expect((await deleteAccount(request(), clients)).status).toBe(401);
  signIn.mockResolvedValueOnce({
    data: { user: null, session: null },
    error: new AuthError('invalid', 400),
  });
  expect((await deleteAccount(request(), clients)).status).toBe(403);
  expect(remove).not.toHaveBeenCalled();
  expect(signOut).not.toHaveBeenCalled();
});
test('revokes sessions before hard deletion of only the authenticated user; failures never return success', async () => {
  const response = await deleteAccount(request(), clients);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ deleted: true });
  expect(signIn).toHaveBeenCalledWith({ email: 'fixture@example.invalid', password: 'correct' });
  expect(signOut).toHaveBeenCalledWith(session.access_token, 'global');
  expect(remove).toHaveBeenCalledWith(user.id, false);
  expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(remove.mock.invocationCallOrder[0]);
  signOut.mockResolvedValueOnce({ data: null, error: new AuthError('unavailable', 503) });
  expect((await deleteAccount(request(), clients)).status).toBe(503);
  expect(remove).toHaveBeenCalledTimes(1);
});
