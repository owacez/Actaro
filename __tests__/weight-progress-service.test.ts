import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { bodyService } from '@/features/body/body-service';
import { profileService } from '@/features/profile/profile-service';
import { nutritionContext } from './helpers/nutrition-fixture';
const owner = nutritionContext().preferences.user_id,
  mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<Response>>();
const client = () =>
  createClient<Database>('https://example-project.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof client>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn() },
}));
const response = (rows: unknown[], count: number) =>
  new Response(JSON.stringify(rows), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Range': `0-${Math.max(0, rows.length - 1)}/${count}`,
    },
  });
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = client();
  jest.mocked(profileService.getPreferences).mockResolvedValue(nutritionContext().preferences);
});
test('progress requests authenticated preferences and bounds/owner/order on every complete history page', async () => {
  const rows = [
    { local_date: '2026-09-15', weight_kg: 80 },
    { local_date: '2026-10-01', weight_kg: 79 },
  ];
  // A small project response cap must not be mistaken for the entire period.
  mockFetch
    .mockResolvedValueOnce(response([rows[0]], 2))
    .mockResolvedValueOnce(response([rows[1]], 2));
  const result = await bodyService.progress(owner, { from: '2026-09-15', to: '2026-10-01' });
  expect(result.rows).toEqual(rows);
  expect(profileService.getPreferences).toHaveBeenCalledWith(owner);
  expect(mockFetch).toHaveBeenCalledTimes(2);
  const query = new URL(String(mockFetch.mock.calls[0][0]));
  expect(query.searchParams.get('user_id')).toBe('eq.' + owner);
  expect(query.searchParams.getAll('local_date')).toEqual(['gte.2026-09-15', 'lte.2026-10-01']);
  expect(query.searchParams.get('order')).toBe('local_date.asc');
  expect(new URL(String(mockFetch.mock.calls[1][0])).searchParams.get('offset')).toBe('1');
});
test('partial or changing history fails instead of reporting false totals', async () => {
  mockFetch
    .mockResolvedValueOnce(response([{ local_date: '2026-10-01', weight_kg: 80 }], 2))
    .mockResolvedValueOnce(response([], 2));
  await expect(
    bodyService.progress(owner, { from: '2026-09-15', to: '2026-10-01' }),
  ).rejects.toThrow('incomplete');
  mockFetch
    .mockResolvedValueOnce(response([{ local_date: '2026-10-01', weight_kg: 80 }], 2))
    .mockResolvedValueOnce(response([{ local_date: '2026-10-02', weight_kg: 79 }], 3));
  await expect(
    bodyService.progress(owner, { from: '2026-09-15', to: '2026-10-02' }),
  ).rejects.toThrow('changed');
});
test('account changes and invalid/future periods never issue weight queries', async () => {
  await expect(
    bodyService.progress(owner, { from: '2026-10-02', to: '2026-10-01' }),
  ).rejects.toThrow();
  await expect(
    bodyService.progress(owner, { from: '2100-01-01', to: '2100-01-02' }),
  ).rejects.toThrow('future');
  jest.mocked(profileService.getPreferences).mockRejectedValue(new Error('Account changed'));
  await expect(bodyService.progress(owner)).rejects.toThrow('Account changed');
  expect(mockFetch).not.toHaveBeenCalled();
});
