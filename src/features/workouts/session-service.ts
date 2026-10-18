import { randomUUID } from 'expo-crypto';
import { getSupabase } from '@/lib/supabase/client';
import { exerciseService, validExerciseId } from '@/features/exercises/exercise-service';
import { workoutService } from './workout-service';
import { blankSet, displayWeight, type WorkoutDraft, type WeightUnit } from './workout-model';
import {
  localDateAt,
  parsePerformance,
  sessionPayload,
  type SessionDraft,
  type SessionExercise,
} from './session-model';
async function owner(expected: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error)
    throw new Error(
      'Unable to verify your account. Your local copy is kept; retry when connected.',
    );
  if (data.user?.id !== expected) throw new Error('Account changed. Reopen your workout.');
}
export type PreparedWorkout = {
  draft: WorkoutDraft;
  unit: WeightUnit;
  exercises: SessionExercise[];
  templateId: string | null;
};
export const sessionService = {
  async prepare(
    userId: string,
    templateId?: string,
    exerciseId?: string,
  ): Promise<PreparedWorkout> {
    if (
      !!templateId === !!exerciseId ||
      (templateId && !validExerciseId(templateId)) ||
      (exerciseId && !validExerciseId(exerciseId))
    )
      throw new Error('Invalid workout selection.');
    let draft: WorkoutDraft, unit: WeightUnit;
    if (templateId) {
      const loaded = await workoutService.load(userId, templateId);
      if (!loaded.draft) throw new Error('Workout unavailable.');
      draft = loaded.draft;
      unit = loaded.unit;
    } else if (exerciseId) {
      await owner(userId);
      const [exercise, preference] = await Promise.all([
        exerciseService.detail(exerciseId),
        getSupabase().from('user_preferences').select('weight_unit').eq('user_id', userId).single(),
      ]);
      if (preference.error || !preference.data)
        throw new Error('Unable to load weight preference.');
      unit = preference.data.weight_unit === 'lb' ? 'lb' : 'kg';
      draft = {
        id: randomUUID(),
        name: exercise.name,
        notes: '',
        exercises: [
          {
            key: randomUUID(),
            exerciseId,
            name: exercise.name,
            imageUrl:
              exercise.exercise_media.find((media) => media.pose === 'start')?.imageUrl ??
              exercise.exercise_media[0]?.imageUrl ??
              null,
            notes: '',
            sets: [blankSet()],
          },
        ],
      };
    } else throw new Error('Choose a workout or exercise.');
    if (!draft.exercises.length) throw new Error('Add at least one exercise first.');
    const ids = [...new Set(draft.exercises.map((exercise) => exercise.exerciseId))];
    const before = new Date().toISOString();
    const [metadata, performance] = await Promise.all([
      getSupabase()
        .from('exercises')
        .select(
          'id,category,exercise_muscles(role,muscles(name)),exercise_equipment(equipment(name))',
        )
        .in('id', ids),
      getSupabase().rpc('get_exercise_performance', { p_exercise_ids: ids, p_before: before }),
    ]);
    if (metadata.error || !metadata.data || performance.error || !performance.data)
      throw new Error('Unable to load workout details. Retry.');
    const exercises: SessionExercise[] = draft.exercises.map((exercise) => {
      const entry = metadata.data.find((row) => row.id === exercise.exerciseId),
        previous = performance.data.find((row) => row.exercise_id === exercise.exerciseId);
      if (!entry || !previous) throw new Error('Workout exercise unavailable.');
      const priorPerformance = parsePerformance(previous.previous, previous.best);
      return {
        id: randomUUID(),
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        imageUrl: exercise.imageUrl,
        metadata:
          [
            ...entry.exercise_muscles
              .filter((row) => row.role === 'primary')
              .map((row) => row.muscles.name),
            ...entry.exercise_equipment.map((row) => row.equipment.name),
          ].join(' · ') ||
          entry.category ||
          'Muscle/equipment not listed',
        notes: exercise.notes,
        performance: priorPerformance,
        sets: exercise.sets.map((set, index) => ({
          ...set,
          rpe: '',
          weight:
            set.weight || displayWeight(priorPerformance.previous[index]?.weightKg ?? null, unit),
          id: randomUUID(),
          completedAt: null,
        })),
      };
    });
    return { draft, unit, exercises, templateId: templateId ?? null };
  },
  create(userId: string, prepared: PreparedWorkout, mode: SessionDraft['mode']): SessionDraft {
    const startedAt = new Date().toISOString(),
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return {
      format: 1,
      id: randomUUID(),
      userId,
      templateId: prepared.templateId,
      name: prepared.draft.name,
      notes: '',
      unit: prepared.unit,
      mode,
      status: 'active',
      startedAt,
      endedAt: null,
      localDate: localDateAt(startedAt, timeZone),
      timeZone,
      clock: { elapsedMs: 0, runningSince: mode === 'timed' ? Date.parse(startedAt) : null },
      rest: null,
      restDuration: 0,
      version: 0,
      mutationId: null,
      exercises: prepared.exercises,
    };
  },
  async save(session: SessionDraft) {
    const payload = sessionPayload(session);
    await owner(session.userId);
    if (payload.template_id) {
      const { data: template, error: lookupError } = await getSupabase()
        .from('workout_templates')
        .select('id')
        .eq('id', payload.template_id)
        .eq('user_id', session.userId)
        .maybeSingle();
      if (lookupError)
        throw new Error('Unable to check workout reference. Your local copy is kept; retry.');
      // Performed facts survive a template deleted while this device was offline.
      payload.template_id = template?.id ?? null;
    }
    const { data, error } = await getSupabase().rpc('save_workout_session', {
      p_session: payload,
      p_expected_version: session.version,
      p_mutation_id: session.mutationId ?? '',
    });
    if (error?.code === '40001')
      throw new Error(
        'Workout changed or was removed. Your local copy is kept; reopen history before editing.',
      );
    if (error || data !== session.version + 1)
      throw new Error('Unable to save workout. Your local copy is kept; retry.');
    return data;
  },
};
