import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { ProgressScreen } from '@/features/progress/progress-screen';

export default function ProgressRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <ProgressScreen
      key={session.user.id}
      userId={session.user.id}
      onLog={() => router.push('/body')}
      onNutrition={() => router.push('/(tabs)/nutrition')}
      onWorkouts={() => router.push('/workouts/history')}
      onActivity={() => router.push('/activity')}
      onHabits={() => router.push('/habits')}
    />
  );
}
