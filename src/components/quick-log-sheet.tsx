import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';
import { router } from 'expo-router';
import { randomUUID } from 'expo-crypto';
import { ActionSheet, ProductIcon } from './product-ui';
import { AuthButton, AuthInput } from '@/features/auth/auth-components';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { numeric } from '@/features/nutrition/nutrition-model';
import { SaveFeedback, useNutritionAction } from '@/features/nutrition/nutrition-ui';
export function QuickLogSheet({
  userId,
  visible,
  onClose,
}: {
  userId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [customWater, setCustomWater] = useState(false);
  const [water, setWater] = useState('250'),
    action = useNutritionAction();
  function go(path: '/body' | '/activity' | '/habits' | '/workouts' | '/nutrition/manage') {
    onClose();
    if (path === '/nutrition/manage') router.push({ pathname: path, params: { view: 'search' } });
    else router.push(path);
  }
  function logWater(amountText: string) {
    try {
      const amount = numeric(amountText, 'water quantity', 20000);
      if (amount < 1) throw new Error('Log between 1 and 20,000 ml.');
      const id = randomUUID();
      let context: Awaited<ReturnType<typeof nutritionService.context>> | undefined;
      void action.run(
        async () => {
          context ??= await nutritionService.context(userId);
          await nutritionService.water(
            userId,
            id,
            context.today,
            context.preferences.time_zone,
            amount,
          );
        },
        'Water logged',
        onClose,
      );
    } catch (error) {
      action.setError(error instanceof Error ? error.message : 'Check the amount.');
    }
  }
  return (
    <ActionSheet
      title="Quick log"
      visible={visible}
      onClose={() => {
        if (!action.locked) onClose();
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(
          [
            {
              title: 'Food',
              path: '/nutrition/manage',
              icon: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
            },
            {
              title: 'Water',
              path: null,
              icon: { ios: 'drop', android: 'water_drop', web: 'water_drop' },
            },
            {
              title: 'Weight',
              path: '/body',
              icon: { ios: 'scalemass', android: 'monitor_weight', web: 'monitor_weight' },
            },
            {
              title: 'Steps',
              path: '/activity',
              icon: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
            },
            {
              title: 'Habit',
              path: '/habits',
              icon: { ios: 'checkmark.square', android: 'check_box', web: 'check_box' },
            },
            {
              title: 'Workout',
              path: '/workouts',
              icon: { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' },
            },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.title}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            accessibilityState={{ disabled: action.locked }}
            disabled={action.locked}
            onPress={() => {
              if (item.path === null) setCustomWater((value) => !value);
              else if (
                item.path === '/nutrition/manage' ||
                item.path === '/body' ||
                item.path === '/activity' ||
                item.path === '/habits' ||
                item.path === '/workouts'
              )
                go(item.path);
            }}
            style={{
              flexBasis: '30%',
              flexGrow: 1,
              minHeight: 88,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ProductIcon name={item.icon} color={colors.accent} />
            <Text style={{ color: colors.text, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </View>
      {customWater && (
        <AuthInput
          label="Water (ml)"
          value={water}
          onChangeText={setWater}
          keyboardType="decimal-pad"
          editable={!action.locked}
        />
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {['250', '500'].map((amount) => (
          <View key={amount} style={{ flex: 1 }}>
            <AuthButton
              title={'+' + amount + ' ml'}
              outlined
              disabled={action.locked}
              onPress={() => logWater(amount)}
            />
          </View>
        ))}
      </View>
      {customWater && (
        <AuthButton
          title="Log water"
          disabled={action.locked}
          busy={action.busy}
          onPress={() => logWater(water)}
        />
      )}
      <SaveFeedback action={action} />
    </ActionSheet>
  );
}
