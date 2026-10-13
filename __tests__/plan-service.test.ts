import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { planService } from '@/features/workouts/plan-service';
const userId = '00000000-0000-4000-8000-000000000001',
  id = '00000000-0000-4000-8000-000000000002';
const user: User = {
  id: userId,
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
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  mockFetch.mockReset();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('sends filters and preserves nullable schedule/real preview through the SDK', async () => {
  mockFetch.mockResolvedValue(
    response([
      {
        id,
        schedule: [null, 'A'],
        workouts: [{ name: 'A', sets: 2, reps: 8, rest_seconds: 90, exercises: ['Squat'] }],
      },
    ]),
  );
  const plans = await planService.list(userId, {
    goal: 'general',
    experience: 'beginner',
    days: 3,
    availableOnly: true,
  });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_goal: 'general',
    p_experience: 'beginner',
    p_days: 3,
    p_available_only: true,
  });
  expect(plans[0].schedule[0]).toBeNull();
  expect(plans[0].workouts[0].rest).toBe(90);
});
test('checks account/UUID before mutation and rejects transport or mismatched acknowledgements', async () => {
  await expect(planService.adopt(id, id, userId)).rejects.toThrow('Account changed');
  await expect(planService.adopt(userId, 'invalid', id)).rejects.toThrow('Invalid');
  expect(mockFetch).not.toHaveBeenCalled();
  mockFetch.mockResolvedValueOnce(response({ message: 'private diagnostic' }, 400));
  await expect(planService.adopt(userId, id, userId)).rejects.toThrow('Retry');
  mockFetch.mockResolvedValueOnce(response(id));
  await expect(planService.adopt(userId, id, userId)).rejects.toThrow('Retry');
});
