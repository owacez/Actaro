import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { AuthButton, AuthInput, AuthNotice, AuthText } from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';

import { accountSecurityError, accountSecurityService } from './account-security-service';

export function AccountSecurity({
  userId,
  email,
  blocked,
  onBusyChange,
}: {
  userId: string;
  email: string;
  blocked: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [mode, setMode] = useState<'email' | 'password' | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const active = useRef(false);
  const { clear, notify } = useAuthFeedback();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  function reset() {
    setMode(null);
    setNewEmail('');
    setPassword('');
    setConfirmation('');
    setError(null);
  }
  async function submit() {
    if (pending.current || blocked || !mode) return;
    pending.current = true;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    clear();
    try {
      if (mode === 'email') {
        if (newEmail.trim().toLowerCase() === email.toLowerCase()) throw new Error('unchanged');
        const result = await accountSecurityService.changeEmail(newEmail, userId);
        if (!active.current) return;
        reset();
        notify(
          result.confirmed
            ? 'Email updated.'
            : 'Check your email inboxes to confirm the email change.',
          result.confirmed ? 'success' : 'info',
        );
      } else {
        await accountSecurityService.changePassword(password, confirmation, userId);
        if (!active.current) return;
        reset();
        notify('Password updated successfully.', 'success');
      }
    } catch (failure) {
      if (!active.current) return;
      const message =
        failure instanceof Error && failure.message === 'unchanged'
          ? 'Enter a different email address.'
          : accountSecurityError(failure);
      setError(message);
      // Passwords are never retained after a request, including a failed request.
      setPassword('');
      setConfirmation('');
      if (Platform.OS === 'web') notify(message, 'error');
    } finally {
      pending.current = false;
      if (active.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }
  return (
    <>
      <AuthText kind="heading">Account security</AuthText>
      <AuthText>Email</AuthText>
      <AuthText>{email}</AuthText>
      {!mode ? (
        <>
          <AuthButton
            title="Change email"
            outlined
            disabled={blocked}
            onPress={() => {
              clear();
              setMode('email');
            }}
          />
          <AuthButton
            title="Change password"
            outlined
            disabled={blocked}
            onPress={() => {
              clear();
              setMode('password');
            }}
          />
        </>
      ) : (
        <>
          {mode === 'email' ? (
            <>
              <AuthInput
                label="New email"
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!busy && !blocked}
              />
              <AuthText>
                Your email changes after any required confirmation. Check both inboxes.
              </AuthText>
            </>
          ) : (
            <>
              <AuthInput
                label="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                editable={!busy && !blocked}
              />
              <AuthInput
                label="Confirm new password"
                value={confirmation}
                onChangeText={setConfirmation}
                secureTextEntry
                autoComplete="new-password"
                autoCapitalize="none"
                editable={!busy && !blocked}
              />
            </>
          )}
          {error && (
            <AuthNotice error announce={Platform.OS !== 'web'}>
              {error}
            </AuthNotice>
          )}
          <AuthButton
            title={mode === 'email' ? 'Update email' : 'Update password'}
            busy={busy}
            disabled={blocked}
            onPress={() => void submit()}
          />
          <AuthButton
            title="Cancel"
            outlined
            disabled={busy || blocked}
            onPress={() => {
              clear();
              reset();
            }}
          />
        </>
      )}
    </>
  );
}
