import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { RunSessionScreen } from '@/features/running/run-screen';
export default function RunSessionRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <RunSessionScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/(tabs)/fitness')}
      onSaved={(id) => router.replace({ pathname: '/runs/[id]', params: { id } })}
    />
  );
}
