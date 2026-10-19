import { useState } from 'react';
import { View } from 'react-native';
import { ActionSheet } from '@/components/product-ui';
import { CompletionMark } from '@/components/completion-mark';
import { NumberStepper } from '@/components/number-stepper';
import { AuthButton, AuthInput, AuthText } from '@/features/auth/auth-components';
import { useRecordAction, RecordSaveFeedback } from '@/hooks/use-records';
import { formatNumber } from '@/features/nutrition/nutrition-model';
import { habitService } from '@/features/habits/habit-service';
import {
  habitToday,
  habitVersion,
  habitValue,
  habitDoneToday,
  habitUnit,
  habitStatusLabel,
  logValue,
  type HabitRecord,
} from '@/features/habits/habit-model';

export function TodayHabit({
  userId,
  habit,
  onLogged,
}: {
  userId: string;
  habit: HabitRecord;
  onLogged: (date: string, value: number, notes: string) => void;
}) {
  const [open, setOpen] = useState(false),
    [input, setInput] = useState(''),
    [notes, setNotes] = useState('');
  const action = useRecordAction(),
    date = habitToday(habit),
    version = habitVersion(habit, date);
  const log = habit.habit_logs.find((row) => row.local_date === date),
    value = habitValue(habit, date);
  const done = !!version && habitDoneToday(habit, date),
    dailyCheck = habit.kind === 'boolean' || habit.kind === 'frequency';
  function save(amount: number, note = log?.notes ?? '') {
    void action.run(
      () => habitService.log(userId, habit.id, date, amount, note),
      'Habit logged',
      () => {
        onLogged(date, amount, note);
        setOpen(false);
      },
    );
  }
  function edit() {
    setInput(log ? String(log.value) : '');
    setNotes(log?.notes ?? '');
    action.setError(null);
    setOpen(true);
  }
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 100 }}>
          <AuthText kind="heading">{habit.name}</AuthText>
        </View>
        <CompletionMark
          done={done}
          label={dailyCheck ? 'Done today' : 'Target met'}
          pendingLabel={habitStatusLabel(habit, date)}
        />
      </View>
      <AuthText kind="muted">
        {habit.kind === 'boolean'
          ? 'Check off once today'
          : `${value === null ? 'No amount logged' : formatNumber(value) + ' ' + habitUnit(habit)} · ${habit.kind === 'avoidance' ? 'Limit' : 'Target'} ${formatNumber(version?.target ?? 0)} ${habitUnit(habit)} ${habit.kind === 'frequency' ? 'this week' : 'today'}`}
      </AuthText>
      <AuthButton
        title={
          done
            ? 'Edit today’s log'
            : habit.kind === 'boolean'
              ? 'Mark done'
              : habit.kind === 'frequency'
                ? 'Mark today done'
                : habit.kind === 'duration'
                  ? 'Log minutes'
                  : habit.kind === 'avoidance'
                    ? 'Log today’s count'
                    : 'Log amount'
        }
        accessibilityLabel={`Log habit ${habit.name}`}
        outlined={done}
        disabled={action.locked}
        onPress={() => {
          if (!done && habit.kind === 'boolean') save(1);
          else if (!done && habit.kind === 'frequency') save(1);
          else edit();
        }}
      />
      {!done && log && (
        <AuthButton
          title="Edit today’s log"
          accessibilityLabel={`Edit today’s log for ${habit.name}`}
          outlined
          disabled={action.locked}
          onPress={edit}
        />
      )}
      {!open && <RecordSaveFeedback action={action} />}
      <ActionSheet
        title={habit.name}
        visible={open}
        onClose={() => {
          if (!action.locked) setOpen(false);
        }}
      >
        <AuthText>
          {date} ·{' '}
          {habit.kind === 'frequency'
            ? 'Each date counts once. Undo today without changing other days.'
            : 'Update today’s log without leaving Today.'}
        </AuthText>
        {dailyCheck ? (
          <View style={{ gap: 8 }}>
            <AuthButton
              title="Done today"
              disabled={action.locked}
              onPress={() => save(1, notes)}
            />
            <AuthButton
              title="Not done today"
              outlined
              disabled={action.locked}
              onPress={() => save(0, notes)}
            />
          </View>
        ) : (
          <>
            <NumberStepper
              label={`Today’s value (${habit.unit})`}
              value={input}
              step={habit.kind === 'frequency' || habit.kind === 'avoidance' ? 1 : 0.5}
              max={1000000}
              disabled={action.locked}
              onChange={setInput}
            />
            <AuthInput
              label="Habit note (optional)"
              value={notes}
              onChangeText={setNotes}
              maxLength={2000}
              editable={!action.locked}
            />
            <AuthText kind="muted">
              Saving replaces today’s value. Enter zero explicitly when there were no occurrences.
            </AuthText>
            <AuthButton
              title="Save today’s log"
              busy={action.busy}
              disabled={action.locked}
              onPress={() => {
                try {
                  save(logValue(habit, input), notes);
                } catch (error) {
                  action.setError(error instanceof Error ? error.message : 'Check the value.');
                }
              }}
            />
          </>
        )}
        <RecordSaveFeedback action={action} />
      </ActionSheet>
    </View>
  );
}
