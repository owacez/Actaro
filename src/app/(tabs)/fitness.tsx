import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Segments } from '@/components/product-ui';
import { PlansScreen } from '@/features/workouts/plans-screen';
import { WorkoutsScreen } from '@/features/workouts/workouts-screen';
import { useAuth } from '@/features/auth/auth-provider';
import { LibraryScreen } from '@/features/exercises/library-screen';

export default function FitnessRoute() {
  const { session, recovery } = useAuth();
  const [section, setSection] = useState<'workouts' | 'library' | 'plans'>('workouts');
  if (!session || recovery) return <Redirect href="/" />;
  const navigation = (
    <Segments
      value={section}
      onChange={setSection}
      options={[
        { value: 'workouts', label: 'Workouts' },
        { value: 'library', label: 'Library' },
        { value: 'plans', label: 'Plans' },
      ]}
    />
  );
  if (section === 'plans')
    return (
      <PlansScreen
        userId={session.user.id}
        navigation={navigation}
        onBack={() => setSection('workouts')}
        onAdopted={(id) => router.push({ pathname: '/workouts/splits', params: { id } })}
      />
    );
  if (section === 'workouts')
    return (
      <WorkoutsScreen
        userId={session.user.id}
        navigation={navigation}
        onBack={() => setSection('library')}
        onCreate={() => router.push('/workouts/edit')}
        onEdit={(id) => router.push({ pathname: '/workouts/edit', params: { id } })}
        onStart={(id) => router.push({ pathname: '/workouts/start', params: { id } })}
        onSplits={() => router.push('/workouts/splits')}
        onPlans={() => setSection('plans')}
        onResume={() => router.push('/workouts/session')}
        onHistory={() => router.push('/workouts/history')}
        onTraining={() => router.push('/workouts/training')}
      />
    );
  return (
    <LibraryScreen
      navigation={navigation}
      key={session.user.id}
      userId={session.user.id}
      onOpen={(id) => router.push({ pathname: '/exercises/[id]', params: { id } })}
      onEquipment={() => router.push('/equipment')}
      onWorkouts={() => router.push('/workouts')}
      onLogExercise={(exerciseId) =>
        router.push({ pathname: '/workouts/start', params: { exerciseId } })
      }
      onAddToWorkout={(exerciseId) =>
        router.push({ pathname: '/workouts', params: { exerciseId } })
      }
    />
  );
}
