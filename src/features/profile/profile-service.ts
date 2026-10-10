import { getSupabase } from '@/lib/supabase/client';

import {
  ProfileError,
  validatePreferencesUpdate,
  validateProfileUpdate,
  type PreferencesUpdate,
  type ProfileUpdate,
} from './profile-model';

// Never accept an owner ID from a form. RLS is the authorization boundary;
// the explicit filter also prevents accidentally requesting unrelated rows.
// Expected identity comes from the mounted editor's session, never from a form;
// it rejects account changes and cannot override the authenticated owner.
async function currentUserId(expectedUserId?: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) {
    if (
      !data.user &&
      (!error || error.name === 'AuthSessionMissingError' || error.status === 401)
    ) {
      throw new ProfileError('AUTH_REQUIRED', 'Sign in to manage your profile.');
    }
    throw new ProfileError('REQUEST_FAILED', 'Unable to verify your account. Try again.');
  }
  if (expectedUserId !== undefined && data.user.id !== expectedUserId) {
    throw new ProfileError('AUTH_REQUIRED', 'Your account changed. Reopen your profile.');
  }
  return data.user.id;
}

async function safely<T>(request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    // Do not surface raw database errors or log user data/credentials.
    if (error instanceof ProfileError) throw error;
    throw new ProfileError('REQUEST_FAILED', 'Unable to complete this request. Try again.');
  }
}

function requireRecord<T>(data: T | null, error: unknown): T {
  if (error)
    throw new ProfileError('REQUEST_FAILED', 'Unable to load or save your data. Try again.');
  if (data === null) {
    throw new ProfileError('NOT_FOUND', 'Your profile or preferences are unavailable. Try again.');
  }
  return data;
}

export const profileService = {
  getProfile(expectedUserId?: string) {
    return safely(async () => {
      const id = await currentUserId(expectedUserId);
      const { data, error } = await getSupabase()
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      return requireRecord(data, error);
    });
  },
  getPreferences(expectedUserId?: string) {
    return safely(async () => {
      const id = await currentUserId(expectedUserId);
      const { data, error } = await getSupabase()
        .from('user_preferences')
        .select('*')
        .eq('user_id', id)
        .maybeSingle();
      return requireRecord(data, error);
    });
  },
  updateProfile(patch: ProfileUpdate, expectedUserId?: string) {
    return safely(async () => {
      const values = validateProfileUpdate(patch);
      const id = await currentUserId(expectedUserId);
      const { data, error } = await getSupabase()
        .from('profiles')
        .update(values)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      return requireRecord(data, error);
    });
  },
  updatePreferences(patch: PreferencesUpdate, expectedUserId?: string) {
    return safely(async () => {
      const values = validatePreferencesUpdate(patch);
      const id = await currentUserId(expectedUserId);
      const { data, error } = await getSupabase()
        .from('user_preferences')
        .update(values)
        .eq('user_id', id)
        .select('*')
        .maybeSingle();
      return requireRecord(data, error);
    });
  },
};
