import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { HabitsScreen } from '@/features/habits/habit-screens';
export default function HabitsRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <HabitsScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.dismissTo('/(tabs)/more')}
      onOpen={(view, id, date) =>
        router.push({
          pathname: '/habits/manage',
          params: { view, ...(id ? { id } : {}), ...(date ? { date } : {}) },
        })
      }
    />
  );
}
