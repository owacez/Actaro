import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  AuthButton,
  AuthCard,
  AuthChoice,
  AuthInput,
  AuthLink,
  AuthLoading,
  AuthNotice,
  AuthText,
  authStyles,
} from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import {
  foodUnits,
  NutritionRequestError,
  formatNumber,
  numeric,
  nutritionLabel,
  portionNutrition,
  type Food,
  type Nutrients,
} from './nutrition-model';

export function useNutritionLoad<T>(load: () => Promise<T>, onLoaded?: (data: T) => void) {
  const [result, setResult] = useState<{
      source: typeof load;
      version: number;
      data: T | null;
      error: string | null;
    } | null>(null),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    void load()
      .then((value) => {
        if (active) {
          onLoaded?.(value);
          setResult({ source: load, version, data: value, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setResult({
            source: load,
            version,
            data: null,
            error: 'Unable to load nutrition. Retry.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, [load, version, onLoaded]);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  const loading = !result || result.source !== load || result.version !== version;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    refresh,
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
      if (reason instanceof NutritionRequestError && !reason.retryable) {
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
  return (
    <AuthCard>
      {title && <AuthText kind="eyebrow">{title}</AuthText>}
      <AuthText kind="heading">{nutritionLabel(values, unit)}</AuthText>
    </AuthCard>
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
            onPress={() => onUnit(item.key)}
          />
        ))}
      </View>
      <View style={authStyles.row}>
        <AuthLink
          title="−"
          accessibilityLabel="Decrease quantity"
          disabled={disabled}
          onPress={() => onQuantity(String(Math.max(0.1, (Number(quantity) || 1) - 1)))}
        />
        <AuthInput
          label="Quantity"
          value={quantity}
          onChangeText={onQuantity}
          keyboardType="decimal-pad"
          editable={!disabled}
        />
        <AuthLink
          title="+"
          accessibilityLabel="Increase quantity"
          disabled={disabled}
          onPress={() => onQuantity(String(Math.min(100000, (Number(quantity) || 0) + 1)))}
        />
      </View>
      {values ? (
        <NutrientSummary title="Live portion nutrition" values={values} unit={energyUnit} />
      ) : (
        <AuthNotice error>{message}</AuthNotice>
      )}
    </>
  );
}
