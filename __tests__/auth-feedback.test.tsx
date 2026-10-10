import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Platform, Text } from 'react-native';

import { AuthButton } from '@/features/auth/auth-components';
import { useAuthFeedback } from '@/features/auth/auth-feedback';
import { FeedbackTestRoot } from './helpers/feedback-root';

function Sender() {
  const { notify } = useAuthFeedback();
  return (
    <>
      <AuthButton title="Success" onPress={() => notify('Signed in successfully.', 'success')} />
      <AuthButton
        title="Failure"
        onPress={() => notify('Email or password is incorrect.', 'error')}
      />
    </>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('success feedback survives the sign-in screen being replaced', async () => {
  const { rerender } = await render(<Sender />, { wrapper: FeedbackTestRoot });
  await fireEvent.press(screen.getByRole('button', { name: 'Success' }));
  await rerender(<Text>Account screen</Text>);
  expect(screen.getByText('Signed in successfully.')).toBeTruthy();
  await act(() => jest.advanceTimersByTime(8000));
  expect(screen.queryByText('Signed in successfully.')).toBeNull();
});

test('a new error cancels the prior notification timer and can be dismissed', async () => {
  await render(<Sender />, { wrapper: FeedbackTestRoot });
  await fireEvent.press(screen.getByRole('button', { name: 'Success' }));
  await act(() => jest.advanceTimersByTime(6000));
  await fireEvent.press(screen.getByRole('button', { name: 'Failure' }));
  await act(() => jest.advanceTimersByTime(2000));
  expect(screen.getByText('Email or password is incorrect.')).toBeTruthy();
  expect(screen.queryByText('Signed in successfully.')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss notification' }));
  expect(screen.queryByTestId('auth-feedback')).toBeNull();
});

test('web hover and keyboard focus keep the error visible until reading finishes', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  await render(<Sender />, { wrapper: FeedbackTestRoot });
  await fireEvent.press(screen.getByRole('button', { name: 'Failure' }));
  await fireEvent(screen.getByTestId('auth-feedback'), 'pointerEnter');
  await act(() => jest.advanceTimersByTime(15000));
  expect(screen.getByTestId('auth-feedback')).toBeTruthy();
  const dismiss = screen.getByRole('button', { name: 'Dismiss notification' });
  await fireEvent(dismiss, 'focus');
  await fireEvent(screen.getByTestId('auth-feedback'), 'pointerLeave');
  await act(() => jest.advanceTimersByTime(15000));
  expect(screen.getByTestId('auth-feedback')).toBeTruthy();
  await fireEvent(dismiss, 'blur');
  await act(() => jest.advanceTimersByTime(10000));
  expect(screen.queryByTestId('auth-feedback')).toBeNull();
});
