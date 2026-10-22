import { useCallback, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { View } from 'react-native';
import { Meter, ScreenHeader } from '@/components/product-ui';
import { DatePicker } from '@/components/date-picker';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { bodyService } from '@/features/body/body-service';
import { bodySexOptions, canonicalInput } from '@/features/body/body-model';
import { numeric } from '@/features/nutrition/nutrition-model';
import {
  activityLevels,
  ageOnDate,
  estimateTargets,
  type TargetEstimate,
} from '@/features/nutrition/target-estimate';
import {
  RecordLoadFeedback,
  RecordSaveFeedback,
  useRecordAction,
  useRecords,
} from '@/hooks/use-records';
import { bodyGoals, planTargets, targetWeightError, type BodyGoal } from './onboarding-model';
import { onboardingService } from './onboarding-service';

const steps = ['Units', 'About you', 'Your body', 'Your goal', 'Activity', 'Your plan'] as const;
type Plan = { calories: string; protein: string; carbs: string; fat: string; water: string };

export function OnboardingScreen({ userId, onDone }: { userId: string; onDone: () => void }) {
  const { colors } = useAppTheme();
  const load = useCallback(() => bodyService.form(userId), [userId]);
  const [step, setStep] = useState(0),
    [error, setError] = useState<string | null>(null),
    [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg'),
    [lengthUnit, setLengthUnit] = useState<'cm' | 'in'>('cm'),
    [sex, setSex] = useState(''),
    [birthDate, setBirthDate] = useState(''),
    [height, setHeight] = useState(''),
    [weight, setWeight] = useState(''),
    [waist, setWaist] = useState(''),
    [goal, setGoal] = useState<BodyGoal>('maintain'),
    [targetWeight, setTargetWeight] = useState(''),
    [activity, setActivity] = useState(''),
    [eligible, setEligible] = useState(false),
    [estimateNote, setEstimateNote] = useState<string | null>(null),
    [plan, setPlan] = useState<Plan>({ calories: '', protein: '', carbs: '', fat: '', water: '' }),
    [goalId] = useState(() => randomUUID());
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.form>>) => {
    setWeightUnit(data.preferences.weight_unit === 'lb' ? 'lb' : 'kg');
    setLengthUnit(data.preferences.length_unit === 'in' ? 'in' : 'cm');
    setSex(data.profile.sex ?? '');
    setBirthDate(data.profile.date_of_birth ?? '');
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction();
  const data = resource.data;

  // Each step validates only its own answers before moving on.
  function check(): string | null {
    try {
      if (step === 1) {
        if (!sex) return 'Choose an option for sex, including Prefer not to say.';
        if (!birthDate) return 'Choose your date of birth.';
        canonicalInput(height, lengthUnit, 275);
      }
      if (step === 2) {
        canonicalInput(weight, weightUnit, 455);
        if (waist.trim()) canonicalInput(waist, lengthUnit, 300);
      }
      if (step === 3 && targetWeight.trim())
        return targetWeightError(
          goal,
          canonicalInput(weight, weightUnit, 455),
          canonicalInput(targetWeight, weightUnit, 455),
        );
      if (step === 4 && !activity) return 'Choose your usual activity level.';
    } catch (reason) {
      return reason instanceof Error ? reason.message : 'Check this step.';
    }
    return null;
  }
  // The plan is a deterministic estimate filled into editable fields; nothing is saved yet.
  function preparePlan() {
    if (!data) return;
    try {
      const weightKg = canonicalInput(weight, weightUnit, 455);
      const maintenance = estimateTargets({
        age: String(ageOnDate(birthDate, data.today)),
        weightKg,
        heightCm: canonicalInput(height, lengthUnit, 275),
        sex,
        activity,
        eligible,
      });
      const values: TargetEstimate = planTargets(maintenance, goal, weightKg);
      setPlan((current) => ({
        ...current,
        calories: String(values.calories),
        protein: String(values.protein),
        carbs: String(values.carbs),
        fat: String(values.fat),
      }));
      setEstimateNote(
        `Estimated maintenance: ${maintenance.calories.toLocaleString('en')} kcal a day.`,
      );
    } catch (reason) {
      setEstimateNote(
        `${reason instanceof Error ? reason.message : 'An estimate is not available.'} Enter your own targets below.`,
      );
    }
  }
  function next() {
    const problem = check();
    setError(problem);
    if (problem) return;
    if (step === 4) preparePlan();
    setStep((value) => Math.min(steps.length - 1, value + 1));
  }
  function save() {
    if (!data) return;
    try {
      const targets = {
        calories: numeric(plan.calories, 'calories', 10000),
        protein: numeric(plan.protein, 'protein', 1000, true),
        carbs: numeric(plan.carbs, 'carbohydrates', 2000, true),
        fat: numeric(plan.fat, 'fat', 1000, true),
        water_ml: numeric(plan.water, 'daily water', 10000),
      };
      const goalForm =
        goal !== 'maintain' && targetWeight.trim()
          ? {
              id: goalId,
              form: {
                name: `Bodyweight: ${targetWeight.trim()} ${weightUnit}`,
                metric: 'body_weight' as const,
                baseline: String(canonicalInput(weight, weightUnit, 455)),
                target: String(canonicalInput(targetWeight, weightUnit, 455)),
                direction: goal === 'lose' ? ('at_most' as const) : ('at_least' as const),
                tolerance: '10',
                start: data.today,
                end: '',
                zone: data.preferences.time_zone,
                habitId: '',
                exerciseId: '',
                measurement: 'waist',
              },
            }
          : null;
      setError(null);
      void action.run(
        () =>
          onboardingService.complete(userId, data.preferences, {
            units: { weight_unit: weightUnit, length_unit: lengthUnit },
            body: {
              date: data.today,
              weight,
              height,
              sex,
              birthDate,
              location: '',
              notes: '',
            },
            waist,
            targets,
            goal: goalForm,
          }),
        'Your plan is ready',
        onDone,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Check your targets.');
    }
  }
  const locked = action.locked;
  return (
    <AuthFrame
      header={
        <ScreenHeader title="Set up Actaro" subtitle={`STEP ${step + 1} OF ${steps.length}`} />
      }
    >
      <Meter value={step + 1} target={steps.length} color={colors.accent} />
      <RecordLoadFeedback {...resource} retry={resource.reload} />
      {data && !resource.loading && (
        <>
          {step === 0 && (
            <>
              <AuthText kind="title">Welcome to Actaro</AuthText>
              <AuthText>
                A few questions set up your daily calorie and protein targets. It takes about a
                minute, and you can change everything later.
              </AuthText>
              <AuthText kind="heading">Weight unit</AuthText>
              <View style={authStyles.choices}>
                {(['kg', 'lb'] as const).map((unit) => (
                  <AuthChoice
                    key={unit}
                    title={unit}
                    selected={weightUnit === unit}
                    onPress={() => setWeightUnit(unit)}
                  />
                ))}
              </View>
              <AuthText kind="heading">Height unit</AuthText>
              <View style={authStyles.choices}>
                {(['cm', 'in'] as const).map((unit) => (
                  <AuthChoice
                    key={unit}
                    title={unit}
                    selected={lengthUnit === unit}
                    onPress={() => setLengthUnit(unit)}
                  />
                ))}
              </View>
            </>
          )}
          {step === 1 && (
            <>
              <AuthText kind="title">About you</AuthText>
              <AuthText>Used to estimate your daily energy needs. Kept private to you.</AuthText>
              <AuthText kind="heading">Sex</AuthText>
              <View style={authStyles.choices}>
                {bodySexOptions
                  .filter((option) => option.value)
                  .map((option) => (
                    <AuthChoice
                      key={option.value}
                      title={option.label}
                      selected={sex === option.value}
                      onPress={() => setSex(option.value)}
                    />
                  ))}
              </View>
              <DatePicker
                label="Date of birth"
                value={birthDate}
                max={data.today}
                referenceDate="2000-01-01"
                yearSelection
                onChange={setBirthDate}
              />
              <AuthInput
                label={`Height (${lengthUnit})`}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </>
          )}
          {step === 2 && (
            <>
              <AuthText kind="title">Your body today</AuthText>
              <AuthText>Saved as today’s first weigh-in so Progress can show your trend.</AuthText>
              <AuthInput
                label={`Current weight (${weightUnit})`}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                maxLength={6}
              />
              <AuthInput
                label={`Waist (${lengthUnit}, optional)`}
                value={waist}
                onChangeText={setWaist}
                keyboardType="decimal-pad"
                maxLength={6}
              />
              <AuthText kind="muted">
                Measure around your waist at the navel. Useful for tracking fat loss alongside
                weight.
              </AuthText>
            </>
          )}
          {step === 3 && (
            <>
              <AuthText kind="title">What’s your goal?</AuthText>
              {bodyGoals.map((option) => (
                <AuthChoice
                  key={option.key}
                  title={option.label}
                  selected={goal === option.key}
                  onPress={() => setGoal(option.key)}
                />
              ))}
              <AuthText>{bodyGoals.find((option) => option.key === goal)?.detail}</AuthText>
              {goal !== 'maintain' && (
                <>
                  <AuthInput
                    label={`Target weight (${weightUnit}, optional)`}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    keyboardType="decimal-pad"
                    maxLength={6}
                  />
                  <AuthText kind="muted">
                    Adds a bodyweight goal that tracks your weigh-ins. Results vary; nothing is
                    promised.
                  </AuthText>
                </>
              )}
            </>
          )}
          {step === 4 && (
            <>
              <AuthText kind="title">How active are you?</AuthText>
              <AuthText>Think of a usual week, including work and exercise.</AuthText>
              {activityLevels.map((level) => (
                <AuthCard key={level.key}>
                  <AuthChoice
                    title={level.label}
                    selected={activity === level.key}
                    onPress={() => setActivity(level.key)}
                  />
                  <AuthText kind="muted">{level.detail}</AuthText>
                </AuthCard>
              ))}
              <AuthChoice
                title="I’m 19 or older and not pregnant or breastfeeding"
                selected={eligible}
                onPress={() => setEligible((value) => !value)}
              />
              <AuthText kind="muted">
                The estimate uses the 2023 adult Dietary Reference Intake equations. Without this
                confirmation you can enter your own targets.
              </AuthText>
            </>
          )}
          {step === 5 && (
            <>
              <AuthText kind="title">Your daily plan</AuthText>
              {estimateNote && <AuthNotice>{estimateNote}</AuthNotice>}
              <AuthText>
                {goal === 'maintain'
                  ? 'Targets match your estimated maintenance.'
                  : bodyGoals.find((option) => option.key === goal)?.detail}{' '}
                Edit any value before saving.
              </AuthText>
              {(
                [
                  ['calories', 'Calories (kcal)'],
                  ['protein', 'Protein (g)'],
                  ['carbs', 'Carbohydrates (g)'],
                  ['fat', 'Fat (g)'],
                  ['water', 'Daily water (ml)'],
                ] as const
              ).map(([field, label]) => (
                <AuthInput
                  key={field}
                  label={label}
                  value={plan[field]}
                  placeholder={field === 'water' ? 'Your choice, for example 2000' : undefined}
                  onChangeText={(value) => setPlan((current) => ({ ...current, [field]: value }))}
                  keyboardType="number-pad"
                  maxLength={5}
                  editable={!locked}
                />
              ))}
              <AuthText kind="muted">
                A starting point, not medical advice. Review it after a few weeks of logging.
              </AuthText>
            </>
          )}
          {error && <AuthNotice error>{error}</AuthNotice>}
          {step === steps.length - 1 ? (
            <AuthButton title="Save my plan" busy={action.busy} disabled={locked} onPress={save} />
          ) : (
            <AuthButton title="Continue" disabled={locked} onPress={next} />
          )}
          {step > 0 && (
            <AuthLink
              title="Back"
              disabled={locked}
              onPress={() => {
                setError(null);
                setStep((value) => value - 1);
              }}
            />
          )}
          <AuthLink
            title="Skip setup for now"
            disabled={locked}
            onPress={() => void onboardingService.finish(userId).then(onDone)}
          />
          <RecordSaveFeedback action={action} />
        </>
      )}
    </AuthFrame>
  );
}
