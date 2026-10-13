import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { DiaryScreen } from '@/features/nutrition/diary-screen';

export default function NutritionRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <DiaryScreen
      key={session.user.id}
      userId={session.user.id}
      onOpen={(view, date, meal, id) =>
        router.push({
          pathname: '/nutrition/manage',
          params: { view, date, meal, ...(id ? { id } : {}) },
        })
      }
    />
  );
}
