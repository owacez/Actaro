import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { BuilderScreen } from '@/features/workouts/builder-screen';
export default function BuilderRoute() {
  const { session, recovery } = useAuth();
  const { id, exerciseId, returnTo } = useLocalSearchParams<{
    id?: string | string[];
    exerciseId?: string | string[];
    returnTo?: string | string[];
  }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (
    (id !== undefined && !validExerciseId(id)) ||
    (exerciseId !== undefined && !validExerciseId(exerciseId))
  )
    return (
      <AuthFrame>
        <AuthNotice error>Invalid workout or exercise.</AuthNotice>
        <AuthLink title="My workouts" onPress={() => router.replace('/workouts')} />
      </AuthFrame>
    );
  return (
    <BuilderScreen
      key={`${session.user.id}-${id ?? 'new'}-${exerciseId ?? 'none'}`}
      id={id}
      exerciseId={exerciseId}
      userId={session.user.id}
      onBack={() =>
        returnTo === 'split' && router.canGoBack()
          ? router.back()
          : router.replace({ pathname: '/workouts', params: exerciseId ? { exerciseId } : {} })
      }
      onSaved={() =>
        returnTo === 'split' && router.canGoBack() ? router.back() : router.replace('/workouts')
      }
      onEquipment={() => router.push('/equipment')}
    />
  );
}
