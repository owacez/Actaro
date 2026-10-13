import type { Performance } from './session-model';
export type PerformedSet = { reps: number; weightKg: number | null };
export function estimated1rm(set: PerformedSet) {
  if (set.weightKg === null || set.weightKg <= 0 || set.reps < 1 || set.reps > 10) return null;
  return set.reps === 1 ? set.weightKg : set.weightKg * (1 + set.reps / 30);
}
export function trainingVolume(sets: PerformedSet[]) {
  return {
    sets: sets.length,
    reps: sets.reduce((sum, set) => sum + set.reps, 0),
    volumeKg:
      Math.round(sets.reduce((sum, set) => sum + set.reps * (set.weightKg ?? 0), 0) * 1000) / 1000,
    unknownWeightSets: sets.filter((set) => set.weightKg === null).length,
  };
}
export function personalRecords(sets: PerformedSet[], previous: Performance) {
  const records: {
    kind: 'Heaviest lift' | 'Rep PR' | 'Estimated 1RM';
    value: number;
    weightKg?: number;
    first: boolean;
  }[] = [];
  const positive = sets.flatMap((set) =>
    set.weightKg !== null && set.weightKg > 0 ? [set.weightKg] : [],
  );
  const heaviest = positive.length ? Math.max(...positive) : null;
  if (heaviest !== null && (previous.heaviestKg === null || heaviest > previous.heaviestKg))
    records.push({ kind: 'Heaviest lift', value: heaviest, first: previous.heaviestKg === null });
  const estimates = sets.flatMap((set) => {
    const estimate = estimated1rm(set);
    return estimate === null ? [] : [estimate];
  });
  const estimate = estimates.length ? Math.max(...estimates) : null;
  if (
    estimate !== null &&
    (previous.estimated1rm === null || estimate > previous.estimated1rm + 0.000001)
  )
    records.push({ kind: 'Estimated 1RM', value: estimate, first: previous.estimated1rm === null });
  const reps = new Map<number, number>();
  for (const set of sets)
    if (set.weightKg !== null)
      reps.set(set.weightKg, Math.max(reps.get(set.weightKg) ?? 0, set.reps));
  for (const [weight, value] of reps) {
    const best = previous.repsByWeight[String(weight)];
    if (best === undefined || value > best)
      records.push({ kind: 'Rep PR', value, weightKg: weight, first: best === undefined });
  }
  return records;
}
