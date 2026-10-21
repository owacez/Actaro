import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { RunHistoryScreen } from '@/features/running/run-history-screen';
export default function RunHistoryRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <RunHistoryScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/(tabs)/fitness')}
      onOpen={(id) => router.push({ pathname: '/runs/[id]', params: { id } })}
    />
  );
}
