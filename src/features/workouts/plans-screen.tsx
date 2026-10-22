import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { actaroColors } from '@/constants/actaro-theme';
import { randomUUID } from 'expo-crypto';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthFrame,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { ScreenHeader, ActionSheet, ProductIcon, StatTile } from '@/components/product-ui';
import { plural } from '@/lib/format';
import { useAppTheme } from '@/features/profile/theme-context';
import { weekdays } from './split-model';
import {
  planService,
  planSessionTime,
  planWorkoutMinutes,
  type PlanFilters,
  type TrainingPlan,
} from './plan-service';
const initialFilters: PlanFilters = {
  goal: null,
  experience: null,
  days: null,
  availableOnly: false,
};
export function PlansScreen({
  userId,
  navigation,
  onBack,
  onAdopted,
}: {
  userId: string;
  navigation?: ReactNode;
  onBack: () => void;
  onAdopted: (id: string) => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(initialFilters),
    [rows, setRows] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<{ plan: TrainingPlan; splitId: string } | null>(null);
  const [busy, setBusy] = useState(false),
    pending = useRef(false),
    alive = useRef(true);
  const { notify } = useAuthFeedback();
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    let current = true;
    void planService
      .list(userId, query)
      .then((plans) => {
        if (current) {
          setRows(plans);
          setLoading(false);
        }
      })
      .catch(() => {
        if (current) {
          setError('Unable to load plans. Check your connection and retry.');
          setLoading(false);
        }
      });
    return () => {
      current = false;
    };
  }, [userId, query]);
  function filter(next: PlanFilters) {
    setError(null);
    setLoading(true);
    setQuery(next);
  }
  async function adopt() {
    if (!selection || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const id = await planService.adopt(userId, selection.plan.id, selection.splitId);
      if (alive.current) {
        notify('Plan added. Your workouts and split are editable.', 'success');
        onAdopted(id);
      }
    } catch {
      if (alive.current) setError('Unable to add plan. Retry to recover the same copy.');
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const plan = selection?.plan;
  const { colors } = useAppTheme();
  return (
    <AuthFrame header={navigation ? <ScreenHeader title="Train" /> : undefined}>
      {navigation}
      {(!navigation || plan) && (
        <AuthLink
          title={plan ? '← Training plans' : '← My workouts'}
          disabled={busy}
          onPress={() => {
            if (selection) {
              setSelection(null);
              setError(null);
            } else onBack();
          }}
        />
      )}
      <AuthText kind="title">{plan?.name ?? 'Training plans'}</AuthText>
      {!plan && (
        <AuthText>
          Actaro-authored starting templates. Review and edit the exercises, targets and schedule to
          suit you. Choose working weights before training.
        </AuthText>
      )}
      {error && <AuthNotice error>{error}</AuthNotice>}
      {plan ? (
        <>
          <Chips values={[capital(plan.goal), capital(plan.experience)]} />
          <AuthText>{plan.description}</AuthText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <StatTile
              icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              label="Days per week"
              value={plural(plan.days_per_week, 'day')}
            />
            <StatTile
              icon={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              label="Session time"
              value={planSessionTime(plan.workouts)}
            />
            <StatTile
              icon={{ ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' }}
              label="Equipment"
              value={plan.required_equipment.join(', ') || 'None'}
            />
            <StatTile
              icon={{
                ios: 'chart.bar',
                android: 'signal_cellular_alt',
                web: 'signal_cellular_alt',
              }}
              label="Level"
              value={capital(plan.experience)}
            />
          </View>
          <AuthText kind="eyebrow">WEEKLY SCHEDULE</AuthText>
          <AuthCard>
            {weekdays.map((day, index) => {
              const workout = plan.schedule[index];
              const letter = workout ? workoutLetter(plan.workouts, workout) : null;
              return (
                <View
                  key={day}
                  accessible
                  accessibilityLabel={`${day}: ${workout ?? 'Rest'}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingVertical: 6,
                  }}
                >
                  <View style={{ width: 40 }}>
                    <AuthText kind="eyebrow">{day.slice(0, 3).toUpperCase()}</AuthText>
                  </View>
                  {letter ? <Badge letter={letter} /> : null}
                  <AuthText kind={workout ? 'heading' : 'muted'}>{workout ?? 'Rest'}</AuthText>
                </View>
              );
            })}
          </AuthCard>
          <AuthText kind="eyebrow">WORKOUTS</AuthText>
          {plan.workouts.map((workout, at) => (
            <AuthCard key={workout.name}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Badge letter={String.fromCharCode(65 + at)} />
                <View style={{ flex: 1 }}>
                  <AuthText kind="heading">{workout.name}</AuthText>
                </View>
              </View>
              <Chips
                values={[
                  plural(workout.exercises.length, 'exercise'),
                  `${workout.sets} × ${workout.reps} reps`,
                  `${workout.rest}s rest`,
                  `~${planWorkoutMinutes(workout)} min`,
                ]}
              />
              {workout.exercises.map((name, index) => (
                <AuthText key={`${name}-${index}`}>
                  {index + 1}. {name}
                </AuthText>
              ))}
            </AuthCard>
          ))}
          <AuthText kind="muted">
            General programming reference: {plan.source_url}. This template is editable and is not
            an endorsed program. Session time assumes about 45 seconds per set plus rest.
          </AuthText>
          <AuthText kind="muted">
            Adding this plan creates your own workouts and makes its seven-day split active.
            Existing workouts and splits are kept.
          </AuthText>
          <AuthButton title="Use this plan" busy={busy} onPress={() => void adopt()} />
        </>
      ) : (
        <>
          <AuthLink title="Plan filters" onPress={() => setFiltersOpen(true)} />
          <ActionSheet
            title="Plan filters"
            visible={filtersOpen}
            onClose={() => setFiltersOpen(false)}
          >
            <AuthText kind="eyebrow">Goal</AuthText>
            <View style={authStyles.choices}>
              {([null, 'general', 'strength', 'hypertrophy'] as const).map((goal) => (
                <AuthChoice
                  key={goal ?? 'all'}
                  title={goal ?? 'All goals'}
                  selected={query.goal === goal}
                  onPress={() => filter({ ...query, goal })}
                />
              ))}
            </View>
            <AuthText kind="eyebrow">Experience</AuthText>
            <View style={authStyles.choices}>
              {([null, 'beginner', 'intermediate'] as const).map((experience) => (
                <AuthChoice
                  key={experience ?? 'all'}
                  title={experience ?? 'All experience levels'}
                  selected={query.experience === experience}
                  onPress={() => filter({ ...query, experience })}
                />
              ))}
            </View>
            <AuthText kind="eyebrow">Training days per week</AuthText>
            <View style={authStyles.choices}>
              {[null, 1, 2, 3, 4, 5, 6, 7].map((days) => (
                <AuthChoice
                  key={days ?? 'all'}
                  title={days ? `${days} days` : 'Any days'}
                  selected={query.days === days}
                  onPress={() => filter({ ...query, days })}
                />
              ))}
            </View>
            <AuthChoice
              title="Use only my available equipment"
              selected={query.availableOnly}
              onPress={() => filter({ ...query, availableOnly: !query.availableOnly })}
            />
          </ActionSheet>
          {loading ? (
            <AuthLoading>Loading plans…</AuthLoading>
          ) : error ? (
            <AuthButton title="Retry plans" onPress={() => filter({ ...query })} />
          ) : (
            <>
              {!rows.length && (
                <AuthText>
                  No plans match these filters. Try fewer filters or update your available equipment
                  in Preferences.
                </AuthText>
              )}
              {rows.map((row) => (
                <Pressable
                  key={row.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Preview ${row.name}`}
                  onPress={() => {
                    setError(null);
                    setSelection({ plan: row, splitId: randomUUID() });
                  }}
                  style={({ pressed }) => ({
                    gap: 10,
                    padding: 16,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <AuthText kind="heading">{row.name}</AuthText>
                    </View>
                    <ProductIcon
                      name={{
                        ios: 'chevron.right',
                        android: 'chevron_right',
                        web: 'chevron_right',
                      }}
                      size={18}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {row.schedule.map((workout, index) => (
                      <View
                        key={index}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 4,
                          backgroundColor: workout ? colors.accent : colors.fill,
                        }}
                      />
                    ))}
                  </View>
                  <Chips
                    values={[
                      `${row.days_per_week} days/week`,
                      capital(row.experience),
                      planSessionTime(row.workouts),
                      row.required_equipment.length
                        ? row.required_equipment.join(', ')
                        : 'No equipment',
                    ]}
                  />
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </AuthFrame>
  );
}

function capital(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}
// Workouts are lettered A, B, C… in plan order so the schedule and cards match.
function workoutLetter(workouts: { name: string }[], name: string) {
  const index = workouts.findIndex((workout) => workout.name === name);
  return index < 0 ? null : String.fromCharCode(65 + index);
}
function Badge({ letter }: { letter: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.accent,
      }}
    >
      <Text style={{ color: actaroColors.text, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
        {letter}
      </Text>
    </View>
  );
}
function Chips({ values }: { values: string[] }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {values.map((value) => (
        <View
          key={value}
          style={{
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            backgroundColor: colors.fill,
          }}
        >
          <AuthText kind="muted">{value}</AuthText>
        </View>
      ))}
    </View>
  );
}
