import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { AuthSessionMissingError, createClient, type User } from '@supabase/supabase-js';

import {
  validatePreferencesUpdate,
  validateProfileUpdate,
  type Preferences,
  type Profile,
} from '@/features/profile/profile-model';
import { profileService } from '@/features/profile/profile-service';
import type { Database } from '@/lib/supabase/database.types';

const owner = '00000000-0000-4000-8000-000000000001';
const user: User = {
  id: owner,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};
const profile: Profile = {
  id: owner,
  display_name: null,
  created_at: user.created_at,
  updated_at: user.created_at,
};
const preferences: Preferences = {
  user_id: owner,
  weight_unit: 'kg',
  length_unit: 'cm',
  distance_unit: 'km',
  energy_unit: 'kcal',
  time_zone: 'UTC',
  theme: 'system',
  notifications_enabled: false,
  gamification_enabled: false,
  created_at: user.created_at,
  updated_at: user.created_at,
};

const mockFetch = jest.fn<typeof fetch>();
function createTestClient() {
  return createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: mockFetch },
  });
}
let mockClient: ReturnType<typeof createTestClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  mockClient = createTestClient();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('reads each record with the Auth user as an explicit owner filter', async () => {
  mockFetch.mockResolvedValueOnce(respond([profile])).mockResolvedValueOnce(respond([preferences]));
  await expect(profileService.getProfile()).resolves.toEqual(profile);
  await expect(profileService.getPreferences()).resolves.toEqual(preferences);
  const profileUrl = new URL(String(mockFetch.mock.calls[0][0]));
  const preferencesUrl = new URL(String(mockFetch.mock.calls[1][0]));
  expect(profileUrl.pathname).toBe('/rest/v1/profiles');
  expect(profileUrl.searchParams.get('id')).toBe(`eq.${owner}`);
  expect(preferencesUrl.pathname).toBe('/rest/v1/user_preferences');
  expect(preferencesUrl.searchParams.get('user_id')).toBe(`eq.${owner}`);
});

test('saves a trimmed display name and returns the actual server timestamp', async () => {
  const saved = { ...profile, display_name: 'Athlete', updated_at: '2026-01-02T00:00:00Z' };
  mockFetch.mockResolvedValueOnce(respond(saved));
  await expect(profileService.updateProfile({ display_name: ' Athlete ' })).resolves.toEqual(saved);
  const [input, init] = mockFetch.mock.calls[0];
  const url = new URL(String(input));
  expect(init?.method).toBe('PATCH');
  expect(init?.body).toBe(JSON.stringify({ display_name: 'Athlete' }));
  expect(url.searchParams.get('id')).toBe(`eq.${owner}`);
  expect(url.searchParams.get('select')).toBe('*');
});

test('sends only changed preferences and returns saved server values', async () => {
  const changes = { weight_unit: 'lb', theme: 'dark', notifications_enabled: true } as const;
  mockFetch.mockResolvedValueOnce(respond({ ...preferences, ...changes }));
  await expect(profileService.updatePreferences(changes)).resolves.toEqual({
    ...preferences,
    ...changes,
  });
  const [input, init] = mockFetch.mock.calls[0];
  expect(init?.method).toBe('PATCH');
  expect(init?.body).toBe(JSON.stringify(changes));
  expect(new URL(String(input)).searchParams.get('user_id')).toBe(`eq.${owner}`);
});

test('rejects attempted owner and timestamp injection before making any request', async () => {
  const injectedProfile = { display_name: 'Athlete', id: 'other-user' };
  const injectedPreferences = { theme: 'dark', updated_at: 'spoofed' } as const;
  await expect(profileService.updateProfile(injectedProfile)).rejects.toMatchObject({
    code: 'INVALID_INPUT',
  });
  await expect(profileService.updatePreferences(injectedPreferences)).rejects.toMatchObject({
    code: 'INVALID_INPUT',
  });
  expect(mockClient.auth.getUser).not.toHaveBeenCalled();
  expect(mockFetch).not.toHaveBeenCalled();
});

test('does not query or update records without a session', async () => {
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({
    data: { user: null },
    error: new AuthSessionMissingError(),
  });
  for (const request of [
    () => profileService.getProfile(),
    () => profileService.getPreferences(),
    () => profileService.updateProfile({ display_name: 'Athlete' }),
    () => profileService.updatePreferences({ theme: 'dark' }),
  ]) {
    await expect(request()).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
  }
  expect(mockFetch).not.toHaveBeenCalled();
});

test('authentication verification network errors stay safe and block data requests', async () => {
  jest.spyOn(mockClient.auth, 'getUser').mockRejectedValue(new Error('private diagnostic'));
  await expect(profileService.getProfile()).rejects.toMatchObject({
    code: 'REQUEST_FAILED',
    message: 'Unable to complete this request. Try again.',
  });
  expect(mockFetch).not.toHaveBeenCalled();
});

