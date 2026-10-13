import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import IndexScreen from '@/app/index';
import MainTabs from '@/app/(tabs)/_layout';
import WorkoutsRoute from '@/app/workouts';
import BuilderRoute from '@/app/workouts/edit';
import { FeedbackTestRoot } from './helpers/feedback-root';

let mockSession: object | null = {};
let mockRecovery = false;
let mockParams: Record<string, string | string[]> = {};
const mockPush = jest.fn(),
  mockReplace = jest.fn();
const workoutId = '00000000-0000-4000-8000-000000000002';
const exerciseId = '00000000-0000-4000-8000-000000000003';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/workouts/workouts-screen', () => {
  const { Button } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    WorkoutsScreen: ({
      onCreate,
      onEdit,
    }: {
      onCreate: () => void;
      onEdit: (id: string) => void;
    }) => (
      <>
        <Button title="Create" onPress={onCreate} />
        <Button
          title="Choose existing"
          onPress={() => onEdit('00000000-0000-4000-8000-000000000002')}
        />
      </>
    ),
  };
});
jest.mock('@/features/workouts/builder-screen', () => {
  const { Button, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    BuilderScreen: ({
      id,
      exerciseId,
      onBack,
      onSaved,
    }: {
      id?: string;
      exerciseId?: string;
      onBack: () => void;
      onSaved: () => void;
    }) => (
      <>
        <Text>{`${id ?? 'new'} / ${exerciseId ?? 'none'}`}</Text>
        <Button title="Builder back" onPress={onBack} />
        <Button title="Saved" onPress={onSaved} />
      </>
    ),
  };
});
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ session: mockSession, recovery: mockRecovery }),
}));
jest.mock('@/features/auth/auth-screen', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    AuthScreen: ({ recovery }: { recovery?: boolean }) => (
      <Text>{recovery ? 'Recovery form' : 'Sign in form'}</Text>
    ),
  };
});
jest.mock('expo-router', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  Tabs.Screen = ({ name }: { name: string }) => <Text>{name}</Text>;
  return {
    Tabs,
    Redirect: ({ href }: { href: string }) => <Text>Redirect: {href}</Text>,
    useLocalSearchParams: () => mockParams,
    router: {
      push: (value: unknown) => mockPush(value),
      replace: (value: unknown) => mockReplace(value),
    },
  };
});
beforeEach(() => {
  mockSession = { user: { id: '00000000-0000-4000-8000-000000000001' } };
  mockRecovery = false;
  mockParams = {};
  mockPush.mockClear();
  mockReplace.mockClear();
});
test('workout chooser preserves selected exercise for new/existing destinations and replaces the chooser', async () => {
  mockParams = { exerciseId };
  await render(<WorkoutsRoute />);
  await fireEvent.press(screen.getByRole('button', { name: 'Create' }));
  expect(mockReplace).toHaveBeenLastCalledWith({
    pathname: '/workouts/edit',
    params: { exerciseId },
  });
  await fireEvent.press(screen.getByRole('button', { name: 'Choose existing' }));
  expect(mockReplace).toHaveBeenLastCalledWith({
    pathname: '/workouts/edit',
    params: { id: workoutId, exerciseId },
  });
  expect(mockPush).not.toHaveBeenCalled();
});
test('builder receives selection, returns to its chooser on discard and clears selection after save', async () => {
  mockParams = { id: workoutId, exerciseId };
  await render(<BuilderRoute />);
  expect(screen.getByText(`${workoutId} / ${exerciseId}`)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Builder back' }));
  expect(mockReplace).toHaveBeenLastCalledWith({ pathname: '/workouts', params: { exerciseId } });
  await fireEvent.press(screen.getByRole('button', { name: 'Saved' }));
  expect(mockReplace).toHaveBeenLastCalledWith('/workouts');
});
test('malformed or repeated selection parameters cannot open the chooser or builder', async () => {
  for (const exerciseId of ['bad', ['00000000-0000-4000-8000-000000000003']]) {
    mockParams = { exerciseId };
    const result = await render(
      <FeedbackTestRoot>
        <WorkoutsRoute />
      </FeedbackTestRoot>,
    );
    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
    await result.rerender(
      <FeedbackTestRoot>
        <BuilderRoute />
      </FeedbackTestRoot>,
    );
    expect(screen.queryByRole('button', { name: 'Saved' })).toBeNull();
    await result.unmount();
  }
});
test('signed-out and recovery sessions cannot enter workout selection or editing', async () => {
  mockSession = null;
  const result = await render(<WorkoutsRoute />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
  mockSession = { user: { id: '00000000-0000-4000-8000-000000000001' } };
  mockRecovery = true;
  await result.rerender(<BuilderRoute />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
});

test('normal sign-in lands on Today and exposes all five module routes', async () => {
  const result = await render(<IndexScreen />);
  expect(screen.getByText('Redirect: /today')).toBeTruthy();
  await result.rerender(<MainTabs />);
  for (const route of ['today', 'fitness', 'nutrition', 'progress', 'more'])
    expect(screen.getByText(route)).toBeTruthy();
});
test('signed-out access to tabs returns to sign-in', async () => {
  mockSession = null;
  const result = await render(<MainTabs />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
  await result.rerender(<IndexScreen />);
  expect(screen.getByText('Sign in form')).toBeTruthy();
});
test('recovery sessions cannot enter tabs or skip their password form', async () => {
  mockRecovery = true;
  const result = await render(<MainTabs />);
  expect(screen.getByText('Redirect: /')).toBeTruthy();
  await result.rerender(<IndexScreen />);
  expect(screen.getByText('Recovery form')).toBeTruthy();
});
