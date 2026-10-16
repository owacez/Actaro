import type { ErrorBoundaryProps } from 'expo-router';
import { AuthButton, AuthFrame, AuthNotice, AuthText } from '@/features/auth/auth-components';

export function ScreenErrorBoundary({ retry }: Pick<ErrorBoundaryProps, 'retry'>) {
  return (
    <AuthFrame>
      <AuthText kind="heading">Unable to display this screen</AuthText>
      <AuthNotice error>
        Try opening the screen again. If a save was interrupted, check your recorded history before
        repeating it.
      </AuthNotice>
      <AuthButton title="Try opening again" onPress={() => void retry()} />
    </AuthFrame>
  );
}
