import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, View } from 'react-native';

import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from './auth-components';
import { useAuth } from './auth-provider';
import { useAuthFeedback } from './auth-feedback';
import { authErrorMessage, authService, validateAuthForm, type AuthMode } from './auth-service';

const headings: Record<AuthMode, string> = {
  'sign-in': 'Welcome back',
  'sign-up': 'Create your account',
  reset: 'Reset password',
  verify: 'Check your email',
  'update-password': 'Set a new password',
};
const descriptions: Record<AuthMode, string> = {
  'sign-in': 'Sign in to continue tracking your training, nutrition and progress.',
  'sign-up': 'Create your Actaro account to get started.',
  reset: 'We’ll send a secure reset link to your email.',
  verify:
    'If your account needs verification, follow the email link on the device where you created it, then sign in.',
  'update-password': 'Choose a new password for your account.',
};
const buttons: Record<AuthMode, string> = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  reset: 'Send reset link',
  verify: 'Resend confirmation',
  'update-password': 'Update password',
};

export function AuthScreen({ recovery = false }: { recovery?: boolean }) {
  const { finishRecovery } = useAuth();
  const { notify, clear } = useAuthFeedback();
  const [mode, setMode] = useState<AuthMode>(recovery ? 'update-password' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  function changeMode(next: AuthMode) {
    setMode(next);
    setPassword('');
    setConfirmation('');
    setError(null);
    clear();
  }
  function reportError(message: string) {
    setError(message);
    if (Platform.OS === 'web') notify(message, 'error');
  }
  async function submit() {
    if (pending.current) return;
    const invalid = validateAuthForm(mode, email, password, confirmation);
    setError(null);
    clear();
    if (invalid) {
      reportError(invalid);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        await authService.signIn(email, password);
        notify('Signed in successfully.', 'success');
      }
      if (mode === 'sign-up') {
        const { needsConfirmation } = await authService.signUp(email, password);
        if (needsConfirmation) {
          changeMode('verify');
          notify('Check your email for confirmation instructions.', 'info');
        } else notify('Signed in successfully.', 'success');
      }
      if (mode === 'verify') {
        await authService.resendConfirmation(email);
        notify('If confirmation is needed, a new email will arrive shortly.', 'info');
      }
      if (mode === 'reset') {
        await authService.requestReset(email);
        notify(
          'If this email has an account, a reset link will arrive shortly. Open it on this device.',
          'info',
        );
      }
      if (mode === 'update-password') {
        await authService.updatePassword(password);
        setPassword('');
        setConfirmation('');
        finishRecovery();
        notify('Password updated successfully.', 'success');
      }
    } catch (requestError) {
      reportError(authErrorMessage(requestError));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function cancelRecovery() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    clear();
    try {
      await authService.signOut();
      finishRecovery();
    } catch (requestError) {
      reportError(authErrorMessage(requestError));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  const hasPassword = mode === 'sign-in' || mode === 'sign-up' || mode === 'update-password';
  return (
    <AuthFrame>
      {mode === 'sign-in' || mode === 'sign-up' ? (
        <AuthText kind="eyebrow">ACTARO</AuthText>
      ) : (
        <AuthLink
          title="← SIGN IN"
          disabled={busy}
          onPress={() => (recovery ? void cancelRecovery() : changeMode('sign-in'))}
        />
      )}
      <AuthText kind={mode === 'sign-in' ? 'title' : 'heading'}>{headings[mode]}</AuthText>
      <AuthText>{descriptions[mode]}</AuthText>
      {mode !== 'update-password' && (
        <AuthInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!busy && mode !== 'verify'}
        />
      )}
      {hasPassword && (
        <AuthInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
          textContentType={mode === 'sign-in' ? 'password' : 'newPassword'}
          editable={!busy}
        />
      )}
      {(mode === 'sign-up' || mode === 'update-password') && (
        <>
          <AuthInput
            label="Confirm password"
            value={confirmation}
            onChangeText={setConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!busy}
          />
          <AuthText kind="muted">Use at least 8 characters.</AuthText>
        </>
      )}
      {mode === 'sign-in' && (
        <View style={authStyles.row}>
          <AuthText kind="muted">Keep me signed in</AuthText>
          <AuthLink title="Forgot password?" disabled={busy} onPress={() => changeMode('reset')} />
        </View>
      )}
      {error && (
        <AuthNotice error announce={Platform.OS !== 'web'}>
          {error}
        </AuthNotice>
      )}
      <AuthButton title={buttons[mode]} busy={busy} onPress={() => void submit()} />
      {mode === 'sign-in' && (
        <>
          <View style={authStyles.divider} />
          <AuthButton
            title="Create account"
            outlined
            disabled={busy}
            onPress={() => changeMode('sign-up')}
          />
          <AuthNotice>
            Your account is private. Fitness data storage will be introduced with verified ownership
            rules.
          </AuthNotice>
        </>
      )}
      {(mode === 'sign-up' || mode === 'verify') && (
        <AuthLink
          title="Already have an account? Sign in"
          disabled={busy}
          onPress={() => changeMode('sign-in')}
        />
      )}
      {mode === 'reset' && (
        <AuthNotice>
          SECURITY{'\n'}The app never displays whether another person’s email exists in the system.
        </AuthNotice>
      )}
    </AuthFrame>
  );
}

export function AccountScreen() {
  const { session } = useAuth();
  const { notify, clear } = useAuthFeedback();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  async function signOut() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    clear();
    try {
      await authService.signOut();
      notify('Signed out successfully.', 'success');
    } catch (requestError) {
      setError(authErrorMessage(requestError));
      if (Platform.OS === 'web') notify(authErrorMessage(requestError), 'error');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">ACTARO</AuthText>
      <AuthText kind="title">More</AuthText>
      <AuthText>{session?.user.email}</AuthText>
      <AuthNotice>
        Training, nutrition and progress features are coming in later releases.
      </AuthNotice>
      <AuthButton
        title="Profile management"
        outlined
        disabled={busy}
        onPress={() => router.push('/profile')}
      />
      {error && (
        <AuthNotice error announce={Platform.OS !== 'web'}>
          {error}
        </AuthNotice>
      )}
      <AuthButton title="Sign out" busy={busy} onPress={() => void signOut()} />
    </AuthFrame>
  );
}
