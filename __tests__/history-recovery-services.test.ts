import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { historyService } from '@/features/workouts/history-service';
import { recoveryService } from '@/features/workouts/recovery-service';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000007' }));
const user: User = {
  id: sessionOwner,
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

test('workout calendar reads the entire selected month with ownership and completion filters', async () => {
  mockFetch.mockImplementation(async (input) =>
    String(input).includes('/user_preferences')
      ? response({ ...nutritionContext().preferences, user_id: sessionOwner })
      : response([
          {
            id: sessionFixture().id,
            name: 'Completed',
            local_date: '2024-02-29',
            mode: 'log_only',
            duration_seconds: null,
          },
        ]),
  );
  const result = await historyService.calendar(sessionOwner, '2024-02');
  expect(result.rows).toHaveLength(1);
  const request = mockFetch.mock.calls.find(([input]) =>
    String(input).includes('/workout_sessions'),
  );
  const params = new URL(String(request?.[0])).searchParams;
  expect(params.get('user_id')).toBe('eq.' + sessionOwner);
  expect(params.get('status')).toBe('eq.completed');
  expect(params.getAll('local_date')).toEqual(['gte.2024-02-01', 'lt.2024-03-01']);
});
test('history sends real search/mode/page filters and returns the saved display unit', async () => {
  mockFetch.mockImplementation(async (url) =>
    String(url).includes('/rpc/')
      ? response([{ id: sessionFixture().id }])
      : response({ weight_unit: 'lb' }),
  );
  const page = await historyService.list(sessionOwner, {
    offset: 20,
    query: 'Upper',
    mode: 'log_only',
  });
  expect(page.unit).toBe('lb');
  const request = mockFetch.mock.calls.find(([url]) => String(url).includes('/rpc/'));
  expect(JSON.parse(String(request?.[1]?.body))).toEqual({
    p_offset: 20,
    p_query: 'Upper',
    p_mode: 'log_only',
  });
});
test('history loads recorded snapshots and excludes itself from past-performance calculation', async () => {
  const fixture = sessionFixture(),
    exercise = fixture.exercises[0];
  mockFetch.mockImplementation(async (url) => {
    if (String(url).includes('/rpc/'))
      return response([
        {
          exercise_id: exercise.exerciseId,
          previous: [],
          best: { heaviest_kg: null, estimated_1rm: null, reps_by_weight: {} },
        },
      ]);
    if (String(url).includes('/user_preferences')) return response({ weight_unit: 'kg' });
    return response({
      id: fixture.id,
      user_id: sessionOwner,
      template_id: null,
      name: 'Recorded',
      mode: 'timed',
      status: 'completed',
      started_at: fixture.startedAt,
      ended_at: fixture.startedAt,
      local_date: fixture.localDate,
      time_zone: 'UTC',
      duration_seconds: 0,
      notes: null,
      version: 1,
      workout_session_exercises: [
        {
          id: exercise.id,
          exercise_id: exercise.exerciseId,
          position: 0,
          exercise_name: 'Historical name',
          notes: null,
          workout_sets: [
            {
              id: exercise.sets[0].id,
              position: 0,
              reps: 8,
              weight_kg: 20,
              rest_seconds: 90,
              rpe: null,
              notes: null,
              completed_at: fixture.startedAt,
            },
          ],
        },
      ],
    });
  });
  const draft = await historyService.load(sessionOwner, fixture.id);
  expect(draft?.exercises[0].name).toBe('Historical name');
  expect(draft?.version).toBe(1);
  const rpc = mockFetch.mock.calls.find(([url]) => String(url).includes('/rpc/'));
  expect(JSON.parse(String(rpc?.[1]?.body)).p_exclude_session).toBe(fixture.id);
});
test('history deletion matches owner and revision and rejects an unacknowledged deletion', async () => {
  const id = sessionFixture().id;
  mockFetch.mockResolvedValueOnce(response([{ id }]));
  await historyService.remove(sessionOwner, id, 9);
  const url = new URL(String(mockFetch.mock.calls[0][0]));
  expect(url.searchParams.get('user_id')).toBe('eq.' + sessionOwner);
  expect(url.searchParams.get('version')).toBe('eq.9');
  expect(mockFetch.mock.calls[0][1]?.method).toBe('DELETE');
  mockFetch.mockResolvedValueOnce(response([]));
  await expect(historyService.remove(sessionOwner, id, 9)).rejects.toThrow('changed');
});
test('recovery sends the expected actor and explicit categories, including zero soreness and optional stress', async () => {
  mockFetch.mockResolvedValue(response('2026-10-13'));
  await recoveryService.save(sessionOwner, '2026-10-13', 'UTC', {
    energy: 3,
    soreness: 0,
    sleep: 3,
    stress: null,
    notes: ' Note ',
  });
  expect(JSON.parse(String(mockFetch.mock.calls[0][1]?.body))).toEqual({
    p_user_id: sessionOwner,
    p_date: '2026-10-13',
    p_time_zone: 'UTC',
    p_energy: 3,
    p_soreness: 0,
    p_sleep: 3,
    p_notes: 'Note',
  });
  await expect(
    recoveryService.save('other', '2026-10-13', 'UTC', {
      energy: 3,
      soreness: 0,
      sleep: 3,
      stress: null,
      notes: '',
    }),
  ).rejects.toThrow('verify account');
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
