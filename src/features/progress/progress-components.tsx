import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect } from 'expo-router';
import { View } from 'react-native';
import { ScreenHeader, Segments, ActionSheet, IconButton } from '@/components/product-ui';
import { DatePicker } from '@/components/date-picker';
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
import {
  chartBins,
  progressPresets,
  type ProgressPoint,
  type ProgressPreset,
  type ProgressRange,
  validateProgressRange,
} from './progress-period';

export function ProgressPanel<T extends ProgressRange & { today: string }>({
  title,
  navigation,
  read,
  onLog,
  children,
}: {
  title: string;
  navigation: ReactNode;
  read: (preset: ProgressPreset, custom?: ProgressRange) => Promise<T>;
  onLog?: () => void;
  children: (data: T) => ReactNode;
}) {
  const [preset, setPreset] = useState<ProgressPreset>('30D'),
    [custom, setCustom] = useState<ProgressRange>(),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [editing, setEditing] = useState(false),
    [inputError, setInputError] = useState<string | null>(null);
  const load = useCallback(() => read(preset, custom), [read, preset, custom]),
    loaded = useCallback((data: T) => {
      setFrom(data.from);
      setTo(data.to);
      setInputError(null);
    }, []),
    resource = useRecords(load, loaded),
    refresh = resource.refresh,
    initialFocus = useRef(true);
  // The load hook handles initial mount; refresh only when returning from another route.
  useFocusEffect(
    useCallback(() => {
      if (initialFocus.current) initialFocus.current = false;
      else refresh();
    }, [refresh]),
  );
  function changePreset(value: ProgressPreset) {
    setPreset(value);
    setCustom(undefined);
    setInputError(null);
    setEditing(false);
    if (value === preset && !custom) refresh();
  }
  function apply() {
    try {
      setCustom(validateProgressRange({ from, to }, resource.data?.today ?? ''));
      setInputError(null);
      setEditing(false);
    } catch (error) {
      setInputError(error instanceof Error ? error.message : 'Check dates.');
    }
  }
  return (
    <AuthFrame
      header={
        <ScreenHeader
          title="Progress"
          action={
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {onLog && (
                <IconButton
                  label={
                    title === 'Nutrition progress' ? 'Log or edit nutrition' : 'Open source records'
                  }
                  name={{ ios: 'square.and.pencil', android: 'edit_note', web: 'edit_note' }}
                  onPress={onLog}
                />
              )}
              <IconButton
                label="Refresh progress"
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                disabled={resource.loading || resource.refreshing}
                onPress={resource.reload}
              />
              <IconButton
                label="Change dates"
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                disabled={!resource.data || resource.loading}
                onPress={() => setEditing((value) => !value)}
              />
            </View>
          }
        />
      }
    >
      {navigation}
      <AuthText kind="heading">{title}</AuthText>
      <ProgressPresets
        selected={custom ? undefined : preset}
        disabled={resource.loading}
        onChange={changePreset}
      />
      {editing && (
        <ActionSheet title="Custom range" visible onClose={() => setEditing(false)}>
          <DatePicker label="From" value={from} onChange={setFrom} max={resource.data?.today} />
          <DatePicker label="To" value={to} onChange={setTo} max={resource.data?.today} />
          <AuthButton title="Apply dates" disabled={resource.loading} onPress={apply} />
          {inputError && <AuthNotice error>{inputError}</AuthNotice>}
        </ActionSheet>
      )}
      {inputError && <AuthNotice error>{inputError}</AuthNotice>}
      <RecordLoadFeedback {...resource} retry={refresh} />
      {resource.data && (
        <View key={resource.data.from + resource.data.to} style={{ gap: 14 }}>
          <AuthText>
            {resource.data.from} → {resource.data.to}
          </AuthText>
          {children(resource.data)}
        </View>
      )}
    </AuthFrame>
  );
}
export function ProgressHistory({
  entries,
}: {
  entries: { key: string; title: string; detail: string }[];
}) {
  const [page, setPage] = useState(0),
    current = Math.min(page, Math.max(0, Math.ceil(entries.length / 20) - 1));
  return (
    <>
      <AuthText kind="heading">Recorded history</AuthText>
      {entries.slice(current * 20, (current + 1) * 20).map((entry) => (
        <View key={entry.key}>
          <AuthText kind="heading">{entry.title}</AuthText>
          <AuthText>{entry.detail}</AuthText>
        </View>
      ))}
      {entries.length > 20 && (
        <View style={authStyles.row}>
          <AuthLink
            title="Newer records"
            disabled={current === 0}
            onPress={() => setPage(current - 1)}
          />
          <AuthText>Page {current + 1}</AuthText>
          <AuthLink
            title="Older records"
            disabled={(current + 1) * 20 >= entries.length}
            onPress={() => setPage(current + 1)}
          />
        </View>
      )}
    </>
  );
}

