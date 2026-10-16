import type { SupabaseClient } from '@supabase/supabase-js';

type Clients = { admin: SupabaseClient; passwordClient: SupabaseClient };
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store',
};
const reply = (status: number, body: object) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

// The deployment wrapper supplies server-only clients. No caller-supplied account ID is accepted.
export async function deleteAccount(request: Request, clients: Clients) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST') return reply(405, { error: 'Use POST.' });
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return reply(401, { error: 'Sign in again.' });
  try {
    const text = await request.text();
    if (text.length > 4096) return reply(400, { error: 'Invalid request.' });
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return reply(400, { error: 'Invalid request.' });
    }
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).some((key) => !['password', 'confirmation'].includes(key)) ||
      !('password' in body) ||
      typeof body.password !== 'string' ||
      !body.password ||
      body.password.length > 256 ||
      !('confirmation' in body) ||
      body.confirmation !== 'DELETE'
    )
      return reply(400, { error: 'Enter your password and type DELETE.' });
    const token = authorization.slice(7),
      { admin, passwordClient } = clients;
    const authenticated = await admin.auth.getUser(token);
    const user = authenticated.data.user;
    if (authenticated.error || !user?.email) return reply(401, { error: 'Sign in again.' });
    const verified = await passwordClient.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });
    if (verified.error || verified.data.user?.id !== user.id || !verified.data.session)
      return reply(403, { error: 'Password verification failed.' });
    // Revoke refresh sessions before the hard delete. Deleted profile FKs prevent old JWTs from recreating data.
    const revoked = await admin.auth.admin.signOut(verified.data.session.access_token, 'global');
    if (revoked.error)
      return reply(503, { error: 'Deletion was not confirmed. Sign in again to retry.' });
    const deleted = await admin.auth.admin.deleteUser(user.id, false);
    if (deleted.error)
      return reply(503, { error: 'Deletion was not confirmed. Sign in again to retry.' });
    return reply(200, { deleted: true });
  } catch {
    return reply(503, { error: 'Deletion was not confirmed. Check your account before retrying.' });
  }
}
