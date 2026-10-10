import type { Tables, TablesUpdate } from '@/lib/supabase/database.types';

export type Profile = Tables<'profiles'>;
export type Preferences = Tables<'user_preferences'>;
export type ProfileUpdate = Pick<TablesUpdate<'profiles'>, 'display_name'>;
export type PreferencesUpdate = Partial<{
  weight_unit: 'kg' | 'lb';
  length_unit: 'cm' | 'in';
  distance_unit: 'km' | 'mi';
  energy_unit: 'kcal' | 'kJ';
  theme: 'system' | 'light' | 'dark';
  time_zone: string;
  notifications_enabled: boolean;
  gamification_enabled: boolean;
}>;

export class ProfileError extends Error {
  constructor(
    public readonly code: 'AUTH_REQUIRED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'REQUEST_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}

function invalid(message: string): never {
  throw new ProfileError('INVALID_INPUT', message);
}

function checkFields(
  patch: unknown,
  allowed: readonly string[],
): asserts patch is Record<string, unknown> {
  if (typeof patch !== 'object' || patch === null || Array.isArray(patch)) {
    invalid('Provide the fields you want to update.');
  }
  const keys = Object.keys(patch);
  if (!keys.length) invalid('Choose at least one field to update.');
  if (keys.some((key) => !allowed.includes(key))) invalid('This field cannot be updated.');
}

export function validateProfileUpdate(patch: unknown): ProfileUpdate {
  checkFields(patch, ['display_name']);
  const name = patch.display_name;
  if (name === null) return { display_name: null };
  if (typeof name !== 'string') invalid('Enter a display name or clear it.');
  const trimmed = name.trim();
  if (Array.from(trimmed).length > 80) invalid('Use a display name of 80 characters or fewer.');
  return { display_name: trimmed || null };
}

function choice<const T extends string>(value: unknown, allowed: readonly T[], message: string): T {
  const selected = allowed.find((option) => option === value);
  if (selected === undefined) invalid(message);
  return selected;
}

export function validatePreferencesUpdate(patch: unknown): PreferencesUpdate {
  checkFields(patch, [
    'weight_unit',
    'length_unit',
    'distance_unit',
    'energy_unit',
    'theme',
    'time_zone',
    'notifications_enabled',
    'gamification_enabled',
  ]);
  const values: PreferencesUpdate = {};
  if ('weight_unit' in patch) {
    values.weight_unit = choice(patch.weight_unit, ['kg', 'lb'], 'Choose kg or lb for weight.');
  }
  if ('length_unit' in patch) {
    values.length_unit = choice(patch.length_unit, ['cm', 'in'], 'Choose cm or in for length.');
  }
  if ('distance_unit' in patch) {
    values.distance_unit = choice(
      patch.distance_unit,
      ['km', 'mi'],
      'Choose km or mi for distance.',
    );
  }
  if ('energy_unit' in patch) {
    values.energy_unit = choice(patch.energy_unit, ['kcal', 'kJ'], 'Choose kcal or kJ for energy.');
  }
  if ('theme' in patch) {
    values.theme = choice(
      patch.theme,
      ['system', 'light', 'dark'],
      'Choose system, light or dark for theme.',
    );
  }
  for (const field of ['notifications_enabled', 'gamification_enabled'] as const) {
    if (field in patch) {
      const enabled = patch[field];
      if (typeof enabled !== 'boolean') invalid('Choose enabled or disabled for this preference.');
      values[field] = enabled;
    }
  }
  if ('time_zone' in patch) {
    if (typeof patch.time_zone !== 'string' || !patch.time_zone.trim()) {
      invalid('Choose a valid time zone.');
    }
    const zone = patch.time_zone.trim();
    // IANA names and UTC only; a bare offset is not a PostgreSQL zone name.
    if (zone !== 'UTC' && !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+)+$/.test(zone)) {
      invalid('Choose a valid time zone.');
    }
    try {
      new Intl.DateTimeFormat('en', { timeZone: zone });
    } catch {
      invalid('Choose a valid time zone.');
    }
    values.time_zone = zone;
  }
  return values;
}
