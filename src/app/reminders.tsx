import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { ReminderScreen } from '@/features/notifications/reminder-screen';
export default function ReminderRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <ReminderScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/preferences')}
    />
  );
}
