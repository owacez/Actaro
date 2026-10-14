import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { HabitEditor, HabitLogScreen } from '@/features/habits/habit-screens';
import { habitService } from '@/features/habits/habit-service';
import { profileService } from '@/features/profile/profile-service';
import type { HabitRecord } from '@/features/habits/habit-model';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('expo-crypto', () => ({ randomUUID: () => '05000000-0000-4000-8000-000000000003' }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { getPreferences: jest.fn() },
}));
jest.mock('@/features/habits/habit-service', () => ({
  habitService: { load: jest.fn(), save: jest.fn(), log: jest.fn(), removeLog: jest.fn() },
}));
const service = jest.mocked(habitService),
  owner = nutritionContext().preferences.user_id;
const record: HabitRecord = {
  id: '05000000-0000-4000-8000-000000000003',
  user_id: owner,
  name: 'Avoidance habit',
  kind: 'avoidance',
  unit: 'times',
  start_date: '2026-10-01',
  time_zone: 'UTC',
  archived: false,
  created_at: '2026-10-01',
  updated_at: '2026-10-01',
  habit_logs: [],
  habit_versions: [
    {
      id: '05000000-0000-4000-8000-000000000004',
      habit_id: '05000000-0000-4000-8000-000000000003',
      user_id: owner,
      effective_from: '2026-10-01',
      target: 0,
      weekdays: [1, 2, 3, 4, 5, 6, 7],
      end_date: null,
      motivation: 'none',
      reminder_time: null,
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(profileService.getPreferences).mockResolvedValue(nutritionContext().preferences);
  service.load.mockResolvedValue({ record, today: '2026-10-14', until: '2026-10-14' });
  service.save.mockResolvedValue(undefined);
  service.log.mockResolvedValue(undefined);
});
test('creation requires a name and persists the chosen type/schedule/reminder/motivation', async () => {
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <HabitEditor userId={owner} onBack={jest.fn()} onSaved={saved} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Habit name');
  await fireEvent.press(screen.getByRole('button', { name: 'Save habit' }));
  expect(service.save).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Habit name'), 'Read');
  await fireEvent.press(screen.getByRole('button', { name: 'duration' }));
  await fireEvent.changeText(screen.getByLabelText('Daily target (minutes)'), '20');
  await fireEvent.changeText(screen.getByLabelText('In-app reminder (optional HH:MM)'), '18:30');
  await fireEvent.press(screen.getByRole('button', { name: 'None' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save habit' }));
  await waitFor(() => expect(saved).toHaveBeenCalled());
  expect(service.save).toHaveBeenCalledWith(
    owner,
    expect.any(String),
    expect.objectContaining({
      kind: 'duration',
      target: '20',
      motivation: 'none',
      reminder: '18:30',
    }),
  );
});
test('unlogged avoidance stays blank; explicit zero logs with a stable failed-save retry', async () => {
  service.log.mockRejectedValueOnce(new Error('network'));
  const back = jest.fn();
  await render(
    <FeedbackTestRoot>
      <HabitLogScreen userId={owner} habitId={record.id} onBack={back} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Logged value (times)');
  expect(screen.getByLabelText('Logged value (times)').props.value).toBe('');
  await fireEvent.press(screen.getByRole('button', { name: 'Save habit log' }));
  expect(service.log).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Logged value (times)'), '0');
  await fireEvent.press(screen.getByRole('button', { name: 'Save habit log' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Logged value (times)').props.editable).toBe(false);
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(back).toHaveBeenCalled());
  expect(service.log.mock.calls[1]).toEqual(service.log.mock.calls[0]);
  expect(service.log).toHaveBeenCalledWith(owner, record.id, '2026-10-14', 0, '');
});
