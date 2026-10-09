export function readSupabaseConfiguration(url: string | undefined, key: string | undefined) {
  const projectUrl = url?.trim();
  const publishableKey = key?.trim();

  if (!projectUrl || !publishableKey) {
    throw new Error(
      'Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env, then restart Expo.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(projectUrl);
  } catch {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL must be the HTTPS project API URL.');
  }

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL must be the HTTPS project API origin, not a dashboard URL.',
    );
  }

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new Error(
      'Use a Supabase public publishable key; never use a secret or service-role key.',
    );
  }

  return { url: parsed.origin, publishableKey };
}
