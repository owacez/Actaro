import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { AuthFrame, AuthLoading } from '@/features/auth/auth-components';
import { onboardingService } from './onboarding-service';

// Sends a new account to setup once; any failure falls through to Today so the app is
// never blocked by this check.
export function SetupRedirect({ userId }: { userId: string }) {
  const [target, setTarget] = useState<'/welcome' | '/today' | null>(null);
  useEffect(() => {
    let active = true;
    onboardingService
      .needed(userId)
      .then((needed) => active && setTarget(needed ? '/welcome' : '/today'))
      .catch(() => active && setTarget('/today'));
    return () => {
      active = false;
    };
  }, [userId]);
  if (!target)
    return (
      <AuthFrame>
        <AuthLoading>Opening Actaro…</AuthLoading>
      </AuthFrame>
    );
  return <Redirect href={target} />;
}
