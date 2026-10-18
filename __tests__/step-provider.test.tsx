import { afterEach, beforeEach, expect, jest, test } from '@jest/globals';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { AppState, Platform, Text, type AppStateStatus } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { StepProvider, useDeviceSteps } from '@/features/activity/step-provider';
import { activityService } from '@/features/activity/activity-service';
import { readTodaySteps } from '@/features/activity/pedometer-service';
import { nutritionContext } from './helpers/nutrition-fixture';
import { PermissionStatus } from 'expo-modules-core';
jest.mock('expo-sensors', () => ({
  Pedometer: { getPermissionsAsync: jest.fn(), watchStepCount: jest.fn() },
}));
jest.mock('@/features/activity/activity-service', () => ({
  activityService: { load: jest.fn(), save: jest.fn() },
}));
jest.mock('@/features/activity/pedometer-service', () => ({ readTodaySteps: jest.fn() }));
const sensor = jest.mocked(Pedometer),
  service = jest.mocked(activityService),
  read = jest.mocked(readTodaySteps);
const remove = jest.fn();
let appState: (state: AppStateStatus) => void,
  motion: Parameters<typeof Pedometer.watchStepCount>[0];
function Probe() {
  const device = useDeviceSteps();
  return (
    <>
      <Text>{device?.reading ? String(device.reading.steps) : 'Unknown'}</Text>
      {device?.error && <Text>{device.error}</Text>}
    </>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-18T10:00:00Z'));
  jest.replaceProperty(Platform, 'OS', 'ios');
  AppState.currentState = 'active';
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    appState = callback;
    return { remove };
  });
  sensor.watchStepCount.mockImplementation((callback) => {
    motion = callback;
    return { remove };
  });
  sensor.getPermissionsAsync.mockResolvedValue({
    granted: true,
    canAskAgain: true,
    expires: 'never',
    status: PermissionStatus.GRANTED,
  });
  service.load.mockResolvedValue({
    preferences: nutritionContext().preferences,
    today: '2026-10-18',
    day: '2026-10-18',
    current: null,
    history: [],
    target: null,
  });
  service.save.mockResolvedValue(undefined);
  read.mockResolvedValue({ day: '2026-10-18', steps: 1200 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('starts automatically, shares live totals, throttles cloud writes and catches up on resume', async () => {
  const { unmount } = await render(
    <StepProvider userId="owner">
      <Probe />
    </StepProvider>,
  );
  await screen.findByText('1200');
  await waitFor(() => expect(sensor.watchStepCount).toHaveBeenCalledTimes(1));
  expect(service.save).toHaveBeenCalledWith(
    'owner',
    '2026-10-18',
    '1200',
    '',
    'km',
    'UTC',
    'ios_pedometer',
  );
  read.mockResolvedValue({ day: '2026-10-18', steps: 1210 });
  await act(async () => {
    jest.advanceTimersByTime(5001);
    motion({ steps: 10 });
  });
  await screen.findByText('1210');
  expect(service.save).toHaveBeenCalledTimes(1);
  await act(() => {
    AppState.currentState = 'background';
    appState('background');
  });
  await waitFor(() => expect(service.save).toHaveBeenCalledTimes(2));
  read.mockResolvedValue({ day: '2026-10-18', steps: 1300 });
  await act(() => {
    AppState.currentState = 'active';
    appState('active');
  });
  await screen.findByText('1300');
  await unmount();
  expect(remove).toHaveBeenCalled();
});

test('an account unmount during a sensor read cannot write or publish the old account result', async () => {
  let finish: ((value: { day: string; steps: number }) => void) | undefined;
  read.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const { unmount } = await render(
    <StepProvider userId="owner">
      <Probe />
    </StepProvider>,
  );
  await waitFor(() => expect(read).toHaveBeenCalled());
  await unmount();
  await act(() => finish?.({ day: '2026-10-18', steps: 3000 }));
  expect(service.save).not.toHaveBeenCalled();
  expect(sensor.watchStepCount).not.toHaveBeenCalled();
});

test('resuming during an older permission/read operation immediately queues a fresh count', async () => {
  let finish: ((value: { day: string; steps: number }) => void) | undefined;
  read
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValue({ day: '2026-10-18', steps: 1300 });
  await render(
    <StepProvider userId="owner">
      <Probe />
    </StepProvider>,
  );
  await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
  await act(() => {
    AppState.currentState = 'inactive';
    appState('inactive');
  });
  await act(() => {
    AppState.currentState = 'active';
    appState('active');
  });
  await waitFor(() => expect(service.load).toHaveBeenCalledTimes(2));
  await act(() => finish?.({ day: '2026-10-18', steps: 1200 }));
  await screen.findByText('1300');
  expect(service.save).toHaveBeenCalledTimes(1);
  expect(service.save.mock.calls[0][2]).toBe('1300');
});

test('live sensor updates do not hide an unacknowledged cloud save; the throttled retry clears it', async () => {
  service.save.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
  await render(
    <StepProvider userId="owner">
      <Probe />
    </StepProvider>,
  );
  await screen.findByText('Steps are live on this device. Cloud sync will retry automatically.');
  await waitFor(() => expect(sensor.watchStepCount).toHaveBeenCalled());
  read.mockResolvedValue({ day: '2026-10-18', steps: 1210 });
  await act(async () => {
    jest.advanceTimersByTime(5001);
    motion({ steps: 10 });
  });
  await screen.findByText('1210');
  expect(
    screen.getByText('Steps are live on this device. Cloud sync will retry automatically.'),
  ).toBeTruthy();
  expect(service.save).toHaveBeenCalledTimes(1);
  await act(async () => {
    jest.advanceTimersByTime(60000);
  });
  await waitFor(() => expect(service.save).toHaveBeenCalledTimes(2));
  expect(
    screen.queryByText('Steps are live on this device. Cloud sync will retry automatically.'),
  ).toBeNull();
});
