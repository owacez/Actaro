import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { workoutService } from '@/features/workouts/workout-service';
import { blankSet, type WorkoutDraft } from '@/features/workouts/workout-model';
const userId = '00000000-0000-4000-8000-000000000001';
const id = '00000000-0000-4000-8000-000000000002';
const exerciseId = '00000000-0000-4000-8000-000000000003';
const user: User = {
  id: userId,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};
const mockFetch =
  jest.fn<(input: unknown, init?: { method?: string; body?: unknown }) => Promise<Response>>();
const client = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof client>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const draft: WorkoutDraft = {
  id,
  name: ' Upper A ',
  notes: '',
  exercises: [
    {
      key: 'one',
      exerciseId,
      name: 'Fixture press',
      imageUrl: null,
      notes: '',
      sets: [{ ...blankSet(), weight: '22.046' }],
    },
  ],
};
beforeEach(() => {
  mockFetch.mockReset();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('save authenticates expected user and sends one atomic canonical payload', async () => {
  mockFetch.mockResolvedValue(response(id));
  await expect(workoutService.save(userId, draft, 'lb')).resolves.toBe(id);
  const [url, init] = mockFetch.mock.calls[0];
  expect(String(url)).toContain('/rpc/save_workout_template');
  expect(JSON.parse(String(init?.body))).toMatchObject({
    p_id: id,
    p_name: 'Upper A',
    p_exercises: [
      { exercise_id: exerciseId, sets: [{ reps: 8, weight_kg: 10, rest_seconds: 90 }] },
    ],
  });
});
test('invalid input and changed accounts do not send a mutation', async () => {
  await expect(workoutService.save(userId, { ...draft, name: '' }, 'kg')).rejects.toThrow('name');
  expect(mockFetch).not.toHaveBeenCalled();
  await expect(workoutService.save(exerciseId, draft, 'kg')).rejects.toThrow('account changed');
  expect(mockFetch).not.toHaveBeenCalled();
});
test('list uses ownership, stable ordering and bounded pagination', async () => {
  mockFetch.mockResolvedValue(
    response(
      Array.from({ length: 11 }, () => ({
        id,
        name: 'Fixture',
        updated_at: '2026-01-01',
        workout_template_exercises: [{ count: 2 }],
      })),
    ),
  );
  const page = await workoutService.list(userId, 10);
  expect(page.rows).toHaveLength(10);
  expect(page.more).toBe(true);
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(url.searchParams.get('user_id')).toBe(`eq.${userId}`);
  expect(url.searchParams.get('offset')).toBe('10');
  expect(url.searchParams.get('limit')).toBe('11');
});
test('database error text is kept out of UI messages', async () => {
  mockFetch.mockResolvedValue(response({ message: 'private SQL diagnostic' }, 400));
  await expect(workoutService.save(userId, draft, 'kg')).rejects.toThrow('Your draft is kept');
});
test('delete filters the authenticated owner and exact template and requires a returned row', async () => {
  mockFetch.mockResolvedValueOnce(response([{ id }]));
  await expect(workoutService.remove(userId, id)).resolves.toBeUndefined();
  const [address, init] = mockFetch.mock.calls[0];
  const url = new URL(String(address));
  expect(init?.method).toBe('DELETE');
  expect(url.searchParams.get('id')).toBe(`eq.${id}`);
  expect(url.searchParams.get('user_id')).toBe(`eq.${userId}`);
  mockFetch.mockResolvedValueOnce(response([]));
  await expect(workoutService.remove(userId, id)).rejects.toThrow('Workout unavailable');
  mockFetch.mockResolvedValueOnce(response({ message: 'private SQL diagnostic' }, 400));
  await expect(workoutService.remove(userId, id)).rejects.toThrow('Unable to delete workout');
});
test('invalid delete IDs and changed accounts cannot send a deletion', async () => {
  await expect(workoutService.remove(userId, 'invalid')).rejects.toThrow('Invalid workout');
  await expect(workoutService.remove(exerciseId, id)).rejects.toThrow('account changed');
  expect(mockFetch).not.toHaveBeenCalled();
});
