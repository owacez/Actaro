import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton, AuthFrame, AuthNotice, AuthText } from './auth-components';
import { exchangeAuthCode } from './auth-service';

export function AuthCallbackScreen({ recovery = false }: { recovery?: boolean }) {
  const { code, error, error_code, sb_flow_id, message } = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    sb_flow_id?: string | string[];
    message?: string | string[];
  }>();
  const [failedCode, setFailedCode] = useState<string | null>(null);
  // The first secure email-change link has no session code. This is an
  // instruction state only; URL text never authorizes or completes an update.
  const pendingEmailChange =
    !recovery &&
    code === undefined &&
    !error &&
    !error_code &&
    !Array.isArray(sb_flow_id) &&
    message ===
      'Confirmation link accepted. Please proceed to confirm link sent to the other email';
  const invalid =
    typeof code !== 'string' || !code || !!error || !!error_code || Array.isArray(sb_flow_id);
  const failed = invalid || failedCode === code;
  useEffect(() => {
    let active = true;
    if (typeof code !== 'string' || invalid) return;
    void exchangeAuthCode(code, typeof sb_flow_id === 'string' ? sb_flow_id : undefined)
      .then(() => {
        if (active) router.replace(recovery ? '/' : '/auth/confirmed');
      })
      .catch(() => {
        if (active) setFailedCode(code);
      });
    return () => {
      active = false;
    };
  }, [code, invalid, sb_flow_id, recovery]);
  return (
    <AuthFrame>
      <AuthText kind="heading">
        {pendingEmailChange
          ? 'Check your other inbox'
          : failed
            ? 'Unable to open this link'
            : 'Confirming your account'}
      </AuthText>
      {pendingEmailChange ? (
        <>
          <AuthNotice>
            Your email change needs confirmation from both addresses. Open the other confirmation
            email on the same phone or browser where you started. Your email changes only after all
            required confirmations are complete.
          </AuthNotice>
          <AuthButton title="Return to app" onPress={() => router.replace('/')} />
        </>
      ) : failed ? (
        <>
          <AuthNotice error>
            Request a new link and open it on the device where you started. Links expire and can
            only be used once.
          </AuthNotice>
          <AuthButton title="Return to sign in" onPress={() => router.replace('/')} />
        </>
      ) : (
        <AuthNotice>Please wait while we securely complete your request.</AuthNotice>
      )}
    </AuthFrame>
  );
}
