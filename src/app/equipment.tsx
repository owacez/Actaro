import { Redirect, router } from 'expo-router';
import { useAuth } from '@/features/auth/auth-provider';
import { EquipmentScreen } from '@/features/exercises/equipment-screen';

export default function EquipmentRoute() {
  const { session, recovery } = useAuth();
  if (!session || recovery) return <Redirect href="/" />;
  return (
    <EquipmentScreen
      key={session.user.id}
      userId={session.user.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/fitness'))}
    />
  );
}
