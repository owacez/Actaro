import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import { exerciseService, type SearchFilters } from '@/features/exercises/exercise-service';
import type { Database } from '@/lib/supabase/database.types';

const owner = '00000000-0000-4000-8000-000000000001';
const itemId = '00000000-0000-4000-8000-000000000002';
const user: User = {
  id: owner,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
};
const mockFetch =
  jest.fn<(input: unknown, init?: { method?: string; body?: unknown }) => Promise<Response>>();
const createTestClient = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof createTestClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
const filters: SearchFilters = { query: '', bodyweight: false, availableOnly: false, offset: 0 };
const summary = {
  id: itemId,
  name: 'Fixture exercise',
  difficulty: 'beginner',
  muscles: ['Fixture muscle'],
  equipment: [],
  thumbnail_path: `${itemId}/main.webp`,
  total_count: 1,
};
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  mockFetch.mockReset();
  mockClient = createTestClient();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
afterEach(() => {
  jest.restoreAllMocks();
});

test('search uses bound RPC parameters and signs only our private storage paths', async () => {
  mockFetch.mockResolvedValueOnce(response([summary])).mockResolvedValueOnce(
    response([
      {
        path: summary.thumbnail_path,
        signedURL: '/object/sign/exercise-media/fixture?token=test',
      },
    ]),
  );
  const result = await exerciseService.search(
    { ...filters, query: '  press%_', offset: 24 },
    owner,
  );
  expect(result[0].imageUrl).toContain('/storage/v1/object/sign/exercise-media/');
  expect(new URL(String(mockFetch.mock.calls[0][0])).pathname).toBe(
    '/rest/v1/rpc/search_exercises',
  );
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toMatchObject({
    p_query: 'press%_',
    p_offset: 24,
    p_limit: 24,
  });
  expect(JSON.parse(String(mockFetch.mock.calls[1][1]?.body))).toMatchObject({
    paths: [summary.thumbnail_path],
    expiresIn: 3600,
  });
});
test('malformed filters and IDs fail before sending data requests', async () => {
  await expect(
    exerciseService.search({ ...filters, muscleId: 'spoofed' }, owner),
  ).rejects.toThrow();
  await expect(exerciseService.search({ ...filters, offset: -1 }, owner)).rejects.toThrow();
  await expect(exerciseService.detail('invalid')).rejects.toThrow();
  await expect(exerciseService.saveEquipment(['invalid'], owner)).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
});
test('a failed signing request keeps exercise data usable without external fallback URLs', async () => {
  mockFetch
    .mockResolvedValueOnce(response([summary]))
    .mockResolvedValueOnce(response({ message: 'private diagnostic' }, 403));
  await expect(exerciseService.search(filters, owner)).resolves.toEqual([
    { ...summary, imageUrl: null },
  ]);
});
test('empty search avoids a needless storage request', async () => {
  mockFetch.mockResolvedValueOnce(response([]));
  await expect(exerciseService.search(filters, owner)).resolves.toEqual([]);
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
test.each(['start', 'main'] as const)(
  'workout image resolves %s media by exercise ID',
  async (pose) => {
    const path = `${itemId}/${pose}.webp`;
    mockFetch
      .mockResolvedValueOnce(
        response([
          { storage_path: `${itemId}/main.webp`, pose: 'main' },
          ...(pose === 'start' ? [{ storage_path: path, pose: 'start' }] : []),
        ]),
      )
      .mockResolvedValueOnce(
        response([{ path, signedURL: '/object/sign/exercise-media/fresh?token=test' }]),
      );
    expect(await exerciseService.image(itemId)).toContain('/object/sign/exercise-media/fresh');
    const request = new URL(String(mockFetch.mock.calls[0][0]));
    expect(request.pathname).toBe('/rest/v1/exercise_media');
    expect(request.searchParams.get('exercise_id')).toBe(`eq.${itemId}`);
    expect(JSON.parse(String(mockFetch.mock.calls[1][1]?.body)).paths).toEqual([path]);
  },
);
test('workout image failure keeps provider diagnostics private and missing media avoids signing', async () => {
  await expect(exerciseService.image('invalid')).rejects.toThrow('Check your connection');
  expect(mockFetch).not.toHaveBeenCalled();
  mockFetch.mockResolvedValueOnce(response([]));
  await expect(exerciseService.image(itemId)).resolves.toBeNull();
  expect(mockFetch).toHaveBeenCalledTimes(1);
  mockFetch.mockResolvedValueOnce(response({ message: 'private diagnostic' }, 403));
  await expect(exerciseService.image(itemId)).rejects.toThrow('Check your connection');
});
test('owned equipment operations reject a stale account before reads or writes', async () => {
  for (const request of [
    () => exerciseService.equipmentProfile(itemId),
    () => exerciseService.saveEquipment([], itemId),
    () => exerciseService.search({ ...filters, availableOnly: true }, itemId),
  ])
    await expect(request()).rejects.toThrow();
  expect(mockFetch).not.toHaveBeenCalled();
});
test('equipment read filters the Auth owner and atomic save sends no owner override', async () => {
  mockFetch
    .mockResolvedValueOnce(response([{ equipment_id: itemId }]))
    .mockResolvedValueOnce(response([{ user_id: owner, equipment_id: itemId }]));
  await expect(exerciseService.equipmentProfile(owner)).resolves.toEqual([itemId]);
  await expect(exerciseService.saveEquipment([itemId, itemId], owner)).resolves.toEqual([itemId]);
  expect(new URL(String(mockFetch.mock.calls[0][0])).searchParams.get('user_id')).toBe(
    `eq.${owner}`,
  );
  expect(JSON.parse(String(mockFetch.mock.calls[1][1]?.body))).toEqual({
    p_equipment_ids: [itemId],
  });
});
test('denied catalog/data requests hide provider diagnostics', async () => {
  mockFetch.mockResolvedValueOnce(response({ message: 'private diagnostic' }, 403));
  await expect(exerciseService.search(filters, owner)).rejects.toThrow('Check your connection');
});
