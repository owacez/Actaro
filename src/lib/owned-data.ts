import { getSupabase } from './supabase/client';
export class RecordRequestError extends Error {
  constructor(
    message: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = 'RecordRequestError';
  }
}
export async function requireOwner(userId: string) {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || data.user?.id !== userId)
    throw new RecordRequestError('Unable to verify your account. Reopen this screen or retry.');
}
export function recordResult<T>(data: T | null, error: unknown): T {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string' &&
    ['22023', '23514', '23502', '23503', '23505', '42501', 'PGRST116'].includes(error.code)
  )
    throw new RecordRequestError('Request rejected. Review inputs or reload for the latest data.');
  if (error || data === null)
    throw new RecordRequestError(
      'Request was not confirmed. Keep this screen open and retry.',
      true,
    );
  return data;
}
export function recordInput<T>(validate: () => T): T {
  try {
    return validate();
  } catch (error) {
    throw new RecordRequestError(error instanceof Error ? error.message : 'Review your inputs.');
  }
}
