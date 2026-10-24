import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { ReactNode } from 'react';
import { ActionRow, ActionSheet, IconButton, ScreenHeader } from '@/components/product-ui';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthFrame,
  AuthCard,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { workoutService } from './workout-service';
import { ScheduledTraining } from './scheduled-training';
import { plural } from '@/lib/format';
type Page = Awaited<ReturnType<typeof workoutService.list>>;
export function WorkoutsScreen({
  userId,
  navigation,
  onBack,
  onCreate,
  onEdit,
  selecting = false,
  selectionTitle = 'Add to workout',
  selectionDescription = 'Choose a saved workout or create one. The selected exercise is added to its draft; save the workout to keep it.',
  backTitle = '← Train',
  onSplits,
  onPlans,
  onStart,
  onResume,
  onHistory,
  onTraining,
}: {
  userId: string;
  navigation?: ReactNode;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string, name: string) => void;
  selecting?: boolean;
  selectionTitle?: string;
  selectionDescription?: string;
  backTitle?: string;
  onSplits?: () => void;
  onPlans?: () => void;
  onStart?: (id: string) => void;
  onResume?: () => void;
  onHistory?: () => void;
  onTraining?: () => void;
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
    <AuthFrame header={<ScreenHeader title={selecting ? selectionTitle : 'Train'} />}>
      {navigation ?? <AuthLink title={backTitle} disabled={removing} onPress={onBack} />}
      {selecting && <AuthText>{selectionDescription}</AuthText>}
      {navigation && !selecting && onStart && (
        <ScheduledTraining userId={userId} onStart={onStart} onResume={onResume} />
      )}
      <AuthText kind="heading">Your workouts</AuthText>
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
            <AuthCard>
              <AuthText kind="heading">Build your first workout</AuthText>
              <AuthText>Choose exercises from the library, then set your own targets.</AuthText>
            </AuthCard>
          )}
          {page?.rows.map((row) => (
            <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <ActionRow
                  title={row.name}
                  detail={plural(row.workout_template_exercises[0]?.count ?? 0, 'exercise')}
                  icon={{ ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }}
                  disabled={removing}
                  onPress={() => onEdit(row.id, row.name)}
                />
              </View>
              {!selecting && (
                <View style={{ flexDirection: 'row' }}>
                  {onStart && (
                    <IconButton
                      label={'Start ' + row.name}
                      name={{ ios: 'play', android: 'play_arrow', web: 'play_arrow' }}
                      disabled={removing}
                      onPress={() => onStart(row.id)}
                    />
                  )}
                  <IconButton
                    label={'Delete ' + row.name}
                    name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
                    disabled={removing}
                    onPress={() => {
                      setSelected(row);
                      setDeleteError(null);
                    }}
                  />
                </View>
              )}
            </View>
          ))}
          {(offset > 0 || page?.more) && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AuthLink
                title="Previous workouts"
                disabled={removing || offset === 0}
                onPress={() => refresh(Math.max(0, offset - 10))}
              />
              <AuthText>Page {offset / 10 + 1}</AuthText>
              <AuthLink
                title="Next workouts"
                disabled={removing || !page?.more}
                onPress={() => refresh(offset + 10)}
              />
            </View>
          )}
        </>
      )}
      <ActionRow
        title="Create workout"
        detail="Build from the library"
        disabled={removing}
        icon={{ ios: 'plus', android: 'add', web: 'add' }}
        onPress={onCreate}
      />
      {!selecting && (
        <>
          <AuthText kind="heading">Plan and review</AuthText>
          <AuthCard>
            {onSplits && (
              <ActionRow title="Training splits" onPress={onSplits} disabled={removing} />
            )}
            {onPlans && <ActionRow title="Training plans" onPress={onPlans} disabled={removing} />}
            {onResume && (
              <ActionRow title="Resume saved workout" onPress={onResume} disabled={removing} />
            )}
            {onHistory && (
              <ActionRow title="Workout history" onPress={onHistory} disabled={removing} />
            )}
            {onTraining && (
              <ActionRow title="Training summary" onPress={onTraining} disabled={removing} />
            )}
          </AuthCard>
        </>
      )}
      <ActionSheet
        title="Delete workout?"
        visible={!!selected}
        onClose={() => {
          if (!removing) setSelected(null);
        }}
      >
        <AuthText>
          Delete “{selected?.name}”? Planned exercises and sets are removed. Recorded sessions stay
          in your history.
        </AuthText>
        {deleteError && <AuthNotice error>{deleteError}</AuthNotice>}
        <AuthButton
          title="Keep workout"
          outlined
          disabled={removing}
          onPress={() => setSelected(null)}
        />
        <AuthButton title="Delete workout" busy={removing} onPress={() => void remove()} />
      </ActionSheet>
    </AuthFrame>
  );
}
