import { emptyPerformance, type SessionDraft } from '@/features/workouts/session-model';
export const sessionOwner = '00000000-0000-4000-8000-000000000001';
export function sessionFixture(): SessionDraft {
  const startedAt = new Date().toISOString();
  return {
    format: 1,
    userId: sessionOwner,
    id: '00000000-0000-4000-8000-000000000002',
    templateId: null,
    name: 'Test workout',
    notes: '',
    unit: 'kg',
    mode: 'timed',
    status: 'active',
    startedAt,
    endedAt: null,
    localDate: startedAt.slice(0, 10),
    timeZone: 'UTC',
    clock: { elapsedMs: 0, runningSince: Date.parse(startedAt) },
    rest: null,
    restDuration: 0,
    version: 0,
    mutationId: null,
    exercises: [
      {
        id: '00000000-0000-4000-8000-000000000003',
        exerciseId: '00000000-0000-4000-8000-000000000004',
        name: 'Test exercise',
        imageUrl: null,
        metadata: 'Chest',
        notes: '',
        performance: emptyPerformance(),
        sets: [
          {
            id: '00000000-0000-4000-8000-000000000005',
            reps: '8',
            weight: '20',
            rest: '90',
            rpe: '',
            notes: '',
            completedAt: null,
          },
        ],
      },
    ],
  };
}
