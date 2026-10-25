import { describe, expect, test } from '@jest/globals';

import { readSupabaseConfiguration } from '../src/lib/supabase/config';

const publicKey = 'sb_publishable_test_configuration_only';
const apiUrl = 'https://example-project.supabase.co';

describe('Supabase public configuration', () => {
  test('normalizes whitespace and the trailing slash', () => {
    expect(readSupabaseConfiguration(` ${apiUrl}/ `, ` ${publicKey} `)).toEqual({
      url: apiUrl,
      publishableKey: publicKey,
    });
  });

  test.each([
    [undefined, publicKey],
    [apiUrl, undefined],
    ['', publicKey],
    [apiUrl, ' '],
  ])('rejects missing configuration (%s)', (url, key) => {
    expect(() => readSupabaseConfiguration(url, key)).toThrow('Set EXPO_PUBLIC_SUPABASE_URL');
  });

  test.each([
    'not-a-url',
    'http://example-project.supabase.co',
    'https://supabase.com/dashboard/project/example-project',
    'https://name:password@example-project.supabase.co',
    `${apiUrl}?token=private`,
    `${apiUrl}#private`,
  ])('rejects invalid API origins without echoing their values', (url) => {
    expect(() => readSupabaseConfiguration(url, publicKey)).toThrow(/HTTPS project API/);
    try {
      readSupabaseConfiguration(url, publicKey);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error && error.message).not.toContain(url);
    }
  });

  test.each(['sb_secret_never_embed_this', 'service-role-jwt', 'invalid'])(
    'rejects non-publishable keys without exposing them',
    (key) => {
      expect(() => readSupabaseConfiguration(apiUrl, key)).toThrow('public publishable key');
      try {
        readSupabaseConfiguration(apiUrl, key);
      } catch (error) {
        expect(error instanceof Error && error.message).not.toContain(key);
      }
    },
  );

  // Builds an unsigned JWT-shaped key; only its payload role is read by the check.
  const jwt = (role: string) =>
    [
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url'),
      'signature',
    ].join('.');

  test('accepts a self-hosted backend on this computer or local network with its anon key', () => {
    for (const url of [
      'http://localhost:8000',
      'http://192.168.18.73:8000',
      'http://10.0.0.5:8000',
      'http://172.20.1.2:8000',
    ])
      expect(readSupabaseConfiguration(url, jwt('anon'))).toEqual({
        url,
        publishableKey: jwt('anon'),
      });
    expect(readSupabaseConfiguration('https://supabase.example.org', jwt('anon')).url).toBe(
      'https://supabase.example.org',
    );
  });

  test('keeps public HTTP and service-role keys rejected', () => {
    for (const url of [
      'http://supabase.example.org',
      'http://8.8.8.8:8000',
      'http://172.32.0.1:8000',
    ])
      expect(() => readSupabaseConfiguration(url, publicKey)).toThrow(/HTTPS project API/);
    for (const key of [jwt('service_role'), jwt('authenticated'), 'a.b', 'not.a!.jwt'])
      expect(() => readSupabaseConfiguration('http://localhost:8000', key)).toThrow(
        'public publishable key',
      );
  });
});
