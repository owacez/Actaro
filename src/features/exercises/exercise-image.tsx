import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';

export function ExerciseImage({
  url,
  label,
  large = false,
}: {
  url: string | null;
  label: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const { colors } = useAppTheme();
  const size = large ? 200 : 58;
  return (
    <View
      style={{
        width: large ? '100%' : size,
        height: size,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {url && !failed ? (
        <Image
          source={url}
          accessibilityLabel={label}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={url}
          style={{ width: '100%', height: '100%' }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: large ? 12 : 9,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          {large ? 'Image unavailable. Refresh to retry.' : 'No image'}
        </Text>
      )}
    </View>
  );
}
