import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';

export default function WelcomeRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <OnboardingScreen
      key={session.user.id}
      userId={session.user.id}
      onDone={() => router.replace('/today')}
    />
  );
}
