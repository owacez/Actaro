import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { workoutService } from './workout-service';
type Page = Awaited<ReturnType<typeof workoutService.list>>;
export function WorkoutsScreen({
  userId,
  onBack,
  onCreate,
  onEdit,
  selecting = false,
  selectionTitle = 'Add to workout',
  selectionDescription = 'Choose a saved workout or create one. The selected exercise is added to its draft; save the workout to keep it.',
  backTitle = '← Exercise Library',
  onSplits,
  onPlans,
}: {
  userId: string;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string, name: string) => void;
  selecting?: boolean;
  selectionTitle?: string;
  selectionDescription?: string;
  backTitle?: string;
  onSplits?: () => void;
  onPlans?: () => void;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [query, setQuery] = useState({ offset: 0 });
  const [selected, setSelected] = useState<Page['rows'][number] | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const pending = useRef(false),
    alive = useRef(true);
  const { notify } = useAuthFeedback();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const offset = query.offset;
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(false);
  const generation = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const request = ++generation.current;
      void workoutService
        .list(userId, query.offset)
        .then((result) => {
          if (request === generation.current) {
            setPage(result);
            setLoading(false);
            setError(false);
          }
        })
        .catch(() => {
          if (request === generation.current) {
            setError(true);
            setLoading(false);
          }
        });
      return () => {
        generation.current = request + 1;
      };
    }, [userId, query]),
  );
  function refresh(next: number) {
    setLoading(true);
    setError(false);
    setQuery({ offset: next });
  }
  async function remove() {
    if (!selected || pending.current) return;
    pending.current = true;
    setRemoving(true);
    setDeleteError(null);
    try {
      await workoutService.remove(userId, selected.id);
      if (!alive.current) return;
      setSelected(null);
      notify('Workout deleted.', 'success');
      refresh(page?.rows.length === 1 && offset > 0 ? offset - 10 : offset);
    } catch (reason) {
      if (alive.current)
        setDeleteError(
          reason instanceof Error ? reason.message : 'Unable to delete workout. Retry.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setRemoving(false);
    }
  }
  return (
    <AuthFrame>
      <AuthLink title={backTitle} disabled={removing} onPress={onBack} />
      <AuthText kind="heading">{selecting ? selectionTitle : 'My workouts'}</AuthText>
      {selecting && <AuthText>{selectionDescription}</AuthText>}
      <AuthButton title="Create workout" disabled={removing} onPress={onCreate} />
      {!selecting && onSplits && (
        <AuthLink title="Training splits" disabled={removing} onPress={onSplits} />
      )}
      {!selecting && onPlans && (
        <AuthLink title="Training plans" disabled={removing} onPress={onPlans} />
      )}
      {loading ? (
        <AuthLoading>Loading workouts…</AuthLoading>
      ) : error ? (
        <>
          <AuthNotice error>Unable to load workouts. Check your connection and retry.</AuthNotice>
          <AuthButton title="Retry" onPress={() => refresh(offset)} />
        </>
      ) : (
        <>
          {!page?.rows.length && (
            <AuthText>No saved workouts yet. Create your first workout.</AuthText>
          )}
          {page?.rows.map((row) => (
            <View key={row.id} style={{ gap: 8 }}>
              <AuthLink
                title={`${row.name} · ${row.workout_template_exercises[0]?.count ?? 0} exercises`}
                disabled={removing}
                onPress={() => onEdit(row.id, row.name)}
              />
              {!selecting && (
                <AuthLink
                  title={`Delete ${row.name}`}
                  disabled={removing}
                  onPress={() => {
                    setSelected(row);
                    setDeleteError(null);
                  }}
                />
              )}
              {selected?.id === row.id && (
                <>
                  <AuthText>
                    Delete “{selected.name}”? Its planned exercises and sets will be removed.
                    Recorded sessions stay in your history.
                  </AuthText>
                  {deleteError && <AuthNotice error>{deleteError}</AuthNotice>}
                  <AuthButton
                    title="Keep workout"
                    outlined
                    disabled={removing}
                    onPress={() => {
                      setSelected(null);
                      setDeleteError(null);
                    }}
                  />
                  <AuthButton
                    title="Delete workout"
                    busy={removing}
                    onPress={() => void remove()}
                  />
                </>
              )}
            </View>
          ))}
          <AuthButton
            title="Previous workouts"
            outlined
            disabled={removing || offset === 0}
            onPress={() => refresh(Math.max(0, offset - 10))}
          />
          <AuthText>Page {offset / 10 + 1}</AuthText>
          <AuthButton
            title="Next workouts"
            outlined
            disabled={removing || !page?.more}
            onPress={() => refresh(offset + 10)}
          />
        </>
      )}
    </AuthFrame>
  );
}
