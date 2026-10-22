import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigation } from 'expo-router';
import { usePreventRemove, type NavigationAction } from 'expo-router/react-navigation';
import { randomUUID } from 'expo-crypto';
import { Text, View, useWindowDimensions } from 'react-native';
import { ActionSheet, NavigationSurface, ScreenHeader } from '@/components/product-ui';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
} from '@/features/auth/auth-components';
import { profileService } from '@/features/profile/profile-service';
import { useAppTheme } from '@/features/profile/theme-context';
import { ProgressMetrics } from '@/features/progress/progress-components';
import {
  RecordLoadFeedback,
  RecordSaveFeedback,
  useRecordAction,
  useRecords,
} from '@/hooks/use-records';
import { RecordRequestError } from '@/lib/owned-data';
import { backgroundRunSupported, runTracker } from './run-tracker';
import { runStore } from './run-store';
import { runService } from './run-service';
import {
  runClock,
  runDistance,
  runPace,
  runSeconds,
  runMovingSeconds,
  runLivePace,
  runSplits,
  type RunPoint,
} from './run-model';
import { RunMap } from './run-map';
import { useRunDraft } from './use-run-draft';

export function RunMetrics({
  seconds,
  distance,
  unit,
}: {
  seconds: number;
  distance: number;
  unit: 'km' | 'mi';
}) {
  return (
    <ProgressMetrics
      metrics={[
        {
          title: 'Distance',
          value: `${runDistance(distance, unit)} ${unit}`,
        },
        { title: 'Avg moving pace', value: runPace(seconds, distance, unit) },
      ]}
    />
  );
}
// Recording-style stat panel: one large primary value with compact secondary values.
function RunStatPanel({
  hero,
  items,
}: {
  hero: { title: string; value: string };
  items: { title: string; value: string }[];
}) {
  const { colors } = useAppTheme();
  const number = {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums' as const],
  };
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        gap: 14,
      }}
    >
      <View accessible accessibilityLabel={`${hero.title} ${hero.value}`}>
        <AuthText kind="eyebrow">{hero.title.toUpperCase()}</AuthText>
        <Text style={[number, { fontSize: 56, lineHeight: 64 }]}>{hero.value}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 }}>
        {items.map((item) => (
          <View
            key={item.title}
            accessible
            accessibilityLabel={`${item.title} ${item.value}`}
            style={{ flexBasis: '50%', paddingRight: 8 }}
          >
            <AuthText kind="eyebrow">{item.title.toUpperCase()}</AuthText>
            <Text style={[number, { fontSize: 24, lineHeight: 30 }]}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
export function RunSplits({ points, unit }: { points: readonly RunPoint[]; unit: 'km' | 'mi' }) {
  const { colors } = useAppTheme();
  const splits = runSplits(points, unit);
  if (!splits.length) return null;
  // Bars compare speed with the fastest split, so a longer bar is a faster split.
  const fastest = Math.max(...splits.map((split) => split.metres / Math.max(1, split.seconds)));
  return (
    <View style={{ gap: 8 }}>
      <AuthText kind="eyebrow">SPLITS</AuthText>
      {splits.map((split) => {
        const whole = Math.abs(split.metres - (unit === 'mi' ? 1609.344 : 1000)) < 0.001;
        const label = whole ? String(split.index) : `${runDistance(split.metres, unit)} ${unit}`;
        const pace = runPace(split.seconds, split.metres, unit);
        const share = split.metres / Math.max(1, split.seconds) / fastest;
        return (
          <View
            key={split.index}
            accessible
            accessibilityLabel={`Split ${label}${whole ? ` ${unit}` : ''}, ${pace}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
          >
            <View style={{ width: 64 }}>
              <AuthText>{label}</AuthText>
            </View>
            <View style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.fill }}>
              <View
                style={{
                  width: `${Math.max(8, Math.round(share * 100))}%`,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.accent,
                }}
              />
            </View>
            <View style={{ width: 92, alignItems: 'flex-end' }}>
              <AuthText>{pace}</AuthText>
            </View>
          </View>
        );
      })}
      <AuthText kind="muted">
        Moving pace per {unit === 'mi' ? 'mile' : 'kilometre'} from GPS.
      </AuthText>
    </View>
  );
}
export function RunStartScreen({
  userId,
  navigation,
  onStart,
  onHistory,
}: {
  userId: string;
  navigation?: ReactNode;
  onStart: () => void;
  onHistory: () => void;
}) {
  const load = useCallback(() => profileService.getPreferences(userId), [userId]);
  const resource = useRecords(load),
    saved = useRunDraft(userId);
  const supported = backgroundRunSupported();
  const [background, setBackground] = useState(supported);
  const [permissionSheet, setPermissionSheet] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const pending = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function start() {
    if (pending.current || !resource.data) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await runTracker.begin(
        userId,
        randomUUID(),
        resource.data.time_zone,
        background && supported,
        resource.data.distance_unit === 'mi' ? 'mi' : 'km',
      );
      if (alive.current) {
        setPermissionSheet(false);
        onStart();
      }
    } catch (reason) {
      if (alive.current) {
        setError(
          reason instanceof RecordRequestError
            ? reason.message
            : 'Unable to start recording. Check location permission, GPS and device storage, then retry.',
        );
        saved.retry();
      }
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return (
    <AuthFrame header={<ScreenHeader title="Train" subtitle="RUNNING" />}>
      {navigation}
      <AuthText kind="heading">Go for a run</AuthText>
      <AuthText>
        Record your time, distance, pace and GPS route. Your route is private to your account.
      </AuthText>
      <RecordLoadFeedback {...resource} retry={resource.reload} />
      {saved.loading && <AuthLoading>Checking for a saved run…</AuthLoading>}
      {saved.error && (
        <>
          <AuthNotice error>{saved.error}</AuthNotice>
          <AuthButton title="Retry saved run" onPress={saved.retry} />
        </>
      )}
      {saved.draft ? (
        <AuthCard>
          <AuthText kind="heading">
            {saved.draft.status === 'review'
              ? 'Run waiting to be saved'
              : 'Your run is on this device'}
          </AuthText>
          <AuthText>
            {saved.draft.localDate} · {runDistance(saved.draft.distanceMeters, saved.draft.unit)}{' '}
            {saved.draft.unit}
          </AuthText>
          <AuthButton title="Open saved run" onPress={onStart} />
        </AuthCard>
      ) : (
        resource.data &&
        !saved.loading &&
        !saved.error && (
          <>
            <AuthChoice
              title="Record with screen locked"
              selected={background && supported}
              disabled={!supported || busy}
              onPress={() => setBackground((value) => !value)}
            />
            <AuthText kind="muted">
              {supported
                ? 'Uses background location only during an active run. You will be asked for Always/background location after foreground permission.'
                : 'Expo Go and web support foreground recording here. Leaving the app pauses the run. Background GPS needs a development build.'}
            </AuthText>
            <AuthButton
              title="Start run"
              disabled={busy}
              onPress={() => setPermissionSheet(true)}
            />
          </>
        )
      )}
      <AuthButton title="Run history" outlined disabled={busy} onPress={onHistory} />
      <AuthText kind="muted">
        GPS is an estimate. Weak signal can leave route gaps. Steps stay in your existing activity
        count; no duplicate steps or invented calories are added.
      </AuthText>
      <ActionSheet
        title="Allow location for this run"
        visible={permissionSheet}
        onClose={() => {
          if (!busy) setPermissionSheet(false);
        }}
      >
        <AuthText>
          {background && supported
            ? 'Actaro records your route while you run, including when the screen is locked. The next prompt may open system settings. Allow background/Always location to use this mode. Recording stops when you pause, finish, discard, or sign out.'
            : 'Actaro records your route only while the app is on screen. Leaving the app pauses recording. Location is requested only for this run.'}
        </AuthText>
        {error && <AuthNotice error>{error}</AuthNotice>}
        <AuthButton title="Allow location and start" busy={busy} onPress={() => void start()} />
        <AuthLink title="Cancel start" disabled={busy} onPress={() => setPermissionSheet(false)} />
      </ActionSheet>
    </AuthFrame>
  );
}

export function RunSessionScreen({
  userId,
  onBack,
  onSaved,
}: {
  userId: string;
  onBack: () => void;
  onSaved: (id: string) => void;
}) {
  const saved = useRunDraft(userId),
    action = useRecordAction(),
    draft = saved.draft;
  const [sheet, setSheet] = useState<'stop' | 'leave' | 'discard' | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState<{ id: string; value: string } | null>(null);
  const notes = noteEdit?.id === draft?.id ? (noteEdit?.value ?? '') : (draft?.notes ?? '');
  const [exitApproved, setExitApproved] = useState(false),
    [exitAction, setExitAction] = useState<NavigationAction | null>(null),
    [savedId, setSavedId] = useState<string | null>(null);
  const screenSize = useWindowDimensions();
  const navigation = useNavigation(),
    pending = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  usePreventRemove(!exitApproved && (saved.loading || !!draft), ({ data }) => {
    if (pending.current || action.locked) return;
    setExitAction(data.action);
    setSheet('leave');
  });
  useEffect(() => {
    if (!exitApproved) return;
    if (savedId) onSaved(savedId);
    else if (exitAction) navigation.dispatch(exitAction);
    else onBack();
  }, [exitApproved, exitAction, navigation, onBack, onSaved, savedId]);
  async function command(work: () => Promise<unknown>) {
    if (pending.current || action.locked) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      await work();
      if (alive.current) setSheet(null);
    } catch (reason) {
      if (alive.current)
        setError(
          reason instanceof RecordRequestError
            ? reason.message
            : 'Unable to confirm this action. Your saved run is kept; retry before leaving.',
        );
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function leave() {
    if (!draft) {
      setExitApproved(true);
      return;
    }
    await runStore.update(userId, (value) => ({ ...value, notes }));
    if (!draft.background && draft.status === 'recording') await runTracker.pause(userId);
    setExitApproved(true);
  }
  const locked = busy || action.locked;
  const seconds = draft ? runSeconds(draft, saved.error ? draft.updatedAt : saved.now) : 0;
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title={draft?.status === 'review' ? 'Review run' : 'Open run'}
          action={<AuthLink title="Back" disabled={locked} onPress={() => setSheet('leave')} />}
        />
      }
      footer={
        draft && (
          <NavigationSurface style={{ padding: 16, gap: 10 }}>
            {draft.status === 'review' ? (
              <AuthButton
                title="Save run"
                busy={action.busy}
                disabled={locked || seconds < 1}
                onPress={() => {
                  const snapshot = { ...draft, notes };
                  void action.run(
                    async () => {
                      await runStore.update(userId, (value) => ({
                        ...value,
                        notes: snapshot.notes,
                      }));
                      await runService.save(userId, snapshot);
                      await runTracker.discard(userId, snapshot.id);
                    },
                    'Run saved',
                    () => {
                      setSavedId(snapshot.id);
                      setExitApproved(true);
                    },
                  );
                }}
              />
            ) : (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AuthButton
                    title={draft.status === 'recording' ? 'Pause run' : 'Resume run'}
                    outlined
                    disabled={locked}
                    onPress={() =>
                      void command(() =>
                        draft.status === 'recording'
                          ? runTracker.pause(userId)
                          : runTracker.resume(userId),
                      )
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AuthButton title="Stop run" disabled={locked} onPress={() => setSheet('stop')} />
                </View>
              </View>
            )}
          </NavigationSurface>
        )
      }
    >
      {saved.loading && <AuthLoading>Restoring run…</AuthLoading>}
      {sheet === null && (saved.error || error) && (
        <AuthNotice error>{error ?? saved.error}</AuthNotice>
      )}
      {!draft && !saved.loading && (
        <>
          <AuthNotice>
            {saved.error
              ? 'Saved data has not been removed. Retry before starting another run.'
              : 'No active run on this device.'}
          </AuthNotice>
          <AuthButton
            title={saved.error ? 'Retry run' : 'Back to Train'}
            onPress={saved.error ? saved.retry : onBack}
          />
        </>
      )}
      {draft && (
        <>
          <AuthText kind="eyebrow">
            {draft.status === 'recording'
              ? saved.error
                ? 'RECORDING INTERRUPTED'
                : 'RECORDING'
              : draft.status === 'paused'
                ? 'PAUSED'
                : 'RUN SUMMARY'}
          </AuthText>
          <RunMap
            points={draft.route}
            live={draft.status === 'recording'}
            height={
              draft.status === 'review' ? 280 : Math.max(300, Math.round(screenSize.height * 0.45))
            }
          />
          {draft.status === 'review' ? (
            <RunStatPanel
              hero={{
                title: 'Distance',
                value: `${runDistance(draft.distanceMeters, draft.unit)} ${draft.unit}`,
              }}
              items={[
                { title: 'Moving time', value: runClock(runMovingSeconds(draft)) },
                {
                  title: 'Avg moving pace',
                  value: runPace(runMovingSeconds(draft), draft.distanceMeters, draft.unit),
                },
                { title: 'Elapsed time', value: runClock(seconds) },
              ]}
            />
          ) : (
            <RunStatPanel
              hero={{ title: 'Time', value: runClock(seconds) }}
              items={[
                {
                  title: 'Distance',
                  value: `${runDistance(draft.distanceMeters, draft.unit)} ${draft.unit}`,
                },
                { title: 'Live pace', value: runLivePace(draft, saved.now) },
                {
                  title: 'Avg moving pace',
                  value: runPace(runMovingSeconds(draft), draft.distanceMeters, draft.unit),
                },
                { title: 'Moving time', value: runClock(runMovingSeconds(draft)) },
              ]}
            />
          )}
          <AuthText kind="muted">
            Time excludes manual pauses. Live pace shows — when stopped or GPS is uncertain.
          </AuthText>
          {draft.status === 'review' && <RunSplits points={draft.route} unit={draft.unit} />}
          {draft.interruption && <AuthNotice>{draft.interruption}</AuthNotice>}
          <AuthText kind="muted">
            {draft.status === 'recording'
              ? saved.now - draft.lastFix.timestamp > 15000
                ? 'GPS signal is stale. Move outdoors; uncertain movement is not counted.'
                : draft.autoPaused ||
                    saved.now - draft.route[draft.route.length - 1].timestamp > 10000
                  ? 'Auto-paused · waiting for clear movement. GPS remains on to resume automatically.'
                  : `GPS accuracy ±${Math.round(draft.lastFix.accuracy)} m · recording movement`
              : `${draft.route.length} GPS points kept on this device`}
          </AuthText>
          <AuthText>
            {draft.background
              ? 'Background GPS enabled for this run.'
              : 'Foreground only: leaving Actaro pauses recording.'}
          </AuthText>
          {draft.status === 'review' && (
            <>
              <AuthInput
                label="Run notes (optional)"
                value={notes}
                onChangeText={(value) => setNoteEdit({ id: draft.id, value })}
                maxLength={2000}
                multiline
                editable={!locked}
              />
              <AuthText>
                Review your recorded route before saving it to your private history. GPS distance
                and pace are estimates.
              </AuthText>
              {seconds < 1 && (
                <AuthNotice>This run is too short to save. Discard it and start again.</AuthNotice>
              )}
            </>
          )}
          <AuthButton
            title="Discard run"
            outlined
            disabled={locked}
            onPress={() => setSheet('discard')}
          />
        </>
      )}
      <RecordSaveFeedback action={action} />
      <ActionSheet
        title={
          sheet === 'stop'
            ? 'Stop this run?'
            : sheet === 'discard'
              ? 'Discard this run?'
              : 'Leave this run?'
        }
        visible={sheet !== null}
        onClose={() => {
          if (!locked) setSheet(null);
        }}
      >
        {sheet === 'stop' && (
          <>
            <AuthText>
              Stop location recording and review your run. Nothing is uploaded until you save.
            </AuthText>
            <AuthButton
              title="Stop and review"
              disabled={locked}
              onPress={() => void command(() => runTracker.finish(userId))}
            />
          </>
        )}
        {sheet === 'leave' && (
          <>
            <AuthText>
              {draft?.background && draft.status === 'recording'
                ? 'Your run can keep recording while you use the rest of Actaro. Open it again from Train → Run.'
                : 'Keep the run on this device. Foreground recording pauses before you leave.'}
            </AuthText>
            <AuthButton
              title={
                draft?.background && draft.status === 'recording'
                  ? 'Keep recording and return'
                  : 'Save draft and return'
              }
              disabled={locked}
              onPress={() => void command(leave)}
            />
            <AuthButton
              title="Discard instead"
              outlined
              disabled={locked}
              onPress={() => setSheet('discard')}
            />
          </>
        )}
        {sheet === 'discard' && (
          <>
            <AuthText>
              Delete this unsaved run from this device? Its route cannot be recovered.
            </AuthText>
            <AuthButton
              title="Confirm discard run"
              disabled={locked}
              onPress={() =>
                void command(async () => {
                  if (draft) await runTracker.discard(userId, draft.id);
                  setExitApproved(true);
                })
              }
            />
          </>
        )}
        <AuthLink
          title="Continue with run"
          disabled={locked}
          onPress={() => {
            setExitAction(null);
            setSheet(null);
          }}
        />
        {error && <AuthNotice error>{error}</AuthNotice>}
      </ActionSheet>
    </AuthFrame>
  );
}
