import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { readSupabaseConfiguration } from './config';
import type { Database } from './database.types';

function createSupabaseClient() {
  // Expo inlines public variables only when accessed with static dot notation.
  const config = readSupabaseConfiguration(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  return createClient<Database>(config.url, config.publishableKey, {
    auth: {
      flowType: 'pkce',
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let client: ReturnType<typeof createSupabaseClient> | undefined;

export function getSupabase() {
  client ??= createSupabaseClient();
  return client;
}

// Called by the root layout's effect; avoids native storage during web export.
export function startSupabaseSessionRefresh() {
  const supabase = getSupabase();
  if (Platform.OS === 'web') return;

  function refreshForState(state: AppStateStatus) {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  }

  refreshForState(AppState.currentState);
  const subscription = AppState.addEventListener('change', refreshForState);

  return () => {
    subscription.remove();
    void supabase.auth.stopAutoRefresh();
  };
}
