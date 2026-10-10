import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { AuthScreen } from '@/features/auth/auth-screen';

export default function IndexScreen() {
  const { session, recovery } = useAuth();
  if (session && recovery) return <AuthScreen key="recovery" recovery />;
  return session ? <Redirect href="/today" /> : <AuthScreen key="sign-in" />;
}
