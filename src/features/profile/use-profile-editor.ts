import { useEffect, useRef, useState } from 'react';

import { ProfileError, validateProfileUpdate, type Profile } from './profile-model';
import { profileService } from './profile-service';

function safeMessage(error: unknown) {
  return error instanceof ProfileError
    ? error.message
    : 'Unable to load or save your profile. Try again.';
}

// The route keys the editor by session user ID, discarding drafts on account change.
export function useProfileEditor(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);

  useEffect(() => {
    const request = ++generation.current;
    void profileService
      .getProfile(userId)
      .then((record) => {
        if (generation.current !== request) return;
        setProfile(record);
        setName(record.display_name ?? '');
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (generation.current !== request) return;
        setLoadError(safeMessage(error));
        setLoading(false);
      });
    return () => {
      generation.current = request + 1;
    };
  }, [userId, attempt]);

  function retry() {
    if (pending.current || loading) return;
    setLoading(true);
    setLoadError(null);
    setProfile(null);
    setSaveError(null);
    setAttempt((value) => value + 1);
  }
  function editName(value: string) {
    if (pending.current) return;
    setName(value);
    setSaveError(null);
  }
  function cancel() {
    if (pending.current || !profile) return;
    setName(profile.display_name ?? '');
    setSaveError(null);
  }
  async function save() {
    if (pending.current || loading || !profile || profile.id !== userId) return false;
    let values;
    try {
      values = validateProfileUpdate({ display_name: name });
    } catch (error) {
      setSaveError(safeMessage(error));
      return false;
    }
    if (values.display_name === profile.display_name) return false;
    const request = generation.current;
    pending.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await profileService.updateProfile(values, userId);
      if (generation.current !== request) return false;
      setProfile(saved);
      setName(saved.display_name ?? '');
      return true;
    } catch (error) {
      if (generation.current === request) setSaveError(safeMessage(error));
      return false;
    } finally {
      pending.current = false;
      if (generation.current === request) setSaving(false);
    }
  }
  const dirty = (name.trim() || null) !== profile?.display_name;
  return {
    profile,
    name,
    loading,
    saving,
    loadError,
    saveError,
    dirty,
    editName,
    cancel,
    retry,
    save,
  };
}
