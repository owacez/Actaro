import { useCallback, useRef, useState } from 'react';
import { WeightLineChart } from '@/components/weight-line-chart';
import { View } from 'react-native';
import { ScreenHeader, ActionSheet, IconButton } from '@/components/product-ui';
import { DatePicker } from '@/components/date-picker';
import { useFocusEffect } from 'expo-router';
import {
  AuthButton,
  AuthCard,
  AuthFrame,
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
import { displayDate, displayRange } from '@/lib/format';
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
    summary = data?.summary;
  const label = (value: number | null | undefined) =>
    value === null || value === undefined
      ? 'Not recorded'
      : `${formatNumber(value * factor)} ${unit}`;
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title="Progress"
          action={
            <View style={{ flexDirection: 'row', gap: 2 }}>
              <IconButton
                label="Log or edit bodyweight"
                name={{ ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' }}
                onPress={onLog}
              />
              <IconButton
                label="Refresh weight progress"
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                disabled={resource.loading || resource.refreshing}
                onPress={resource.reload}
              />
              <IconButton
                label={editingDates ? 'Hide weight dates' : 'Change weight dates'}
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                disabled={!today || resource.loading}
                onPress={() => setEditingDates((value) => !value)}
              />
            </View>
          }
        />
      }
    >
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
      {today && editingDates && (
        <ActionSheet title="Custom range" visible onClose={() => setEditingDates(false)}>
          <DatePicker
            label="From"
            value={from}
            onChange={setFrom}
            max={today}
            disabled={resource.loading}
          />
          <DatePicker
            label="To"
            value={to}
            onChange={setTo}
            max={today}
            disabled={resource.loading}
          />
          <AuthButton
            title="Apply weight dates"
            outlined
            disabled={resource.loading}
            onPress={apply}
          />
          {inputError && <AuthNotice error>{inputError}</AuthNotice>}
        </ActionSheet>
      )}
      {inputError && <AuthNotice error>{inputError}</AuthNotice>}
      <RecordLoadFeedback {...resource} retry={refresh} />
      {data && summary && !resource.loading && (
        <>
          <AuthText>
            {displayRange(data.from, data.to)} · {summary.count} recorded weigh-in
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
                  : `${summary.changePercent !== null && summary.changePercent > 0 ? '+' : ''}${formatNumber(summary.changePercent ?? 0)}% recorded change from ${displayDate(summary.first?.local_date ?? '')} to ${displayDate(summary.latest?.local_date ?? '')}`}
              </AuthText>
              <AuthCard>
                <AuthText>
                  Scale {label(summary.low)} — {label(summary.high)}
                </AuthText>
                <WeightLineChart
                  rows={summary.rows}
                  from={data.from}
                  to={data.to}
                  description={`Weight trend from ${displayDate(data.from)} to ${displayDate(data.to)}. ${summary.count} recorded weigh-ins. Lowest ${label(summary.low)}, highest ${label(summary.high)}. Blank positions have no records. Lines join recorded weigh-ins only. Exact dated weights appear below.`}
                />
                <View style={authStyles.row}>
                  <AuthText kind="muted">{displayDate(data.from)}</AuthText>
                  <AuthText kind="muted">{displayDate(data.to)}</AuthText>
                </View>
                <AuthText>
                  Recorded weigh-ins only. Lines join observations; missing dates are never
                  estimated.
                </AuthText>
              </AuthCard>
              <AuthCard>
                <AuthText kind="heading">Recorded weights</AuthText>
                <AuthText>
                  First {label(summary.first?.weight_kg)} ·{' '}
                  {displayDate(summary.first?.local_date ?? '')}
                </AuthText>
                <AuthText>
                  Latest {label(summary.latest?.weight_kg)} ·{' '}
                  {displayDate(summary.latest?.local_date ?? '')}
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
                    <AuthText>{displayDate(row.local_date)}</AuthText>
                    <AuthText kind="heading">{label(row.weight_kg)}</AuthText>
                  </View>
                ))}
              {summary.count > 20 && (
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
              )}
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
