import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { MuscleExplorerScreen } from '@/features/muscles/muscle-explorer-screen';
export default function MusclesRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <MuscleExplorerScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/fitness'))}
      onOpen={(id) => router.push({ pathname: '/exercises/[id]', params: { id } })}
    />
  );
}
