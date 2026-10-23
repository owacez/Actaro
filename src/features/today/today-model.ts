// What the Today workout card shows. An unfinished local session always wins; a workout
// completed today replaces the plan, but training again stays one tap away.
export type CompletedToday = {
  id: string;
  name: string;
  mode: string;
  duration_seconds: number | null;
};
export function todayWorkoutState({
  session,
  completed,
  scheduled,
}: {
  session: { status: 'active' | 'pending' | 'saved' } | null;
  completed: CompletedToday[];
  scheduled: boolean;
}) {
  if (session && session.status !== 'saved') return 'resume' as const;
  if (completed.length) return 'done' as const;
  return scheduled ? ('scheduled' as const) : ('none' as const);
}
