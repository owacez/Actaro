import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BodyFormEditor } from '@/features/body/body-form';
import { bodyService } from '@/features/body/body-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/body/body-service', () => ({
  bodyService: { form: jest.fn(), saveForm: jest.fn() },
}));
const owner = nutritionContext().preferences.user_id;
const loaded: Awaited<ReturnType<typeof bodyService.form>> = {
  profile: {
    id: owner,
    display_name: null,
    sex: null,
    date_of_birth: null,
    location: null,
    created_at: '',
    updated_at: '',
  },
  preferences: nutritionContext().preferences,
  today: '2026-10-18',
  day: '2026-10-18',
  weight: null,
  height: null,
};
const service = jest.mocked(bodyService);
beforeEach(() => {
  jest.clearAllMocks();
  service.form.mockResolvedValue(loaded);
  service.saveForm.mockResolvedValue(undefined);
});
test('unified body form saves all fields atomically and retains the same request after failure', async () => {
  service.saveForm.mockRejectedValueOnce(new Error('offline'));
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BodyFormEditor userId={owner} onSaved={saved} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Weight (kg, optional)');
  await fireEvent.changeText(screen.getByLabelText('Weight (kg, optional)'), '80');
  await fireEvent.changeText(screen.getByLabelText('Height (cm, optional)'), '180');
  await fireEvent.press(screen.getByRole('button', { name: 'Female' }));
  await fireEvent.changeText(
    screen.getByLabelText('Location (city/country, optional)'),
    'Example City',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Date of birth (optional): Not set' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Choose birth year' }));
  await fireEvent.press(screen.getByRole('button', { name: '1995' }));
  await fireEvent.press(screen.getByRole('button', { name: '1995-01-15' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Save body details' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(saved).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Weight (kg, optional)').props.value).toBe('80');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  expect(service.saveForm.mock.calls[1]).toEqual(service.saveForm.mock.calls[0]);
  expect(service.saveForm).toHaveBeenCalledWith(
    owner,
    {
      date: '2026-10-18',
      weight: '80',
      height: '180',
      sex: 'female',
      birthDate: '1995-01-15',
      location: 'Example City',
      notes: '',
    },
    loaded.preferences,
  );
});
test('changing the log date loads that date’s values and retains unsaved personal details', async () => {
  await render(
    <FeedbackTestRoot>
      <BodyFormEditor userId={owner} onSaved={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Location (city/country, optional)');
  await fireEvent.changeText(screen.getByLabelText('Location (city/country, optional)'), 'My city');
  await fireEvent.press(screen.getByRole('button', { name: 'Body log date: 2026-10-18' }));
  service.form.mockResolvedValue({
    ...loaded,
    day: '2026-10-17',
    weight: {
      user_id: owner,
      local_date: '2026-10-17',
      weight_kg: 79,
      time_zone: 'UTC',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  });
  await fireEvent.press(screen.getByRole('button', { name: '2026-10-17' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Weight (kg, optional)').props.value).toBe('79'),
  );
  expect(screen.getByLabelText('Location (city/country, optional)').props.value).toBe('My city');
  expect(service.form).toHaveBeenCalledWith(owner, '2026-10-17');
});
