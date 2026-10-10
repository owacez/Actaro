import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { getSupabase, startSupabaseSessionRefresh } from '@/lib/supabase/client';

type AuthContextValue = {
  session: Session | null;
  initializing: boolean;
  error: string | null;
  recovery: boolean;
  finishRecovery: () => void;
  retry: () => void;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    let cleanup: (() => void) | undefined;
    void Promise.resolve()
      .then(() => {
        if (!active) return;
        const client = getSupabase();
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((event, nextSession) => {
          if (!active) return;
          receivedEvent = true;
          setSession(nextSession);
          if (event === 'PASSWORD_RECOVERY') setRecovery(true);
          if (event === 'SIGNED_OUT') setRecovery(false);
          setInitializing(false);
        });
        cleanup = () => subscription.unsubscribe();
        const stopRefresh = startSupabaseSessionRefresh();
        cleanup = () => {
          subscription.unsubscribe();
          stopRefresh?.();
        };
        void client.auth
          .getSession()
          .then(({ data, error: restoreError }) => {
            if (!active) return;
            // A newer auth event takes precedence over an older restoration result.
            if (!receivedEvent) setSession(data.session);
            if (restoreError && !receivedEvent)
              setError('Unable to restore your session. Please retry.');
            setInitializing(false);
          })
          .catch(() => {
            if (!active) return;
            if (!receivedEvent) setError('Unable to restore your session. Please retry.');
            setInitializing(false);
          });
      })
      .catch(() => {
        if (!active) return;
        setError('Authentication is unavailable. Check the app configuration and retry.');
        setInitializing(false);
      });
    return () => {
      active = false;
      cleanup?.();
    };
  }, [attempt]);

  function retry() {
    setError(null);
    setInitializing(true);
    setAttempt((value) => value + 1);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        initializing,
        error,
        recovery,
        finishRecovery: () => setRecovery(false),
        retry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
