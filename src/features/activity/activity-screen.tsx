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
import { useDeviceSteps } from './step-provider';
export function ActivityScreen({ userId, onBack }: { userId: string; onBack: () => void }) {
  const [date, setDate] = useState<string>(),
    [offset, setOffset] = useState(0),
    [distance, setDistance] = useState(''),
    [target, setTarget] = useState(''),
    [remove, setRemove] = useState<string | null>(null);
  const load = useCallback(
    () => activityService.load(userId, date, offset),
    [userId, date, offset],
  );
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof activityService.load>>) => {
    setDistance(
      data.current?.distance_km === null || !data.current
        ? ''
        : String(data.current.distance_km * unitFactor(data.preferences.distance_unit)),
    );
    setTarget(data.target ? String(data.target.steps_target) : '');
  }, []);
  const resource = useRecords(load, onLoaded),
    action = useRecordAction(),
    refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  const device = useDeviceSteps();
  const data = resource.data,
    locked = action.locked;
  const live = device?.reading?.day === data?.day ? device?.reading : null;
  const count = live?.steps ?? data?.current?.steps;
  return (
    <AuthFrame header={<ScreenHeader title="Steps and activity" />}>
      <AuthLink title="← You" disabled={locked} onPress={onBack} />
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
            }}
          />
          <AuthCard>
            <AuthText kind="eyebrow">{live ? 'LIVE IPHONE STEPS' : 'RECORDED STEPS'}</AuthText>
            <AuthText kind="metric">
              {count === null || count === undefined ? '—' : formatNumber(count)}
            </AuthText>
            <AuthText>
              {live
                ? 'Updates automatically while Actaro is open. Catches up when you return.'
                : Platform.OS === 'ios'
                  ? 'Motion & Fitness access enables automatic tracking.'
                  : 'Synced iPhone totals appear here. Full-day sensing is unavailable on this platform.'}
            </AuthText>
            {device?.error && <AuthNotice>{device.error}</AuthNotice>}
            <AuthText kind="muted">
              Daily boundary: midnight in {data.preferences.time_zone}.
            </AuthText>
          </AuthCard>
          <AuthText kind="heading">Your daily target</AuthText>
          <AuthText>Choose the number of steps you want to reach each day.</AuthText>
          <NumberStepper
            step={1000}
            max={1000000}
            label="Daily steps target"
            value={target}
            disabled={locked}
            onChange={setTarget}
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
          <AuthCard>
            <AuthText kind="heading">Other distance</AuthText>
            <AuthText>
              Optional distance for the selected date. Saving it keeps your automatic step total.
            </AuthText>
            <AuthInput
              label={`Daily distance (${data.preferences.distance_unit}, optional)`}
              value={distance}
              keyboardType="decimal-pad"
              editable={!locked}
              onChangeText={setDistance}
            />
            <AuthButton
              title="Save distance"
              outlined
              busy={action.busy}
              disabled={locked}
              onPress={() =>
                void action.run(
                  () =>
                    activityService.save(
                      userId,
                      data.day,
                      '',
                      distance,
                      data.preferences.distance_unit,
                      data.preferences.time_zone,
                    ),
                  'Distance saved',
                  resource.refresh,
                )
              }
            />
          </AuthCard>
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
                  title={`View activity ${row.local_date}`}
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
              {remove === data.today && (
                <AuthText>
                  Automatic tracking can recreate the current step total from iPhone Motion.
                  Historical records are not re-imported.
                </AuthText>
              )}
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
