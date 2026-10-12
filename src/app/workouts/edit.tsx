import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { AuthFrame, AuthLink, AuthNotice } from '@/features/auth/auth-components';
import { validExerciseId } from '@/features/exercises/exercise-service';
import { BuilderScreen } from '@/features/workouts/builder-screen';
export default function BuilderRoute() {
  const { session, recovery } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  if (!session || recovery) return <Redirect href="/" />;
  if (id !== undefined && !validExerciseId(id))
    return (
      <AuthFrame>
        <AuthNotice error>Invalid workout.</AuthNotice>
        <AuthLink title="My workouts" onPress={() => router.replace('/workouts')} />
      </AuthFrame>
    );
  return (
    <BuilderScreen
      key={`${session.user.id}-${id ?? 'new'}`}
      id={id}
      userId={session.user.id}
      onBack={() => router.replace('/workouts')}
      onSaved={() => router.replace('/workouts')}
      onEquipment={() => router.push('/equipment')}
    />
  );
}
