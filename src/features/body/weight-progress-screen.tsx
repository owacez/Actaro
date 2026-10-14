import { useCallback, useRef, useState } from 'react';
import { View } from 'react-native';
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
import { useRecords, RecordLoadFeedback } from '@/hooks/use-records';
import { useAppTheme } from '@/features/profile/theme-context';
import { formatNumber } from '@/features/nutrition/nutrition-model';
import { unitFactor } from './body-model';
import { bodyService } from './body-service';
import { weightPeriod, weightProgress } from './weight-progress-model';
import { ProgressPresets } from '@/features/progress/progress-components';
import type { ProgressPreset } from '@/features/progress/progress-period';
export function WeightProgressScreen({
  userId,
  onLog,
  navigation,
}: {
  userId: string;
  onLog: () => void;
  navigation?: React.ReactNode;
}) {
  const [preset, setPreset] = useState<ProgressPreset>('30D'),
    [period, setPeriod] = useState<{ from: string; to: string }>(),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [today, setToday] = useState(''),
    [inputError, setInputError] = useState<string | null>(null),
    [page, setPage] = useState(0),
    [editingDates, setEditingDates] = useState(false);
  const load = useCallback(async () => {
    const data = await (preset === '30D'
      ? bodyService.progress(userId, period)
      : bodyService.progress(userId, period, preset));
    return { ...data, summary: weightProgress(data.rows, data.from, data.to) };
  }, [userId, period, preset]);
  const onLoaded = useCallback((data: Awaited<ReturnType<typeof bodyService.progress>>) => {
      setFrom(data.from);
      setTo(data.to);
      setToday(data.today);
      setPage(0);
      setInputError(null);
    }, []),
    resource = useRecords(load, onLoaded),
    refresh = resource.refresh,
    { colors } = useAppTheme(),
    data = resource.data,
    initialFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (initialFocus.current) initialFocus.current = false;
      else refresh();
    }, [refresh]),
  );
  function apply() {
    try {
      const value = weightPeriod(from, to, today);
      setInputError(null);
      setPage(0);
      setPeriod(value);
      setEditingDates(false);
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Check your dates.');
    }
  }
  const factor = data ? unitFactor(data.preferences.weight_unit) : 1,
    unit = data?.preferences.weight_unit ?? 'kg',
    summary = data?.summary,
    latestBin = summary?.bins.filter((bin) => bin.value !== null).at(-1)?.from;
  const label = (value: number | null | undefined) =>
    value === null || value === undefined
      ? 'Not recorded'
      : `${formatNumber(value * factor)} ${unit}`;
  return (
    <AuthFrame>
      <AuthText kind="eyebrow">ACTARO</AuthText>
      <AuthText kind="title">Progress</AuthText>
      {navigation}
      <AuthText kind="heading">Weight progress</AuthText>
      <ProgressPresets
        selected={period ? undefined : preset}
        disabled={resource.loading}
        onChange={(value) => {
          setPreset(value);
          setPeriod(undefined);
          setEditingDates(false);
          if (value === preset && !period) refresh();
        }}
      />
      <View style={authStyles.choices}>
        <AuthLink title="Log or edit bodyweight" onPress={onLog} />
        <AuthLink title="Refresh weight progress" disabled={resource.loading} onPress={refresh} />
        {today && (
          <AuthLink
            title={editingDates ? 'Hide weight dates' : 'Change weight dates'}
            disabled={resource.loading}
            onPress={() => setEditingDates((current) => !current)}
          />
        )}
      </View>
      {today && editingDates && (
        <>
          <AuthInput
            label="Weight progress start (YYYY-MM-DD)"
            value={from}
            editable={!resource.loading}
            onChangeText={setFrom}
          />
          <AuthInput
            label="Weight progress end (YYYY-MM-DD)"
            value={to}
            editable={!resource.loading}
            onChangeText={setTo}
          />
          <AuthButton
            title="Apply weight dates"
            outlined
            disabled={resource.loading}
            onPress={apply}
          />
        </>
      )}
      {inputError && <AuthNotice error>{inputError}</AuthNotice>}
      <RecordLoadFeedback {...resource} retry={refresh} />
      {data && summary && !resource.loading && (
        <>
          <AuthText>
            {data.from} → {data.to} · {summary.count} recorded weigh-in
            {summary.count === 1 ? '' : 's'} / {summary.days} calendar dates
          </AuthText>
          {!summary.count ? (
            <AuthNotice>
              No weigh-ins in this period. Log a weight or choose dates with recorded entries.
              Missing weigh-ins are not zero weight.
            </AuthNotice>
          ) : (
            <>
              <AuthText kind="eyebrow">Weight trend</AuthText>
              <AuthText kind="title">
                {summary.change === null
                  ? 'One recorded weigh-in'
                  : `${summary.change > 0 ? '+' : ''}${formatNumber(summary.change * factor)} ${unit}`}
              </AuthText>
              <AuthText>
                {summary.change === null
                  ? 'A change needs at least two dated weigh-ins.'
                  : `${summary.changePercent !== null && summary.changePercent > 0 ? '+' : ''}${formatNumber(summary.changePercent ?? 0)}% recorded change from ${summary.first?.local_date} to ${summary.latest?.local_date}`}
              </AuthText>
              <AuthCard>
                <AuthText>
                  Scale {label(summary.low)} — {label(summary.high)}
                </AuthText>
                <View
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`Weight trend from ${data.from} to ${data.to}. ${summary.count} recorded weigh-ins. Lowest ${label(summary.low)}, highest ${label(summary.high)}. Blank positions have no records. Exact dated weights appear below.`}
                  style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}
                >
                  {summary.bins.map((bin) => (
                    <View
                      key={bin.from}
                      style={{
                        flex: 1,
                        height:
                          bin.value === null
                            ? 2
                            : summary.high === summary.low
                              ? 72
                              : 12 +
                                ((bin.value - (summary.low ?? bin.value)) /
                                  ((summary.high ?? bin.value) - (summary.low ?? bin.value))) *
                                  92,
                        backgroundColor:
                          bin.value === null
                            ? colors.border
                            : bin.from === latestBin
                              ? colors.accent
                              : colors.border,
                        borderRadius: 3,
                        opacity: bin.value === null ? 0.35 : 1,
                      }}
                    />
                  ))}
                </View>
                <View style={authStyles.row}>
                  <AuthText kind="muted">{data.from}</AuthText>
                  <AuthText kind="muted">{data.to}</AuthText>
                </View>
                <AuthText>
                  {summary.binDays === 1
                    ? 'One bar per recorded calendar date. Blank dates remain gaps.'
                    : `Bars average recorded weigh-ins within ${summary.binDays}-date intervals. Empty intervals remain gaps; missing dates are never filled.`}
                </AuthText>
              </AuthCard>
              <AuthCard>
                <AuthText kind="heading">Recorded weights</AuthText>
                <AuthText>
                  First {label(summary.first?.weight_kg)} · {summary.first?.local_date}
                </AuthText>
                <AuthText>
                  Latest {label(summary.latest?.weight_kg)} · {summary.latest?.local_date}
                </AuthText>
                <AuthText>Average {label(summary.average)} · mean of recorded weigh-ins</AuthText>
                <AuthText>
                  Lowest {label(summary.low)} · Highest {label(summary.high)}
                </AuthText>
              </AuthCard>
              <AuthText kind="heading">Weigh-in history</AuthText>
              {[...summary.rows]
                .reverse()
                .slice(page * 20, (page + 1) * 20)
                .map((row) => (
                  <View
                    key={row.local_date}
                    style={[
                      authStyles.row,
                      { borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 8 },
                    ]}
                  >
                    <AuthText>{row.local_date}</AuthText>
                    <AuthText kind="heading">{label(row.weight_kg)}</AuthText>
                  </View>
                ))}
              <View style={authStyles.row}>
                <AuthLink
                  title="Newer weigh-ins"
                  disabled={page === 0}
                  onPress={() => setPage((current) => current - 1)}
                />
                <AuthText>Page {page + 1}</AuthText>
                <AuthLink
                  title="Older weigh-ins"
                  disabled={(page + 1) * 20 >= summary.count}
                  onPress={() => setPage((current) => current + 1)}
                />
              </View>
            </>
          )}
        </>
      )}
      <AuthText>
        Charts and change use recorded weights only. Missing dates are never estimated.
      </AuthText>
    </AuthFrame>
  );
}
