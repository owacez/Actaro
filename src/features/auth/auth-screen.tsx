import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';

import {
  AuthButton,
  AuthCard,
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
import { useAppTheme } from '@/features/profile/theme-context';
import { ActionRow, ScreenHeader } from '@/components/product-ui';

const headings: Record<AuthMode, string> = {
  'sign-in': 'Welcome back',
  'sign-up': 'Create your account',
  reset: 'Reset password',
  verify: 'Check your email',
  'update-password': 'Set a new password',
};
const descriptions: Record<AuthMode, string> = {
  'sign-in': 'Sign in to pick up where you left off.',
  'sign-up': 'Training, food and progress in one place.',
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
  const { colors } = useAppTheme();
  const [mode, setMode] = useState<AuthMode>(recovery ? 'update-password' : 'sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const pending = useRef(false);

  function changeMode(next: AuthMode) {
    setMode(next);
    setEmailSent(false);
    setPassword('');
    setConfirmation('');
    setError(null);
    clear();
  }
  function reportError(message: string) {
    if (Platform.OS === 'web') notify(message, 'error');
    else setError(message);
  }
  async function submit() {
    if (pending.current) return;
    const invalid = validateAuthForm(mode, email, password, confirmation);
    setError(null);
    clear();
    if (invalid) {
      setError(invalid);
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
        } else notify('Signed in successfully.', 'success');
      }
      if (mode === 'verify') {
        await authService.resendConfirmation(email);
        notify('If confirmation is needed, a new email will arrive shortly.', 'info');
      }
      if (mode === 'reset') {
        await authService.requestReset(email);
        setEmailSent(true);
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
        <Text
          style={{
            fontFamily: 'Inter_600SemiBold',
            color: colors.text,
            fontSize: 40,
            marginTop: 40,
            marginBottom: 28,
          }}
        >
          actaro<Text style={{ color: colors.accent }}>.</Text>
        </Text>
      ) : (
        <AuthLink
          title="← SIGN IN"
          disabled={busy}
          onPress={() => (recovery ? void cancelRecovery() : changeMode('sign-in'))}
        />
      )}
      <AuthText kind="title">{emailSent ? 'Check your email' : headings[mode]}</AuthText>
      <AuthText>
        {emailSent
          ? 'If this email has an account, open the reset link on this device.'
          : descriptions[mode]}
      </AuthText>
      {(mode === 'verify' || emailSent) && <AuthText>{email.trim()}</AuthText>}
      {mode !== 'update-password' && mode !== 'verify' && !emailSent && (
        <AuthInput
          label="Email"
          error={error === 'Enter a valid email address.' ? error : undefined}
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!busy}
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
          <Text
            style={{ color: password.length >= 8 ? colors.success : colors.muted, fontSize: 12 }}
          >
            {password.length >= 8 ? '✓ At least 8 characters' : 'Use at least 8 characters.'}
          </Text>
        </>
      )}
      {mode === 'sign-in' && (
        <View style={authStyles.row}>
          <AuthText kind="muted">Secure sign-in</AuthText>
          <AuthLink title="Forgot password?" disabled={busy} onPress={() => changeMode('reset')} />
        </View>
      )}
      {error && error !== 'Enter a valid email address.' && <AuthNotice error>{error}</AuthNotice>}
      <AuthButton title={buttons[mode]} busy={busy} onPress={() => void submit()} />
      {mode === 'sign-in' && (
        <>
          <AuthLink title="Create account" disabled={busy} onPress={() => changeMode('sign-up')} />
          <AuthText kind="muted">Your records are private to your account.</AuthText>
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
        <AuthText kind="muted">
          For your privacy, Actaro never confirms whether an email has an account.
        </AuthText>
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
    <AuthFrame header={<ScreenHeader title="You" />}>
      <AuthCard>
        <ActionRow
          title="Profile management"
          detail={session?.user.email}
          icon={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
          disabled={busy}
          onPress={() => router.push('/profile')}
        />
      </AuthCard>
      <AuthText kind="eyebrow">TRACKING</AuthText>
      <AuthCard>
        <ActionRow
          title="Habits"
          detail="Actions you repeat and record"
          icon={{ ios: 'checkmark.square', android: 'check_box', web: 'check_box' }}
          disabled={busy}
          onPress={() => router.push('/habits')}
        />
        <ActionRow
          title="Goals"
          detail="Targets updated from your logs"
          icon={{ ios: 'target', android: 'my_location', web: 'my_location' }}
          disabled={busy}
          onPress={() => router.push('/goals')}
        />
        <ActionRow
          title="Body records"
          icon={{ ios: 'scalemass', android: 'monitor_weight', web: 'monitor_weight' }}
          disabled={busy}
          onPress={() => router.push('/body')}
        />
        <ActionRow
          title="Steps & activity"
          icon={{ ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' }}
          disabled={busy}
          onPress={() => router.push('/activity')}
        />
      </AuthCard>
      <AuthText kind="eyebrow">SETTINGS</AuthText>
      <AuthCard>
        <ActionRow
          title="Preferences"
          detail="Units, time zone and appearance"
          icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
          disabled={busy}
          onPress={() => router.push('/preferences')}
        />
        <ActionRow
          title="Habit reminders"
          icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
          disabled={busy}
          onPress={() => router.push('/reminders')}
        />
        <ActionRow
          title="Privacy and data"
          detail="Export or delete your records"
          icon={{ ios: 'shield', android: 'shield', web: 'shield' }}
          disabled={busy}
          onPress={() => router.push('/privacy')}
        />
        <ActionRow
          title="Recipes"
          disabled={busy}
          onPress={() =>
            router.push({ pathname: '/nutrition/manage', params: { view: 'recipes' } })
          }
        />
      </AuthCard>
      {error && <AuthNotice error>{error}</AuthNotice>}
      <AuthButton title="Sign out" busy={busy} onPress={() => void signOut()} />
    </AuthFrame>
  );
}
