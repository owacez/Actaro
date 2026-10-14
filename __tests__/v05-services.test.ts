import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { activityService } from '@/features/activity/activity-service';
import { bodyService } from '@/features/body/body-service';
import { goalService } from '@/features/goals/goal-service';
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
