import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { RecoveryScreen } from '@/features/workouts/recovery-screen';
export default function RecoveryRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <RecoveryScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/workouts/training')}
    />
  );
}
