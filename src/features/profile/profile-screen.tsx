import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { ScreenHeader } from '@/components/product-ui';
import { useAppTheme } from './theme-context';
import { router } from 'expo-router';

import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  AuthLoading,
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
  const { colors } = useAppTheme();
  const [securityBusy, setSecurityBusy] = useState(false);
  const { clear, notify } = useAuthFeedback();
  useEffect(() => {
    if (editor.saveError && Platform.OS === 'web') notify(editor.saveError, 'error');
  }, [editor.saveError, notify]);

  async function save() {
    if (securityBusy) return;
    clear();
    if (await editor.save()) {
      notify('Profile saved.', 'success');
      onBack();
    }
  }

  return (
    <AuthFrame header={<ScreenHeader title="Profile" />}>
      <AuthLink title="← You" disabled={editor.saving || securityBusy} onPress={onBack} />
      {editor.loading ? (
        <AuthLoading>Loading your profile…</AuthLoading>
      ) : editor.loadError ? (
        <>
          <AuthNotice error>{editor.loadError}</AuthNotice>
          <AuthButton title="Retry" onPress={editor.retry} />
        </>
      ) : (
        <>
          <View
            style={{
              alignSelf: 'center',
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: colors.text,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{ color: colors.background, fontSize: 34, fontFamily: 'Inter_600SemiBold' }}
            >
              {(editor.name.trim() || email || '?').charAt(0).toUpperCase()}
            </Text>
          </View>
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
      <AuthLink
        title="Privacy & account data"
        disabled={editor.saving || securityBusy}
        onPress={() => router.push('/privacy')}
      />
    </AuthFrame>
  );
}
