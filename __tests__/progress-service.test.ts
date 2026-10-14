import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { progressPages, progressService } from '@/features/progress/progress-service';
import { profileService } from '@/features/profile/profile-service';
import { nutritionContext } from './helpers/nutrition-fixture';
const mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<Response>>();
const makeClient = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof makeClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn() },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = makeClient();
  jest.mocked(profileService.getPreferences).mockResolvedValue(nutritionContext().preferences);
});
test('nutrition uses owned date-bounded reads and target history without requesting one diary per day', async () => {
  mockFetch.mockImplementation(
    async () =>
      new Response('[]', {
        headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' },
      }),
  );
  const result = await progressService.nutrition(nutritionContext().preferences.user_id, '30D', {
    from: '2026-10-01',
    to: '2026-10-04',
  });
  expect(result.summary.count).toBe(0);
  expect(mockFetch).toHaveBeenCalledTimes(2);
  const urls = mockFetch.mock.calls.map((call) => new URL(String(call[0])));
  expect(
    urls.every(
      (url) => url.searchParams.get('user_id') === 'eq.' + nutritionContext().preferences.user_id,
    ),
  ).toBe(true);
  expect(
    urls.find((url) => url.pathname.endsWith('/food_logs'))?.searchParams.getAll('local_date'),
  ).toEqual(['gte.2026-10-01', 'lte.2026-10-04']);
  expect(
    urls
      .find((url) => url.pathname.endsWith('/nutrition_target_history'))
      ?.searchParams.get('effective_date'),
  ).toBe('lte.2026-10-04');
});
test('account failure and invalid date ranges never read analytics rows', async () => {
  await expect(
    progressService.nutrition('owner', '30D', { from: '2026-10-04', to: '2026-10-01' }),
  ).rejects.toThrow();
  jest.mocked(profileService.getPreferences).mockRejectedValue(new Error('Account changed'));
  await expect(progressService.nutrition('owner')).rejects.toThrow('Account changed');
  expect(mockFetch).not.toHaveBeenCalled();
});
test('complete pagination honors response caps and fails on partial or changing counts', async () => {
  const read = jest
    .fn<(from: number, to: number) => Promise<{ data: number[]; error: null; count: number }>>()
    .mockResolvedValueOnce({ data: [1], error: null, count: 2 })
    .mockResolvedValueOnce({ data: [2], error: null, count: 2 });
  expect(await progressPages(read)).toEqual([1, 2]);
  expect(read).toHaveBeenLastCalledWith(1, 500);
  read
    .mockResolvedValueOnce({ data: [1], error: null, count: 2 })
    .mockResolvedValueOnce({ data: [], error: null, count: 2 });
  await expect(progressPages(read)).rejects.toThrow('incomplete');
  read
    .mockResolvedValueOnce({ data: [1], error: null, count: 2 })
    .mockResolvedValueOnce({ data: [2], error: null, count: 3 });
  await expect(progressPages(read)).rejects.toThrow('changed');
});
const emptyTraining = {
  sessions: 0,
  active_days: 0,
  sets: 0,
  reps: 0,
  volume_kg: 0,
  unknown_weight_sets: 0,
  first_date: null,
  days: [],
  muscles: [],
};
function emptyReads() {
  mockFetch.mockImplementation(
    async (input) =>
      new Response(
        JSON.stringify(String(input).includes('/rpc/get_training_overview') ? emptyTraining : []),
        { headers: { 'Content-Type': 'application/json', 'Content-Range': '*/0' } },
      ),
  );
}
test('training reads completed owned sessions and strength filters both the set and parent session', async () => {
  emptyReads();
  const custom = { from: '2026-10-01', to: '2026-10-04' },
    owner = nutritionContext().preferences.user_id;
  await progressService.training(owner, '30D', custom);
  const session = mockFetch.mock.calls
    .map((call) => new URL(String(call[0])))
    .find((url) => url.pathname.endsWith('/workout_sessions'));
  expect(session?.searchParams.get('status')).toBe('eq.completed');
  expect(session?.searchParams.get('user_id')).toBe('eq.' + owner);
  await progressService.strength(owner, '30D', custom);
  const sets = new URL(String(mockFetch.mock.calls.at(-1)?.[0]));
  expect(sets.searchParams.get('completed_at')).toBe('not.is.null');
  expect(sets.searchParams.get('workout_session_exercises.workout_sessions.status')).toBe(
    'eq.completed',
  );
  expect(sets.searchParams.getAll('workout_session_exercises.workout_sessions.local_date')).toEqual(
    ['gte.2026-10-01', 'lte.2026-10-04'],
  );
});
test('habit reads include weekly boundary logs, complete versions and owner filters; steps do not sum sources', async () => {
  emptyReads();
  const owner = nutritionContext().preferences.user_id;
  await progressService.habits(owner, '30D', { from: '2026-10-07', to: '2026-10-11' });
  const urls = mockFetch.mock.calls.map((call) => new URL(String(call[0])));
  expect(
    urls.find((url) => url.pathname.endsWith('/habit_logs'))?.searchParams.getAll('local_date'),
  ).toEqual(['gte.2026-10-05', 'lte.2026-10-11']);
  expect(urls.every((url) => url.searchParams.get('user_id') === 'eq.' + owner)).toBe(true);
  await progressService.steps(owner, '30D', { from: '2026-10-07', to: '2026-10-11' });
  expect(mockFetch.mock.calls.some((call) => String(call[0]).includes('/activity_targets'))).toBe(
    true,
  );
});
test('summary verifies account/preferences once and reuses the same bounds for every source', async () => {
  emptyReads();
  const owner = nutritionContext().preferences.user_id;
  const result = await progressService.summary(owner, '30D', {
    from: '2026-10-01',
    to: '2026-10-04',
  });
  expect(profileService.getPreferences).toHaveBeenCalledTimes(1);
  expect(result.weeks).toHaveLength(1);
  expect(result.months).toHaveLength(1);
  expect(result.weeks[0].nutrition.average).toBeNull();
  expect(result.weeks[0].steps.average).toBeNull();
  expect(mockFetch.mock.calls).toHaveLength(10);
});
