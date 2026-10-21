import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthButton, AuthFrame, AuthNotice, AuthLoading } from '@/features/auth/auth-components';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { AuthFeedbackProvider } from '@/features/auth/auth-feedback';
import { AppThemeProvider } from '@/features/profile/theme-provider';
import { useAppTheme } from '@/features/profile/theme-context';
import { ReminderCoordinator } from '@/features/notifications/reminder-coordinator';
import { StepProvider } from '@/features/activity/step-provider';
import { RunCoordinator } from '@/features/running/run-coordinator';
export { ScreenErrorBoundary as ErrorBoundary } from '@/components/screen-error-boundary';

void SplashScreen.preventAutoHideAsync();

function AuthRoutes() {
  const { session, initializing, error, retry, recovery } = useAuth();
  const { colors } = useAppTheme();
  if (initializing)
    return (
      <AuthFrame>
        <AuthLoading>Restoring your session…</AuthLoading>
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
        <Stack.Screen name="privacy" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="equipment" />
        <Stack.Screen name="exercises/[id]" />
        <Stack.Screen name="workouts/index" />
        <Stack.Screen name="workouts/edit" />
        <Stack.Screen name="workouts/splits" />
        <Stack.Screen name="workouts/plans" />
        <Stack.Screen name="workouts/start" />
        <Stack.Screen name="workouts/session" options={{ fullScreenGestureEnabled: false }} />
        <Stack.Screen name="workouts/history" />
        <Stack.Screen name="workouts/training" />
        <Stack.Screen name="workouts/recovery" />
        <Stack.Screen name="habits/index" />
        <Stack.Screen name="habits/manage" />
        <Stack.Screen name="goals/index" />
        <Stack.Screen name="goals/manage" />
        <Stack.Screen name="body" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="runs/index" />
        <Stack.Screen name="runs/session" options={{ fullScreenGestureEnabled: false }} />
        <Stack.Screen name="runs/[id]" />
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
        <RunCoordinator />
        <ReminderCoordinator userId={recovery ? undefined : session?.user.id} />
        <StepProvider
          key={session?.user.id ?? 'signed-out'}
          userId={recovery ? undefined : session?.user.id}
        >
          <AuthRoutes />
        </StepProvider>
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
