import { authErrorMessage, authRedirectUrl, validateAuthForm } from '@/features/auth/auth-service';
import { getSupabase } from '@/lib/supabase/client';

import { ProfileError } from './profile-model';

async function requireAccount(userId: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error) throw error;
  if (!data.user || data.user.id !== userId) {
    throw new ProfileError('AUTH_REQUIRED', 'Your account changed. Reopen your profile.');
  }
}

export function accountSecurityError(error: unknown) {
  if (error instanceof ProfileError) return error.message;
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 'same_password') return 'Choose a password different from your current password.';
  if (code === 'reauthentication_needed' || code === 'reauthentication_not_valid') {
    return 'Sign out and sign in again, then retry this password change.';
  }
  return authErrorMessage(error);
}

export const accountSecurityService = {
  async changeEmail(email: string, userId: string) {
    const invalid = validateAuthForm('reset', email, '', '');
    if (invalid) throw new ProfileError('INVALID_INPUT', invalid);
    await requireAccount(userId);
    const normalized = email.trim().toLowerCase();
    const { data, error } = await getSupabase().auth.updateUser(
      { email: normalized },
      { emailRedirectTo: authRedirectUrl() },
    );
    if (error) throw error;
    return { confirmed: data.user.email?.toLowerCase() === normalized };
  },
  async changePassword(password: string, confirmation: string, userId: string) {
    const invalid = validateAuthForm('update-password', '', password, confirmation);
    if (invalid) throw new ProfileError('INVALID_INPUT', invalid);
    await requireAccount(userId);
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) throw error;
  },
};
