import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { habitService } from '@/features/habits/habit-service';
const owner = '05000000-0000-4000-8000-000000000001',
  id = '05000000-0000-4000-8000-000000000003';
const user: User = {
    id: owner,
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01',
  },
  mockFetch =
    jest.fn<(input: unknown, init?: { method?: string; body?: unknown }) => Promise<Response>>();
let mockClient: ReturnType<typeof client>;
function client() {
  return createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
}
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
const response = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('save carries explicit owner and real type/schedule; zero avoidance remains explicit', async () => {
  mockFetch.mockResolvedValue(response(id));
  await habitService.save(owner, id, {
    name: 'Avoid',
    kind: 'avoidance',
    unit: 'times',
    start: '2026-10-14',
    zone: 'UTC',
    target: '0',
    days: [3, 1],
    end: '',
    motivation: 'none',
    reminder: '18:30',
  });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toMatchObject({
    p_user_id: owner,
    p_id: id,
    p_kind: 'avoidance',
    p_target: 0,
    p_days: [1, 3],
    p_reminder: '18:30',
  });
});
test('log acknowledges selected civil date and owner, and account changes stop all writes', async () => {
  mockFetch.mockResolvedValue(response('2026-10-14'));
  await habitService.log(owner, id, '2026-10-14', 0, ' note ');
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_user_id: owner,
    p_habit_id: id,
    p_date: '2026-10-14',
    p_value: 0,
    p_notes: 'note',
  });
  mockFetch.mockClear();
  jest
    .spyOn(mockClient.auth, 'getUser')
    .mockResolvedValue({ data: { user: { ...user, id: 'another' } }, error: null });
  await expect(habitService.log(owner, id, '2026-10-14', 0, '')).rejects.toThrow('account');
  expect(mockFetch).not.toHaveBeenCalled();
});
