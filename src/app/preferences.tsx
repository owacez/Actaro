import { Redirect, router } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { PreferencesScreen } from '@/features/profile/preferences-screen';

export default function PreferencesRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <PreferencesScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/more')}
    />
  );
}
