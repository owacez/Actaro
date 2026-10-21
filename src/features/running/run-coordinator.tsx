import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/features/auth/auth-provider';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { runTracker } from './run-tracker';

export function RunCoordinator() {
  const { session, initializing, recovery } = useAuth();
  const { notify } = useAuthFeedback();
  const userId = recovery ? undefined : session?.user.id;
  useEffect(() => {
    if (initializing) return;
    void runTracker
      .setOwner(userId)
      .catch(() =>
        notify(
          'Run tracking could not be restored. Open Running and retry before starting another run.',
          'error',
        ),
      );
    const unsubscribe = runTracker.subscribeProblems((value) => {
      if (value && value.userId === userId) notify(value.message, 'error');
    });
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'background' && userId)
        void runTracker
          .backgrounded(userId)
          .catch(() =>
            notify(
              'Unable to pause your run. Return to Running and check device storage.',
              'error',
            ),
          );
    });
    return () => {
      unsubscribe();
      listener.remove();
    };
  }, [initializing, userId, notify]);
  return null;
}
