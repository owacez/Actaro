import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { runService } from '@/features/running/run-service';
import { runFixture, runId, runOwner } from './helpers/run-fixture';
const mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<Response>>();
const makeClient = () =>
  createClient<Database>('https://run-fixture.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof makeClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: async () => ({ time_zone: 'UTC', energy_unit: 'kcal' }) },
}));
const user: User = {
  id: runOwner,
  aud: 'authenticated',
  created_at: '',
  app_metadata: {},
  user_metadata: {},
};
beforeEach(() => {
  mockClient = makeClient();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
  mockFetch.mockImplementation(
    async () =>
      new Response('[]', {
        headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
      }),
  );
});
test('save is stable on retry, sends raw route and leaves distance/preview calculation to Postgres', async () => {
  await expect(runService.save(runOwner, runFixture())).rejects.toThrow('review');
  expect(mockFetch).not.toHaveBeenCalled();
  mockFetch.mockImplementation(
    async () =>
      new Response(JSON.stringify({ id: runId }), {
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  await runService.save(runOwner, runFixture(true));
  await runService.save(runOwner, runFixture(true));
  const requests = mockFetch.mock.calls.map(([, init]) => {
    if (!init || typeof init !== 'object' || !('body' in init) || typeof init.body !== 'string')
      throw Error('Missing body');
    return JSON.parse(init.body);
  });
  expect(requests[0]).toEqual(requests[1]);
  expect(requests[0]).toMatchObject({
    id: runId,
    user_id: runOwner,
    duration_seconds: 60,
    route: runFixture(true).route,
  });
  expect(requests[0]).not.toHaveProperty('distance_meters');
  expect(requests[0]).not.toHaveProperty('route_preview');
});
test('history and progress filter by owner and date and omit full routes', async () => {
  await runService.history(runOwner, 1);
  await runService.progress(runOwner, '30D', { from: '2026-10-01', to: '2026-10-13' });
  for (const [input] of mockFetch.mock.calls) {
    const url = new URL(String(input));
    expect(url.searchParams.get('user_id')).toBe('eq.' + runOwner);
    expect(url.searchParams.get('select')?.split(',')).not.toContain('route');
  }
  expect(
    new URL(String(mockFetch.mock.calls.at(-1)?.[0])).searchParams.getAll('local_date'),
  ).toEqual(['gte.2026-10-01', 'lte.2026-10-13']);
});
test('account changes prevent access and rejected requests do not expose raw provider messages', async () => {
  jest.mocked(mockClient.auth.getUser).mockResolvedValue({
    data: { user: { ...user, id: '12000000-0000-4000-8000-000000000002' } },
    error: null,
  });
  await expect(runService.save(runOwner, runFixture(true))).rejects.toThrow('account');
  expect(mockFetch).not.toHaveBeenCalled();
  jest.mocked(mockClient.auth.getUser).mockResolvedValue({ data: { user }, error: null });
  mockFetch.mockImplementation(
    async () =>
      new Response('{"code":"42501","message":"private provider response"}', {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
  );
  await expect(runService.history(runOwner)).rejects.toThrow('Request rejected');
});
