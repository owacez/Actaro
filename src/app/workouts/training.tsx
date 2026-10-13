import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { TrainingScreen } from '@/features/workouts/training-screen';
export default function TrainingRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <TrainingScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/workouts')}
      onRecovery={() => router.push('/workouts/recovery')}
    />
  );
}
