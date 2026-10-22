import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { DatePicker } from '@/components/date-picker';
import { QuickLogSheet } from '@/components/quick-log-sheet';
import { AuthInput } from '@/features/auth/auth-components';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
import { displayDate } from '@/lib/format';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (target: unknown) => mockPush(target) } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => '10000000-0000-4000-8000-000000000001' }));
jest.mock('@/features/nutrition/nutrition-service', () => ({
  nutritionService: { context: jest.fn(), water: jest.fn() },
}));
const service = jest.mocked(nutritionService);
beforeEach(() => {
  jest.clearAllMocks();
  service.context.mockResolvedValue(nutritionContext());
});

test('calendar handles leap days and prevents selecting dates beyond the permitted day', async () => {
  const changed = jest.fn();
  await render(<DatePicker value="2024-02-28" max="2024-02-29" onChange={changed} />, {
    wrapper: FeedbackTestRoot,
  });
  await fireEvent.press(
    screen.getByRole('button', { name: 'Choose date: ' + displayDate('2024-02-28') }),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Next month' }));
  expect(screen.getByRole('button', { name: '2024-03-01' })).toBeDisabled();
  await fireEvent.press(screen.getByRole('button', { name: 'Previous month' }));
  await fireEvent.press(screen.getByRole('button', { name: '2024-02-29' }));
  expect(changed).toHaveBeenCalledWith('2024-02-29');
});

test('quick log opens the real food flow without writing data', async () => {
  const close = jest.fn();
  await render(<QuickLogSheet userId="owner" visible onClose={close} />, {
    wrapper: FeedbackTestRoot,
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Food' }));
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/nutrition/manage',
    params: { view: 'search' },
  });
  expect(close).toHaveBeenCalledTimes(1);
  expect(service.water).not.toHaveBeenCalled();
});

test('quick water keeps its original date and ID after an unconfirmed save and blocks dismissal until retry', async () => {
  const close = jest.fn();
  service.water.mockRejectedValueOnce(new Error('response lost')).mockResolvedValueOnce(undefined);
  await render(<QuickLogSheet userId="owner" visible onClose={close} />, {
    wrapper: FeedbackTestRoot,
  });
  await fireEvent.press(screen.getByRole('button', { name: '+250 ml' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  await fireEvent.press(screen.getByRole('button', { name: 'Dismiss Quick log' }));
  expect(close).not.toHaveBeenCalled();
  service.context.mockResolvedValue({ ...nutritionContext(), today: '2026-10-14' });
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  expect(service.context).toHaveBeenCalledTimes(1);
  expect(service.water.mock.calls[1]).toEqual(service.water.mock.calls[0]);
  expect(service.water.mock.calls[0]).toEqual([
    'owner',
    '10000000-0000-4000-8000-000000000001',
    '2026-10-13',
    'UTC',
    250,
  ]);
});

test('password visibility changes presentation without changing the entered value', async () => {
  await render(<AuthInput label="Password" value="sample-password" secureTextEntry />, {
    wrapper: FeedbackTestRoot,
  });
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', true);
  await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password')).toHaveProp('secureTextEntry', false);
  expect(screen.getByLabelText('Password')).toHaveProp('value', 'sample-password');
});
