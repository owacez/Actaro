import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { activityService } from '@/features/activity/activity-service';
import { bodyService } from '@/features/body/body-service';
import { goalService } from '@/features/goals/goal-service';
import { nutritionContext } from './helpers/nutrition-fixture';
import { profileService } from '@/features/profile/profile-service';
const owner = '05000000-0000-4000-8000-000000000001',
  user: User = {
    id: owner,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01',
  };
const mockFetch = jest.fn<(input: unknown, init?: { body?: unknown }) => Promise<Response>>();
const client = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof client>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
const response = (value: unknown) =>
  new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('daily activity omits unknown metrics but sends an explicit zero and verified owner', async () => {
  mockFetch.mockImplementation(async () => response('2026-10-14'));
  await activityService.save(owner, '2026-10-14', '', '1', 'mi', 'UTC');
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_user_id: owner,
    p_date: '2026-10-14',
    p_distance: 1.609344,
    p_zone: 'UTC',
  });
  await activityService.save(owner, '2026-10-14', '0', '', 'km', 'UTC');
  expect(JSON.parse(String(mockFetch.mock.calls[1][1]?.body))).toEqual({
    p_user_id: owner,
    p_date: '2026-10-14',
    p_steps: 0,
    p_source: 'manual',
    p_zone: 'UTC',
  });
  await expect(
    activityService.save(owner, '2026-10-14', '', '', 'km', 'UTC'),
  ).rejects.toMatchObject({ retryable: false });
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
test('body values normalize to canonical units and invalid forms remain correctable', async () => {
  mockFetch.mockResolvedValue(response('2026-10-14'));
  await bodyService.save(owner, 'measurement', '2026-10-14', '10', 'in', 'UTC', ' Waist ', '');
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toMatchObject({
    p_name: 'waist',
    p_kind: 'measurement',
    p_user_id: owner,
  });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body)).p_value).toBeCloseTo(25.4);
  await expect(
    bodyService.save(owner, 'weight', '2026-10-14', 'no', 'kg', 'UTC', '', ''),
  ).rejects.toMatchObject({ retryable: false });
});
test('body form reuses latest saved height, and only the calculator opts into latest weight', async () => {
  const prefs = jest
    .spyOn(profileService, 'getPreferences')
    .mockResolvedValue(nutritionContext().preferences);
  const profile = jest.spyOn(profileService, 'getProfile').mockResolvedValue({
    id: owner,
    display_name: null,
    sex: 'male',
    date_of_birth: '1996-01-01',
    location: null,
    created_at: '',
    updated_at: '',
  });
  mockFetch.mockImplementation(async () => response([]));
  try {
    await bodyService.form(owner, undefined, { latestWeight: true });
    const requests = mockFetch.mock.calls.map(([url]) => new URL(String(url)));
    expect(requests).toHaveLength(2);
    for (const request of requests) {
      expect(request.searchParams.get('user_id')).toBe('eq.' + owner);
      expect(request.searchParams.get('local_date')).toMatch(/^lte\./);
      expect(request.searchParams.get('order')).toBe('local_date.desc');
      expect(request.searchParams.get('limit')).toBe('1');
    }
    mockFetch.mockClear();
    await bodyService.form(owner, '2026-10-01');
    const weight = new URL(
      String(mockFetch.mock.calls.find(([url]) => String(url).includes('/body_weights'))?.[0]),
    );
    expect(weight.searchParams.get('local_date')).toBe('eq.2026-10-01');
    const height = new URL(
      String(mockFetch.mock.calls.find(([url]) => String(url).includes('/body_measurements'))?.[0]),
    );
    expect(height.searchParams.get('local_date')).toMatch(/^lte\./);
    expect(height.searchParams.get('measurement')).toBe('eq.height');
    // The body record also reads the weigh-in before the date and that date's waist.
    const urls = mockFetch.mock.calls.map(([url]) => new URL(String(url)));
    const previous = urls.find(
      (url) =>
        url.pathname.endsWith('/body_weights') &&
        url.searchParams.get('local_date') === 'lt.2026-10-01',
    );
    expect(previous?.searchParams.get('order')).toBe('local_date.desc');
    expect(previous?.searchParams.get('limit')).toBe('1');
    const waist = urls.find((url) => url.searchParams.get('measurement') === 'eq.waist');
    expect(waist?.searchParams.get('local_date')).toBe('eq.2026-10-01');
    expect(waist?.searchParams.get('user_id')).toBe('eq.' + owner);
  } finally {
    prefs.mockRestore();
    profile.mockRestore();
  }
});
test('the combined form sends one atomic RPC, checks acknowledgement and blocks an account change', async () => {
  const form = {
    date: '2026-10-14',
    weight: '80',
    height: '180',
    sex: 'female',
    birthDate: '1995-01-15',
    location: ' Example City ',
    notes: '',
  };
  mockFetch.mockResolvedValue(response(form.date));
  await bodyService.saveForm(owner, form, nutritionContext().preferences);
  expect(mockFetch).toHaveBeenCalledTimes(1);
  expect(String(mockFetch.mock.calls[0][0])).toContain('/rpc/save_body_form');
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toMatchObject({
    p_user_id: owner,
    p_weight: 80,
    p_height: 180,
    p_sex: 'female',
    p_date_of_birth: '1995-01-15',
    p_location: 'Example City',
  });
  mockFetch.mockResolvedValue(response('2026-10-13'));
  await expect(bodyService.saveForm(owner, form, nutritionContext().preferences)).rejects.toThrow(
    'acknowledged',
  );
  jest
    .spyOn(mockClient.auth, 'getUser')
    .mockResolvedValue({ data: { user: { ...user, id: 'another' } }, error: null });
  await expect(bodyService.saveForm(owner, form, nutritionContext().preferences)).rejects.toThrow(
    'account',
  );
  expect(mockFetch).toHaveBeenCalledTimes(2);
});
test('account changes block body/activity writes and goal source reads', async () => {
  jest
    .spyOn(mockClient.auth, 'getUser')
    .mockResolvedValue({ data: { user: { ...user, id: 'another' } }, error: null });
  await expect(activityService.target(owner, '8000')).rejects.toThrow('account');
  await expect(
    bodyService.save(owner, 'weight', '2026-10-14', '80', 'kg', 'UTC', '', ''),
  ).rejects.toThrow('account');
  await expect(goalService.facts(owner, [])).rejects.toThrow('account');
  expect(mockFetch).not.toHaveBeenCalled();
});
