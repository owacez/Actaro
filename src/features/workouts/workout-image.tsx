import { useEffect, useState, type ComponentProps } from 'react';
import { AppState } from 'react-native';
import { ExerciseImage } from '@/features/exercises/exercise-image';
import { exerciseService } from '@/features/exercises/exercise-service';
import { clearReadCache } from '@/lib/supabase/read-cache';

// Drafts keep performed facts; their one-hour image URLs are only temporary hints.
export function WorkoutImage({
  exerciseId,
  url,
  ...props
}: Omit<ComponentProps<typeof ExerciseImage>, 'onRetry'> & { exerciseId: string }) {
  const [attempt, setAttempt] = useState(0);
  const [resolved, setResolved] = useState<{
    exerciseId: string;
    original: string | null;
    url: string;
  } | null>(null);
  useEffect(() => {
    let active = true,
      sequence = 0;
    function refresh() {
      const request = ++sequence;
      void exerciseService
        .image(exerciseId)
        .then((image) => {
          if (active && request === sequence && image)
            setResolved({ exerciseId, original: url, url: image });
        })
        .catch(() => {}); // Keep the cached image and workout usable while offline.
    }
    refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      listener.remove();
    };
  }, [exerciseId, url, attempt]);
  return (
    <ExerciseImage
      {...props}
      url={resolved?.exerciseId === exerciseId && resolved.original === url ? resolved.url : url}
      onRetry={() => {
        clearReadCache();
        setAttempt((value) => value + 1);
      }}
    />
  );
}
