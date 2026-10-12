import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { workoutService } from './workout-service';
type Page = Awaited<ReturnType<typeof workoutService.list>>;
export function WorkoutsScreen({
  userId,
  onBack,
  onCreate,
  onEdit,
}: {
  userId: string;
  onBack: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [query, setQuery] = useState({ offset: 0 });
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
  return (
    <AuthFrame>
      <AuthLink title="← Exercise Library" onPress={onBack} />
      <AuthText kind="heading">My workouts</AuthText>
      <AuthButton title="Create workout" onPress={onCreate} />
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
            <AuthLink
              key={row.id}
              title={`${row.name} · ${row.workout_template_exercises[0]?.count ?? 0} exercises`}
              onPress={() => onEdit(row.id)}
            />
          ))}
          <AuthButton
            title="Previous workouts"
            outlined
            disabled={offset === 0}
            onPress={() => refresh(Math.max(0, offset - 10))}
          />
          <AuthText>Page {offset / 10 + 1}</AuthText>
          <AuthButton
            title="Next workouts"
            outlined
            disabled={!page?.more}
            onPress={() => refresh(offset + 10)}
          />
        </>
      )}
    </AuthFrame>
  );
}
