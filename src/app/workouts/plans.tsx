import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { PlansScreen } from '@/features/workouts/plans-screen';
export default function PlansRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <PlansScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/workouts')}
      onAdopted={(id) => router.replace({ pathname: '/workouts/splits', params: { id } })}
    />
  );
}
