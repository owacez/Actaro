import { beforeEach, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
import { PermissionStatus } from 'expo-modules-core';
import { Pedometer } from 'expo-sensors';
import { readTodaySteps } from '@/features/activity/pedometer-service';
jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getStepCountAsync: jest.fn(),
  },
}));
const pedometer = jest.mocked(Pedometer),
  permission = {
    granted: true,
    status: PermissionStatus.GRANTED,
    expires: 'never' as const,
    canAskAgain: true,
  };
beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  pedometer.isAvailableAsync.mockResolvedValue(true);
  pedometer.getPermissionsAsync.mockResolvedValue(permission);
  pedometer.getStepCountAsync.mockResolvedValue({ steps: 1234 });
});
test('iPhone reads one calendar day after permission and preserves a real zero', async () => {
  pedometer.getStepCountAsync.mockResolvedValue({ steps: 0 });
  const result = await readTodaySteps('UTC');
  expect(result.steps).toBe(0);
  const [start, end] = pedometer.getStepCountAsync.mock.calls[0];
  expect(start.toISOString()).toBe(result.day + 'T00:00:00.000Z');
  expect(+end).toBeGreaterThanOrEqual(+start);
  expect(pedometer.requestPermissionsAsync).not.toHaveBeenCalled();
});
test('denied, unavailable and Android sources fall back truthfully without reading fake totals', async () => {
  pedometer.getPermissionsAsync.mockResolvedValue({
    ...permission,
    granted: false,
    status: PermissionStatus.DENIED,
    canAskAgain: false,
  });
  await expect(readTodaySteps('UTC')).rejects.toThrow('not granted');
  expect(pedometer.getStepCountAsync).not.toHaveBeenCalled();
  pedometer.isAvailableAsync.mockResolvedValue(false);
  await expect(readTodaySteps('UTC')).rejects.toThrow('unavailable');
  Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
  await expect(readTodaySteps('UTC')).rejects.toThrow('manually');
});
