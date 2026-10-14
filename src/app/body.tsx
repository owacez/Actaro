import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { BodyScreen } from '@/features/body/body-screen';
export default function BodyRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <BodyScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.dismissTo('/(tabs)/more')}
    />
  );
}
