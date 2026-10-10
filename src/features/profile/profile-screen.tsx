import { useEffect, useState } from 'react';
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
import { AccountSecurity } from './account-security';

// User-authorized reuse of verified components; exact Profile Figma matching pending.
export function ProfileScreen({
  userId,
  email,
  onBack,
}: {
  userId: string;
  email?: string;
  onBack: () => void;
}) {
  const editor = useProfileEditor(userId);
  const [securityBusy, setSecurityBusy] = useState(false);
  const { clear, notify } = useAuthFeedback();
  useEffect(() => {
    if (editor.saveError && Platform.OS === 'web') notify(editor.saveError, 'error');
  }, [editor.saveError, notify]);

  async function save() {
    if (securityBusy) return;
    clear();
    if (await editor.save()) notify('Profile saved.', 'success');
  }

  return (
    <AuthFrame>
      <AuthLink title="← More" disabled={editor.saving || securityBusy} onPress={onBack} />
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
            editable={!editor.saving && !securityBusy}
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
            disabled={!editor.dirty || securityBusy}
            onPress={() => void save()}
          />
          <AuthButton
            title="Discard changes"
            outlined
            disabled={!editor.dirty || editor.saving || securityBusy}
            onPress={() => {
              clear();
              editor.cancel();
            }}
          />
        </>
      )}
      {email && (
        <AccountSecurity
          userId={userId}
          email={email}
          blocked={editor.saving}
          onBusyChange={setSecurityBusy}
        />
      )}
    </AuthFrame>
  );
}
