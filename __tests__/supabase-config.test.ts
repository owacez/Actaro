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
});
