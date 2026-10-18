import { useCallback, useState } from 'react';
import { View } from 'react-native';
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
import { bodySexOptions, unitFactor } from './body-model';

export function BodyFormEditor({ userId, onSaved }: { userId: string; onSaved: () => void }) {
  const [selectedDate, setSelectedDate] = useState<string>();
  const [personal, setPersonal] = useState<{
    sex: string;
    birthDate: string;
    location: string;
  } | null>(null);
  const [weight, setWeight] = useState(''),
    [height, setHeight] = useState(''),
    [notes, setNotes] = useState('');
  const load = useCallback(() => bodyService.form(userId, selectedDate), [userId, selectedDate]);
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.form>>) => {
    setPersonal(
      (previous) =>
        previous ?? {
          sex: data.profile.sex ?? '',
          birthDate: data.profile.date_of_birth ?? '',
          location: data.profile.location ?? '',
        },
    );
    setWeight(
      data.weight ? String(data.weight.weight_kg * unitFactor(data.preferences.weight_unit)) : '',
    );
    setHeight(
      data.height ? String(data.height.value_cm * unitFactor(data.preferences.length_unit)) : '',
    );
    setNotes(data.weight?.notes ?? data.height?.notes ?? '');
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    data = resource.data;
  return (
    <View style={{ gap: 12 }}>
      <AuthText kind="heading">Your body details</AuthText>
      <AuthText>
        Log weight and height together. Sex, date of birth and location are optional personal
        details.
      </AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && personal && (
        <>
          <DatePicker
            label="Body log date"
            value={data.day}
            max={data.today}
            disabled={action.locked}
            onChange={setSelectedDate}
          />
          <NumberStepper
            label={`Weight (${data.preferences.weight_unit}, optional)`}
            value={weight}
            onChange={setWeight}
            step={0.1}
            max={1000 * unitFactor(data.preferences.weight_unit)}
            disabled={action.locked}
          />
          <NumberStepper
            label={`Height (${data.preferences.length_unit}, optional)`}
            value={height}
            onChange={setHeight}
            step={0.1}
            max={1000 * unitFactor(data.preferences.length_unit)}
            disabled={action.locked}
          />
          <AuthText kind="muted">
            The log date applies to weight and height. Blank values leave existing dated records
            unchanged.
          </AuthText>
          <AuthText>Sex (optional)</AuthText>
          <View style={authStyles.choices}>
            {bodySexOptions.map((option) => (
              <AuthChoice
                key={option.value}
                title={option.label}
                selected={personal.sex === option.value}
                disabled={action.locked}
                onPress={() => setPersonal({ ...personal, sex: option.value })}
              />
            ))}
          </View>
          <DatePicker
            label="Date of birth (optional)"
            value={personal.birthDate}
            max={data.today}
            referenceDate="2000-01-01"
            yearSelection
            disabled={action.locked}
            onChange={(birthDate) => setPersonal({ ...personal, birthDate })}
          />
          {personal.birthDate && (
            <AuthButton
              title="Clear date of birth"
              outlined
              disabled={action.locked}
              onPress={() => setPersonal({ ...personal, birthDate: '' })}
            />
          )}
          <AuthInput
            label="Location (city/country, optional)"
            value={personal.location}
            onChangeText={(location) => setPersonal({ ...personal, location })}
            maxLength={120}
            editable={!action.locked}
          />
          <AuthInput
            label="Body record note (optional)"
            value={notes}
            onChangeText={setNotes}
            maxLength={2000}
            multiline
            editable={!action.locked}
          />
          <AuthText kind="muted">
            Personal details stay on your private profile when you change log dates. Location is
            entered manually.
          </AuthText>
          <AuthButton
            title="Save body details"
            busy={action.busy}
            disabled={action.locked}
            onPress={() =>
              void action.run(
                () =>
                  bodyService.saveForm(
                    userId,
                    { date: data.day, weight, height, notes, ...personal },
                    data.preferences,
                  ),
                'Body details saved',
                () => {
                  resource.refresh();
                  onSaved();
                },
              )
            }
          />
        </>
      )}
      <RecordSaveFeedback action={action} />
    </View>
  );
}
