import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { DetailScreen } from '@/features/exercises/detail-screen';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { AuthFrame, AuthNotice, BackLink } from '@/features/auth/auth-components';

export default function ExerciseRoute() {
  const { session, recovery } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (!validExerciseId(id))
    return (
      <AuthFrame>
        <AuthNotice error>Exercise unavailable.</AuthNotice>
        <BackLink label="Exercise Library" onPress={() => router.replace('/fitness')} />
      </AuthFrame>
    );
  return (
    <DetailScreen
      key={`${session.user.id}-${id}`}
      id={id}
      onLogExercise={(exerciseId) =>
        router.push({ pathname: '/workouts/start', params: { exerciseId } })
      }
      onAddToWorkout={(exerciseId) =>
        router.push({ pathname: '/workouts', params: { exerciseId } })
      }
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/fitness'))}
    />
  );
}
