import { beforeEach, expect, jest, test } from '@jest/globals';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { sessionService } from '@/features/workouts/session-service';
import { workoutService } from '@/features/workouts/workout-service';
import { sessionFixture, sessionOwner } from './helpers/session-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '00000000-0000-4000-8000-000000000007' }));
jest.mock('@/features/workouts/workout-service', () => ({ workoutService: { load: jest.fn() } }));
const user: User = {
  id: sessionOwner,
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
  jest.clearAllMocks();
  mockClient = client();
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
});
test('preparation joins real metadata and prior values without marking targets completed', async () => {
  const fixture = sessionFixture(),
    exercise = fixture.exercises[0];
  jest.mocked(workoutService.load).mockResolvedValue({
    unit: 'kg',
    draft: {
      id: fixture.id,
      name: 'Real template',
      notes: '',
      exercises: [
        {
          key: exercise.id,
          exerciseId: exercise.exerciseId,
          name: exercise.name,
          imageUrl: null,
          notes: '',
          sets: [{ ...exercise.sets[0], weight: '', rpe: '7.5' }],
        },
      ],
    },
  });
  mockFetch.mockImplementation(async (url) =>
    String(url).includes('/rpc/')
      ? response([
          {
            exercise_id: exercise.exerciseId,
            previous: [{ reps: 10, weight_kg: 25 }],
            best: { heaviest_kg: 25, estimated_1rm: 33.333, reps_by_weight: { '25': 10 } },
          },
        ])
      : response([
          {
            id: exercise.exerciseId,
            category: 'strength',
            exercise_muscles: [{ role: 'primary', muscles: { name: 'Chest' } }],
            exercise_equipment: [{ equipment: { name: 'Barbell' } }],
          },
        ]),
  );
  const prepared = await sessionService.prepare(sessionOwner, fixture.id);
  expect(prepared.exercises[0].metadata).toBe('Chest · Barbell');
  expect(prepared.exercises[0].sets[0].weight).toBe('25');
  expect(prepared.exercises[0].sets[0].completedAt).toBeNull();
  expect(prepared.exercises[0].sets[0].rpe).toBe('');
  expect(sessionService.create(sessionOwner, prepared, 'log_only').clock.runningSince).toBeNull();
});
test('save uses canonical actual facts, owned deleted-template fallback and revision acknowledgement', async () => {
  const fixture = sessionFixture();
  fixture.templateId = fixture.id;
  fixture.status = 'pending';
  fixture.endedAt = fixture.startedAt;
  fixture.mutationId = fixture.id;
  fixture.exercises[0].sets[0].completedAt = fixture.startedAt;
  mockFetch.mockResolvedValueOnce(response(null)).mockResolvedValueOnce(response(1));
  expect(await sessionService.save(fixture)).toBe(1);
  const body = JSON.parse(String(mockFetch.mock.calls[1][1]?.body));
  expect(body.p_expected_version).toBe(0);
  expect(body.p_mutation_id).toBe(fixture.id);
  expect(body.p_session.template_id).toBeNull();
  expect(body.p_session.exercises[0].sets[0].weight_kg).toBe(20);
  const lookup = new URL(String(mockFetch.mock.calls[0][0]));
  expect(lookup.searchParams.get('user_id')).toBe('eq.' + sessionOwner);
});
test('stale revision errors retain the draft and expose no raw diagnostics', async () => {
  const fixture = sessionFixture();
  fixture.status = 'pending';
  fixture.endedAt = fixture.startedAt;
  fixture.mutationId = fixture.id;
  fixture.exercises[0].sets[0].completedAt = fixture.startedAt;
  mockFetch.mockResolvedValue(response({ code: '40001', message: 'private diagnostic' }, 400));
  await expect(sessionService.save(fixture)).rejects.toThrow('local copy is kept');
});
