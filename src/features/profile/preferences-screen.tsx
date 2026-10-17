import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
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
import { ScreenHeader, Segments } from '@/components/product-ui';
import { useAuthFeedback } from '@/features/auth/auth-feedback';

import {
  ProfileError,
  validatePreferencesUpdate,
  type Preferences,
  type PreferencesUpdate,
} from './profile-model';
import { profileService } from './profile-service';
import { useAppTheme } from './theme-context';

// Uses approved existing components while the Preferences Figma read is blocked.
const unitChoices = [
  { field: 'weight_unit', label: 'Weight', values: ['kg', 'lb'] },
  { field: 'length_unit', label: 'Length', values: ['cm', 'in'] },
  { field: 'distance_unit', label: 'Distance', values: ['km', 'mi'] },
  { field: 'energy_unit', label: 'Energy', values: ['kcal', 'kJ'] },
] as const;

function message(error: unknown) {
  return error instanceof ProfileError
    ? error.message
    : 'Unable to load or save preferences. Try again.';
}

export function PreferencesScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [saved, setSaved] = useState<Preferences | null>(null);
  const [draft, setDraft] = useState<PreferencesUpdate>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const { clear, notify } = useAuthFeedback();
  const { applySavedPreferences } = useAppTheme();

  useEffect(() => {
    const request = ++generation.current;
    void profileService
      .getPreferences(userId)
      .then((record) => {
        if (request !== generation.current) return;
        applySavedPreferences(record);
        setSaved(record);
        setDraft({});
        setLoading(false);
      })
      .catch((failure) => {
        if (request !== generation.current) return;
        setError(message(failure));
        setLoading(false);
      });
    return () => {
      generation.current = request + 1;
    };
  }, [userId, attempt, applySavedPreferences]);

  function edit(patch: PreferencesUpdate) {
    if (pending.current) return;
    clear();
    setError(null);
    setDraft((current) => {
      const next = { ...current, ...patch };
      for (const field of Object.keys(next) as (keyof PreferencesUpdate)[]) {
        if (next[field] === saved?.[field]) delete next[field];
      }
      return next;
    });
  }
  async function save() {
    if (pending.current || !saved || loading || !Object.keys(draft).length) return;
    clear();
    setError(null);
    const request = generation.current;
    try {
      const patch = validatePreferencesUpdate(draft);
      pending.current = true;
      setSaving(true);
      const record = await profileService.updatePreferences(patch, userId);
      if (request !== generation.current) return;
      applySavedPreferences(record);
      setSaved(record);
      setDraft({});
      notify('Preferences saved.', 'success');
    } catch (failure) {
      if (request !== generation.current) return;
      const description = message(failure);
      setError(description);
      if (Platform.OS === 'web') notify(description, 'error');
    } finally {
      pending.current = false;
      if (request === generation.current) setSaving(false);
    }
  }

  const theme = draft.theme ?? saved?.theme;
  return (
    <AuthFrame header={<ScreenHeader title="Preferences" />}>
      <AuthLink title="← More" disabled={saving} onPress={onBack} />
      {loading ? (
        <AuthLoading>Loading preferences…</AuthLoading>
      ) : !saved ? (
        <>
          <AuthNotice error>{error}</AuthNotice>
          <AuthButton
            title="Retry"
            onPress={() => {
              setError(null);
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      ) : (
        <>
          <AuthText kind="eyebrow">UNITS</AuthText>
          {unitChoices.map(({ field, label, values }) => (
            <View key={field} style={{ gap: 8 }}>
              <AuthText kind="heading">{label}</AuthText>
              <Segments
                label={label}
                value={draft[field] ?? saved[field]}
                options={values.map((unit) => ({ value: unit, label: unit }))}
                disabled={saving}
                onChange={(unit) => edit({ [field]: unit })}
              />
            </View>
          ))}
          <AuthInput
            label="Time zone"
            value={draft.time_zone ?? saved.time_zone}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
            onChangeText={(value) => edit({ time_zone: value })}
          />
          <AuthText>
            Use an IANA time zone such as Europe/London or UTC. This sets the day boundary for
            future tracking.
          </AuthText>
          <AuthButton
            title="Use device time zone"
            outlined
            disabled={saving}
            onPress={() => edit({ time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
          />
          <AuthText>Privacy</AuthText>
          <AuthText>
            Your profile and preferences are private to your account. Sharing controls will be added
            only when sharing is supported.
          </AuthText>
          <AuthButton
            title={`Notifications preference: ${(draft.notifications_enabled ?? saved.notifications_enabled) ? 'On' : 'Off'}`}
            outlined
            disabled={saving}
            onPress={() =>
              edit({
                notifications_enabled: !(
                  draft.notifications_enabled ?? saved.notifications_enabled
                ),
              })
            }
          />
          <AuthButton
            title={`Gamification preference: ${(draft.gamification_enabled ?? saved.gamification_enabled) ? 'On' : 'Off'}`}
            outlined
            disabled={saving}
            onPress={() =>
              edit({
                gamification_enabled: !(draft.gamification_enabled ?? saved.gamification_enabled),
              })
            }
          />
          <AuthText>
            Notifications also require permission on each phone. Achievements remain a future
            release.
          </AuthText>
          <AuthLink
            title="Manage habit reminders"
            disabled={saving}
            onPress={() => router.push('/reminders')}
          />
          <AuthText kind="heading">Appearance</AuthText>
          <Segments<'system' | 'light' | 'dark'>
            label="Theme"
            value={theme === 'light' ? 'light' : theme === 'dark' ? 'dark' : 'system'}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            disabled={saving}
            onChange={(theme) => edit({ theme })}
          />
          <AuthText>Save to apply your appearance. System follows your device setting.</AuthText>
          {error && (
            <AuthNotice error announce={Platform.OS !== 'web'}>
              {error}
            </AuthNotice>
          )}
          <AuthButton
            title="Save preferences"
            busy={saving}
            disabled={!Object.keys(draft).length}
            onPress={() => void save()}
          />
          <AuthButton
            title="Discard changes"
            outlined
            disabled={saving || !Object.keys(draft).length}
            onPress={() => {
              clear();
              setError(null);
              setDraft({});
            }}
          />
        </>
      )}
    </AuthFrame>
  );
}
