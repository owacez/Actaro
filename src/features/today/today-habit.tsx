import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ActionSheet, IconButton } from '@/components/product-ui';
import { CompletionMark } from '@/components/completion-mark';
import { NumberStepper } from '@/components/number-stepper';
import { AuthButton, AuthInput, AuthText } from '@/features/auth/auth-components';
import { useRecordAction, RecordSaveFeedback } from '@/hooks/use-records';
import { formatNumber } from '@/features/nutrition/nutrition-model';
import { useAppTheme } from '@/features/profile/theme-context';
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
  const { colors } = useAppTheme();
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
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text
            numberOfLines={1}
            style={{ color: colors.text, fontSize: 15, fontFamily: 'Inter_600SemiBold' }}
          >
            {habit.name}
          </Text>
          <View style={{ alignSelf: 'flex-start' }}>
            <CompletionMark
              done={done}
              label={dailyCheck ? 'Done today' : 'Target met'}
              pendingLabel={habitStatusLabel(habit, date)}
            />
          </View>
          {habit.kind !== 'boolean' && (
            <AuthText kind="muted">
              {`${value === null ? 'No amount logged' : formatNumber(value) + ' ' + habitUnit(habit)} · ${habit.kind === 'avoidance' ? 'Limit' : 'Target'} ${formatNumber(version?.target ?? 0)} ${habitUnit(habit)} ${habit.kind === 'frequency' ? 'this week' : 'today'}`}
            </AuthText>
          )}
          {habit.kind === 'boolean' && !log && (
            <AuthText kind="muted">Check off once today</AuthText>
          )}
        </View>
        {log ? (
          <IconButton
            label={`Options for ${habit.name}`}
            name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
            disabled={action.locked}
            onPress={edit}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Log habit ${habit.name}`}
            accessibilityState={{ disabled: action.locked }}
            disabled={action.locked}
            onPress={() => {
              if (dailyCheck) save(1);
              else edit();
            }}
            hitSlop={6}
            style={({ pressed }) => ({
              minHeight: 36,
              paddingHorizontal: 14,
              borderRadius: 18,
              justifyContent: 'center',
              backgroundColor: colors.accent,
              opacity: action.locked ? 0.45 : pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: '#111311', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
              {dailyCheck ? 'Done' : habit.kind === 'duration' ? 'Log min' : 'Log'}
            </Text>
          </Pressable>
        )}
      </View>
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
