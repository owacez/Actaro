import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import {
  AuthFrame,
  AuthText,
  AuthLink,
  AuthButton,
  AuthInput,
  AuthChoice,
  AuthLoading,
  AuthNotice,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { splitService } from './split-service';
import { splitPayload, weekdays, type SplitDraft } from './split-model';
import { WorkoutsScreen } from './workouts-screen';
type Page = Awaited<ReturnType<typeof splitService.list>>;
export function SplitsScreen({
  userId,
  id,
  onBack,
  onOpen,
  onSaved,
  onCreateWorkout,
}: {
  userId: string;
  id?: string;
  onBack: () => void;
  onOpen: (id: string) => void;
  onSaved: () => void;
  onCreateWorkout: () => void;
}) {
  const [newId] = useState(randomUUID),
    [draft, setDraft] = useState<SplitDraft | null>(null),
    [baseline, setBaseline] = useState('');
  const [page, setPage] = useState<Page | null>(null),
    [query, setQuery] = useState({ offset: 0 }),
    [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<number | null>(null),
    [discard, setDiscard] = useState(false),
    [deleting, setDeleting] = useState<Page['rows'][number] | null>(null);
  const generation = useRef(0),
    pending = useRef(false),
    alive = useRef(true);
  const { notify } = useAuthFeedback();
  const offset = query.offset;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!id) return;
    const request = ++generation.current;
    const operation =
      id === 'new'
        ? Promise.resolve<SplitDraft>({
            id: newId,
            name: '',
            active: true,
            days: weekdays.map(() => ({ isRest: false, workoutId: null, workoutName: null })),
          })
        : splitService.load(userId, id);
    void operation
      .then((result) => {
        if (request !== generation.current) return;
        if (!result) throw new Error('Unavailable');
        setDraft(result);
        setBaseline(JSON.stringify(result));
        setLoading(false);
      })
      .catch(() => {
        if (request === generation.current) {
          setError('Unable to load split. Retry or return to the list.');
          setLoading(false);
        }
      });
    return () => {
      generation.current = request + 1;
    };
  }, [id, userId, newId, attempt]);
  useFocusEffect(
    useCallback(() => {
      if (id) return;
      const request = ++generation.current;
      setLoading(true);
      setError(null);
      void splitService
        .list(userId, query.offset)
        .then((result) => {
          if (request === generation.current) {
            setPage(result);
            setLoading(false);
          }
        })
        .catch(() => {
          if (request === generation.current) {
            setError('Unable to load splits. Check your connection and retry.');
            setLoading(false);
          }
        });
      return () => {
        generation.current = request + 1;
      };
    }, [id, userId, query]),
  );
  const dirty = !!draft && JSON.stringify(draft) !== baseline;
  function refresh(next: number) {
    setLoading(true);
    setError(null);
    setQuery({ offset: next });
  }
  async function save() {
    if (!draft || pending.current) return;
    try {
      splitPayload(draft);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check all seven days.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await splitService.save(userId, draft);
      if (alive.current) {
        notify('Training split saved.', 'success');
        onSaved();
      }
    } catch {
      if (alive.current) setError('Unable to save split. Your draft is kept; retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function remove() {
    if (!deleting || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await splitService.remove(userId, deleting.id);
      if (alive.current) {
        setDeleting(null);
        notify('Training split deleted.', 'success');
        refresh(page?.rows.length === 1 && offset > 0 ? offset - 10 : offset);
      }
    } catch {
      if (alive.current) setError('Unable to delete split. Retry.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  if (picking !== null && draft)
    return (
      <WorkoutsScreen
        userId={userId}
        selecting
        selectionTitle={`${weekdays[picking]} workout`}
        selectionDescription="Choose a saved workout or create one for this day. Save the split to keep the assignment."
        backTitle="← Back to split"
        onBack={() => setPicking(null)}
        onCreate={onCreateWorkout}
        onEdit={(workoutId, workoutName) => {
          setDraft((current) =>
            current
              ? {
                  ...current,
                  days: current.days.map((day, index) =>
                    index === picking ? { isRest: false, workoutId, workoutName } : day,
                  ),
                }
              : current,
          );
          setPicking(null);
          setError(null);
        }}
      />
    );
  return (
    <AuthFrame>
      <AuthLink
        title={id ? '← Training splits' : '← My workouts'}
        disabled={busy}
        onPress={() => (dirty ? setDiscard(true) : onBack())}
      />
      <AuthText kind="heading">
        {id === 'new' ? 'Create training split' : id ? 'Edit training split' : 'Training splits'}
      </AuthText>
      <AuthText>
        A recurring seven-day schedule. Rest days are part of the plan; saved workouts and past logs
        stay independent.
      </AuthText>
      {error && <AuthNotice error>{error}</AuthNotice>}
      {loading ? (
        <AuthLoading>Loading split…</AuthLoading>
      ) : id ? (
        draft ? (
          <>
            {discard && (
              <>
                <AuthText>Discard these unsaved split changes?</AuthText>
                <AuthButton
                  title="Keep editing"
                  outlined
                  disabled={busy}
                  onPress={() => setDiscard(false)}
                />
                <AuthButton title="Discard split changes" disabled={busy} onPress={onBack} />
              </>
            )}
            <AuthInput
              label="Split name"
              value={draft.name}
              maxLength={100}
              editable={!busy}
              onChangeText={(name) => setDraft({ ...draft, name })}
            />
            <AuthChoice
              title="Use this as my active split"
              selected={draft.active}
              disabled={busy}
              onPress={() => setDraft({ ...draft, active: !draft.active })}
            />
            {draft.days.map((day, index) => (
              <View key={weekdays[index]} style={{ gap: 8 }}>
                <AuthText kind="eyebrow">{weekdays[index]}</AuthText>
                <AuthText>
                  {day.isRest
                    ? 'Rest day'
                    : day.workoutId
                      ? (day.workoutName ?? 'Saved workout')
                      : 'Choose a workout or rest (a previous workout may have been deleted).'}
                </AuthText>
                <View style={authStyles.row}>
                  <AuthLink
                    title={`Choose ${weekdays[index]} workout`}
                    disabled={busy}
                    onPress={() => setPicking(index)}
                  />
                  <AuthChoice
                    title={`Rest on ${weekdays[index]}`}
                    selected={day.isRest}
                    disabled={busy}
                    onPress={() =>
                      setDraft({
                        ...draft,
                        days: draft.days.map((value, position) =>
                          position === index
                            ? { isRest: true, workoutId: null, workoutName: null }
                            : value,
                        ),
                      })
                    }
                  />
                </View>
              </View>
            ))}
            <AuthButton
              title="Save split"
              busy={busy}
              disabled={!dirty}
              onPress={() => void save()}
            />
          </>
        ) : (
          <AuthButton
            title="Retry split"
            onPress={() => {
              setLoading(true);
              setError(null);
              setAttempt((n) => n + 1);
            }}
          />
        )
      ) : (
        <>
          <AuthButton title="Create split" onPress={() => onOpen('new')} disabled={busy} />
          {!page?.rows.length && <AuthText>No saved splits yet.</AuthText>}
          {page?.rows.map((row) => (
            <View key={row.id} style={{ gap: 8 }}>
              <AuthLink
                title={`${row.name}${row.is_active ? ' · Active' : ''}`}
                disabled={busy}
                onPress={() => onOpen(row.id)}
              />
              <AuthLink
                title={`Delete split ${row.name}`}
                disabled={busy}
                onPress={() => setDeleting(row)}
              />
              {deleting?.id === row.id && (
                <>
                  <AuthText>
                    Delete “{row.name}”? Workouts and recorded sessions will stay.
                  </AuthText>
                  <AuthButton
                    title="Keep split"
                    outlined
                    disabled={busy}
                    onPress={() => setDeleting(null)}
                  />
                  <AuthButton title="Delete split" busy={busy} onPress={() => void remove()} />
                </>
              )}
            </View>
          ))}
          {error && <AuthButton title="Retry splits" onPress={() => refresh(offset)} />}
          <AuthButton
            title="Previous splits"
            outlined
            disabled={busy || offset === 0}
            onPress={() => refresh(Math.max(0, offset - 10))}
          />
          <AuthText>Page {offset / 10 + 1}</AuthText>
          <AuthButton
            title="Next splits"
            outlined
            disabled={busy || !page?.more}
            onPress={() => refresh(offset + 10)}
          />
        </>
      )}
    </AuthFrame>
  );
}
