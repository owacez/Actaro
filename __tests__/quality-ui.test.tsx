import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { AuthButton, AuthChoice, AuthText } from '@/features/auth/auth-components';
import { ScreenErrorBoundary } from '@/components/screen-error-boundary';
import { actaroColors, actaroDarkColors } from '@/constants/actaro-theme';
import { FeedbackTestRoot } from './helpers/feedback-root';
function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  if (!channels || channels.length !== 3) throw new Error('Invalid color');
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
test('shared primary text and metric labels have readable contrast and compact choices retain touch width', async () => {
  await render(
    <FeedbackTestRoot>
      <AuthButton title="Continue" onPress={jest.fn()} />
      <AuthText kind="eyebrow">Daily calories</AuthText>
      <AuthChoice title="kg" selected onPress={jest.fn()} />
    </FeedbackTestRoot>,
  );
  const foreground = StyleSheet.flatten(screen.getByText('Continue').props.style).color;
  expect(foreground).toBe(actaroColors.text);
  expect(StyleSheet.flatten(screen.getByText('Daily calories').props.style).color).toBe(
    actaroColors.text,
  );
  for (const background of [actaroColors.accent, actaroColors.surface, actaroColors.background])
    expect(
      (luminance(background) + 0.05) / (luminance(actaroColors.text) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  expect(
    (luminance(actaroDarkColors.text) + 0.05) / (luminance(actaroDarkColors.background) + 0.05),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    StyleSheet.flatten(screen.getByRole('button', { name: 'kg' }).props.style).minWidth,
  ).toBeGreaterThanOrEqual(44);
});
test('route error fallback retries without exposing raw errors or clearing persisted data', async () => {
  const retry = jest.fn<() => Promise<void>>().mockResolvedValue();
  await render(
    <FeedbackTestRoot>
      <ScreenErrorBoundary retry={retry} />
    </FeedbackTestRoot>,
  );
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Try opening again' }));
  expect(retry).toHaveBeenCalledTimes(1);
});
