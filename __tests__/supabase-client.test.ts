import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  })),
}));

const originalUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const originalKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

describe('Supabase client lifecycle', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test_configuration_only';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalKey;
  });

  test.each(['ios', 'android'] as const)(
    'creates one persistent %s client and cleans up refresh',
    (platform) => {
      // Use the same RN module instance as the client after resetModules.
      const native = jest.requireActual<typeof import('react-native')>('react-native');
      jest.replaceProperty(native.Platform, 'OS', platform);
      native.AppState.currentState = 'active';
      const remove = jest.fn();
      const listen = jest.spyOn(native.AppState, 'addEventListener').mockReturnValue({ remove });
      const { getSupabase, startSupabaseSessionRefresh } = jest.requireActual<
        typeof import('../src/lib/supabase/client')
      >('../src/lib/supabase/client');
      const { createClient } =
        jest.requireMock<typeof import('@supabase/supabase-js')>('@supabase/supabase-js');
      const storage = jest.requireMock<
        (typeof import('@react-native-async-storage/async-storage'))['default']
      >('@react-native-async-storage/async-storage');

      const client = getSupabase();
      const cleanup = startSupabaseSessionRefresh();
      expect(getSupabase()).toBe(client);
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(createClient).toHaveBeenCalledWith(
        'https://example-project.supabase.co',
        'sb_publishable_test_configuration_only',
        {
          auth: {
            storage,
            flowType: 'pkce',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        },
      );
      expect(client.auth.startAutoRefresh).toHaveBeenCalledTimes(1);
      const onChange = listen.mock.calls[0][1];
      onChange('background');
      expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
      onChange('active');
      expect(client.auth.startAutoRefresh).toHaveBeenCalledTimes(2);
      cleanup?.();
      expect(remove).toHaveBeenCalledTimes(1);
      expect(client.auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
    },
  );

  test('uses browser storage behavior without registering native lifecycle events', () => {
    const native = jest.requireActual<typeof import('react-native')>('react-native');
    jest.replaceProperty(native.Platform, 'OS', 'web');
    const listen = jest.spyOn(native.AppState, 'addEventListener');
    const { startSupabaseSessionRefresh } = jest.requireActual<
      typeof import('../src/lib/supabase/client')
    >('../src/lib/supabase/client');
    const { createClient } =
      jest.requireMock<typeof import('@supabase/supabase-js')>('@supabase/supabase-js');

    expect(startSupabaseSessionRefresh()).toBeUndefined();
    expect(listen).not.toHaveBeenCalled();
    expect(createClient).toHaveBeenCalledWith(expect.any(String), expect.any(String), {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  });
});
