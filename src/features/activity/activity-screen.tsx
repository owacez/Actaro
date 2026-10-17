import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
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
import { formatNumber } from '@/features/nutrition/nutrition-model';
import { unitFactor } from '@/features/body/body-model';
import { activityService } from './activity-service';
import { WeekStrip } from '@/components/date-picker';
import { ScreenHeader } from '@/components/product-ui';
import { NumberStepper } from '@/components/number-stepper';
import { readTodaySteps } from './pedometer-service';
export function ActivityScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [date, setDate] = useState<string>(),
    [offset, setOffset] = useState(0),
    [steps, setSteps] = useState(''),
    [distance, setDistance] = useState(''),
    [target, setTarget] = useState(''),
    [source, setSource] = useState<'manual' | 'ios_pedometer'>('manual'),
    [sensorBusy, setSensorBusy] = useState(false),
    [sensorError, setSensorError] = useState<string | null>(null),
    [remove, setRemove] = useState<string | null>(null);
  const load = useCallback(
    () => activityService.load(userId, date, offset),
    [userId, date, offset],
  );
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof activityService.load>>) => {
    setSteps(data.current?.steps === null || !data.current ? '' : String(data.current.steps));
    setDistance(
      data.current?.distance_km === null || !data.current
        ? ''
        : String(data.current.distance_km * unitFactor(data.preferences.distance_unit)),
    );
    setTarget(data.target ? String(data.target.steps_target) : '');
    setSource(data.current?.steps_source === 'ios_pedometer' ? 'ios_pedometer' : 'manual');
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const data = resource.data,
    locked = action.locked || sensorBusy;
  async function sensor() {
    if (!data) return;
    setSensorBusy(true);
    setSensorError(null);
    try {
      const result = await readTodaySteps(data.preferences.time_zone);
      if (result.day !== data.day)
        throw new Error('The day changed. Open today before importing steps.');
      setSteps(String(result.steps));
      setSource('ios_pedometer');
    } catch (error) {
      setSensorError(error instanceof Error ? error.message : 'Sensor count unavailable.');
    } finally {
      setSensorBusy(false);
    }
  }
  return (
    <AuthFrame header={<ScreenHeader title="Steps and activity" />}>
      <AuthLink title="← More" disabled={locked} onPress={onBack} />
      <RecordLoadFeedback {...resource} retry={resource.refresh} />
      {data && !resource.loading && (
        <>
          <WeekStrip
            value={data.day}
            disabled={locked}
            onChange={(selected) => {
              if (selected > data.today) {
                action.setError('Cannot log a future date.');
                return;
              }
              setDate(selected);
              setOffset(0);
              setSensorError(null);
            }}
          />
          <NumberStepper
            large
            step={100}
            max={1000000}
            label="Daily steps"
            value={steps}
            disabled={locked}
            onChange={(text) => {
              setSteps(text);
              setSource('manual');
            }}
          />
          <AuthInput
            label={`Daily distance (${data.preferences.distance_unit}, optional)`}
            value={distance}
            keyboardType="decimal-pad"
            editable={!locked}
            onChangeText={setDistance}
          />
          <AuthText>
            Blank means not recorded. An explicit 0 records a zero. Save replaces this date’s
            totals; it never adds two phones or manual and sensor counts together.
          </AuthText>
          {Platform.OS === 'ios' && data.day === data.today ? (
            <>
              <AuthButton
                title="Read iPhone steps for today"
                outlined
                busy={sensorBusy}
                disabled={locked}
                onPress={() => void sensor()}
              />
              <AuthText>
                Reads steps since midnight in {data.preferences.time_zone}. Review the count, then
                save it. The app does not collect steps in the background.
              </AuthText>
            </>
          ) : (
            <AuthText>
              Manual daily totals are supported here. Android foreground sensor updates cannot
              provide a reliable full-day count; advanced sensing and health integrations are
              deferred.
            </AuthText>
          )}
          {sensorError && <AuthNotice error>{sensorError}</AuthNotice>}
          <AuthText>
            Steps source: {source === 'ios_pedometer' ? 'iPhone pedometer' : 'manual'}
          </AuthText>
          <AuthButton
            title="Save steps and distance"
            busy={action.busy}
            disabled={locked}
            onPress={() =>
              void action.run(
                () =>
                  activityService.save(
                    userId,
                    data.day,
                    steps,
                    distance,
                    data.preferences.distance_unit,
                    data.preferences.time_zone,
                    source,
                  ),
                'Activity saved',
                resource.refresh,
              )
            }
          />
          <AuthInput
            label="Daily steps target"
            value={target}
            keyboardType="number-pad"
            editable={!locked}
            onChangeText={setTarget}
          />
          <AuthButton
            title="Save steps target"
            outlined
            busy={action.busy}
            disabled={locked}
            onPress={() =>
              void action.run(
                () => activityService.target(userId, target),
                'Steps target saved',
                resource.refresh,
              )
            }
          />
          <AuthText kind="heading">Recorded activity</AuthText>
          {!data.history.length && <AuthNotice>No activity recorded yet.</AuthNotice>}
          {data.history.map((row) => (
            <AuthCard key={row.local_date}>
              <AuthText kind="heading">{row.local_date}</AuthText>
              <AuthText>
                {row.steps === null ? 'Steps not recorded' : formatNumber(row.steps) + ' steps'} ·{' '}
                {row.distance_km === null
                  ? 'Distance not recorded'
                  : formatNumber(row.distance_km * unitFactor(data.preferences.distance_unit)) +
                    ' ' +
                    data.preferences.distance_unit}
              </AuthText>
              <AuthText>
                Source: {row.steps_source ?? 'distance only'} · updated{' '}
                {new Date(row.updated_at).toLocaleString()}
              </AuthText>
              <View style={authStyles.choices}>
                <AuthLink
                  title={`Edit activity ${row.local_date}`}
                  disabled={locked}
                  onPress={() => {
                    setDate(row.local_date);
                    setOffset(0);
                  }}
                />
                <AuthLink
                  title={`Delete activity ${row.local_date}`}
                  disabled={locked}
                  onPress={() => setRemove(row.local_date)}
                />
              </View>
            </AuthCard>
          ))}
          {remove && (
            <AuthCard>
              <AuthText>Delete the recorded totals for {remove}?</AuthText>
              <AuthButton
                title="Confirm activity deletion"
                disabled={locked}
                onPress={() =>
                  void action.run(
                    () => activityService.remove(userId, remove),
                    'Activity deleted',
                    () => {
                      setRemove(null);
                      resource.refresh();
                    },
                  )
                }
              />
              <AuthLink title="Keep activity" disabled={locked} onPress={() => setRemove(null)} />
            </AuthCard>
          )}
          <View style={authStyles.row}>
            <AuthLink
              title="Newer activity records"
              disabled={locked || offset === 0}
              onPress={() => setOffset((current) => Math.max(0, current - 30))}
            />
            <AuthText>Page {offset / 30 + 1}</AuthText>
            <AuthLink
              title="Older activity records"
              disabled={locked || data.history.length < 30}
              onPress={() => setOffset((current) => current + 30)}
            />
          </View>
        </>
      )}
      <RecordSaveFeedback action={action} />
    </AuthFrame>
  );
}
