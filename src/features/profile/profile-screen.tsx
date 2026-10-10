import { useEffect } from 'react';
import { Platform } from 'react-native';

import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';

import { useProfileEditor } from './use-profile-editor';

// User-authorized reuse of verified components; exact Profile Figma matching pending.
export function ProfileScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const editor = useProfileEditor(userId);
  const { clear, notify } = useAuthFeedback();
  useEffect(() => {
    if (editor.saveError && Platform.OS === 'web') notify(editor.saveError, 'error');
  }, [editor.saveError, notify]);

  async function save() {
    clear();
    if (await editor.save()) notify('Profile saved.', 'success');
  }

  return (
    <AuthFrame>
      <AuthLink title="← Your account" disabled={editor.saving} onPress={onBack} />
      <AuthText kind="heading">Profile</AuthText>
      {editor.loading ? (
        <AuthText>Loading your profile…</AuthText>
      ) : editor.loadError ? (
        <>
          <AuthNotice error>{editor.loadError}</AuthNotice>
          <AuthButton title="Retry" onPress={editor.retry} />
        </>
      ) : (
        <>
          <AuthInput
            label="Display name"
            value={editor.name}
            onChangeText={(value) => {
              clear();
              editor.editName(value);
            }}
            editable={!editor.saving}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="done"
            onSubmitEditing={() => void save()}
          />
          <AuthText>
            Optional. Up to 80 characters. Leave blank to clear your display name.
          </AuthText>
          {editor.saveError && (
            <AuthNotice error announce={Platform.OS !== 'web'}>
              {editor.saveError}
            </AuthNotice>
          )}
          <AuthButton
            title="Save profile"
            busy={editor.saving}
            disabled={!editor.dirty}
            onPress={() => void save()}
          />
          <AuthButton
            title="Discard changes"
            outlined
            disabled={!editor.dirty || editor.saving}
            onPress={() => {
              clear();
              editor.cancel();
            }}
          />
        </>
      )}
    </AuthFrame>
  );
}
