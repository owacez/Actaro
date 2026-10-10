import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { AuthConfirmationScreen } from '@/features/auth/auth-confirmation-screen';

const mockReplace = jest.fn();
let mockConfirmedAt: string | undefined;
let mockSignedIn = false;
jest.mock('expo-router', () => ({ router: { replace: (path: string) => mockReplace(path) } }));
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({
    session: mockSignedIn
      ? {
          user: {
            email_confirmed_at: mockConfirmedAt,
            user_metadata: { email_confirmed_at: 'forged-user-value' },
          },
        }
      : null,
  }),
}));
beforeEach(() => {
  mockConfirmedAt = undefined;
  mockSignedIn = false;
});

test('shows success for a Supabase-confirmed session and continues to the account', async () => {
  mockSignedIn = true;
  mockConfirmedAt = '2026-10-09T00:00:00Z';
  await render(<AuthConfirmationScreen />);
  expect(screen.getByText('Email confirmed')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Continue to account' }));
  expect(mockReplace).toHaveBeenCalledWith('/');
});

test('an absent session never claims successful verification', async () => {
  await render(<AuthConfirmationScreen />);
  expect(screen.queryByText('Email confirmed')).toBeNull();
  expect(screen.getByText('Confirmation incomplete')).toBeTruthy();
});

test('user-editable metadata cannot impersonate confirmed email', async () => {
  mockSignedIn = true;
  await render(<AuthConfirmationScreen />);
  expect(screen.queryByText('Email confirmed')).toBeNull();
  expect(screen.getByRole('button', { name: 'Return to sign in' })).toBeTruthy();
});
