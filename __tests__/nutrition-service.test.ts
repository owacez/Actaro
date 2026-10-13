import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { nutritionFood } from './helpers/nutrition-fixture';
const owner = '04000000-0000-4000-8000-000000000001',
  id = '04000000-0000-4000-8000-000000000003';
const user: User = {
  id: owner,
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
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('real search sends bounded page/mode; diary requests only the selected owner and date', async () => {
  mockFetch.mockImplementation(async (url) =>
    response(String(url).includes('nutrition_target_history') ? null : []),
  );
  await nutritionService.search(owner, ' chick ', 'Favorites', 24);
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_query: 'chick',
    p_mode: 'Favorites',
    p_offset: 24,
  });
  await nutritionService.diary(owner, '2026-10-13');
  const urls = mockFetch.mock.calls.slice(1).map(([url]) => new URL(String(url)));
  expect(urls).toHaveLength(3);
  for (const url of urls) expect(url.searchParams.get('user_id')).toBe('eq.' + owner);
  for (const url of urls.filter((url) => !url.pathname.includes('nutrition_target_history')))
    expect(url.searchParams.get('local_date')).toBe('eq.2026-10-13');
});
test('log RPC sends source/portion and expected actor, never client nutrition totals', async () => {
  mockFetch.mockResolvedValue(response(id));
  const food = nutritionFood();
  await nutritionService.log(owner, id, '2026-10-13', 'UTC', 'Lunch', food, 'oz', 2);
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_user_id: owner,
    p_id: id,
    p_date: '2026-10-13',
    p_time_zone: 'UTC',
    p_meal: 'Lunch',
    p_food_id: id,
    p_unit: 'oz',
    p_quantity: 2,
  });
});
test('account changes stop requests before private reads/writes', async () => {
  jest
    .spyOn(mockClient.auth, 'getUser')
    .mockResolvedValue({ data: { user: { ...user, id: 'different' } }, error: null });
  await expect(nutritionService.water(owner, id, '2026-10-13', 'UTC', 250)).rejects.toThrow(
    'account',
  );
  expect(mockFetch).not.toHaveBeenCalled();
});
test('copy and recipe RPCs preserve ownership and request IDs', async () => {
  mockFetch.mockResolvedValueOnce(response(2)).mockResolvedValueOnce(response(id));
  await nutritionService.copy(owner, id, '2026-10-13', 'UTC', {
    date: '2026-10-12',
    meal: 'Lunch',
    destMeal: 'Dinner',
  });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toMatchObject({
    p_user_id: owner,
    p_id: id,
    p_source_date: '2026-10-12',
    p_source_meal: 'Lunch',
    p_dest_meal: 'Dinner',
  });
  await nutritionService.recipe(
    owner,
    id,
    'Recipe',
    [{ food_id: id, unit: 'g', quantity: 200 }],
    2,
    800,
  );
  expect(JSON.parse(String(mockFetch.mock.calls[1][1]?.body))).toMatchObject({
    p_user_id: owner,
    p_id: id,
    p_servings: 2,
    p_cooked_weight: 800,
  });
});
test('server rejections allow correction and raw database errors are not exposed', async () => {
  mockFetch.mockResolvedValue(response({ code: '23514', message: 'private SQL detail' }, 400));
  await expect(
    nutritionService.targets(owner, { calories: -1, protein: 0, carbs: 0, fat: 0, water_ml: 250 }),
  ).rejects.toMatchObject({
    retryable: false,
    message: expect.not.stringContaining('private SQL'),
  });
});
test('repeated deletion acknowledges already-gone entries with an owner filter', async () => {
  mockFetch.mockResolvedValue(response([]));
  await expect(nutritionService.remove(owner, 'food_logs', id)).resolves.toBeUndefined();
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(url.searchParams.get('id')).toBe('eq.' + id);
  expect(url.searchParams.get('user_id')).toBe('eq.' + owner);
});
