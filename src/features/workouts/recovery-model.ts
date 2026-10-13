import { shiftDate, trainingStatus, type TrainingOverview } from './training-overview';
export type RecoveryInput = {
  energy: number | null;
  soreness: number | null;
  sleep: number | null;
  stress: number | null;
  notes: string;
};
export const recoveryChoices = {
  energy: [
    { value: 1, label: 'Low' },
    { value: 2, label: 'Okay' },
    { value: 3, label: 'High' },
  ],
  soreness: [
    { value: 0, label: 'None' },
    { value: 1, label: 'Mild' },
    { value: 2, label: 'Moderate' },
    { value: 3, label: 'High' },
  ],
  sleep: [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Fair' },
    { value: 3, label: 'Good' },
  ],
  stress: [
    { value: null, label: 'Not recorded' },
    { value: 1, label: 'Low' },
    { value: 2, label: 'Moderate' },
    { value: 3, label: 'High' },
  ],
};
export const blankRecovery = (): RecoveryInput => ({
  energy: null,
  soreness: null,
  sleep: null,
  stress: null,
  notes: '',
});
export function recoveryPayload(input: RecoveryInput) {
  const category = (value: number | null, allowed: number[], label: string) => {
    if (value === null || !allowed.includes(value)) throw new Error(`Choose ${label}.`);
    return value;
  };
  if (input.notes.length > 2000) throw new Error('Keep notes within 2,000 characters.');
  if (input.stress !== null && ![1, 2, 3].includes(input.stress))
    throw new Error('Choose a valid stress level.');
  return {
    energy: category(input.energy, [1, 2, 3], 'energy'),
    soreness: category(input.soreness, [0, 1, 2, 3], 'soreness'),
    sleep: category(input.sleep, [1, 2, 3], 'sleep quality'),
    stress: input.stress,
    notes: input.notes.trim(),
  };
}
export function recoveryResult(
  input: RecoveryInput,
  overview: TrainingOverview,
  today: string,
  plannedRest: boolean,
) {
  if (input.energy === null || input.soreness === null || input.sleep === null) return null;
  if (input.energy === 1 || input.sleep === 1 || input.soreness === 3 || input.stress === 3)
    return {
      label: 'Consider Recovery',
      reason:
        'At least one self-report indicates low energy, poor sleep, high soreness or high stress.',
    };
  if (input.energy === 2 || input.sleep === 2 || input.soreness === 2 || input.stress === 2)
    return {
      label: 'Moderate',
      reason:
        'At least one self-report indicates okay energy, fair sleep, moderate soreness or moderate stress.',
    };
  const consecutive = [0, 1, 2].every((offset) =>
    overview.days.some((day) => day.date === shiftDate(today, -offset) && day.sessions > 0),
  );
  const highVolume = trainingStatus(overview, today, null).some(
    (status) => status.label === 'High Training Volume',
  );
  if (consecutive && (plannedRest || highVolume))
    return {
      label: 'Moderate',
      reason: plannedRest
        ? 'Your reports are positive, but you logged training on three consecutive dates and today is scheduled for rest.'
        : 'Your reports are positive, but three consecutive training dates coincide with working-set volume above your own recorded baseline.',
    };
  return {
    label: 'Good',
    reason:
      'Self-reports are positive and no recent frequency/volume/rest-day rule is triggered. This is a check-in category, not a physiological measurement.',
  };
}
