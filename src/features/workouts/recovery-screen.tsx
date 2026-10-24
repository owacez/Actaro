import { ScreenHeader, Segments } from '@/components/product-ui';
import { displayDate } from '@/lib/format';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthFrame,
  AuthInput,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { displayWeight } from './workout-model';
import {
  blankRecovery,
  recoveryChoices,
  recoveryPayload,
  recoveryResult,
  type RecoveryInput,
} from './recovery-model';
import { recoveryService } from './recovery-service';
type Loaded = Awaited<ReturnType<typeof recoveryService.load>>;
export function RecoveryScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [data, setData] = useState<Loaded | null>(null),
    [input, setInput] = useState(blankRecovery),
    [baseline, setBaseline] = useState('');
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [attempt, setAttempt] = useState(0),
    [discard, setDiscard] = useState(false);
  const pending = useRef(false),
    alive = useRef(true),
    { notify } = useAuthFeedback();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    void recoveryService
      .load(userId)
      .then((value) => {
        if (!active) return;
        const row = value.rows.find((entry) => entry.local_date === value.context.today);
        const form: RecoveryInput = row
          ? {
              energy: row.energy,
              soreness: row.soreness,
              sleep: row.sleep_quality,
              stress: row.stress,
              notes: row.notes ?? '',
            }
          : blankRecovery();
        setData(value);
        setInput(form);
        setBaseline(JSON.stringify(form));
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError('Unable to load recovery checks. Retry.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  async function save() {
    if (!data || pending.current) return;
    try {
      recoveryPayload(input);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Choose all required reports.');
      return;
    }
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await recoveryService.save(userId, data.context.today, data.context.timeZone, input);
      if (alive.current) {
        notify('Recovery check saved.', 'success');
        onBack();
      }
    } catch (reason) {
      if (alive.current)
        setError(
          reason instanceof Error ? reason.message : 'Unable to save check. Your entries are kept.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const dirty = !!data && JSON.stringify(input) !== baseline;
  const weekday = data ? (new Date(data.context.today + 'T12:00:00Z').getUTCDay() + 6) % 7 : 0;
  const rest = data?.context.plan?.days[weekday]?.isRest ?? false;
  const result = data
    ? recoveryResult(input, data.context.overview, data.context.today, rest)
    : null;
  return (
    <AuthFrame header={<ScreenHeader title="Recovery check" />}>
      <BackLink
        label="Back"
        disabled={busy}
        onPress={() => (dirty ? setDiscard(true) : onBack())}
      />
      {error && <AuthNotice error>{error}</AuthNotice>}
      {loading ? (
        <AuthLoading>Loading recovery checks…</AuthLoading>
      ) : data ? (
        <>
          {discard && (
            <>
              <AuthText>Discard these unsaved check-in changes?</AuthText>
              <AuthButton
                title="Keep check-in changes"
                outlined
                disabled={busy}
                onPress={() => setDiscard(false)}
              />
              <AuthButton title="Discard check-in changes" disabled={busy} onPress={onBack} />
            </>
          )}
          <AuthText>
            {displayDate(data.context.today)} · {data.context.timeZone}
          </AuthText>
          <AuthText>
            Report how you feel today. Energy, soreness and sleep are required; stress and notes are
            optional.
          </AuthText>
          {(['energy', 'soreness', 'sleep', 'stress'] as const).map((field) => (
            <View key={field} style={{ gap: 8 }}>
              <AuthText kind="eyebrow">
                {field === 'sleep' ? 'Sleep quality' : field[0].toUpperCase() + field.slice(1)}
              </AuthText>
              <Segments
                label={field === 'sleep' ? 'Sleep' : field[0].toUpperCase() + field.slice(1)}
                value={input[field] === null ? '' : String(input[field])}
                options={recoveryChoices[field].map((choice) => ({
                  value: choice.value === null ? '' : String(choice.value),
                  label: choice.label,
                }))}
                disabled={busy}
                onChange={(value) =>
                  setInput({ ...input, [field]: value === '' ? null : Number(value) })
                }
              />
            </View>
          ))}
          <AuthInput
            label="Recovery note (optional)"
            value={input.notes}
            multiline
            maxLength={2000}
            editable={!busy}
            onChangeText={(notes) => setInput({ ...input, notes })}
          />
          {result && (
            <AuthCard>
              <AuthText kind="eyebrow">
                {dirty ? 'Preview' : 'Saved check'}: {result.label}
              </AuthText>
              <AuthText>{result.reason}</AuthText>
            </AuthCard>
          )}
          <AuthCard>
            <AuthText kind="eyebrow">Recorded training context</AuthText>
            <AuthText>
              {data.context.overview.sessions} workouts on {data.context.overview.activeDays} dates
              in the past 28 dates · {data.context.overview.sets} working sets
            </AuthText>
            <AuthText>
              Known external volume:{' '}
              {displayWeight(data.context.overview.volumeKg, data.context.unit)} {data.context.unit}
              ·reps
            </AuthText>
            <AuthText>
              {data.context.plan
                ? rest
                  ? 'Today is a planned rest day.'
                  : 'Today is not scheduled for rest.'
                : 'No active split is selected.'}
            </AuthText>
          </AuthCard>
          <AuthButton
            title="Save recovery check"
            busy={busy}
            disabled={!dirty}
            onPress={() => void save()}
          />
          <AuthText>
            Categories use your reports and simple recorded frequency/volume/rest-day rules. No
            readiness score or physiological recovery measurement is inferred.
          </AuthText>
          <AuthText kind="eyebrow">Recent check-ins</AuthText>
          {!data.rows.length && <AuthText>No saved check-ins yet.</AuthText>}
          {data.rows.map((row) => (
            <AuthCard key={row.local_date}>
              <AuthText>
                {displayDate(row.local_date)}: energy{' '}
                {recoveryChoices.energy.find((choice) => choice.value === row.energy)?.label},
                soreness{' '}
                {recoveryChoices.soreness.find((choice) => choice.value === row.soreness)?.label},
                sleep{' '}
                {recoveryChoices.sleep.find((choice) => choice.value === row.sleep_quality)?.label}
              </AuthText>
              {!!row.notes && <AuthText>{row.notes}</AuthText>}
            </AuthCard>
          ))}
        </>
      ) : (
        <AuthButton
          title="Retry recovery checks"
          onPress={() => {
            setError(null);
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        />
      )}
    </AuthFrame>
  );
}
