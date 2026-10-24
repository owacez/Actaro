import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { NumberStepper } from '@/components/number-stepper';
import { DatePicker } from '@/components/date-picker';
import { ScreenHeader, ActionSheet } from '@/components/product-ui';
import { BodyFormEditor } from './body-form';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  BackLink,
  AuthCard,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import { formatNumber, nutritionDate } from '@/features/nutrition/nutrition-model';
import { displayDate } from '@/lib/format';
import { bodyService, type BodyKind } from './body-service';
import { unitFactor } from './body-model';
export function BodyScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [showHistory, setShowHistory] = useState(false);
  const [kind, setKind] = useState<BodyKind>('measurement'),
    [editOpen, setEditOpen] = useState(false),
    [formVersion, setFormVersion] = useState(0),
    [offset, setOffset] = useState(0),
    [until, setUntil] = useState<string>(),
    [date, setDate] = useState(''),
    [value, setValue] = useState(''),
    [name, setName] = useState('waist'),
    [notes, setNotes] = useState(''),
    [remove, setRemove] = useState<{ kind: BodyKind; date: string; name: string } | null>(null);
  const load = useCallback(
      () => bodyService.history(userId, offset, until),
      [userId, offset, until],
    ),
    onLoaded = useCallback(
      (data: Awaited<ReturnType<typeof bodyService.history>>) =>
        setDate((current) => current || data.today),
      [],
    ),
    resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const data = resource.data,
    unit = data
      ? kind === 'weight'
        ? data.preferences.weight_unit
        : data.preferences.length_unit
      : 'kg';
  function save() {
    if (!data) return;
    try {
      nutritionDate(date);
      if (date > data.today) throw new Error('Cannot log a future date.');
      if (!value.trim()) throw new Error('Enter a body value.');
      void action.run(
        () =>
          bodyService.save(
            userId,
            kind,
            date,
            value,
            unit,
            data.preferences.time_zone,
            name,
            notes,
          ),
        'Body record saved',
        () => {
          setEditOpen(false);
          setFormVersion((value) => value + 1);
          resource.refresh();
        },
      );
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check your inputs.');
    }
  }
  return (
    <AuthFrame header={<ScreenHeader title="Body records" />}>
      <BackLink label="Back" disabled={action.locked} onPress={onBack} />
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <BodyFormEditor key={formVersion} userId={userId} onSaved={onBack} />
          <ActionSheet
            title={kind === 'weight' ? 'Edit weight record' : 'Edit measurement'}
            visible={editOpen}
            onClose={() => {
              if (!action.locked) setEditOpen(false);
            }}
          >
            <DatePicker
              label="Body record date"
              value={date || data.today}
              max={data.today}
              disabled={action.locked}
              onChange={setDate}
            />
            {kind === 'measurement' && (
              <AuthInput
                label="Measurement name"
                value={name}
                editable={!action.locked}
                maxLength={80}
                onChangeText={setName}
              />
            )}
            <NumberStepper
              large
              step={0.1}
              max={kind === 'weight' ? 1500 : 1000}
              label={kind === 'weight' ? `Bodyweight (${unit})` : `Measurement (${unit})`}
              value={value}
              disabled={action.locked}
              onChange={setValue}
            />
            <AuthInput
              label="Body record note (optional)"
              value={notes}
              multiline
              maxLength={2000}
              editable={!action.locked}
              onChangeText={setNotes}
            />
            <AuthText>
              One weight and one value per named measurement per date. Saving the same date replaces
              its recorded value. Measurements also support your body goals.
            </AuthText>
            <AuthButton
              title="Save record"
              busy={action.busy}
              disabled={action.locked}
              onPress={save}
            />
            <RecordSaveFeedback action={action} />
          </ActionSheet>
          <AuthButton
            title={showHistory ? 'Hide history' : 'View history'}
            outlined
            disabled={action.locked}
            onPress={() => setShowHistory((value) => !value)}
          />
          {showHistory && (
            <>
              <AuthText kind="heading">Recorded history</AuthText>
              <DatePicker
                label="Show history up to"
                value={until ?? data.today}
                max={data.today}
                disabled={action.locked}
                onChange={(day) => {
                  setUntil(day);
                  setOffset(0);
                }}
              />
              {data.weights.map((row) => (
                <AuthCard key={row.local_date}>
                  <AuthText kind="heading">
                    {displayDate(row.local_date)} · Weight{' '}
                    {formatNumber(row.weight_kg * unitFactor(data.preferences.weight_unit))}{' '}
                    {data.preferences.weight_unit}
                  </AuthText>
                  {row.notes && <AuthText>{row.notes}</AuthText>}
                  <AuthLink
                    title={`Edit weight ${row.local_date}`}
                    disabled={action.locked}
                    onPress={() => {
                      setKind('weight');
                      setEditOpen(true);
                      setDate(row.local_date);
                      setValue(String(row.weight_kg * unitFactor(data.preferences.weight_unit)));
                      setNotes(row.notes ?? '');
                    }}
                  />
                  <AuthLink
                    title={`Delete weight ${row.local_date}`}
                    disabled={action.locked}
                    onPress={() => setRemove({ kind: 'weight', date: row.local_date, name: '' })}
                  />
                </AuthCard>
              ))}
              {data.measurements.map((row) => (
                <AuthCard key={row.measurement + row.local_date}>
                  <AuthText kind="heading">
                    {displayDate(row.local_date)} · {capital(row.measurement)}{' '}
                    {formatNumber(row.value_cm * unitFactor(data.preferences.length_unit))}{' '}
                    {data.preferences.length_unit}
                  </AuthText>
                  {row.notes && <AuthText>{row.notes}</AuthText>}
                  <AuthLink
                    title={`Edit ${row.measurement} ${row.local_date}`}
                    disabled={action.locked}
                    onPress={() => {
                      setDate(row.local_date);
                      setKind('measurement');
                      setEditOpen(true);
                      setName(row.measurement);
                      setValue(String(row.value_cm * unitFactor(data.preferences.length_unit)));
                      setNotes(row.notes ?? '');
                    }}
                  />
                  <AuthLink
                    title={`Delete ${row.measurement} ${row.local_date}`}
                    disabled={action.locked}
                    onPress={() =>
                      setRemove({
                        kind: 'measurement',
                        date: row.local_date,
                        name: row.measurement,
                      })
                    }
                  />
                </AuthCard>
              ))}
              {data.weights.length === 0 && data.measurements.length === 0 && (
                <AuthNotice>No body records in this page. Log a value to begin.</AuthNotice>
              )}
              {remove && (
                <AuthCard>
                  <AuthText>
                    Delete {remove.kind === 'weight' ? 'weight' : remove.name} on{' '}
                    {displayDate(remove.date)}? Goals will recalculate from remaining records.
                  </AuthText>
                  <AuthButton
                    title="Confirm body deletion"
                    busy={action.busy}
                    disabled={action.locked}
                    onPress={() =>
                      void action.run(
                        () => bodyService.remove(userId, remove.kind, remove.date, remove.name),
                        'Body record deleted',
                        () => {
                          setRemove(null);
                          resource.refresh();
                        },
                      )
                    }
                  />
                  <AuthLink
                    title="Keep body record"
                    disabled={action.locked}
                    onPress={() => setRemove(null)}
                  />
                </AuthCard>
              )}
              {(offset > 0 || data.weights.length >= 30 || data.measurements.length >= 30) && (
                <View style={authStyles.row}>
                  <AuthLink
                    title="Newer body records"
                    disabled={action.locked || offset === 0}
                    onPress={() => setOffset((current) => Math.max(0, current - 30))}
                  />
                  <AuthText>Page {offset / 30 + 1}</AuthText>
                  <AuthLink
                    title="Older body records"
                    disabled={
                      action.locked || (data.weights.length < 30 && data.measurements.length < 30)
                    }
                    onPress={() => setOffset((current) => current + 30)}
                  />
                </View>
              )}
            </>
          )}
        </>
      )}
      {!editOpen && <RecordSaveFeedback action={action} />}
    </AuthFrame>
  );
}
function capital(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}
