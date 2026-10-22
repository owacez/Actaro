import { useCallback, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Segments } from '@/components/product-ui';
import {
  AuthChoice,
  AuthInput,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { WeightProgressScreen } from '@/features/body/weight-progress-screen';
import { energy, formatNumber } from '@/features/nutrition/nutrition-model';
import { unitFactor } from '@/features/body/body-model';
import { shiftDate } from '@/features/workouts/training-overview';
import {
  ProgressChart,
  ProgressHistory,
  ProgressMetrics,
  ProgressPanel,
} from './progress-components';
import { periodDays, type ProgressPreset, type ProgressRange } from './progress-period';
import { progressService } from './progress-service';
import { habitUnit } from '@/features/habits/habit-model';
import { RunProgressScreen } from '@/features/running/run-cards';
import { displayDate, displayRange } from '@/lib/format';

const modules = [
  { key: 'weight', title: 'Body' },
  { key: 'nutrition', title: 'Nutrition' },
  { key: 'frequency', title: 'Frequency' },
  { key: 'strength', title: 'Strength' },
  { key: 'volume', title: 'Volume' },
  { key: 'steps', title: 'Activity' },
  { key: 'runs', title: 'Running' },
  { key: 'habits', title: 'Habits' },
  { key: 'summary', title: 'Summary' },
] as const;
type Module = (typeof modules)[number]['key'];
export function ProgressScreen({
  userId,
  onLog,
  onNutrition,
  onWorkouts,
  onActivity,
  onHabits,
}: {
  userId: string;
  onLog: () => void;
  onNutrition: () => void;
  onWorkouts?: () => void;
  onActivity?: () => void;
  onHabits?: () => void;
}) {
  const [module, setModule] = useState<Module>('weight');
  const training = ['frequency', 'strength', 'volume'].includes(module);
  const navigation = (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {modules
            .filter((item) => item.key !== 'strength' && item.key !== 'volume')
            .map((item) => (
              <AuthChoice
                key={item.key}
                title={item.key === 'frequency' ? 'Training' : item.title}
                selected={module === item.key || (item.key === 'frequency' && training)}
                disabled={false}
                onPress={() => setModule(item.key)}
              />
            ))}
        </View>
      </ScrollView>
      {training && (
        <Segments
          value={module}
          options={[
            { value: 'frequency', label: 'Frequency' },
            { value: 'strength', label: 'Strength' },
            { value: 'volume', label: 'Volume' },
          ]}
          onChange={setModule}
        />
      )}
    </View>
  );
  const read = useCallback(
    async (preset: ProgressPreset, custom?: ProgressRange) => {
      if (module === 'nutrition')
        return {
          kind: 'nutrition' as const,
          ...(await progressService.nutrition(userId, preset, custom)),
        };
      if (module === 'strength')
        return {
          kind: 'strength' as const,
          ...(await progressService.strength(userId, preset, custom)),
        };
      if (module === 'steps')
        return { kind: 'steps' as const, ...(await progressService.steps(userId, preset, custom)) };
      if (module === 'habits')
        return {
          kind: 'habits' as const,
          ...(await progressService.habits(userId, preset, custom)),
        };
      if (module === 'summary')
        return {
          kind: 'summary' as const,
          ...(await progressService.summary(userId, preset, custom)),
        };
      return {
        kind: 'training' as const,
        ...(await progressService.training(userId, preset, custom)),
      };
    },
    [userId, module],
  );
  if (module === 'weight')
    return <WeightProgressScreen userId={userId} onLog={onLog} navigation={navigation} />;
  if (module === 'runs') return <RunProgressScreen userId={userId} navigation={navigation} />;
  return (
    <ProgressPanel
      key={module}
      title={
        module === 'frequency'
          ? 'Workout frequency'
          : module === 'volume'
            ? 'Training volume'
            : `${module[0].toUpperCase()}${module.slice(1)} progress`
      }
      navigation={navigation}
      read={read}
      onLog={
        module === 'nutrition'
          ? onNutrition
          : module === 'steps'
            ? onActivity
            : module === 'habits'
              ? onHabits
              : onWorkouts
      }
    >
      {(data) =>
        data.kind === 'nutrition' ? (
          <NutritionResults data={data} />
        ) : data.kind === 'strength' ? (
          <StrengthResults data={data} />
        ) : data.kind === 'steps' ? (
          <StepsResults data={data} />
        ) : data.kind === 'habits' ? (
          <HabitResults data={data} />
        ) : data.kind === 'summary' ? (
          <SummaryResults data={data} />
        ) : (
          <TrainingResults data={data} volume={module === 'volume'} />
        )
      }
    </ProgressPanel>
  );
}
function SummaryResults({ data }: { data: Awaited<ReturnType<typeof progressService.summary>> }) {
  const [group, setGroup] = useState<'week' | 'month'>('week'),
    [page, setPage] = useState(0),
    rows = [...(group === 'week' ? data.weeks : data.months)].reverse(),
    current = Math.min(page, Math.max(0, Math.ceil(rows.length / 8) - 1)),
    unit = data.preferences.energy_unit === 'kJ' ? 'kJ' : 'kcal',
    weightUnit = data.preferences.weight_unit === 'lb' ? 'lb' : 'kg',
    factor = energy(1, unit),
    weightFactor = unitFactor(weightUnit);
  const comparison = (value: number | null) =>
    value === null ? 'unavailable' : `${value > 0 ? '+' : ''}${formatNumber(value)}%`;
  return (
    <>
      <View style={authStyles.choices}>
        {(['week', 'month'] as const).map((value) => (
          <AuthChoice
            key={value}
            title={value === 'week' ? 'Weekly' : 'Monthly'}
            selected={group === value}
            disabled={false}
            onPress={() => {
              setGroup(value);
              setPage(0);
            }}
          />
        ))}
      </View>
      <AuthText>
        Summaries use recorded facts only. Weeks start Monday. Boundary periods are marked partial;
        incomplete periods are not compared. Differences describe these records and do not establish
        a cause.
      </AuthText>
      {rows.slice(current * 8, (current + 1) * 8).map((row) => (
        <View key={row.from} style={{ gap: 8, paddingVertical: 8 }}>
          <AuthText kind="heading">
            {displayRange(row.from, row.to)}
            {row.partial ? ' · partial period' : ''}
          </AuthText>
          <ProgressMetrics
            metrics={[
              {
                title: 'Weight change',
                value:
                  row.weight.change === null
                    ? 'Needs two weigh-ins'
                    : `${row.weight.change > 0 ? '+' : ''}${formatNumber(row.weight.change * weightFactor)} ${weightUnit}`,
                detail: `${row.weight.count} recorded weigh-ins`,
              },
              {
                title: 'Average logged energy',
                value:
                  row.nutrition.average === null
                    ? 'No food logs'
                    : `${formatNumber(Math.round(row.nutrition.average.calories * factor))} ${unit}`,
                detail: `${row.nutrition.count}/${row.days} logged dates; protein ${row.nutrition.average === null ? 'unavailable' : formatNumber(row.nutrition.average.protein) + ' g'}`,
              },
              {
                title: 'Average recorded steps',
                value:
                  row.steps.average === null ? 'No step totals' : formatNumber(row.steps.average),
                detail: `${row.steps.count}/${row.days} recorded dates`,
              },
              {
                title: 'Completed workouts',
                value: String(row.workouts),
                detail: `${row.sets} sets · ${formatNumber(row.volumeKg * weightFactor)} ${weightUnit}·reps known volume · ${row.unknownWeightSets} unknown-load sets`,
              },
              {
                title: 'Habit completion',
                value: row.habits.expected
                  ? `${row.habits.completed}/${row.habits.expected} · ${formatNumber(row.habits.percentage ?? 0)}%`
                  : 'No eligible periods',
              },
              {
                title: 'Protein target days',
                value: row.nutrition.proteinDays
                  ? `${row.nutrition.proteinReachedDays}/${row.nutrition.proteinDays}`
                  : 'No eligible targets',
                detail:
                  row.nutrition.adherence === null
                    ? 'Macro adherence unavailable'
                    : `${formatNumber(row.nutrition.adherence)}% average macro adherence`,
              },
            ]}
          />
          {row.comparison && (
            <AuthText>
              Versus {displayRange(row.comparison.from, row.comparison.to)}: logged-day average
              energy {comparison(row.comparison.energy)}, recorded-day average steps{' '}
              {comparison(row.comparison.steps)}, workouts per calendar day{' '}
              {comparison(row.comparison.workoutRate)}. Logging coverage may differ.
            </AuthText>
          )}
        </View>
      ))}
      {rows.length > 8 && (
        <View style={authStyles.row}>
          <AuthChoice
            title="Newer summaries"
            selected={false}
            disabled={current === 0}
            onPress={() => setPage(current - 1)}
          />
          <AuthText>Page {current + 1}</AuthText>
          <AuthChoice
            title="Older summaries"
            selected={false}
            disabled={(current + 1) * 8 >= rows.length}
            onPress={() => setPage(current + 1)}
          />
        </View>
      )}
    </>
  );
}
function StepsResults({ data }: { data: Awaited<ReturnType<typeof progressService.steps>> }) {
  const summary = data.summary,
    distanceUnit = data.preferences.distance_unit === 'mi' ? 'mi' : 'km';
  if (!summary.days.length)
    return (
      <AuthNotice>
        No activity recorded in this period. Missing steps are unknown, not zero.
      </AuthNotice>
    );
  return (
    <>
      <ProgressMetrics
        metrics={[
          {
            title: 'Average recorded steps',
            value: summary.average === null ? 'Unavailable' : formatNumber(summary.average),
            detail: `${summary.count}/${summary.calendarDays} dates with step totals`,
          },
          {
            title: 'Total recorded steps',
            value: summary.count ? formatNumber(summary.total) : 'Unavailable',
          },
          {
            title: 'Highest recorded day',
            value: summary.best === null ? 'Unavailable' : formatNumber(summary.best),
          },
          {
            title: 'Current daily target',
            value: data.target === null ? 'Not set' : formatNumber(data.target),
            detail: 'Current setting, not a historical target',
          },
        ]}
      />
      <ProgressChart
        title="Daily recorded steps"
        range={data}
        points={summary.days.map((day) => ({ date: day.local_date, value: day.steps }))}
        unit="steps"
      />
      <AuthText>
        Manual and reviewed iPhone readings replace each date’s total; sources are never added
        together. Unlogged steps and distance-only dates are excluded from step averages.
      </AuthText>
      <ProgressHistory
        entries={[...summary.days].reverse().map((day) => ({
          key: day.local_date,
          title: day.local_date,
          detail: `${day.steps === null ? 'Steps not recorded' : formatNumber(day.steps) + ' steps'} · ${day.steps_source === 'ios_pedometer' ? 'reviewed iPhone reading' : day.steps === null ? 'distance only' : 'manual steps'} · ${day.distance_km === null ? 'Distance not recorded' : formatNumber(day.distance_km * unitFactor(distanceUnit)) + ' ' + distanceUnit}`,
        }))}
      />
    </>
  );
}
function HabitResults({ data }: { data: Awaited<ReturnType<typeof progressService.habits>> }) {
  const [selected, setSelected] = useState(''),
    summary = data.summary,
    habit = summary.rows.find((row) => row.record.id === selected) ?? summary.rows[0];
  if (!habit)
    return (
      <AuthNotice>
        No active habits in this period. Archived habits keep their records in Habits history.
      </AuthNotice>
    );
  return (
    <>
      <ProgressMetrics
        metrics={[
          {
            title: 'Completed periods',
            value: `${summary.completed}/${summary.expected}`,
            detail: 'Eligible scheduled dates or complete weeks',
          },
          {
            title: 'Completion',
            value:
              summary.percentage === null
                ? 'No eligible periods'
                : formatNumber(summary.percentage) + '%',
          },
        ]}
      />
      <View style={authStyles.choices}>
        {summary.rows.map((row) => (
          <AuthChoice
            key={row.record.id}
            title={row.record.name}
            selected={row.record.id === habit.record.id}
            disabled={false}
            onPress={() => setSelected(row.record.id)}
          />
        ))}
      </View>
      <AuthText kind="heading">{habit.record.name}</AuthText>
      <AuthText>
        {habit.completed}/{habit.expected} eligible periods completed ·{' '}
        {habit.percentage === null ? 'No eligible periods' : formatNumber(habit.percentage) + '%'}
      </AuthText>
      {habit.motivation === 'streak' && (
        <AuthText>
          {habit.atLeast ? 'At least ' : ''}
          {habit.streak} consecutive eligible periods through the selected end
        </AuthText>
      )}
      <ProgressChart
        title="Scheduled-period completion"
        range={data}
        points={habit.periods.map((period) => ({
          date: period.date < data.from ? data.from : period.date,
          value:
            period.partial || period.status === 'rest' || period.status === 'pending'
              ? null
              : period.status === 'done'
                ? 100
                : 0,
        }))}
        unit="%"
      />
      <AuthText>
        Rest, incomplete boundary weeks and open uncompleted periods are excluded. Historical
        target/schedule versions are respected. Avoidance requires an explicit zero report. Each
        habit uses its saved time zone; archive intervals are not recorded, so{' '}
        {summary.archivedExcluded} currently archived habits are excluded.
      </AuthText>
      <ProgressHistory
        key={habit.record.id}
        entries={[...habit.periods].reverse().map((period) => ({
          key: period.date,
          title:
            period.end !== period.date
              ? displayRange(period.date, period.end)
              : displayDate(period.date),
          detail: `${period.status}${period.partial ? ' · partial/excluded' : ''} · ${period.value === null ? 'Not recorded' : formatNumber(period.value) + ' ' + habitUnit(habit.record)} / ${formatNumber(period.target)} target`,
        }))}
      />
    </>
  );
}
function NutritionResults({
  data,
}: {
  data: Awaited<ReturnType<typeof progressService.nutrition>>;
}) {
  const summary = data.summary,
    unit = data.preferences.energy_unit === 'kJ' ? 'kJ' : 'kcal',
    factor = energy(1, unit);
  if (!summary.count)
    return (
      <AuthNotice>
        No food logged in this period. Missing dates are unknown intake, not zero calories.
      </AuthNotice>
    );
  return (
    <>
      <AuthText>
        {summary.count}/{summary.calendarDays} dates with food logs
      </AuthText>
      <ProgressMetrics
        metrics={[
          {
            title: 'Average logged energy',
            value: `${formatNumber(Math.round((summary.average?.calories ?? 0) * factor))} ${unit}`,
            detail: 'Mean of dates with food logs',
          },
          {
            title: 'Average protein',
            value: `${formatNumber(summary.average?.protein ?? 0)} g`,
            detail: 'Mean of dates with food logs',
          },
          {
            title: 'Protein target days',
            value: summary.proteinDays
              ? `${summary.proteinReachedDays}/${summary.proteinDays}`
              : 'No targets',
            detail: 'Logged dates with positive saved protein targets',
          },
          {
            title: 'Macro adherence',
            value:
              summary.adherence === null ? 'No targets' : `${formatNumber(summary.adherence)}%`,
            detail: 'Average share of four values within ±10% of each date’s targets',
          },
        ]}
      />
      <ProgressChart
        title="Logged energy"
        range={data}
        points={summary.days.map((day) => ({ date: day.date, value: day.calories * factor }))}
        unit={unit}
      />
      <ProgressChart
        title="Logged protein"
        range={data}
        points={summary.days.map((day) => ({ date: day.date, value: day.protein }))}
        unit="g"
      />
      <AuthText>
        Only logged intake is measured; a logged day may still be incomplete. Targets use the values
        effective on that date. No targets means unavailable adherence.
      </AuthText>
      <ProgressHistory
        entries={[...summary.days].reverse().map((day) => ({
          key: day.date,
          title: day.date,
          detail: `${formatNumber(Math.round(day.calories * factor))} ${unit} · P ${formatNumber(day.protein)} g · C ${formatNumber(day.carbs)} g · F ${formatNumber(day.fat)} g · ${day.adherence === null ? 'No saved targets' : formatNumber(day.adherence) + '% macro adherence'}`,
        }))}
      />
    </>
  );
}
function TrainingResults({
  data,
  volume,
}: {
  data: Awaited<ReturnType<typeof progressService.training>>;
  volume: boolean;
}) {
  const { overview, frequency } = data,
    unit = data.preferences.weight_unit === 'lb' ? 'lb' : 'kg',
    factor = unitFactor(unit);
  if (!frequency.count)
    return (
      <AuthNotice>
        No completed workout logs in this period. Plans and unfinished drafts are excluded.
      </AuthNotice>
    );
  const sessionsByDate = new Map(overview.days.map((day) => [day.date, day.sessions]));
  const points = volume
    ? overview.days.map((day) => ({
        date: day.date,
        value: day.sets && day.unknownWeightSets === day.sets ? null : day.volumeKg * factor,
      }))
    : Array.from({ length: periodDays(data.from, data.to) }, (_, index) => {
        const date = shiftDate(data.from, index);
        return { date, value: sessionsByDate.get(date) ?? 0 };
      });
  return (
    <>
      <ProgressMetrics
        metrics={
          volume
            ? [
                {
                  title: 'Known external volume',
                  value: `${formatNumber(overview.volumeKg * factor)} ${unit}·reps`,
                  detail: 'Completed reps × recorded external load',
                },
                { title: 'Working sets', value: String(overview.sets) },
                { title: 'Repetitions', value: String(overview.reps) },
                {
                  title: 'Unknown-load sets',
                  value: String(overview.unknownWeightSets),
                  detail: 'Excluded from external volume',
                },
              ]
            : [
                { title: 'Completed workouts', value: String(frequency.count) },
                {
                  title: 'Training dates',
                  value: `${frequency.activeDays}/${frequency.calendarDays}`,
                },
                {
                  title: 'Workouts per week',
                  value: formatNumber(frequency.perWeek),
                  detail: 'Count × 7 / calendar dates in this period',
                },
                {
                  title: 'Session modes',
                  value: `${frequency.timed} timed · ${frequency.logOnly} Log Only`,
                  detail: `${formatNumber(frequency.timedSeconds / 60)} recorded timed minutes`,
                },
              ]
        }
      />
      <ProgressChart
        title={volume ? 'Daily external volume' : 'Completed workouts by date'}
        range={data}
        points={points}
        unit={volume ? unit + '·reps' : 'workouts'}
        aggregate="sum"
      />
      {volume ? (
        <>
          <AuthText>
            Bodyweight sets with zero added load contribute zero external volume. Unknown loads are
            not estimated. This is training volume, not physiological load.
          </AuthText>
          <AuthText kind="heading">Primary-muscle allocation</AuthText>
          {overview.muscles.map((muscle) => (
            <View key={muscle.id ?? 'unassigned'}>
              <AuthText>
                {muscle.name}: {formatNumber(muscle.sets)} allocated sets ·{' '}
                {formatNumber(muscle.volumeKg * factor)} {unit}·reps
              </AuthText>
            </View>
          ))}
          <AuthText>
            Sets and known volume are divided equally between recorded primary muscles to avoid
            double counting.
          </AuthText>
        </>
      ) : (
        <AuthText>
          Zero dates mean no completed workout was recorded. Rest days are not failures. Timed
          duration excludes paused time; Log Only has no duration. Saved session calendar dates are
          preserved.
        </AuthText>
      )}
      <ProgressHistory
        entries={[...overview.days].reverse().map((day) => ({
          key: day.date,
          title: day.date,
          detail: `${day.sessions} workout(s) · ${day.sets} sets · ${day.reps} reps · ${formatNumber(day.volumeKg * factor)} ${unit}·reps · ${day.unknownWeightSets} unknown-load sets`,
        }))}
      />
    </>
  );
}
function StrengthResults({ data }: { data: Awaited<ReturnType<typeof progressService.strength>> }) {
  const [selected, setSelected] = useState(''),
    [query, setQuery] = useState('');
  const exercise = data.exercises.find((item) => item.id === selected) ?? data.exercises[0],
    choices = data.exercises.filter((item) =>
      item.name.toLowerCase().includes(query.trim().toLowerCase()),
    ),
    unit = data.preferences.weight_unit === 'lb' ? 'lb' : 'kg',
    factor = unitFactor(unit),
    value = (kg: number | null) =>
      kg === null ? 'Unavailable' : `${formatNumber(kg * factor)} ${unit}`;
  if (!exercise)
    return (
      <AuthNotice>
        No completed exercise sets in this period. Log a workout to see strength history.
      </AuthNotice>
    );
  return (
    <>
      <AuthInput label="Find a recorded exercise" value={query} onChangeText={setQuery} />
      <AuthText>{choices.length} matching recorded exercises</AuthText>
      <View style={authStyles.choices}>
        {choices.slice(0, 20).map((item) => (
          <AuthChoice
            key={item.id}
            title={item.name}
            selected={item.id === exercise.id}
            disabled={false}
            onPress={() => setSelected(item.id)}
          />
        ))}
      </View>
      {choices.length > 20 && (
        <AuthText>Showing 20 matches. Refine the exercise name to select another.</AuthText>
      )}
      <AuthText kind="heading">{exercise.name}</AuthText>
      <ProgressMetrics
        metrics={[
          { title: 'Period best external load', value: value(exercise.bestKg) },
          {
            title: 'Period best estimated 1RM',
            value: value(exercise.bestEstimate),
            detail: 'Epley estimate for 1–10 reps, not a tested maximum',
          },
          {
            title: 'First → latest load',
            value:
              exercise.change === null
                ? 'Needs two loaded dates'
                : `${exercise.change > 0 ? '+' : ''}${value(exercise.change)}`,
            detail: 'Change in the heaviest external load recorded on those dates',
          },
          {
            title: 'Recorded sets',
            value: String(exercise.sets),
            detail: `${exercise.unknown} sets with unknown load`,
          },
        ]}
      />
      <ProgressChart
        title="Daily heaviest external load"
        range={data}
        points={exercise.days.map((day) => ({
          date: day.date,
          value: day.heaviest === null ? null : day.heaviest * factor,
        }))}
        unit={unit}
      />
      <ProgressChart
        title="Daily estimated 1RM"
        range={data}
        points={exercise.days.map((day) => ({
          date: day.date,
          value: day.estimate === null ? null : day.estimate * factor,
        }))}
        unit={unit}
      />
      <AuthText>
        Period best is not necessarily an all-time PR. Bodyweight-only and unknown loads have no
        external strength estimate. Compare the same exercise; changing loads or repetition ranges
        can change these metrics.
      </AuthText>
      <ProgressHistory
        key={exercise.id}
        entries={[...exercise.days].reverse().map((day) => ({
          key: day.date,
          title: day.date,
          detail: `Heaviest ${value(day.heaviest)} · estimated 1RM ${value(day.estimate)}`,
        }))}
      />
    </>
  );
}
