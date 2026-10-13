import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { AuthFrame, AuthNotice, AuthLink } from '@/features/auth/auth-components';
import { SplitsScreen } from '@/features/workouts/splits-screen';
export default function SplitsRoute() {
  const { session, recovery } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (id !== undefined && id !== 'new' && !validExerciseId(id))
    return (
      <AuthFrame>
        <AuthNotice error>Invalid split.</AuthNotice>
        <AuthLink title="Training splits" onPress={() => router.replace('/workouts/splits')} />
      </AuthFrame>
    );
  return (
    <SplitsScreen
      key={`${session.user.id}-${id ?? 'list'}`}
      userId={session.user.id}
      id={id}
      onBack={() => router.replace(id ? '/workouts/splits' : '/workouts')}
      onOpen={(splitId) => router.push({ pathname: '/workouts/splits', params: { id: splitId } })}
      onSaved={() => router.replace('/workouts/splits')}
      onCreateWorkout={() =>
        router.push({ pathname: '/workouts/edit', params: { returnTo: 'split' } })
      }
    />
  );
}
