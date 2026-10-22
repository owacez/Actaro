import { useAuth } from '@/features/auth/auth-provider';
import { AuthScreen } from '@/features/auth/auth-screen';
import { SetupRedirect } from '@/features/onboarding/setup-redirect';

export default function IndexScreen() {
  const { session, recovery } = useAuth();
  if (session && recovery) return <AuthScreen key="recovery" recovery />;
  return session ? (
    <SetupRedirect key={session.user.id} userId={session.user.id} />
  ) : (
    <AuthScreen key="sign-in" />
  );
}