test('a missing read and a zero-row update are not reported as successful', async () => {
  mockFetch.mockResolvedValueOnce(respond([]));
  await expect(profileService.getProfile()).rejects.toMatchObject({ code: 'NOT_FOUND' });
  // This SDK requests arrays for maybeSingle on both reads and mutations.
  mockFetch.mockResolvedValueOnce(respond([]));
  await expect(profileService.updatePreferences({ theme: 'dark' })).rejects.toMatchObject({
    code: 'NOT_FOUND',
  });
  expect(mockFetch.mock.calls.map(([, init]) => init?.method)).toEqual(['GET', 'PATCH']);
});

test('resolves identity again after an account switch without caching private records', async () => {
  const otherUser = { ...user, id: '00000000-0000-4000-8000-000000000002' };
  jest
    .spyOn(mockClient.auth, 'getUser')
    .mockResolvedValueOnce({ data: { user }, error: null })
    .mockResolvedValueOnce({ data: { user: otherUser }, error: null });
  mockFetch
    .mockResolvedValueOnce(respond([profile]))
    .mockResolvedValueOnce(respond([{ ...profile, id: otherUser.id }]));
  await profileService.getProfile();
  await expect(profileService.getProfile()).resolves.toMatchObject({ id: otherUser.id });
  expect(new URL(String(mockFetch.mock.calls[1][0])).searchParams.get('id')).toBe(
    `eq.${otherUser.id}`,
  );
});

test('clearing a name persists null rather than a blank value', async () => {
  mockFetch.mockResolvedValueOnce(respond([profile]));
  await expect(profileService.updateProfile({ display_name: '  ' })).resolves.toEqual(profile);
  expect(mockFetch.mock.calls[0][1]?.body).toBe(JSON.stringify({ display_name: null }));
});

test('multiple returned rows fail safely instead of selecting an arbitrary account', async () => {
  mockFetch.mockResolvedValueOnce(respond([profile, { ...profile, id: 'other-user' }]));
  await expect(profileService.getProfile()).rejects.toMatchObject({ code: 'REQUEST_FAILED' });
});

test.each([403, 400])('a denied/invalid write (%s) hides server diagnostics', async (status) => {
  mockFetch.mockResolvedValueOnce(
    respond({ code: '42501', message: 'private diagnostic', details: 'private row' }, status),
  );
  await expect(profileService.updateProfile({ display_name: 'Athlete' })).rejects.toMatchObject({
    code: 'REQUEST_FAILED',
    message: 'Unable to load or save your data. Try again.',
  });
});

test('a rejected mutation transport cannot produce a successful save', async () => {
  mockFetch.mockRejectedValueOnce(new Error('network unavailable'));
  await expect(profileService.updatePreferences({ theme: 'dark' })).rejects.toMatchObject({
    code: 'REQUEST_FAILED',
  });
});

test('validates optional names with Unicode character counts and clearing', () => {
  expect(validateProfileUpdate({ display_name: '   ' })).toEqual({ display_name: null });
  expect(validateProfileUpdate({ display_name: null })).toEqual({ display_name: null });
  expect(validateProfileUpdate({ display_name: '🏋'.repeat(80) })).toEqual({
    display_name: '🏋'.repeat(80),
  });
  expect(() => validateProfileUpdate({ display_name: '🏋'.repeat(81) })).toThrow('80 characters');
});

test.each([
  null,
  [],
  {},
  { display_name: undefined },
  { display_name: 12 },
  { created_at: 'spoofed' },
])('rejects malformed profile patches: %j', (patch) => {
  expect(() => validateProfileUpdate(patch)).toThrow();
});

test.each([
  null,
  [],
  {},
  { weight_unit: 'stone' },
  { length_unit: 'm' },
  { distance_unit: 'm' },
  { energy_unit: 'kj' },
  { theme: 'blue' },
  { theme: undefined },
  { time_zone: 'Mars/Olympus' },
  { time_zone: '+01:00' },
  { time_zone: null },
  { notifications_enabled: 'false' },
  { gamification_enabled: 1 },
  { user_id: 'other-user' },
])('rejects malformed preference patches: %j', (patch) => {
  expect(() => validatePreferencesUpdate(patch)).toThrow();
});

test('validates all supported preferences and normalizes an IANA time zone', () => {
  const patch = {
    weight_unit: 'lb',
    length_unit: 'in',
    distance_unit: 'mi',
    energy_unit: 'kJ',
    theme: 'light',
    time_zone: ' America/New_York ',
    notifications_enabled: false,
    gamification_enabled: true,
  };
  expect(validatePreferencesUpdate(patch)).toEqual({ ...patch, time_zone: 'America/New_York' });
  expect(validatePreferencesUpdate({ time_zone: 'UTC' })).toEqual({ time_zone: 'UTC' });
});
