import { useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/features/profile/theme-context';
import {
  AuthButton,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { LibraryScreen } from '@/features/exercises/library-screen';
import { ExerciseImage } from '@/features/exercises/exercise-image';
import { exerciseService } from '@/features/exercises/exercise-service';
import { workoutService } from './workout-service';
import {
  blankSet,
  workoutPayload,
  type ExerciseDraft,
  type SetDraft,
  type WeightUnit,
  type WorkoutDraft,
} from './workout-model';

function exerciseDraft(exerciseId: string, name: string, imageUrl: string | null): ExerciseDraft {
  return {
    key: randomUUID(),
    exerciseId,
    name,
    imageUrl,
    notes: '',
    sets: [blankSet(), blankSet(), blankSet()],
  };
}

export function BuilderScreen({
  userId,
  id,
  exerciseId,
  onBack,
  onSaved,
  onEquipment,
}: {
  userId: string;
  id?: string;
  exerciseId?: string;
  onBack: () => void;
  onSaved: () => void;
  onEquipment: () => void;
}) {
  const [draft, setDraft] = useState<WorkoutDraft>(() => ({
    id: id ?? randomUUID(),
    name: '',
    notes: '',
    exercises: [],
  }));
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [baseline, setBaseline] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const generation = useRef(0),
    pending = useRef(false);
  const { notify } = useAuthFeedback();
  const { colors } = useAppTheme();
  useEffect(() => {
    const request = ++generation.current;
    void Promise.all([
      workoutService.load(userId, draft.id),
      exerciseId ? exerciseService.detail(exerciseId) : Promise.resolve(null),
    ])
      .then(([result, selected]) => {
        if (request !== generation.current) return;
        if (id && !result.draft) throw new Error('Workout unavailable. Return to My workouts.');
        const initial = result.draft ?? { id: draft.id, name: '', notes: '', exercises: [] };
        if (selected && initial.exercises.length >= 100) throw new Error('Workout full');
        setDraft(
          selected
            ? {
                ...initial,
                exercises: [
                  ...initial.exercises,
                  exerciseDraft(
                    selected.id,
                    selected.name,
                    selected.exercise_media.find((media) => media.pose === 'start')?.imageUrl ??
                      selected.exercise_media[0]?.imageUrl ??
                      null,
                  ),
                ],
              }
            : initial,
        );
        setUnit(result.unit);
        setBaseline(JSON.stringify(initial));
        setLoading(false);
      })
      .catch(() => {
        if (request !== generation.current) return;
        setError(
          exerciseId
            ? 'Unable to open the workout or add the selected exercise. It may be unavailable or at its 100-exercise limit. Retry or choose another workout.'
            : 'Unable to load this workout and your preferences. Retry or return to My workouts.',
        );
        setLoading(false);
      });
    return () => {
      generation.current = request + 1;
    };
  }, [userId, id, exerciseId, draft.id, attempt]);
  const dirty = baseline !== '' && JSON.stringify(draft) !== baseline;
  function changeExercise(key: string, update: (exercise: ExerciseDraft) => ExerciseDraft) {
    setError(null);
    setDraft((current) => ({
      ...current,
      exercises: current.exercises.map((item) => (item.key === key ? update(item) : item)),
    }));
  }
  function changeSet(key: string, index: number, field: keyof SetDraft, value: string) {
    changeExercise(key, (item) => ({
      ...item,
      sets: item.sets.map((set, position) =>
        position === index ? { ...set, [field]: value } : set,
      ),
    }));
  }
  function move(key: string, step: number) {
    setDraft((current) => {
      const items = [...current.exercises],
        index = items.findIndex((item) => item.key === key),
        target = index + step;
      if (target < 0 || target >= items.length) return current;
      [items[index], items[target]] = [items[target], items[index]];
      return { ...current, exercises: items };
    });
  }
  async function save() {
    if (pending.current) return;
    try {
      workoutPayload(draft, unit);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check your workout.');
      return;
    }
    pending.current = true;
    setSaving(true);
    setError(null);
    const request = generation.current;
    try {
      await workoutService.save(userId, draft, unit);
      if (request !== generation.current) return;
      setBaseline(JSON.stringify(draft));
      notify('Workout saved.', 'success');
      onSaved();
    } catch {
      if (request === generation.current)
        setError('Unable to save workout. Your draft is kept; retry.');
    } finally {
      pending.current = false;
      if (request === generation.current) setSaving(false);
    }
  }
  if (picking)
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthLink title="← Back to workout" onPress={() => setPicking(false)} />
        <LibraryScreen
          userId={userId}
          onEquipment={onEquipment}
          onOpen={(_, item) => {
            setDraft((current) => ({
              ...current,
              exercises: [...current.exercises, exerciseDraft(item.id, item.name, item.imageUrl)],
            }));
            setPicking(false);
            setError(null);
          }}
        />
      </SafeAreaView>
    );
  return (
    <AuthFrame>
      <AuthLink
        title="← My workouts"
        disabled={saving}
        onPress={() => (dirty ? setConfirmDiscard(true) : onBack())}
      />
      <AuthText kind="heading">Build Workout</AuthText>
      <AuthText>Create a reusable strength session.</AuthText>
      {loading ? (
        <AuthLoading>Loading workout…</AuthLoading>
      ) : baseline === '' ? (
        <>
          <AuthNotice error>{error}</AuthNotice>
          <AuthButton
            title="Retry"
            onPress={() => {
              setLoading(true);
              setError(null);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      ) : (
        <>
          {confirmDiscard ? (
            <>
              <AuthNotice>Leave without saving your changes?</AuthNotice>
              <AuthButton
                title="Keep editing"
                outlined
                disabled={saving}
                onPress={() => setConfirmDiscard(false)}
              />
              <AuthButton title="Discard and leave" disabled={saving} onPress={onBack} />
            </>
          ) : null}
          <AuthInput
            label="Workout name"
            value={draft.name}
            maxLength={100}
            editable={!saving}
            onChangeText={(name) => {
              setError(null);
              setDraft((current) => ({ ...current, name }));
            }}
          />
          <View style={authStyles.row}>
            <AuthText kind="heading">Exercises</AuthText>
            <AuthLink
              title="+ Add exercise"
              disabled={saving || draft.exercises.length >= 100}
              onPress={() => setPicking(true)}
            />
          </View>
          {!draft.exercises.length && (
            <AuthText>Add an exercise from the library to begin.</AuthText>
          )}
          {draft.exercises.map((item, index) => (
            <View key={item.key} style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <ExerciseImage url={item.imageUrl} label={`${item.name} technique`} />
                <View style={{ flex: 1 }}>
                  <AuthText>
                    {index + 1}. {item.name}
                  </AuthText>
                  <AuthText kind="muted">{item.sets.length} sets</AuthText>
                </View>
                <AuthLink
                  title={editing === item.key ? 'Close' : `Edit ${index + 1}`}
                  disabled={saving}
                  onPress={() => setEditing((current) => (current === item.key ? null : item.key))}
                />
              </View>
              {editing === item.key && (
                <>
                  <View style={authStyles.row}>
                    <AuthLink
                      title={`Move ${index + 1} up`}
                      disabled={saving || index === 0}
                      onPress={() => move(item.key, -1)}
                    />
                    <AuthLink
                      title={`Move ${index + 1} down`}
                      disabled={saving || index === draft.exercises.length - 1}
                      onPress={() => move(item.key, 1)}
                    />
                    <AuthLink
                      title={`Remove exercise ${index + 1}`}
                      disabled={saving}
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          exercises: current.exercises.filter((entry) => entry.key !== item.key),
                        }))
                      }
                    />
                  </View>
                  {item.sets.map((set, position) => (
                    <View key={position} style={{ gap: 8 }}>
                      <AuthText>Set {position + 1}</AuthText>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(
                          [
                            ['reps', 'Reps'],
                            ['weight', `Weight (${unit})`],
                            ['rest', 'Rest (sec)'],
                            ['rpe', 'RPE (optional)'],
                          ] as const
                        ).map(([field, label]) => (
                          <View key={field} style={{ flexBasis: '20%', flexGrow: 1 }}>
                            <AuthInput
                              label={
                                field === 'weight'
                                  ? unit
                                  : field === 'rest'
                                    ? 'Rest'
                                    : field === 'rpe'
                                      ? 'RPE'
                                      : 'Reps'
                              }
                              accessibilityLabel={`${label} · exercise ${index + 1} set ${position + 1}`}
                              value={set[field]}
                              keyboardType={
                                field === 'reps' || field === 'rest' ? 'number-pad' : 'decimal-pad'
                              }
                              editable={!saving}
                              maxLength={12}
                              onChangeText={(value) => changeSet(item.key, position, field, value)}
                            />
                          </View>
                        ))}
                      </View>
                      <AuthInput
                        label={`Set note · exercise ${index + 1} set ${position + 1}`}
                        value={set.notes}
                        editable={!saving}
                        maxLength={2000}
                        onChangeText={(value) => changeSet(item.key, position, 'notes', value)}
                      />
                      <AuthLink
                        title={`Remove set ${position + 1}`}
                        disabled={saving || item.sets.length === 1}
                        onPress={() =>
                          changeExercise(item.key, (current) => ({
                            ...current,
                            sets: current.sets.filter((_, i) => i !== position),
                          }))
                        }
                      />
                    </View>
                  ))}
                  <AuthButton
                    title="+ Add set"
                    outlined
                    disabled={saving || item.sets.length >= 100}
                    onPress={() =>
                      changeExercise(item.key, (current) => ({
                        ...current,
                        sets: [...current.sets, blankSet()],
                      }))
                    }
                  />
                  <AuthInput
                    label={`Exercise note ${index + 1}`}
                    value={item.notes}
                    maxLength={2000}
                    editable={!saving}
                    onChangeText={(notes) =>
                      changeExercise(item.key, (current) => ({ ...current, notes }))
                    }
                  />
                </>
              )}
            </View>
          ))}
          <AuthText>
            New sets start with 8 reps and 90 seconds rest. Edit each set; blank weight means
            unspecified, zero means bodyweight.
          </AuthText>
          <AuthInput
            label="Workout notes (optional)"
            value={draft.notes}
            editable={!saving}
            maxLength={2000}
            multiline
            onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
          />
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthButton
            title="Save workout"
            disabled={!dirty}
            busy={saving}
            onPress={() => void save()}
          />
        </>
      )}
    </AuthFrame>
  );
}
