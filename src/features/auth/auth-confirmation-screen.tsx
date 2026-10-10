import { router } from 'expo-router';

import { AuthButton, AuthFrame, AuthNotice, AuthText } from './auth-components';
import { useAuth } from './auth-provider';

export function AuthConfirmationScreen() {
  const { session } = useAuth();
  // Supabase owns this field. A URL flag or user-editable metadata is not proof.
  const confirmed = !!session?.user.email_confirmed_at;
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">ACTARO</AuthText>
      <AuthText kind="heading">
        {confirmed ? 'Email confirmed' : 'Confirmation incomplete'}
      </AuthText>
      <AuthNotice>
        {confirmed
          ? 'Your email has been verified. You can continue to your account.'
          : 'Open the confirmation link in the same browser or app where you started. If you already verified your email, return to sign in.'}
      </AuthNotice>
      <AuthButton
        title={confirmed ? 'Continue to account' : 'Return to sign in'}
        onPress={() => router.replace('/')}
      />
    </AuthFrame>
  );
}
