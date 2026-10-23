import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthFrame, AuthNotice, AuthLink } from '@/features/auth/auth-components';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { HistoryScreen } from '@/features/workouts/history-screen';
export default function HistoryRoute() {
  const { session, recovery } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (id !== undefined && !validExerciseId(id))
    return (
      <AuthFrame>
        <AuthNotice error>Invalid recorded workout.</AuthNotice>
        <AuthLink title="Workout history" onPress={() => router.replace('/workouts/history')} />
      </AuthFrame>
    );
  return (
    <HistoryScreen
      key={`${session.user.id}-${id ?? 'list'}`}
      userId={session.user.id}
      id={id}
      onBack={() => router.replace(id ? '/workouts/history' : '/workouts')}
      onOpen={(recordId) =>
        router.push({ pathname: '/workouts/history', params: { id: recordId } })
      }
    />
  );
}
