import { useCallback, useState } from 'react';
import { Linking, View } from 'react-native';
import { ActionSheet } from '@/components/product-ui';
import { NumberStepper } from '@/components/number-stepper';
import {
  AuthButton,
  AuthChoice,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useRecords, RecordLoadFeedback } from '@/hooks/use-records';
import { bodyService } from '@/features/body/body-service';
import { BodyDetailsEditor } from '@/features/body/body-form';
import { canonicalInput, unitFactor } from '@/features/body/body-model';
import type { Preferences } from '@/features/profile/profile-model';
import {
  ageOnDate,
  activityLevels,
  estimateTargets,
  targetMethodUrl,
  type TargetEstimate,
} from './target-estimate';

export function TargetCalculator({
  userId,
  preferences,
  disabled,
  onGenerated,
}: {
  userId: string;
  preferences: Preferences;
  disabled: boolean;
  onGenerated: (values: TargetEstimate) => void;
}) {
  const [age, setAge] = useState(''),
    [weight, setWeight] = useState(''),
    [height, setHeight] = useState(''),
    [sex, setSex] = useState(''),
    [activity, setActivity] = useState(''),
    [eligible, setEligible] = useState(false),
    [editingDetails, setEditingDetails] = useState(false),
    [detailsLocked, setDetailsLocked] = useState(false),
    [error, setError] = useState<string | null>(null);
  const load = useCallback(
    () => bodyService.form(userId, undefined, { latestWeight: true }),
    [userId],
  );
  const onLoaded = useCallback(
    (data: Awaited<ReturnType<typeof bodyService.form>>) => {
      setAge(
        data.profile.date_of_birth ? String(ageOnDate(data.profile.date_of_birth, data.today)) : '',
      );
      setSex(data.profile.sex === 'male' || data.profile.sex === 'female' ? data.profile.sex : '');
      setWeight(
        data.weight ? String(data.weight.weight_kg * unitFactor(preferences.weight_unit)) : '',
      );
      setHeight(
        data.height ? String(data.height.value_cm * unitFactor(preferences.length_unit)) : '',
      );
    },
    [preferences.weight_unit, preferences.length_unit],
  );
  const resource = useRecords(load, onLoaded),
    data = resource.data;
  return (
    <View style={{ gap: 12 }}>
      <AuthText kind="heading">Calculate from your details</AuthText>
      <AuthText>
        Uses your saved age, latest weight and height. Fill any missing values here. Edits here
        affect this estimate only.
      </AuthText>
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <AuthText kind="muted">
            {data.weight ? `Saved weight: ${data.weight.local_date}` : 'No saved weight yet'} ·{' '}
            {data.height ? `Saved height: ${data.height.local_date}` : 'No saved height yet'}
          </AuthText>
          <AuthButton
            title="Edit saved personal details"
            outlined
            disabled={disabled}
            onPress={() => setEditingDetails(true)}
          />
          <NumberStepper
            label="Age (years)"
            value={age}
            onChange={setAge}
            min={19}
            max={120}
            disabled={disabled}
          />
          <NumberStepper
            label={`Calculation weight (${preferences.weight_unit})`}
            value={weight}
            onChange={setWeight}
            step={0.1}
            disabled={disabled}
          />
          <NumberStepper
            label={`Calculation height (${preferences.length_unit})`}
            value={height}
            onChange={setHeight}
            step={0.1}
            disabled={disabled}
          />
          <AuthText>Equation setting</AuthText>
          <View style={authStyles.choices}>
            {['female', 'male'].map((value) => (
              <AuthChoice
                key={value}
                title={value === 'female' ? 'Female equation' : 'Male equation'}
                selected={sex === value}
                disabled={disabled}
                onPress={() => setSex(value)}
              />
            ))}
          </View>
          <AuthText kind="muted">
            The published equations use these two settings. Choosing one here does not change your
            profile; manual targets remain available.
          </AuthText>
          <AuthText>Usual daily activity</AuthText>
          <View style={authStyles.choices}>
            {activityLevels.map((level) => (
              <AuthChoice
                key={level.key}
                title={level.label}
                selected={activity === level.key}
                disabled={disabled}
                onPress={() => setActivity(level.key)}
              />
            ))}
          </View>
          {!!activity && (
            <AuthText>{activityLevels.find((level) => level.key === activity)?.detail}</AuthText>
          )}
          <AuthText>
            Uses the 2023 DRI maintenance equations for adults 19+ who are not pregnant or
            breastfeeding. This is not a weight-loss prescription.
          </AuthText>
          <AuthChoice
            title="This general adult estimate applies to me"
            selected={eligible}
            disabled={disabled}
            onPress={() => setEligible((value) => !value)}
          />
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthButton
            title="Generate targets"
            disabled={disabled}
            onPress={() => {
              try {
                const result = estimateTargets({
                  age,
                  weightKg: canonicalInput(weight, preferences.weight_unit, 1000),
                  heightCm: canonicalInput(height, preferences.length_unit, 1000),
                  sex,
                  activity,
                  eligible,
                });
                setError(null);
                onGenerated(result);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Check your details.');
              }
            }}
          />
          <AuthLink
            title="About the calculation"
            disabled={disabled}
            onPress={() => void Linking.openURL(targetMethodUrl)}
          />
        </>
      )}
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
              resource.reload();
            }}
          />
        )}
      </ActionSheet>
    </View>
  );
}
