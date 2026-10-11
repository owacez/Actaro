import { createContext, useContext } from 'react';

import { actaroColors } from '@/constants/actaro-theme';
import type { Preferences, PreferencesUpdate } from './profile-model';

export type ThemePreference = NonNullable<PreferencesUpdate['theme']>;
export type SavedTheme = Pick<Preferences, 'user_id' | 'theme'>;

export const ThemeContext = createContext<{
  colors: typeof actaroColors;
  scheme: 'light' | 'dark';
  applySavedPreferences: (record: SavedTheme) => void;
}>({ colors: actaroColors, scheme: 'light', applySavedPreferences: () => {} });

export function useAppTheme() {
  return useContext(ThemeContext);
}
