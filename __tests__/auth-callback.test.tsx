import { beforeEach, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';

import { AuthCallbackScreen } from '@/features/auth/auth-callback-screen';
import { exchangeAuthCode } from '@/features/auth/auth-service';

let mockParams: { code?: string | string[]; sb_flow_id?: string | string[]; error?: string } = {};
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  router: { replace: (path: string) => mockReplace(path) },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/auth/auth-service', () => ({ exchangeAuthCode: jest.fn() }));
const exchange = jest.mocked(exchangeAuthCode);
beforeEach(() => {
  exchange.mockReset();
  mockParams = {};
});

test('rejects a missing or ambiguous code without any session exchange', async () => {
  mockParams = { code: ['one', 'two'] };
  await render(<AuthCallbackScreen />);
  expect(screen.getByText('Unable to open this link')).toBeTruthy();
  expect(exchange).not.toHaveBeenCalled();
});
test('exchanges the native flow id and replaces the URL after success', async () => {
  mockParams = { code: 'test-code', sb_flow_id: 'native-test-flow-id' };
  exchange.mockResolvedValue(undefined);
  await render(<AuthCallbackScreen />);
  expect(exchange).toHaveBeenCalledWith('test-code', 'native-test-flow-id');
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
});
test('expired links never navigate or expose the provider response', async () => {
  mockParams = { code: 'expired-code' };
  exchange.mockRejectedValue(new Error('private provider response'));
  await render(<AuthCallbackScreen />);
  expect(await screen.findByText('Unable to open this link')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
  expect(screen.queryByText('private provider response')).toBeNull();
});
