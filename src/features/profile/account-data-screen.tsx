import { ActionSheet, ScreenHeader } from '@/components/product-ui';
import { useEffect, useRef, useState } from 'react';
import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { getSupabase } from '@/lib/supabase/client';
import { sessionStore } from '@/features/workouts/session-store';
import { reminderService } from '@/features/notifications/reminder-service';
import { exportAccount, deleteOwnAccount } from './account-data-service';
import { shareExport } from './share-export';

export function AccountDataScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [password, setPassword] = useState(''),
    [confirmation, setConfirmation] = useState(''),
    [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [deleted, setDeleted] = useState(false);
  const pending = useRef(false),
    { notify } = useAuthFeedback();
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function run(remove: boolean) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    let confirmed = false;
    try {
      if (!remove) {
        const archive = await exportAccount(userId);
        if (!active.current) return;
        await shareExport(archive);
        if (!active.current) return;
        notify(
          'Export handed to your browser or share sheet. Save it somewhere private.',
          'success',
        );
      } else {
        await deleteOwnAccount(userId, password, confirmation);
        confirmed = true;
        setDeleted(true);
        // Server deletion is final even if this device cannot finish its local cleanup.
        const cleaned = await Promise.allSettled([
          sessionStore.discard(userId),
          reminderService.owner() === userId
            ? reminderService.setOwner(undefined)
            : Promise.resolve(),
        ]);
        if (!active.current) return;
        const result = await getSupabase().auth.signOut({ scope: 'local' });
        if (result.error || cleaned.some((item) => item.status === 'rejected'))
          throw new Error('Local cleanup failed.');
        notify('Account deleted.', 'success');
      }
    } catch (failure) {
      if (active.current)
        setError(
          confirmed
            ? 'Account deleted. Local cleanup did not finish; restart the app.'
            : failure instanceof Error
              ? failure.message
              : 'Export unavailable. Retry.',
        );
    } finally {
      setPassword('');
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <AuthFrame header={<ScreenHeader title="Privacy and data" />}>
      <AuthLink title="← Profile" disabled={busy} onPress={onBack} />
      <AuthText kind="heading">Privacy & account data</AuthText>
      <AuthText>
        Only your signed-in account is included. Exports contain private health information; choose
        carefully where you save or share them.
      </AuthText>
      <AuthButton
        title="Export my data"
        busy={busy}
        disabled={deleted}
        onPress={() => void run(false)}
      />
      <AuthText>
        JSON includes your profile, preferences, workouts, nutrition, habits, goals and activity,
        plus any active workout saved on this device. Avoid editing during export.
      </AuthText>
      <AuthText kind="heading">Delete account</AuthText>
      <AuthNotice>
        This permanently deletes your account and its recorded data. It cannot be undone. Export
        first if you want a copy. Existing exports and device backups are outside Actaro’s control.
      </AuthNotice>
      {deleted ? (
        <AuthNotice>Account deleted. Restart the app if sign-out did not finish.</AuthNotice>
      ) : (
        <>
          <AuthButton
            title="Delete account"
            outlined
            disabled={busy}
            onPress={() => setConfirming(true)}
          />
          <ActionSheet
            title="Delete your account?"
            visible={confirming}
            onClose={() => {
              if (!busy) {
                setConfirming(false);
                setPassword('');
                setConfirmation('');
              }
            }}
          >
            <AuthInput
              label="Current password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              editable={!busy}
            />
            <AuthInput
              label="Type DELETE to confirm"
              value={confirmation}
              onChangeText={setConfirmation}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!busy}
            />
            <AuthButton
              title="Permanently delete my account"
              outlined
              busy={busy}
              disabled={confirmation !== 'DELETE' || !password}
              onPress={() => void run(true)}
            />
            {!!error && <AuthNotice error>{error}</AuthNotice>}
          </ActionSheet>
        </>
      )}
      {!!error && (!confirming || deleted) && <AuthNotice error>{error}</AuthNotice>}
    </AuthFrame>
  );
}
