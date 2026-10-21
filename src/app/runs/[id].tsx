import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { RunDetailScreen } from '@/features/running/run-history-screen';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
export default function RunDetailRoute() {
  const { session, recovery } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (typeof id !== 'string' || !validExerciseId(id))
    return (
      <AuthFrame>
        <AuthNotice error>Run not found.</AuthNotice>
        <AuthLink title="Run history" onPress={() => router.replace('/runs')} />
      </AuthFrame>
    );
  return (
    <RunDetailScreen
      key={`${session.user.id}:${id}`}
      userId={session.user.id}
      id={id}
      onBack={() => router.replace('/runs')}
    />
  );
}
