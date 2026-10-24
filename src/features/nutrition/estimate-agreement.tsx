import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ActionSheet, ProductIcon } from '@/components/product-ui';
import { AuthButton, AuthLink, AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import { targetMethodUrl } from './target-estimate';

export const agreementLabel = 'I agree the 2023 adult energy estimate applies to me.';

// The adult-estimate agreement: a checkbox, one line of text and an inline Learn more link.
// Who the estimate is for, and how it works, lives in the Learn more sheet.
export function EstimateAgreement({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme(),
    [learning, setLearning] = useState(false);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={agreementLabel}
        accessibilityState={{ checked, disabled }}
        disabled={disabled}
        onPress={() => onChange(!checked)}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 24,
          height: 24,
          marginTop: 1,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: colors.text,
          backgroundColor: checked ? colors.text : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled || pressed ? 0.6 : 1,
        })}
      >
        {checked && (
          <ProductIcon
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={16}
            color={colors.background}
          />
        )}
      </Pressable>
      <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: colors.text }}>
        <Text onPress={disabled ? undefined : () => onChange(!checked)}>
          I agree the 2023 adult energy estimate applies to me.{' '}
        </Text>
        <Text
          accessibilityRole="link"
          onPress={() => setLearning(true)}
          style={{ fontFamily: 'Inter_600SemiBold', textDecorationLine: 'underline' }}
        >
          Learn more
        </Text>
      </Text>
      <ActionSheet
        title="About this estimate"
        visible={learning}
        onClose={() => setLearning(false)}
      >
        <AuthText>
          Maintenance energy uses the 2023 Dietary Reference Intake (DRI) equations published by
          Health Canada, from your age, height, weight and usual activity.
        </AuthText>
        <AuthText>
          They are for adults aged 19 or older who are not pregnant or breastfeeding. If that is not
          you, or you follow medical advice, enter your targets manually instead.
        </AuthText>
        <AuthText>
          A goal adds a shown, editable deficit or surplus. It is a starting point, not a
          prescription, and promises no rate of change.
        </AuthText>
        <AuthLink
          title="Read the published equations"
          onPress={() => void Linking.openURL(targetMethodUrl)}
        />
        <AuthButton title="Close" outlined onPress={() => setLearning(false)} />
      </ActionSheet>
    </View>
  );
}
