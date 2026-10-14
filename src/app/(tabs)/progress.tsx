import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { WeightProgressScreen } from '@/features/body/weight-progress-screen';

export default function ProgressRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <WeightProgressScreen
      key={session.user.id}
      userId={session.user.id}
      onLog={() => router.push('/body')}
    />
  );
}
