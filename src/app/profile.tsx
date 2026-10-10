import { Redirect, router } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { ProfileScreen } from '@/features/profile/profile-screen';

export default function ProfileRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <ProfileScreen
      key={session.user.id}
      userId={session.user.id}
      email={session.user.email}
      onBack={() => router.replace('/more')}
    />
  );
}
