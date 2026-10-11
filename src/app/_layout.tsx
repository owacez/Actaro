import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthButton, AuthFrame, AuthNotice } from '@/features/auth/auth-components';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { AuthFeedbackProvider } from '@/features/auth/auth-feedback';
import { AppThemeProvider } from '@/features/profile/theme-provider';
import { useAppTheme } from '@/features/profile/theme-context';

void SplashScreen.preventAutoHideAsync();

function AuthRoutes() {
  const { session, initializing, error, retry, recovery } = useAuth();
  const { colors } = useAppTheme();
  if (initializing)
    return (
      <AuthFrame>
        <AuthNotice>Restoring your session…</AuthNotice>
      </AuthFrame>
    );
  if (error)
    return (
      <AuthFrame>
        <AuthNotice error>{error}</AuthNotice>
        <AuthButton title="Retry" onPress={retry} />
      </AuthFrame>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="auth/confirmed" />
      <Stack.Screen name="auth/recovery" />
      <Stack.Protected guard={!!session && !recovery}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="preferences" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="explore" />
      </Stack.Protected>
    </Stack>
  );
}

function AccountTheme() {
  const { session, recovery } = useAuth();
  return (
    <AppThemeProvider userId={recovery ? undefined : session?.user.id}>
      <AuthFeedbackProvider>
        <AuthRoutes />
      </AuthFeedbackProvider>
    </AppThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (error)
    return (
      <AuthFrame>
        <AuthNotice error>Unable to load the app fonts. Please restart the app.</AuthNotice>
      </AuthFrame>
    );
  if (!loaded) return null;
  return (
    <AuthProvider>
      <AccountTheme />
    </AuthProvider>
  );
}
