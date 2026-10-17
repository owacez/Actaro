import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
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
import { ScreenHeader, ActionSheet } from '@/components/product-ui';
import { useAppTheme } from '@/features/profile/theme-context';
import { weekdays } from './split-model';
import { planService, type PlanFilters, type TrainingPlan } from './plan-service';
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
      <AuthText kind="heading">{plan?.name ?? 'Training plans'}</AuthText>
      <AuthText>
        Actaro-authored starting templates. Review and edit the exercises, targets and schedule to
        suit you. Choose working weights before training.
      </AuthText>
      {error && <AuthNotice error>{error}</AuthNotice>}
      {plan ? (
        <>
          <AuthText>{plan.description}</AuthText>
          <AuthText>
            {plan.days_per_week} days/week · {plan.experience} · {plan.goal}
          </AuthText>
          <AuthText>Equipment: {plan.required_equipment.join(', ') || 'No equipment'}</AuthText>
          <AuthText kind="eyebrow">Weekly schedule</AuthText>
          {weekdays.map((day, index) => (
            <AuthText key={day}>
              {day}: {plan.schedule[index] ?? 'Rest'}
            </AuthText>
          ))}
          {plan.workouts.map((workout) => (
            <AuthCard key={workout.name}>
              <View style={{ gap: 8 }}>
                <AuthText kind="eyebrow">{workout.name}</AuthText>
                <AuthText>
                  {workout.sets} sets × {workout.reps} reps per exercise · {workout.rest}s rest
                </AuthText>
                {workout.exercises.map((name, index) => (
                  <AuthText key={`${name}-${index}`}>
                    {index + 1}. {name}
                  </AuthText>
                ))}
              </View>
            </AuthCard>
          ))}
          <AuthText>
            General programming reference: {plan.source_url}. This template is editable and is not
            an endorsed program.
          </AuthText>
          <AuthText>
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
                <AuthCard key={row.id}>
                  <AuthText kind="heading">{row.name}</AuthText>
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
                  <AuthText>
                    {row.days_per_week} days/week · {row.experience} ·{' '}
                    {row.required_equipment.join(', ') || 'No equipment'}
                  </AuthText>
                  <AuthLink
                    title={`Preview ${row.name}`}
                    onPress={() => {
                      setError(null);
                      setSelection({ plan: row, splitId: randomUUID() });
                    }}
                  />
                </AuthCard>
              ))}
            </>
          )}
        </>
      )}
    </AuthFrame>
  );
}
