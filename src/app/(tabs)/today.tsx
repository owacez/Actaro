import { Redirect } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { TodayScreen } from '@/features/today/today-screen';

export default function TodayRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return <TodayScreen key={session.user.id} userId={session.user.id} />;
}
