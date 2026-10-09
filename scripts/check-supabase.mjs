import { createClient } from '@supabase/supabase-js';

import { readSupabaseConfiguration } from '../src/lib/supabase/config.ts';

// Read-only checks. Do not log keys, response bodies, sessions or user data.
try {
  const config = readSupabaseConfiguration(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  for (const endpoint of ['/auth/v1/settings']) {
    const response = await fetch(`${config.url}${endpoint}`, {
      headers: { apikey: config.publishableKey },
      signal: AbortSignal.timeout(15000),
    });
    await response.body?.cancel();
    if (!response.ok) {
      throw new Error(`Supabase ${endpoint} returned HTTP ${response.status}.`);
    }
    console.log(`PASS: Supabase ${endpoint} accepted the public configuration.`);
  }
  const client = createClient(config.url, config.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) }),
    },
  });
  // A missing foundation table is expected in a newly created project.
  // limit(0) also prevents reading user rows once that table exists.
  const { error, status } = await client.from('profiles').select('id').limit(0);
  if (error && !(status === 404 && error.code === 'PGRST205')) {
    throw new Error(`Supabase database probe returned HTTP ${status}.`);
  }
  console.log(
    error
      ? 'PASS: Database API accepted the SDK request; profiles has not been created yet.'
      : 'PASS: Database API accepted the SDK request without reading user rows.',
  );
  console.log('Read-only connection checks passed; no tables or users were created.');
} catch (error) {
  // Fetch errors may contain sensitive request details; report only known messages.
  if (error instanceof Error && !error.cause && error.name !== 'TimeoutError') {
    console.error(error.message);
  } else {
    console.error('Supabase connection failed. Check network access and project availability.');
  }
  process.exitCode = 1;
}
