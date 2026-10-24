import { historyService } from './history-service';
import { sessionStore } from './session-store';

// Today's workout facts shared by Today and Train: the unfinished local session, if any,
// and the sessions completed today (newest first).
export async function todayWorkoutRecords(userId: string, today: string) {
  const [stored, month] = await Promise.all([
    sessionStore.read(userId),
    historyService.calendar(userId),
  ]);
  // A finished session acknowledged by the server is already in history; clearing the local
  // copy lets the user start another workout today.
  let session = stored;
  if (session?.status === 'saved') {
    await sessionStore.forgetSaved(userId, session.id);
    session = null;
  }
  return {
    session,
    completed: month.rows.filter((row) => row.local_date === today).reverse(),
  };
}
