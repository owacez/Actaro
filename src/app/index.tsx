import { useAuth } from '@/features/auth/auth-provider';
import { AccountScreen, AuthScreen } from '@/features/auth/auth-screen';

export default function IndexScreen() {
  const { session, recovery } = useAuth();
  if (session && recovery) return <AuthScreen key="recovery" recovery />;
  return session ? <AccountScreen /> : <AuthScreen key="sign-in" />;
}
