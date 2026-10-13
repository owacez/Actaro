import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { LibraryScreen } from '@/features/exercises/library-screen';

export default function FitnessRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <LibraryScreen
      key={session.user.id}
      userId={session.user.id}
      onOpen={(id) => router.push({ pathname: '/exercises/[id]', params: { id } })}
      onEquipment={() => router.push('/equipment')}
      onWorkouts={() => router.push('/workouts')}
      onAddToWorkout={(exerciseId) =>
        router.push({ pathname: '/workouts', params: { exerciseId } })
      }
    />
  );
}
