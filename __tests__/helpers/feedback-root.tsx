import type { PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthFeedbackProvider } from '@/features/auth/auth-feedback';

export function FeedbackTestRoot({ children }: PropsWithChildren) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 20, bottom: 20, left: 0, right: 0 },
      }}
    >
      <AuthFeedbackProvider>{children}</AuthFeedbackProvider>
    </SafeAreaProvider>
  );
}
