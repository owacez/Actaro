import * as Linking from 'expo-linking';

import { getSupabase } from '@/lib/supabase/client';

export type AuthMode = 'sign-in' | 'sign-up' | 'reset' | 'verify' | 'update-password';

export function validateAuthForm(
  mode: AuthMode,
  email: string,
  password: string,
  confirmation: string,
) {
  if (mode !== 'update-password' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  if (mode === 'sign-in' && !password) return 'Enter your password.';
  if (mode === 'sign-up' || mode === 'update-password') {
    if (password.length < 8) return 'Use a password with at least 8 characters.';
    if (password !== confirmation) return 'Your passwords do not match.';
  }
  return null;
}

export function authErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  switch (code) {
    case 'invalid_credentials':
      return 'Email or password is incorrect.';
    case 'email_not_confirmed':
      return 'Confirm your email before signing in.';
    case 'weak_password':
      return 'Choose a stronger password and try again.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait before trying again.';
    case 'email_address_not_authorized':
      return 'Email delivery is limited to approved test recipients for now.';
    case 'signup_disabled':
      return 'Account creation is temporarily unavailable.';
    case 'otp_expired':
    case 'flow_state_expired':
    case 'flow_state_not_found':
      return 'This link has expired or was already used. Request a new link.';
    default:
      return 'Unable to complete this request. Check your connection and try again.';
  }
}

export function authRedirectUrl(recovery = false) {
  return Linking.createURL(recovery ? 'auth/recovery' : 'auth/callback');
}

const cleanEmail = (email: string) => email.trim().toLowerCase();

export const authService = {
  async signIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: cleanEmail(email),
      password,
    });
    if (error) throw error;
  },
  async signUp(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signUp({
      email: cleanEmail(email),
      password,
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  },
  async resendConfirmation(email: string) {
    const { error } = await getSupabase().auth.resend({
      type: 'signup',
      email: cleanEmail(email),
      options: { emailRedirectTo: authRedirectUrl() },
    });
    if (error) throw error;
  },
  async requestReset(email: string) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(cleanEmail(email), {
      redirectTo: authRedirectUrl(true),
    });
    if (error) throw error;
  },
  async updatePassword(password: string) {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) throw error;
  },
  async signOut() {
    const { error } = await getSupabase().auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
};

// A callback can mount twice during development. Exchange each one-use code once.
let lastExchange: { code: string; flowId?: string; request: Promise<void> } | undefined;
export function exchangeAuthCode(code: string, flowId?: string) {
  if (!code || code.length > 2048) return Promise.reject(new Error('Invalid callback'));
  if (lastExchange?.code === code && lastExchange.flowId === flowId) return lastExchange.request;
  const request = getSupabase()
    .auth.exchangeCodeForSession(code, flowId === undefined ? undefined : { flowId })
    .then(({ error }) => {
      if (error) throw error;
    });
  lastExchange = { code, flowId, request };
  return request;
}
