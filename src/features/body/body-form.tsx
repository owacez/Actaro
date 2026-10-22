import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { DatePicker } from '@/components/date-picker';
import { NumberStepper } from '@/components/number-stepper';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthInput,
  AuthLink,
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
import { displayDate } from '@/lib/format';

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

// One body record: the dated weigh-in (with live change from the previous one), an optional
// waist, and personal details shown inline. A single save writes weight and details
// atomically; height is logged only when it changes, and waist as its dated measurement.
export function BodyFormEditor({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [weight, setWeight] = useState(''),
    [waist, setWaist] = useState(''),
    [notes, setNotes] = useState(''),
    [showNote, setShowNote] = useState(false),
    [other, setOther] = useState({ open: false, name: '', value: '' }),
    [details, setDetails] = useState({ height: '', sex: '', birthDate: '', location: '' });
  const loadedDate = useRef<string | undefined>(undefined),
    detailsLoaded = useRef(false);
  const load = useCallback(() => bodyService.form(userId, selectedDate), [userId, selectedDate]);
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.form>>) => {
    if (!detailsLoaded.current) {
      // Details do not depend on the date; keep any edits when switching dates.
      detailsLoaded.current = true;
      setDetails({
        height: data.height
          ? String(data.height.value_cm * unitFactor(data.preferences.length_unit))
          : '',
        sex: data.profile.sex ?? '',
        birthDate: data.profile.date_of_birth ?? '',
        location: data.profile.location ?? '',
      });
    }
    if (loadedDate.current === data.day) return;
    loadedDate.current = data.day;
    setWeight(
      data.weight ? String(data.weight.weight_kg * unitFactor(data.preferences.weight_unit)) : '',
    );
    setWaist(
      data.waist ? String(data.waist.value_cm * unitFactor(data.preferences.length_unit)) : '',
    );
    setNotes(data.weight?.notes ?? '');
    setShowNote(Boolean(data.weight?.notes));
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    data = resource.data;
  if (!data || resource.loading)
    return <RecordLoadFeedback {...resource} retry={resource.refresh} />;
  const weightUnit = data.preferences.weight_unit,
    lengthUnit = data.preferences.length_unit;
  const savedHeight = data.height ? data.height.value_cm * unitFactor(lengthUnit) : null;
  const heightChanged = details.height.trim() !== '' && Number(details.height) !== savedHeight;
  const detailsChanged =
    heightChanged ||
    details.sex !== (data.profile.sex ?? '') ||
    details.birthDate !== (data.profile.date_of_birth ?? '') ||
    details.location.trim() !== (data.profile.location ?? '');
  const savedWaist = data.waist ? String(data.waist.value_cm * unitFactor(lengthUnit)) : '';
  const waistChanged = waist.trim() !== '' && waist.trim() !== savedWaist;
  // The change since the last weigh-in, from the typed value; nothing is stored.
  let change: string | null = null;
  const typed = Number(weight);
  if (weight.trim() && Number.isFinite(typed) && typed > 0)
    change = data.previous
      ? (() => {
          const diff = typed - data.previous.weight_kg * unitFactor(weightUnit);
          const rounded = Math.round(diff * 10) / 10;
          return `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${formatNumber(Math.abs(rounded))} ${weightUnit} since ${displayDate(data.previous.local_date)}`;
        })()
      : 'Your first weigh-in starts your trend.';
  function save() {
    if (!data) return;
    const otherEntered = other.name.trim() !== '' && other.value.trim() !== '';
    if (other.open && (other.name.trim() !== '') !== (other.value.trim() !== '')) {
      action.setError('Enter both a name and a value for the other measurement.');
      return;
    }
    if (!weight.trim() && !detailsChanged && !waistChanged && !otherEntered) {
      action.setError('Enter your weight, a measurement or a changed detail to save.');
      return;
    }
    void action.run(
      async () => {
        if (weight.trim() || detailsChanged)
          await bodyService.saveForm(
            userId,
            {
              date: data.day,
              weight,
              height: heightChanged ? details.height : '',
              sex: details.sex,
              birthDate: details.birthDate,
              location: details.location,
              notes,
            },
            data.preferences,
          );
        if (waistChanged)
          await bodyService.save(
            userId,
            'measurement',
            data.day,
            waist,
            lengthUnit,
            data.preferences.time_zone,
            'waist',
            '',
          );
        if (otherEntered)
          await bodyService.save(
            userId,
            'measurement',
            data.day,
            other.value,
            lengthUnit,
            data.preferences.time_zone,
            other.name,
            '',
          );
      },
      'Body record saved',
      () => {
        detailsLoaded.current = false;
        loadedDate.current = undefined;
        setOther({ open: false, name: '', value: '' });
        resource.refresh();
        onSaved();
      },
    );
  }
  return (
    <AuthCard>
      <AuthText kind="heading">Body record</AuthText>
      <DatePicker
        label="Body log date"
        value={data.day}
        max={data.today}
        disabled={action.locked}
        onChange={setSelectedDate}
      />
      <NumberStepper
        label={`Weight (${weightUnit})`}
        value={weight}
        onChange={setWeight}
        step={0.1}
        max={1000 * unitFactor(weightUnit)}
        disabled={action.locked}
        heading
      />
      {change && <AuthText kind="muted">{change}</AuthText>}
      <NumberStepper
        label={`Waist (${lengthUnit}, optional)`}
        value={waist}
        onChange={setWaist}
        step={0.5}
        max={300 * unitFactor(lengthUnit)}
        disabled={action.locked}
        heading
      />
      {other.open ? (
        <>
          <AuthText kind="heading">Other measurement</AuthText>
          <AuthInput
            label="Measurement name (for example chest)"
            hideLabel
            placeholder="Name, for example chest"
            value={other.name}
            onChangeText={(name) => setOther((current) => ({ ...current, name }))}
            maxLength={80}
            editable={!action.locked}
          />
          <NumberStepper
            label={`Measurement value (${lengthUnit})`}
            hideLabel
            value={other.value}
            onChange={(value) => setOther((current) => ({ ...current, value }))}
            step={0.5}
            max={300 * unitFactor(lengthUnit)}
            disabled={action.locked}
          />
          <AuthLink
            title="Remove other measurement"
            disabled={action.locked}
            onPress={() => setOther({ open: false, name: '', value: '' })}
          />
        </>
      ) : (
        <AuthLink
          title="+ Add a measurement"
          accessibilityLabel="Add a measurement"
          disabled={action.locked}
          onPress={() => setOther((current) => ({ ...current, open: true }))}
        />
      )}
      <AuthText kind="eyebrow">YOUR DETAILS</AuthText>
      <AuthText kind="muted">
        Change only when needed. Used for calorie estimates; kept private to you.
      </AuthText>
      <NumberStepper
        label={`Height (${lengthUnit}, optional)`}
        value={details.height}
        onChange={(height) => setDetails((current) => ({ ...current, height }))}
        step={0.1}
        max={1000 * unitFactor(lengthUnit)}
        disabled={action.locked}
        heading
      />
      <AuthText kind="heading">Sex (optional)</AuthText>
      <View style={authStyles.choices}>
        {bodySexOptions.map((option) => (
          <AuthChoice
            key={option.value}
            title={option.label}
            selected={details.sex === option.value}
            disabled={action.locked}
            onPress={() => setDetails((current) => ({ ...current, sex: option.value }))}
          />
        ))}
      </View>
      <DatePicker
        label="Date of birth (optional)"
        value={details.birthDate}
        max={data.today}
        referenceDate="2000-01-01"
        yearSelection
        disabled={action.locked}
        onChange={(birthDate) => setDetails((current) => ({ ...current, birthDate }))}
      />
      <AuthText kind="heading">Location (optional)</AuthText>
      <AuthInput
        label="Location (city/country, optional)"
        hideLabel
        placeholder="City, country"
        value={details.location}
        onChangeText={(location) => setDetails((current) => ({ ...current, location }))}
        maxLength={120}
        editable={!action.locked}
      />
      <AuthLink
        title={showNote ? 'Hide note' : notes ? 'Edit note' : 'Add a note'}
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
        title="Save body record"
        busy={action.busy}
        disabled={action.locked}
        onPress={save}
      />
      <AuthText kind="muted">
        One weight per date: saving the same date again corrects it. Height is logged only when it
        changes.
      </AuthText>
      <RecordSaveFeedback action={action} />
    </AuthCard>
  );
}