export function ProgressPresets({
  selected,
  disabled,
  onChange,
}: {
  selected?: ProgressPreset;
  disabled: boolean;
  onChange: (preset: ProgressPreset) => void;
}) {
  return (
    <Segments
      options={progressPresets.map((preset) => ({ value: preset, label: preset }))}
      value={selected ?? ''}
      disabled={disabled}
      onChange={(value) => {
        const preset = progressPresets.find((item) => item === value);
        if (preset) onChange(preset);
      }}
    />
  );
}

export function ProgressChart({
  title,
  points,
  range,
  unit,
  aggregate = 'mean',
}: {
  title: string;
  points: ProgressPoint[];
  range: ProgressRange;
  unit: string;
  aggregate?: 'mean' | 'sum';
}) {
  const { colors } = useAppTheme(),
    { bins, width } = chartBins(points, range, aggregate),
    values = bins.flatMap((bin) => (bin.value === null ? [] : [bin.value])),
    max = values.reduce((a, b) => Math.max(a, b), 0),
    latest = bins.filter((bin) => bin.value !== null).at(-1)?.from;
  if (!values.length) return null;
  return (
    <AuthCard>
      <AuthText kind="heading">{title}</AuthText>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${title} from ${range.from} to ${range.to}. Maximum displayed ${formatNumber(max)} ${unit}. Blank intervals have no recorded values. Exact values appear below.`}
        style={{ height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}
      >
        {bins.map((bin) => (
          <View
            key={bin.from}
            style={{
              flex: 1,
              height: bin.value === null ? 2 : 6 + (max ? (bin.value / max) * 94 : 0),
              backgroundColor:
                bin.value === null
                  ? colors.border
                  : bin.from === latest
                    ? colors.accent
                    : colors.muted,
              opacity: bin.value === null ? 0.35 : 1,
              borderRadius: 3,
            }}
          />
        ))}
      </View>
      <View style={authStyles.row}>
        <AuthText kind="muted">{range.from}</AuthText>
        <AuthText kind="muted">{range.to}</AuthText>
      </View>
      <AuthText>
        {width === 1
          ? 'One bar per recorded date.'
          : `${width}-date intervals: ${aggregate === 'sum' ? 'sum' : 'mean'} of recorded values.`}{' '}
        Blank intervals remain gaps.
      </AuthText>
    </AuthCard>
  );
}
export function ProgressMetrics({
  metrics,
}: {
  metrics: { title: string; value: string; detail?: string }[];
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {metrics.map((metric) => (
        <View key={metric.title} style={{ flexGrow: 1, flexBasis: '45%' }}>
          <AuthCard>
            <AuthText kind="eyebrow">{metric.title}</AuthText>
            <AuthText kind={metric.value.length < 15 ? 'metric' : 'heading'}>
              {metric.value}
            </AuthText>
            {metric.detail && <AuthText>{metric.detail}</AuthText>}
          </AuthCard>
        </View>
      ))}
    </View>
  );
}
