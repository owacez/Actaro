import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { createHash, webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { digest } from 'expo-crypto';

import { installNativePkceCrypto } from '@/lib/supabase/pkce-crypto';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomValues: jest.fn((values: Uint32Array<ArrayBuffer>) =>
    jest
      .requireActual<typeof import('node:crypto')>('node:crypto')
      .webcrypto.getRandomValues(values),
  ),
  digest: jest.fn((algorithm: string, data: BufferSource) =>
    jest
      .requireActual<typeof import('node:crypto')>('node:crypto')
      .webcrypto.subtle.digest(
        algorithm,
        new Uint8Array(
          ArrayBuffer.isView(data)
            ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
            : new Uint8Array(data),
        ),
      ),
  ),
}));

const originalCrypto = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
const originalEncoder = Object.getOwnPropertyDescriptor(globalThis, 'TextEncoder');
beforeEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
  Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
  jest.replaceProperty(Platform, 'OS', 'ios');
});
afterEach(() => {
  jest.restoreAllMocks();
  if (originalCrypto) Object.defineProperty(globalThis, 'crypto', originalCrypto);
  else Reflect.deleteProperty(globalThis, 'crypto');
  if (originalEncoder) Object.defineProperty(globalThis, 'TextEncoder', originalEncoder);
  else Reflect.deleteProperty(globalThis, 'TextEncoder');
});

test('native SDK signup sends S256 derived from its stored verifier, without plain fallback', async () => {
  installNativePkceCrypto();
  const storage = new Map<string, string>();
  const fetch = jest.fn<(input: unknown, init?: { body?: unknown }) => Promise<Response>>();
  fetch.mockResolvedValue(
    new Response(JSON.stringify({ user: null, session: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const client = createClient('https://pkce-test.supabase.co', 'test-public-key', {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => storage.get(key) ?? null,
        setItem: (key, value) => {
          storage.set(key, value);
        },
        removeItem: (key) => {
          storage.delete(key);
        },
      },
    },
    global: { fetch },
  });
  await client.auth.signUp({ email: 'test@example.invalid', password: 'test-password-only' });
  const verifier = JSON.parse(storage.get('sb-pkce-test-auth-token-code-verifier') ?? 'null');
  expect(typeof verifier).toBe('string');
  expect(verifier).toHaveLength(112);
  expect(fetch.mock.calls[0][1]?.body).toEqual(expect.any(String));
  const request = JSON.parse(String(fetch.mock.calls[0][1]?.body));
  expect(request.code_challenge_method).toBe('s256');
  expect(request.code_challenge).toBe(createHash('sha256').update(verifier).digest('base64url'));
  expect(request.code_challenge).not.toBe(verifier);
  expect(warn).not.toHaveBeenCalled();
});

test('SHA-256 matches the published PKCE vector and rejects unsupported algorithms', async () => {
  // RFC 7636 Appendix B: https://www.rfc-editor.org/rfc/rfc7636#appendix-B
  installNativePkceCrypto();
  const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  expect(Buffer.from(result).toString('base64url')).toBe(
    'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
  );
  await expect(crypto.subtle.digest('SHA-1', new Uint8Array())).rejects.toThrow(
    'Unsupported PKCE digest',
  );
});

test('native digest failure stops signup instead of sending a plain challenge', async () => {
  installNativePkceCrypto();
  jest.mocked(digest).mockRejectedValueOnce(new Error('Native crypto unavailable'));
  const fetch = jest.fn<(input: unknown) => Promise<Response>>();
  const client = createClient('https://pkce-failure.supabase.co', 'test-public-key', {
    auth: {
      flowType: 'pkce',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch },
  });
  await expect(
    client.auth.signUp({
      email: 'test@example.invalid',
      password: 'test-password-only',
    }),
  ).rejects.toThrow('Native crypto unavailable');
  expect(fetch).not.toHaveBeenCalled();
});

test('web remains unchanged and existing complete native crypto is preserved', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  installNativePkceCrypto();
  expect(globalThis.crypto).toBeUndefined();
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  jest.replaceProperty(Platform, 'OS', 'android');
  installNativePkceCrypto();
  expect(globalThis.crypto).toBe(webcrypto);
});
