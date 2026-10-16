import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { deleteAccount } from './handler.ts';

Deno.serve((request: Request) => {
  const url = Deno.env.get('SUPABASE_URL'),
    secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
    anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !secret || !anon)
    return new Response(JSON.stringify({ error: 'Account management unavailable.' }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  return deleteAccount(request, {
    admin: createClient(url, secret, options),
    passwordClient: createClient(url, anon, options),
  });
});
