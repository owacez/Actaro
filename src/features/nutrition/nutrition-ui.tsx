import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { NumberStepper } from '@/components/number-stepper';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { clearReadCache } from '@/lib/supabase/read-cache';
import {
  foodUnits,
  formatEnergy,
  formatNumber,
  numeric,
  nutritionLabel,
  portionNutrition,
  switchPortion,
  type Food,
  type Nutrients,
} from './nutrition-model';

export function useNutritionLoad<T>(
  load: () => Promise<T>,
  onLoaded?: (data: T) => void,
  errorMessage = 'Unable to load nutrition. Retry.',
) {
  const generation = useRef(0);
  const [result, setResult] = useState<{
      source: typeof load;
      version: number;
      data: T | null;
      error: string | null;
    } | null>(null),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const request = ++generation.current;
    void load()
      .then((value) => {
        if (active && request === generation.current) {
          onLoaded?.(value);
          setResult({ source: load, version, data: value, error: null });
        }
      })
      .catch(() => {
        if (active && request === generation.current) {
          setResult((previous) => ({
            source: load,
            version,
            data: previous?.source === load ? previous.data : null,
            error: errorMessage,
          }));
        }
      });
    return () => {
      active = false;
    };
  }, [load, version, onLoaded, errorMessage]);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const reload = useCallback(() => {
    clearReadCache();
    refresh();
  }, [refresh]);
  const current = result?.source === load ? result : null;
  const loading = !current || (current.data === null && current.version !== version);
  const updateData = useCallback(
    (update: (value: T) => T) => {
      generation.current++;
      setResult((previous) =>
        previous?.source === load && previous.data !== null
          ? { ...previous, version, data: update(previous.data) }
          : previous,
      );
    },
    [load, version],
  );
  return {
    data: current?.data ?? null,
    error: loading ? null : (current?.error ?? null),
    loading,
    refreshing: !!current && current.version !== version,
    refresh,
    reload,
    updateData,
  };
}
export function useNutritionAction() {
  const { notify } = useAuthFeedback(),
    alive = useRef(true),
    running = useRef(false),
    frozen = useRef<{ request: () => Promise<unknown>; message: string; done?: () => void } | null>(
      null,
    );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [locked, setLocked] = useState(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function run(request: () => Promise<unknown>, message: string, done?: () => void) {
    if (running.current) return;
    frozen.current ??= { request, message, done };
    const attempt = frozen.current;
    running.current = true;
    setBusy(true);
    setLocked(true);
    setError(null);
    try {
      await attempt.request();
      frozen.current = null;
      if (alive.current) {
        setLocked(false);
        notify(attempt.message, 'success');
        attempt.done?.();
      }
    } catch (reason) {
      if (reason instanceof Error && 'retryable' in reason && reason.retryable === false) {
        frozen.current = null;
        if (alive.current) {
          setLocked(false);
          setError(reason.message);
        }
      } else if (alive.current)
        setError('Save was not confirmed. Keep this screen open and retry the same request.');
    } finally {
      running.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return {
    busy,
    locked,
    error,
    setError,
    run,
    retry: () => {
      if (frozen.current)
        void run(frozen.current.request, frozen.current.message, frozen.current.done);
    },
  };
}
export function LoadFeedback({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  return (
    <>
      {loading && <AuthLoading>Loading nutrition…</AuthLoading>}
      {error && (
        <>
          <AuthNotice error>{error}</AuthNotice>
          <AuthButton title="Retry loading" onPress={retry} />
        </>
      )}
    </>
  );
}
export function SaveFeedback({ action }: { action: ReturnType<typeof useNutritionAction> }) {
  return (
    <>
      {action.error && <AuthNotice error>{action.error}</AuthNotice>}
      {action.locked && !action.busy && (
        <AuthButton title="Retry saved request" onPress={action.retry} />
      )}
    </>
  );
}
export function NutrientSummary({
  values,
  unit = 'kcal',
  title,
}: {
  values: Nutrients;
  unit?: 'kcal' | 'kJ';
  title?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View accessible accessibilityLabel={nutritionLabel(values, unit)}>
      <AuthCard>
        {title && <AuthText kind="eyebrow">{title}</AuthText>}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
            <View key={key} style={{ flex: 1, minWidth: 60, gap: 4 }}>
              <AuthText kind="heading">
                {key === 'calories' ? formatEnergy(values[key], unit) : formatNumber(values[key])}
              </AuthText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: key === 'calories' ? colors.text : colors[key],
                  }}
                />
                <AuthText kind="muted">
                  {key === 'calories'
                    ? unit
                    : key === 'protein'
                      ? 'Protein'
                      : key === 'carbs'
                        ? 'Carbs'
                        : 'Fat'}
                </AuthText>
              </View>
            </View>
          ))}
        </View>
      </AuthCard>
    </View>
  );
}

export function PortionEditor({
  food,
  unit,
  quantity,
  onUnit,
  onQuantity,
  disabled = false,
  energyUnit = 'kcal',
}: {
  food: Food;
  unit: string;
  quantity: string;
  onUnit: (unit: string) => void;
  onQuantity: (value: string) => void;
  disabled?: boolean;
  energyUnit?: 'kcal' | 'kJ';
}) {
  let values: Nutrients | null = null,
    message: string | null = null;
  try {
    values = portionNutrition(food, unit, numeric(quantity, 'quantity', 100000));
  } catch (error) {
    message = error instanceof Error ? error.message : 'Enter a valid quantity.';
  }
  return (
    <>
      <NutrientSummary
        title={`Base: ${formatNumber(food.base_amount)} ${food.base_unit}`}
        values={food}
        unit={energyUnit}
      />
      <AuthText kind="eyebrow">Serving unit</AuthText>
      <View style={authStyles.choices}>
        {foodUnits(food).map((item) => (
          <AuthChoice
            key={item.key}
            title={item.label}
            selected={unit === item.key}
            disabled={disabled}
            onPress={() => {
              if (item.key === unit) return;
              onQuantity(switchPortion(food, unit, quantity, item.key));
              onUnit(item.key);
            }}
          />
        ))}
      </View>
      <NumberStepper
        label="Quantity"
        large
        value={quantity}
        onChange={onQuantity}
        disabled={disabled}
        min={0.1}
        max={100000}
      />
      {values ? (
        <NutrientSummary title="Live portion nutrition" values={values} unit={energyUnit} />
      ) : (
        <AuthNotice error>{message}</AuthNotice>
      )}
    </>
  );
}
