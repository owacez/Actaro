import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { GoalEditor } from '@/features/goals/goal-screens';
export default function GoalManageRoute() {
  const { session, recovery } = useAuth(),
    { id } = useLocalSearchParams<{ id?: string }>();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <GoalEditor
      key={session.user.id + ':' + id}
      userId={session.user.id}
      goalId={typeof id === 'string' ? id : undefined}
      onBack={() => router.dismissTo('/goals')}
    />
  );
}
