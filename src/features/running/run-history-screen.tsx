import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { ActionRow, ActionSheet, ScreenHeader } from '@/components/product-ui';
import {
  AuthButton,
  AuthFrame,
  AuthLink,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { profileService } from '@/features/profile/profile-service';
import {
  RecordLoadFeedback,
  RecordSaveFeedback,
  useRecordAction,
  useRecords,
} from '@/hooks/use-records';
import { readRunPoints, runClock, runPace } from './run-model';
import { runService } from './run-service';
import { RunRoute } from './run-route';
import { RunMap } from './run-map';
import { RunMetrics, RunSplits } from './run-screen';

export function RunHistoryScreen({
  userId,
  onBack,
  onOpen,
}: {
  userId: string;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const [page, setPage] = useState(0);
  const load = useCallback(async () => {
    const [rows, preferences] = await Promise.all([
      runService.history(userId, page),
      profileService.getPreferences(userId),
    ]);
    return { rows, unit: preferences.distance_unit === 'mi' ? ('mi' as const) : ('km' as const) };
  }, [userId, page]);
  const resource = useRecords(load),
    refresh = resource.refresh,
    first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) first.current = false;
      else refresh();
    }, [refresh]),
  );
  return (
    <AuthFrame header={<ScreenHeader title="Run history" />}>
      <AuthLink title="Back to Train" onPress={onBack} />
      <RecordLoadFeedback {...resource} retry={resource.reload} />
      {resource.data && (
        <>
          {!resource.data.rows.length && (
            <AuthNotice>
              {page
                ? 'No more runs on this page.'
                : 'No saved runs yet. Start one from Train → Run, then stop, review and save.'}
            </AuthNotice>
          )}
          {resource.data.rows.map((row) => (
            <View key={row.id} style={{ gap: 8 }}>
              <ActionRow
                title={`Run · ${row.local_date}`}
                detail={`${runClock(row.moving_seconds)} moving · ${runPace(row.moving_seconds, row.distance_meters, resource.data!.unit)}`}
                onPress={() => onOpen(row.id)}
              />
              <RunMetrics
                seconds={row.moving_seconds}
                distance={row.distance_meters}
                unit={resource.data!.unit}
              />
              <RunRoute points={readRunPoints(row.route_preview)} compact />
            </View>
          ))}
          <View style={authStyles.row}>
            <AuthLink
              title="Newer runs"
              disabled={page === 0 || resource.loading}
              onPress={() => setPage((value) => value - 1)}
            />
            <AuthText>Page {page + 1}</AuthText>
            <AuthLink
              title="Older runs"
              disabled={resource.loading || resource.data.rows.length < 20}
              onPress={() => setPage((value) => value + 1)}
            />
          </View>
        </>
      )}
    </AuthFrame>
  );
}
export function RunDetailScreen({
  userId,
  id,
  onBack,
}: {
  userId: string;
  id: string;
  onBack: () => void;
}) {
  const load = useCallback(async () => {
    const [run, preferences] = await Promise.all([
      runService.detail(userId, id),
      profileService.getPreferences(userId),
    ]);
    return { run, unit: preferences.distance_unit === 'mi' ? ('mi' as const) : ('km' as const) };
  }, [userId, id]);
  const resource = useRecords(load),
    action = useRecordAction();
  const [deleting, setDeleting] = useState(false);
  return (
    <AuthFrame header={<ScreenHeader title="Run detail" />}>
      <AuthLink title="Back to run history" disabled={action.locked} onPress={onBack} />
      <RecordLoadFeedback {...resource} retry={resource.reload} />
      {resource.data && (
        <>
          <AuthText kind="heading">{resource.data.run.local_date}</AuthText>
          <AuthText kind="metric">{runClock(resource.data.run.duration_seconds)}</AuthText>
          <RunMetrics
            seconds={resource.data.run.moving_seconds}
            distance={resource.data.run.distance_meters}
            unit={resource.data.unit}
          />
          <AuthText>
            Moving time {runClock(resource.data.run.moving_seconds)} · Elapsed time excludes manual
            pauses.
          </AuthText>
          <RunMap points={resource.data.run.points} />
          <RunSplits points={resource.data.run.points} unit={resource.data.unit} />
          <AuthText>{resource.data.run.notes || 'No run notes.'}</AuthText>
          <AuthText kind="muted">
            Recorded with GPS · {resource.data.run.time_zone}. Pauses and route gaps are excluded
            from distance. Calories and intensity are not estimated.
          </AuthText>
          <AuthButton
            title="Delete run"
            outlined
            disabled={action.locked}
            onPress={() => setDeleting(true)}
          />
        </>
      )}
      <ActionSheet
        title="Delete saved run?"
        visible={deleting}
        onClose={() => {
          if (!action.locked) setDeleting(false);
        }}
      >
        <AuthText>
          This permanently deletes this run and its private GPS route from your account.
        </AuthText>
        <AuthButton
          title="Confirm run deletion"
          busy={action.busy}
          disabled={action.locked}
          onPress={() =>
            void action.run(() => runService.remove(userId, id), 'Run deleted', onBack)
          }
        />
        <AuthLink title="Keep run" disabled={action.locked} onPress={() => setDeleting(false)} />
        <RecordSaveFeedback action={action} />
      </ActionSheet>
    </AuthFrame>
  );
}
