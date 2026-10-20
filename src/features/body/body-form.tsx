import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/components/product-ui';
import { DatePicker } from '@/components/date-picker';
import { NumberStepper } from '@/components/number-stepper';
import {
  AuthButton,
  AuthChoice,
  AuthInput,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import {
  useRecords,
  useRecordAction,
  RecordLoadFeedback,
  RecordSaveFeedback,
} from '@/hooks/use-records';
import { bodyService } from './body-service';
import { bodySexOptions, unitFactor, type BodyForm } from './body-model';
import { formatNumber } from '@/features/nutrition/nutrition-model';

export function BodyDetailsEditor({
  userId,
  onSaved,
  onLockChange,
}: {
  userId: string;
  onSaved: () => void;
  onLockChange?: (locked: boolean) => void;
}) {
  const [form, setForm] = useState<BodyForm | null>(null);
  const load = useCallback(() => bodyService.form(userId), [userId]);
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.form>>) => {
    setForm({
      date: data.today,
      weight: '',
      height: data.height
        ? String(data.height.value_cm * unitFactor(data.preferences.length_unit))
        : '',
      sex: data.profile.sex ?? '',
      birthDate: data.profile.date_of_birth ?? '',
      location: data.profile.location ?? '',
      notes: '',
    });
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    data = resource.data;
  useEffect(() => onLockChange?.(action.locked), [action.locked, onLockChange]);
  return (
    <View style={{ gap: 12 }}>
      <AuthText>
        Set these once and update them when needed. They are separate from your daily weight log.
      </AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && form && !resource.loading && (
        <>
          <NumberStepper
            label={`Height (${data.preferences.length_unit}, optional)`}
            value={form.height}
            onChange={(height) => setForm({ ...form, height })}
            step={0.1}
            max={1000 * unitFactor(data.preferences.length_unit)}
            disabled={action.locked}
          />
          <AuthText>Sex (optional)</AuthText>
          <View style={authStyles.choices}>
            {bodySexOptions.map((option) => (
              <AuthChoice
                key={option.value}
                title={option.label}
                selected={form.sex === option.value}
                disabled={action.locked}
                onPress={() => setForm({ ...form, sex: option.value })}
              />
            ))}
          </View>
          <DatePicker
            label="Date of birth (optional)"
            value={form.birthDate}
            max={data.today}
            referenceDate="2000-01-01"
            yearSelection
            disabled={action.locked}
            onChange={(birthDate) => setForm({ ...form, birthDate })}
          />
          {!!form.birthDate && (
            <AuthButton
              title="Clear date of birth"
              outlined
              disabled={action.locked}
              onPress={() => setForm({ ...form, birthDate: '' })}
            />
          )}
          <AuthInput
            label="Location (city/country, optional)"
            value={form.location}
            onChangeText={(location) => setForm({ ...form, location })}
            maxLength={120}
            editable={!action.locked}
          />
          <AuthText kind="muted">
            Height uses the current date only when changed. Leaving it blank preserves it. Location
            is entered manually.
          </AuthText>
          <AuthButton
            title="Save personal details"
            busy={action.busy}
            disabled={action.locked}
            onPress={() =>
              void action.run(
                () =>
                  bodyService.saveForm(
                    userId,
                    {
                      ...form,
                      height:
                        data.height &&
                        Number(form.height) ===
                          data.height.value_cm * unitFactor(data.preferences.length_unit)
                          ? ''
                          : form.height,
                    },
                    data.preferences,
                  ),
                'Personal details saved',
                onSaved,
              )
            }
          />
        </>
      )}
      <RecordSaveFeedback action={action} />
    </View>
  );
}

export function BodyFormEditor({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [weight, setWeight] = useState(''),
    [notes, setNotes] = useState(''),
    [showNote, setShowNote] = useState(false),
    [editingDetails, setEditingDetails] = useState(false),
    [detailsLocked, setDetailsLocked] = useState(false);
  const loadedDate = useRef<string | undefined>(undefined);
  const load = useCallback(() => bodyService.form(userId, selectedDate), [userId, selectedDate]);
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.form>>) => {
    if (loadedDate.current === data.day) return;
    loadedDate.current = data.day;
    setWeight(
      data.weight ? String(data.weight.weight_kg * unitFactor(data.preferences.weight_unit)) : '',
    );
    setNotes(data.weight?.notes ?? '');
    setShowNote(Boolean(data.weight?.notes));
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    data = resource.data;
  return (
    <View style={{ gap: 12 }}>
      <AuthText kind="heading">Log your weight</AuthText>
      <AuthText>A quick weigh-in. Personal details only need updating when they change.</AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <DatePicker
            label="Body log date"
            value={data.day}
            max={data.today}
            disabled={action.locked}
            onChange={setSelectedDate}
          />
          <NumberStepper
            label={`Weight (${data.preferences.weight_unit})`}
            value={weight}
            onChange={setWeight}
            step={0.1}
            max={1000 * unitFactor(data.preferences.weight_unit)}
            disabled={action.locked}
          />
          <AuthButton
            title={showNote ? 'Hide note' : notes ? 'Edit note' : 'Add a note'}
            outlined
            disabled={action.locked}
            onPress={() => setShowNote((value) => !value)}
          />
          {showNote && (
            <AuthInput
              label="Body record note (optional)"
              value={notes}
              onChangeText={setNotes}
              maxLength={2000}
              multiline
              editable={!action.locked}
            />
          )}
          <AuthButton
            title="Save weigh-in"
            busy={action.busy}
            disabled={action.locked}
            onPress={() =>
              void action.run(
                () =>
                  bodyService.save(
                    userId,
                    'weight',
                    data.day,
                    weight,
                    data.preferences.weight_unit,
                    data.preferences.time_zone,
                    '',
                    notes,
                  ),
                'Weight saved',
                () => {
                  resource.refresh();
                  onSaved();
                },
              )
            }
          />
          <AuthText kind="heading">Personal details</AuthText>
          <AuthText kind="muted">
            {data.height
              ? `Height ${formatNumber(data.height.value_cm * unitFactor(data.preferences.length_unit))} ${data.preferences.length_unit}`
              : 'Height not set'}{' '}
            ·{' '}
            {bodySexOptions.find((option) => option.value === data.profile.sex)?.label ??
              'Sex not set'}
          </AuthText>
          <AuthText kind="muted">
            {data.profile.date_of_birth
              ? `Born ${data.profile.date_of_birth}`
              : 'Date of birth not set'}
            {data.profile.location ? ` · ${data.profile.location}` : ''}
          </AuthText>
          <AuthButton
            title="Edit personal details"
            outlined
            disabled={action.locked}
            onPress={() => setEditingDetails(true)}
          />
          <ActionSheet
            title="Personal details"
            visible={editingDetails}
            onClose={() => {
              if (!detailsLocked) setEditingDetails(false);
            }}
          >
            {editingDetails && (
              <BodyDetailsEditor
                userId={userId}
                onLockChange={setDetailsLocked}
                onSaved={() => {
                  setDetailsLocked(false);
                  setEditingDetails(false);
                  resource.refresh();
                  onSaved();
                }}
              />
            )}
          </ActionSheet>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </View>
  );
}
