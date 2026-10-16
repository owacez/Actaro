import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { AccountDataScreen } from '@/features/profile/account-data-screen';
export default function PrivacyRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <AccountDataScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => router.replace('/profile')}
    />
  );
}
