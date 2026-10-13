import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { splitService } from '@/features/workouts/split-service';
import { weekdays, type SplitDraft } from '@/features/workouts/split-model';
const userId = '00000000-0000-4000-8000-000000000001',
  id = '00000000-0000-4000-8000-000000000002';
const user: User = {
  id: userId,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01',
};
const mockFetch =
  jest.fn<(input: unknown, init?: { method?: string; body?: unknown }) => Promise<Response>>();
const client = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof client>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const draft: SplitDraft = {
  id,
  name: ' Week A ',
  active: true,
  days: weekdays.map(() => ({ isRest: true, workoutId: null, workoutName: null })),
};
beforeEach(() => {
  mockFetch.mockReset();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('save authenticates expected identity and sends exactly seven canonical days', async () => {
  mockFetch.mockResolvedValue(response(id));
  await splitService.save(userId, draft);
  const [url, init] = mockFetch.mock.calls[0];
  expect(String(url)).toContain('/rpc/save_training_split');
  expect(JSON.parse(String(init?.body))).toEqual({
    p_id: id,
    p_name: 'Week A',
    p_is_active: true,
    p_days: weekdays.map(() => ({ is_rest: true, workout_id: null })),
  });
});
test('changed accounts and invalid drafts make no mutation and transport errors are safe', async () => {
  await expect(splitService.save(id, draft)).rejects.toThrow('Account changed');
  await expect(splitService.save(userId, { ...draft, days: [] })).rejects.toThrow('seven');
  expect(mockFetch).not.toHaveBeenCalled();
  mockFetch.mockResolvedValue(response({ message: 'private diagnostic' }, 400));
  await expect(splitService.save(userId, draft)).rejects.toThrow('Your draft is kept');
});
test('loads deleted assignments honestly and deletes only the owned split', async () => {
  mockFetch.mockResolvedValueOnce(
    response({
      id,
      name: 'Week A',
      is_active: true,
      training_split_days: [
        { weekday: 0, is_rest: false, workout_id: null, workout_templates: null },
      ],
    }),
  );
  const loaded = await splitService.load(userId, id);
  expect(loaded?.days[0]).toEqual({ isRest: false, workoutId: null, workoutName: null });
  mockFetch.mockResolvedValueOnce(response([{ id }]));
  await splitService.remove(userId, id);
  const [url, init] = mockFetch.mock.calls[1];
  expect(init?.method).toBe('DELETE');
  expect(new URL(String(url)).searchParams.get('user_id')).toBe('eq.' + userId);
});
