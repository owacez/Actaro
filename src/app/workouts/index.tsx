import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { WorkoutsScreen } from '@/features/workouts/workouts-screen';
export default function WorkoutsRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <WorkoutsScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/fitness')}
      onCreate={() => router.push('/workouts/edit')}
      onEdit={(id) => router.push({ pathname: '/workouts/edit', params: { id } })}
    />
  );
}
