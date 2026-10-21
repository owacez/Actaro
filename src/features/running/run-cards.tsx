import { useCallback, useRef, type ReactNode } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthCard,
  AuthLink,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { useRecords } from '@/hooks/use-records';
import {
  ProgressChart,
  ProgressHistory,
  ProgressMetrics,
  ProgressPanel,
} from '@/features/progress/progress-components';
import { readRunPoints, runClock, runDistance, runPace } from './run-model';
import { runService } from './run-service';
import { RunRoute } from './run-route';
import { useRunDraft } from './use-run-draft';
import type { ProgressPreset, ProgressRange } from '@/features/progress/progress-period';

export function TodayRunCard({ userId, unit }: { userId: string; unit: 'km' | 'mi' }) {
  const load = useCallback(() => runService.recent(userId), [userId]),
    resource = useRecords(load);
  const active = useRunDraft(userId),
    first = useRef(true),
    refresh = resource.refresh;
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else refresh();
    }, [refresh]),
  );
  if (active.draft)
    return (
      <AuthCard>
        <AuthText kind="heading">
          {active.draft.status === 'review' ? 'Save your run' : 'Run on this device'}
        </AuthText>
        <AuthText>
          {active.draft.status === 'recording'
            ? 'Recording'
            : active.draft.status === 'paused'
              ? 'Paused'
              : 'Waiting for your review'}
        </AuthText>
        <AuthButton title="Open your run" onPress={() => router.push('/runs/session')} />
      </AuthCard>
    );
  if (resource.error)
    return (
      <AuthCard>
        <AuthText>Recent run unavailable.</AuthText>
        <AuthLink title="Retry recent run" onPress={resource.reload} />
      </AuthCard>
    );
  const run = resource.data;
  if (!run) return null;
  return (
    <AuthCard>
      <AuthText kind="eyebrow">RECENT RUN · {run.local_date}</AuthText>
      <AuthText kind="heading">
        {runDistance(run.distance_meters, unit)} {unit} · {runClock(run.moving_seconds)}
      </AuthText>
      <AuthText>{runPace(run.moving_seconds, run.distance_meters, unit)}</AuthText>
      <RunRoute points={readRunPoints(run.route_preview)} compact />
      <AuthLink
        title="View recent run"
        onPress={() => router.push({ pathname: '/runs/[id]', params: { id: run.id } })}
      />
    </AuthCard>
  );
}
export function RunProgressScreen({
  userId,
  navigation,
}: {
  userId: string;
  navigation: ReactNode;
}) {
  const read = useCallback(
    (preset: ProgressPreset, custom?: ProgressRange) => runService.progress(userId, preset, custom),
    [userId],
  );
  return (
    <ProgressPanel
      title="Running progress"
      navigation={navigation}
      read={read}
      onLog={() => router.push('/runs')}
    >
      {(data) => {
        const unit = data.preferences.distance_unit === 'mi' ? 'mi' : 'km';
        const distance = data.rows.reduce((sum, run) => sum + run.distance_meters, 0),
          duration = data.rows.reduce((sum, run) => sum + run.moving_seconds, 0);
        return (
          <>
            <ProgressMetrics
              metrics={[
                { title: 'Runs', value: String(data.rows.length) },
                {
                  title: 'Distance',
                  value: `${runDistance(distance, unit)} ${unit}`,
                },
                {
                  title: 'Moving time',
                  value: runClock(duration),
                  detail: 'GPS movement estimate; excludes stops',
                },
                {
                  title: 'Avg moving pace',
                  value: runPace(duration, distance, unit),
                  detail: 'Total moving time divided by total distance',
                },
              ]}
            />
            {!data.rows.length && (
              <AuthNotice>
                No saved runs in this period. Missing history is not a missed goal.
              </AuthNotice>
            )}
            <ProgressChart
              title="Recorded running distance"
              points={data.rows.map((run) => ({
                date: run.local_date,
                value: run.distance_meters / (unit === 'mi' ? 1609.344 : 1000),
              }))}
              range={data}
              unit={unit}
              aggregate="sum"
            />
            <AuthText kind="muted">
              GPS estimates only. Pauses and missing route sections are not joined. Running distance
              is separate from the phone step count.
            </AuthText>
            <AuthButton title="Open run history" outlined onPress={() => router.push('/runs')} />
            <ProgressHistory
              entries={[...data.rows].reverse().map((run) => ({
                key: run.id,
                title: run.local_date,
                detail: `${runDistance(run.distance_meters, unit)} ${unit} · ${runClock(run.moving_seconds)} · ${runPace(run.moving_seconds, run.distance_meters, unit)}`,
              }))}
            />
          </>
        );
      }}
    </ProgressPanel>
  );
}
