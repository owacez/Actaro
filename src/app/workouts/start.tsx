import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { PrestartScreen } from '@/features/workouts/prestart-screen';
export default function StartRoute() {
  const { session, recovery } = useAuth();
  const { id, exerciseId } = useLocalSearchParams<{
    id?: string | string[];
    exerciseId?: string | string[];
  }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (
    !!id === !!exerciseId ||
    (id && !validExerciseId(id)) ||
    (exerciseId && !validExerciseId(exerciseId))
  )
    return (
      <AuthFrame>
        <AuthNotice error>Invalid workout selection.</AuthNotice>
        <AuthLink title="My workouts" onPress={() => router.replace('/workouts')} />
      </AuthFrame>
    );
  return (
    <PrestartScreen
      key={`${session.user.id}-${id ?? exerciseId}`}
      userId={session.user.id}
      templateId={validExerciseId(id) ? id : undefined}
      exerciseId={validExerciseId(exerciseId) ? exerciseId : undefined}
      onBack={() => router.replace('/workouts')}
      onSession={() => router.replace('/workouts/session')}
    />
  );
}
