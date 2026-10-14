import { AuthButton, AuthLoading, AuthNotice } from '@/features/auth/auth-components';
import {
  SaveFeedback,
  useNutritionAction,
  useNutritionLoad,
} from '@/features/nutrition/nutrition-ui';
// The existing load and acknowledged-retry mechanics are shared by actual record editors.
export const useRecordAction = useNutritionAction;
export const RecordSaveFeedback = SaveFeedback;
export function useRecords<T>(load: () => Promise<T>, onLoaded?: (value: T) => void) {
  return useNutritionLoad(load, onLoaded, 'Unable to load your records. Retry.');
}
export function RecordLoadFeedback({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  return (
    <>
      {loading && <AuthLoading>Loading your records…</AuthLoading>}
      {error && (
        <>
          <AuthNotice error>{error}</AuthNotice>
          <AuthButton title="Retry loading" onPress={retry} />
        </>
      )}
    </>
  );
}
