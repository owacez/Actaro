import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AuthButton, AuthFrame, AuthNotice, AuthText } from './auth-components';
import { exchangeAuthCode } from './auth-service';

export function AuthCallbackScreen() {
  const { code, error, error_code, sb_flow_id } = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_code?: string | string[];
    sb_flow_id?: string | string[];
  }>();
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const invalid =
    typeof code !== 'string' || !code || !!error || !!error_code || Array.isArray(sb_flow_id);
  const failed = invalid || failedCode === code;
  useEffect(() => {
    let active = true;
    if (typeof code !== 'string' || invalid) return;
    void exchangeAuthCode(code, typeof sb_flow_id === 'string' ? sb_flow_id : undefined)
      .then(() => {
        if (active) router.replace('/');
      })
      .catch(() => {
        if (active) setFailedCode(code);
      });
    return () => {
      active = false;
    };
  }, [code, invalid, sb_flow_id]);
  return (
    <AuthFrame>
      <AuthText kind="heading">
        {failed ? 'Unable to open this link' : 'Confirming your account'}
      </AuthText>
      {failed ? (
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
