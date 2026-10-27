import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AccountDataScreen } from '@/features/profile/account-data-screen';
import { deleteOwnAccount, exportAccount } from '@/features/profile/account-data-service';
import { shareExport } from '@/features/profile/share-export';
import { sessionStore } from '@/features/workouts/session-store';
import { FeedbackTestRoot } from './helpers/feedback-root';
const mockSignOut = jest.fn<() => Promise<{ error: null }>>();
jest.mock('@/features/profile/account-data-service', () => ({
  deleteOwnAccount: jest.fn(),
  exportAccount: jest.fn(),
}));
jest.mock('@/features/profile/share-export', () => ({ shareExport: jest.fn() }));
jest.mock('@/features/workouts/session-store', () => ({ sessionStore: { discard: jest.fn() } }));
jest.mock('@/features/running/run-store', () => ({ runStore: { read: async () => null } }));
jest.mock('@/features/running/run-tracker', () => ({ runTracker: { discard: jest.fn() } }));
jest.mock('@/features/notifications/reminder-service', () => ({
  reminderService: { owner: () => undefined, setOwner: jest.fn() },
}));
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: () => ({ auth: { signOut: mockSignOut } }),
}));
beforeEach(() => {
  jest.resetAllMocks();
  mockSignOut.mockResolvedValue({ error: null });
});
async function open() {
  return render(<AccountDataScreen userId="owner" onBack={jest.fn()} />, {
    wrapper: FeedbackTestRoot,
  });
}
test('destructive confirmation is guarded; duplicate submission and failures cannot sign out or discard data', async () => {
  let reject: (failure: Error) => void = () => {};
  jest.mocked(deleteOwnAccount).mockImplementation(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
  const button = screen.getByRole('button', { name: 'Permanently delete my account' });
  expect(button).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText('Current password'), 'password');
  await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(deleteOwnAccount).toHaveBeenCalledTimes(1);
  await act(() => reject(new Error('Deletion was not confirmed.')));
  expect(screen.getByLabelText('Current password')).toHaveProp('value', '');
  expect(screen.getByText('Deletion was not confirmed.')).toBeTruthy();
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(sessionStore.discard).not.toHaveBeenCalled();
});
test('confirmed server deletion stays final if local cleanup fails', async () => {
  jest.mocked(deleteOwnAccount).mockResolvedValue();
  jest.mocked(sessionStore.discard).mockRejectedValue(new Error('device storage unavailable'));
  await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Delete account' }));
  await fireEvent.changeText(screen.getByLabelText('Current password'), 'password');
  await fireEvent.changeText(screen.getByLabelText('Type DELETE to confirm'), 'DELETE');
  await fireEvent.press(screen.getByRole('button', { name: 'Permanently delete my account' }));
  expect(mockSignOut).toHaveBeenCalled();
  expect(screen.queryByLabelText('Current password')).toBeNull();
  expect(
    screen.getByText('Account deleted. Local cleanup did not finish; restart the app.'),
  ).toBeTruthy();
});
test('an export finishing after account screen unmount cannot open a share sheet', async () => {
  let resolve: (value: Awaited<ReturnType<typeof exportAccount>>) => void = () => {};
  jest.mocked(exportAccount).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const view = await open();
  await fireEvent.press(screen.getByRole('button', { name: 'Export my data' }));
  await view.unmount();
  await act(() =>
    resolve({
      format: 'actaro-export',
      version: 1,
      startedAt: '',
      completedAt: '',
      note: '',
      account: { id: 'owner', email: undefined, createdAt: '' },
      records: {},
      activeWorkout: null,
      activeRun: null,
    }),
  );
  expect(shareExport).not.toHaveBeenCalled();
});
test('credits list every data source, including the link RepDB requires', async () => {
  await open();
  expect(screen.getByText('Credits & data sources')).toBeTruthy();
  for (const name of [
    'Exercise data by RepDB (repdb.co)',
    'USDA FoodData Central',
    '© OpenStreetMap contributors',
    'MuscleMap by Melih Colpan',
    'Health Canada Dietary Reference Intakes',
  ])
    expect(screen.getByRole('button', { name })).toBeTruthy();
});
