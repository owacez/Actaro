import { useEffect, useState } from 'react';
import { runStore } from './run-store';
import { runTracker } from './run-tracker';
import type { RunDraft } from './run-model';

export function useRunDraft(userId: string) {
  const [draft, setDraft] = useState<RunDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let active = true;
    let changed = false;
    const unsubscribe = runStore.subscribe((owner, value) => {
      if (owner === userId) {
        changed = true;
        setDraft(value);
        setLoadedOwner(userId);
        setLoading(false);
      }
    });
    void runStore
      .read(userId)
      .then((value) => {
        if (active && !changed) {
          setDraft(value);
          setLoadedOwner(userId);
          setLoading(false);
          setError(runTracker.problem(userId));
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to read your saved run. Keep device storage and retry.');
          setLoadedOwner(userId);
          setLoading(false);
        }
      });
    const errors = runTracker.subscribeProblems((value) => {
      if (!value || value.userId === userId) setError(value?.message ?? null);
    });
    return () => {
      active = false;
      unsubscribe();
      errors();
    };
  }, [userId, attempt]);
  useEffect(() => {
    if (draft?.userId !== userId || draft.status !== 'recording') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [draft?.userId, draft?.status, userId]);
  return {
    draft: draft?.userId === userId ? draft : null,
    loading: loading || loadedOwner !== userId,
    error: loadedOwner === userId ? error : null,
    now,
    retry: () => {
      setLoading(true);
      setError(null);
      setAttempt((value) => value + 1);
    },
  };
}
