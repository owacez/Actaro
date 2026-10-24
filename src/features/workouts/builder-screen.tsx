import { useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { Pressable, StyleSheet, View } from 'react-native';
import type { SymbolViewProps } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionSheet, ProductIcon } from '@/components/product-ui';
import { NumberStepper } from '@/components/number-stepper';
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
import { exerciseService, type ExerciseSummary } from '@/features/exercises/exercise-service';
import { workoutService } from './workout-service';
import {
  blankSet,
  workoutPayload,
  type ExerciseDraft,
  type SetDraft,
  type WeightUnit,
  type WorkoutDraft,
} from './workout-model';
import { plural } from '@/lib/format';

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

  function addFromSearch(item: ExerciseSummary) {
    setDraft((current) =>
      current.exercises.length >= 100 ||
      current.exercises.some((exercise) => exercise.exerciseId === item.id)
        ? current
        : {
            ...current,
            exercises: [...current.exercises, exerciseDraft(item.id, item.name, item.imageUrl)],
          },
    );
    setError(null);
  }
  const editingIndex = draft.exercises.findIndex((item) => item.key === editing),
    editingExercise = draft.exercises[editingIndex];
  const targetEditor = (
    <ActionSheet
      title={editingExercise ? 'Edit ' + editingExercise.name : 'Edit exercise'}
      visible={!!editingExercise}
      onClose={() => setEditing(null)}
    >
      {editingExercise && (
        <>
          <NumberStepper
            label="Planned sets"
            value={String(editingExercise.sets.length)}
            min={1}
            max={100}
            disabled={saving}
            onChange={(value) => {
              const count = Number(value);
              if (!Number.isInteger(count) || count < 1 || count > 100) return;
              changeExercise(editingExercise.key, (current) => ({
                ...current,
                sets: Array.from(
                  { length: count },
                  (_, index) => current.sets[index] ?? blankSet(),
                ),
              }));
            }}
          />
          <View style={[authStyles.row, { flexWrap: 'wrap' }]}>
            <AuthLink
              title={`Move ${editingIndex + 1} up`}
              disabled={saving || editingIndex === 0}
              onPress={() => move(editingExercise.key, -1)}
            />
            <AuthLink
              title={`Move ${editingIndex + 1} down`}
              disabled={saving || editingIndex === draft.exercises.length - 1}
              onPress={() => move(editingExercise.key, 1)}
            />
            <AuthLink
              title={`Remove exercise ${editingIndex + 1}`}
              disabled={saving}
              onPress={() =>
                setDraft((current) => ({
                  ...current,
                  exercises: current.exercises.filter((entry) => entry.key !== editingExercise.key),
                }))
              }
            />
          </View>
          {editingExercise.sets.map((set, position) => (
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
                      accessibilityLabel={`${label} · exercise ${editingIndex + 1} set ${position + 1}`}
                      value={set[field]}
                      keyboardType={
                        field === 'reps' || field === 'rest' ? 'number-pad' : 'decimal-pad'
                      }
                      editable={!saving}
                      maxLength={12}
                      onChangeText={(value) =>
                        changeSet(editingExercise.key, position, field, value)
                      }
                    />
                  </View>
                ))}
              </View>
              <AuthInput
                label={`Set note · exercise ${editingIndex + 1} set ${position + 1}`}
                value={set.notes}
                editable={!saving}
                maxLength={2000}
                onChangeText={(value) => changeSet(editingExercise.key, position, 'notes', value)}
              />
              <AuthLink
                title={`Remove set ${position + 1}`}
                disabled={saving || editingExercise.sets.length === 1}
                onPress={() =>
                  changeExercise(editingExercise.key, (current) => ({
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
            disabled={saving || editingExercise.sets.length >= 100}
            onPress={() =>
              changeExercise(editingExercise.key, (current) => ({
                ...current,
                sets: [...current.sets, blankSet()],
              }))
            }
          />
          <AuthInput
            label={`Exercise note ${editingIndex + 1}`}
            value={editingExercise.notes}
            maxLength={2000}
            editable={!saving}
            onChangeText={(notes) =>
              changeExercise(editingExercise.key, (current) => ({ ...current, notes }))
            }
          />
        </>
      )}
      <AuthButton title="Done editing" onPress={() => setEditing(null)} />
    </ActionSheet>
  );

  if (picking)
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <LibraryScreen
          userId={userId}
          onEquipment={onEquipment}
          onQuickAdd={addFromSearch}
          selectedExercises={draft.exercises.map((item) => ({
            id: item.exerciseId,
            sets: item.sets.length,
          }))}
          addDisabled={draft.exercises.length >= 100}
          onEditSelection={(id) =>
            setEditing(draft.exercises.find((item) => item.exerciseId === id)?.key ?? null)
          }
          onOpen={(_, item) => {
            const existing = draft.exercises.find((exercise) => exercise.exerciseId === item.id);
            if (existing) setEditing(existing.key);
            else addFromSearch(item);
          }}
        />
        <View
          style={{
            gap: 6,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <AuthText kind="muted">
            {plural(draft.exercises.length, 'exercise')} in this draft. Return to the workout to
            save.
          </AuthText>
          <AuthButton title="Back to workout" onPress={() => setPicking(false)} />
        </View>
        {targetEditor}
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
            <View
              key={item.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 10,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <View>
                <SmallIcon
                  label={`Move exercise ${index + 1} up`}
                  name={{
                    ios: 'chevron.up',
                    android: 'keyboard_arrow_up',
                    web: 'keyboard_arrow_up',
                  }}
                  disabled={saving || index === 0}
                  onPress={() => move(item.key, -1)}
                />
                <SmallIcon
                  label={`Move exercise ${index + 1} down`}
                  name={{
                    ios: 'chevron.down',
                    android: 'keyboard_arrow_down',
                    web: 'keyboard_arrow_down',
                  }}
                  disabled={saving || index === draft.exercises.length - 1}
                  onPress={() => move(item.key, 1)}
                />
              </View>
              <ExerciseImage url={item.imageUrl} label={`${item.name} technique`} />
              <View style={{ flex: 1 }}>
                <AuthText kind="heading">
                  {index + 1}. {item.name}
                </AuthText>
                <AuthText kind="muted">{plural(item.sets.length, 'set')}</AuthText>
              </View>
              <SmallIcon
                label={`${editing === item.key ? 'Close' : 'Edit'} exercise ${index + 1}`}
                name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
                disabled={saving}
                onPress={() => setEditing((current) => (current === item.key ? null : item.key))}
              />
              <SmallIcon
                label={`Delete exercise ${index + 1}`}
                name={{ ios: 'trash', android: 'delete', web: 'delete' }}
                disabled={saving}
                onPress={() => {
                  if (editing === item.key) setEditing(null);
                  setDraft((current) => ({
                    ...current,
                    exercises: current.exercises.filter((entry) => entry.key !== item.key),
                  }));
                }}
              />
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
      {targetEditor}
    </AuthFrame>
  );
}

// A compact icon control for exercise rows; the hit area stays at least 44 points.
function SmallIcon({
  label,
  name,
  disabled,
  onPress,
}: {
  label: string;
  name: SymbolViewProps['name'];
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minWidth: 34,
        minHeight: 34,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.25 : pressed ? 0.5 : 1,
      })}
    >
      <ProductIcon name={name} size={20} color={colors.text} />
    </Pressable>
  );
}
