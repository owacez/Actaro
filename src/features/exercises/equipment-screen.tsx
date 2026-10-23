import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { exerciseService, type CatalogEntry } from './exercise-service';

export function EquipmentScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [saved, setSaved] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const pending = useRef(false);
  const { notify } = useAuthFeedback();
  useEffect(() => {
    const request = ++generation.current;
    void Promise.all([exerciseService.catalogs(), exerciseService.equipmentProfile(userId)])
      .then(([reference, ids]) => {
        if (request !== generation.current) return;
        setCatalog(reference.equipment);
        setSaved(ids);
        setSelected(ids);
        setLoading(false);
      })
      .catch(() => {
        if (request !== generation.current) return;
        setError('Unable to load equipment. Check your connection and retry.');
        setLoading(false);
      });
    return () => {
      generation.current = request + 1;
    };
  }, [userId, attempt]);
  const dirty = saved !== null && [...saved].sort().join(',') !== [...selected].sort().join(',');
  async function save() {
    if (pending.current || !dirty) return;
    pending.current = true;
    setSaving(true);
    setError(null);
    const request = generation.current;
    try {
      const ids = await exerciseService.saveEquipment(selected, userId);
      if (request !== generation.current) return;
      setSaved(ids);
      setSelected(ids);
      notify('Equipment saved.', 'success');
      onBack();
    } catch {
      if (request === generation.current)
        setError('Unable to save equipment. Your selection is kept; try again.');
    } finally {
      pending.current = false;
      if (request === generation.current) setSaving(false);
    }
  }
  return (
    <AuthFrame>
      <AuthLink title="← Exercise Library" disabled={saving} onPress={onBack} />
      <AuthText kind="heading">My equipment</AuthText>
      <AuthText>
        Select equipment available to you. No equipment exercises are always included when filtering
        by your setup.
      </AuthText>
      {loading ? (
        <AuthLoading>Loading equipment…</AuthLoading>
      ) : saved === null ? (
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
          <AuthText>{selected.length} selected</AuthText>
          <AuthInput
            label="Find equipment"
            value={query}
            onChangeText={setQuery}
            editable={!saving}
          />
          <View style={authStyles.choices}>
            {catalog
              .filter((item) => item.name.toLowerCase().includes(query.toLowerCase().trim()))
              .sort(
                (a, b) =>
                  Number(selected.includes(b.id)) - Number(selected.includes(a.id)) ||
                  a.name.localeCompare(b.name),
              )
              .map((item) => (
                <AuthChoice
                  key={item.id}
                  title={item.name}
                  selected={selected.includes(item.id)}
                  disabled={saving}
                  onPress={() => {
                    setError(null);
                    setSelected((current) =>
                      current.includes(item.id)
                        ? current.filter((id) => id !== item.id)
                        : [...current, item.id],
                    );
                  }}
                />
              ))}
          </View>
          <AuthButton
            title="Select all equipment"
            outlined
            disabled={saving}
            onPress={() => setSelected(catalog.map((item) => item.id))}
          />
          <AuthButton
            title="No equipment"
            outlined
            disabled={saving}
            onPress={() => setSelected([])}
          />
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthButton
            title="Save equipment"
            busy={saving}
            disabled={!dirty}
            onPress={() => void save()}
          />
          <AuthButton
            title="Discard changes"
            outlined
            disabled={!dirty || saving}
            onPress={() => {
              setSelected(saved);
              setError(null);
            }}
          />
        </>
      )}
    </AuthFrame>
  );
}
