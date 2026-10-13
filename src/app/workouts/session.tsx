import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { SessionScreen } from '@/features/workouts/session-screen';
export default function SessionRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <SessionScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/workouts')}
    />
  );
}
