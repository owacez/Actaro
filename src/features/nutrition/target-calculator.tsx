import { useCallback, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { ActionSheet, ProductIcon } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
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
  bodyGoals,
  estimateTargets,
  planTargets,
  targetMethodUrl,
  type BodyGoal,
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
  onGenerated: (values: TargetEstimate, goal: BodyGoal, maintenance: TargetEstimate) => void;
}) {
  const { colors } = useAppTheme();
  const [age, setAge] = useState(''),
    [weight, setWeight] = useState(''),
    [height, setHeight] = useState(''),
    [sex, setSex] = useState(''),
    [activity, setActivity] = useState(''),
    [goal, setGoal] = useState<BodyGoal>('maintain'),
    [eligible, setEligible] = useState(false),
    [editingDetails, setEditingDetails] = useState(false),
    [learning, setLearning] = useState(false),
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
        Prefilled from your saved age, latest weight and height, so usually you only choose a goal
        and activity. Edits here affect this estimate only.
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
          <AuthText kind="heading">Your goal</AuthText>
          <View style={authStyles.choices}>
            {bodyGoals.map((option) => (
              <AuthChoice
                key={option.key}
                title={option.label}
                selected={goal === option.key}
                disabled={disabled}
                onPress={() => setGoal(option.key)}
              />
            ))}
          </View>
          <AuthText kind="muted">
            {bodyGoals.find((option) => option.key === goal)?.detail}
          </AuthText>
          <AuthText kind="heading">Usual daily activity</AuthText>
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
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: eligible, disabled }}
            disabled={disabled}
            onPress={() => setEligible((value) => !value)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 44,
              opacity: disabled || pressed ? 0.6 : 1,
            })}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: colors.text,
                backgroundColor: eligible ? colors.text : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {eligible && (
                <ProductIcon
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={16}
                  color={colors.background}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AuthText>I agree the 2023 adult energy estimate applies to me.</AuthText>
            </View>
          </Pressable>
          <View style={{ paddingLeft: 36, marginTop: -12 }}>
            <AuthLink title="Learn more" disabled={disabled} onPress={() => setLearning(true)} />
          </View>
          {error && <AuthNotice error>{error}</AuthNotice>}
          <AuthButton
            title="Generate targets"
            disabled={disabled}
            onPress={() => {
              try {
                const weightKg = canonicalInput(weight, preferences.weight_unit, 1000);
                const result = estimateTargets({
                  age,
                  weightKg,
                  heightCm: canonicalInput(height, preferences.length_unit, 1000),
                  sex,
                  activity,
                  eligible,
                });
                setError(null);
                onGenerated(planTargets(result, goal, weightKg), goal, result);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Check your details.');
              }
            }}
          />
        </>
      )}
      <ActionSheet
        title="About this estimate"
        visible={learning}
        onClose={() => setLearning(false)}
      >
        <AuthText>
          Maintenance energy uses the 2023 Dietary Reference Intake (DRI) equations published by
          Health Canada, from your age, height, weight and usual activity.
        </AuthText>
        <AuthText>
          They are for adults aged 19 or older who are not pregnant or breastfeeding. If that is not
          you, or you follow medical advice, enter your targets manually instead.
        </AuthText>
        <AuthText>
          A goal adds a shown, editable deficit or surplus. It is a starting point, not a
          prescription, and promises no rate of change.
        </AuthText>
        <AuthLink
          title="Read the published equations"
          onPress={() => void Linking.openURL(targetMethodUrl)}
        />
        <AuthButton title="Close" outlined onPress={() => setLearning(false)} />
      </ActionSheet>
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
