import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppTheme } from '@/features/profile/theme-context';

export function ExerciseImage({
  url,
  label,
  large = false,
  size: requestedSize,
  onRetry,
}: {
  url: string | null;
  label: string;
  large?: boolean;
  size?: number;
  onRetry?: () => void;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const { colors } = useAppTheme();
  const size = requestedSize ?? (large ? 200 : 58);
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
      {url && failed !== url ? (
        <Image
          source={url}
          accessibilityLabel={label}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey={url}
          style={{ width: '100%', height: '100%' }}
          onError={() => setFailed(url)}
        />
      ) : onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Retry image for ${label}`}
          onPress={() => {
            setFailed(null);
            onRetry();
          }}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: large ? 12 : 9, textAlign: 'center' }}>
            {large ? 'Image unavailable. Tap to retry.' : 'Retry image'}
          </Text>
        </Pressable>
      ) : (
        <Text
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: large ? 12 : 9,
            color: colors.muted,
            textAlign: 'center',
          }}
        >
          {large ? 'Image unavailable.' : 'No image'}
        </Text>
      )}
    </View>
  );
}
