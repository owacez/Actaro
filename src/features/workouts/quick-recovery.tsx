import { useState } from 'react';
import { View } from 'react-native';
import { Segments } from '@/components/product-ui';
import { AuthButton, AuthCard, AuthText } from '@/features/auth/auth-components';
import { RecordSaveFeedback, useRecordAction } from '@/hooks/use-records';
import { blankRecovery, recoveryChoices, recoveryPayload } from './recovery-model';
import { recoveryService } from './recovery-service';

const fields = [
  ['energy', 'Energy'],
  ['soreness', 'Soreness'],
  ['sleep', 'Sleep last night'],
] as const;

// A short recovery check on the workout summary. It saves the same daily check-in as the
// Recovery screen, where stress and notes remain available.
export function QuickRecovery({
  userId,
  date,
  timeZone,
}: {
  userId: string;
  date: string;
  timeZone: string;
}) {
  const [input, setInput] = useState(blankRecovery),
    [saved, setSaved] = useState(false),
    [problem, setProblem] = useState<string | null>(null);
  const action = useRecordAction();
  function save() {
    try {
      recoveryPayload(input);
    } catch (reason) {
      setProblem(reason instanceof Error ? reason.message : 'Choose each option.');
      return;
    }
    setProblem(null);
    void action.run(
      () => recoveryService.save(userId, date, timeZone, input),
      'Recovery check saved',
      () => setSaved(true),
    );
  }
  if (saved)
    return (
      <AuthCard>
        <AuthText kind="heading">Check-in saved</AuthText>
        <AuthText>Today’s check-in updates your Training Status and Recovery.</AuthText>
      </AuthCard>
    );
  return (
    <AuthCard>
      <AuthText kind="heading">How do you feel?</AuthText>
      <AuthText kind="muted">
        Optional. Three taps record today’s recovery check; it replaces any earlier check-in today.
      </AuthText>
      {fields.map(([field, label]) => (
        <View key={field} style={{ gap: 6 }}>
          <AuthText kind="eyebrow">{label.toUpperCase()}</AuthText>
          <Segments
            label={label}
            value={input[field] === null ? '' : String(input[field])}
            options={recoveryChoices[field].map((choice) => ({
              value: String(choice.value),
              label: choice.label,
            }))}
            disabled={action.locked}
            onChange={(value) => setInput((current) => ({ ...current, [field]: Number(value) }))}
          />
        </View>
      ))}
      {problem && <AuthText kind="muted">{problem}</AuthText>}
      <AuthButton
        title="Save recovery check"
        outlined
        busy={action.busy}
        disabled={action.locked}
        onPress={save}
      />
      <RecordSaveFeedback action={action} />
    </AuthCard>
  );
}
