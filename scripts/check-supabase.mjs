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
  // These tables are private. The anonymous public client must be denied even
  // when requesting zero rows; never read real profile/preference values here.
  for (const [table, column] of [
    ['profiles', 'id'],
    ['user_preferences', 'user_id'],
  ]) {
    const { error, status } = await client.from(table).select(column).limit(0);
    // PostgREST uses 401 for permission denial without a signed-in user and
    // 403 for authenticated denial. Require the database permission code too.
    if ((status !== 401 && status !== 403) || error?.code !== '42501') {
      throw new Error(`Supabase ${table} anonymous access probe failed (HTTP ${status}).`);
    }
    console.log(`PASS: Database API denied anonymous ${table} access as required.`);
  }
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
