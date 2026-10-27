import { NavigationSurface, Segments } from '@/components/product-ui';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { ExerciseImage } from './exercise-image';
import { exerciseService, type ExerciseDetail } from './exercise-service';

export function DetailScreen({
  id,
  onBack,
  onAddToWorkout,
  onLogExercise,
}: {
  id: string;
  onBack: () => void;
  onAddToWorkout?: (id: string) => void;
  onLogExercise?: (id: string) => void;
}) {
  const [record, setRecord] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [pose, setPose] = useState('start');
  const generation = useRef(0);
  useEffect(() => {
    const request = ++generation.current;
    void exerciseService
      .detail(id)
      .then((data) => {
        if (request !== generation.current) return;
        setRecord(data);
        setLoading(false);
      })
      .catch(() => {
        if (request !== generation.current) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      generation.current = request + 1;
    };
  }, [id, attempt]);
  function refresh() {
    setError(false);
    setLoading(true);
    setAttempt((value) => value + 1);
  }
  return (
    <AuthFrame
      footer={
        record && !loading && !error ? (
          <NavigationSurface style={{ padding: 16, gap: 8 }}>
            {onAddToWorkout && (
              <AuthButton title="Add to workout" onPress={() => onAddToWorkout(record.id)} />
            )}
            {onLogExercise && (
              <AuthButton title="Log exercise" outlined onPress={() => onLogExercise(record.id)} />
            )}
          </NavigationSurface>
        ) : undefined
      }
    >
      <BackLink label="Exercise Library" onPress={onBack} />
      {loading ? (
        <AuthLoading>Loading exercise…</AuthLoading>
      ) : error || !record ? (
        <>
          <AuthNotice error>
            Unable to load this exercise. Check your connection and retry.
          </AuthNotice>
          <AuthButton title="Retry" onPress={refresh} />
        </>
      ) : (
        <>
          <AuthText kind="heading">{record.name}</AuthText>
          <AuthText>
            {record.exercise_equipment.map((item) => item.equipment.name).join(', ') ||
              'No equipment'}
            {record.difficulty ? ` · ${record.difficulty}` : ''}
          </AuthText>
          {record.description && <AuthText>{record.description}</AuthText>}
          <Segments
            value={pose}
            onChange={setPose}
            options={['start', 'peak', 'main']
              .filter((value) => record.exercise_media.some((media) => media.pose === value))
              .map((value) => ({
                value,
                label: value === 'main' ? 'Technique' : value[0].toUpperCase() + value.slice(1),
              }))}
          />
          {[
            record.exercise_media.some((media) => media.pose === pose)
              ? pose
              : record.exercise_media[0]?.pose,
          ].map((pose) =>
            record.exercise_media
              .filter((media) => media.pose === pose)
              .map((media) => (
                <View key={media.id} style={{ gap: 6 }}>
                  <ExerciseImage
                    key={media.imageUrl ?? `${media.id}-${attempt}`}
                    url={media.imageUrl}
                    label={`${record.name}: ${pose} pose`}
                    large
                  />
                  <AuthText kind="muted">
                    {pose === 'main'
                      ? 'Technique'
                      : pose === 'start'
                        ? 'Start position'
                        : 'Peak position'}
                  </AuthText>
                </View>
              )),
          )}
          {!record.exercise_media.length && (
            <AuthNotice>Technique images are unavailable.</AuthNotice>
          )}
          <AuthLink title="Refresh images" onPress={refresh} />
          <View style={authStyles.choices}>
            {record.exercise_muscles.map((item) => (
              <AuthChoice
                key={item.muscles.id}
                title={`${item.muscles.name} · ${item.role}`}
                selected={item.role === 'primary'}
                disabled
                onPress={() => {}}
              />
            ))}
          </View>
          <AuthCard>
            <AuthText kind="eyebrow">TECHNIQUE</AuthText>
            {record.instructions.map((instruction, index) => (
              <AuthText key={`${index}-${instruction}`}>
                {index + 1}. {instruction}
              </AuthText>
            ))}
          </AuthCard>
          {record.movement_pattern && <AuthText>Movement: {record.movement_pattern}</AuthText>}
        </>
      )}
    </AuthFrame>
  );
}
