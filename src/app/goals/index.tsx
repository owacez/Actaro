import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { GoalsScreen } from '@/features/goals/goal-screens';
export default function GoalsRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <GoalsScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.dismissTo('/(tabs)/more')}
      onEdit={(id) => router.push({ pathname: '/goals/manage', params: { ...(id ? { id } : {}) } })}
    />
  );
}
