import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { actaroColors, actaroDarkColors } from '@/constants/actaro-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { validatePreferencesUpdate } from './profile-model';
import { profileService } from './profile-service';
import { ThemeContext, type SavedTheme, type ThemePreference } from './theme-context';

export function AppThemeProvider({ userId, children }: PropsWithChildren<{ userId?: string }>) {
  const systemScheme = useColorScheme();
  const [saved, setSaved] = useState<{ userId?: string; theme: ThemePreference }>({
    userId,
    theme: 'system',
  });
  if (saved.userId !== userId) setSaved({ userId, theme: 'system' });
  const activeUser = useRef(userId);
  const generation = useRef(0);

  useLayoutEffect(() => {
    activeUser.current = userId;
    return () => {
      activeUser.current = undefined;
      generation.current += 1;
    };
  }, [userId]);

  const applySavedPreferences = useCallback((record: SavedTheme) => {
    if (record.user_id !== activeUser.current) return;
    const { theme } = validatePreferencesUpdate({ theme: record.theme });
    if (!theme) return;
    // A confirmed save/load supersedes an older request for the same account.
    generation.current += 1;
    setSaved({ userId: record.user_id, theme });
  }, []);

  useEffect(() => {
    const request = ++generation.current;
    if (userId) {
      void profileService
        .getPreferences(userId)
        .then((record) => {
          if (request === generation.current) applySavedPreferences(record);
        })
        // Theme loading must not prevent sign-in. Preferences exposes retry/error UI.
        .catch(() => {});
    }
    return () => {
      generation.current += 1;
    };
  }, [userId, applySavedPreferences]);

  const preference = saved && saved.userId === userId ? saved.theme : 'system';
  const scheme =
    preference === 'dark' || (preference === 'system' && systemScheme === 'dark')
      ? 'dark'
      : 'light';
  const colors = scheme === 'dark' ? actaroDarkColors : actaroColors;

  return (
    <ThemeContext.Provider value={{ colors, scheme, applySavedPreferences }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}
