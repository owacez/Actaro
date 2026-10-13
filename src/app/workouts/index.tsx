import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { WorkoutsScreen } from '@/features/workouts/workouts-screen';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
export default function WorkoutsRoute() {
  const { session, recovery } = useAuth();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (exerciseId !== undefined && !validExerciseId(exerciseId))
    return (
      <AuthFrame>
        <AuthNotice error>Invalid exercise.</AuthNotice>
        <AuthLink title="Exercise Library" onPress={() => router.replace('/fitness')} />
      </AuthFrame>
    );
  function open(id?: string) {
    const target = {
      pathname: '/workouts/edit' as const,
      params: { ...(id ? { id } : {}), ...(exerciseId ? { exerciseId } : {}) },
    };
    if (exerciseId) router.replace(target);
    else router.push(target);
  }
  return (
    <WorkoutsScreen
      key={`${session.user.id}-${exerciseId ?? 'list'}`}
      userId={session.user.id}
      selecting={!!exerciseId}
      onBack={() => router.replace('/fitness')}
      onCreate={() => open()}
      onEdit={open}
      onSplits={() => router.push('/workouts/splits')}
      onPlans={() => router.push('/workouts/plans')}
      onStart={(id) => router.push({ pathname: '/workouts/start', params: { id } })}
      onResume={() => router.push('/workouts/session')}
      onHistory={() => router.push('/workouts/history')}
      onTraining={() => router.push('/workouts/training')}
    />
  );
}
