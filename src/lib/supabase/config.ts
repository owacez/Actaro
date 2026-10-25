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
    // Plain HTTP is only for a self-hosted backend on this computer or the local network.
    (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && privateHost(parsed))) ||
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

  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey) && !anonJwt(publishableKey)) {
    throw new Error(
      'Use a Supabase public publishable key; never use a secret or service-role key.',
    );
  }

  return { url: parsed.origin, publishableKey };
}

function privateHost(url: URL) {
  const host = url.hostname;
  return (
    host === 'localhost' ||
    /^127\.\d+\.\d+\.\d+$/.test(host) ||
    /^10\.\d+\.\d+\.\d+$/.test(host) ||
    /^192\.168\.\d+\.\d+$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host)
  );
}

// Self-hosted Supabase issues a classic anon JWT as its public key. Only a token whose own
// payload says role "anon" is accepted; service-role tokens stay rejected.
function anonJwt(key: string) {
  const parts = key.split('.');
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
    return (
      typeof payload === 'object' &&
      payload !== null &&
      'role' in payload &&
      payload.role === 'anon'
    );
  } catch {
    return false;
  }
}
