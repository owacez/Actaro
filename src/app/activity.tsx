import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { ActivityScreen } from '@/features/activity/activity-screen';
export default function ActivityRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <ActivityScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.dismissTo('/(tabs)/more')}
    />
  );
}
