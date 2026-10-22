import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { BodyFormEditor, BodyDetailsEditor } from '@/features/body/body-form';
import { bodyService } from '@/features/body/body-service';
import { FeedbackTestRoot } from './helpers/feedback-root';
import { nutritionContext } from './helpers/nutrition-fixture';
import { displayDate } from '@/lib/format';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/body/body-service', () => ({
  bodyService: { form: jest.fn(), saveForm: jest.fn(), save: jest.fn() },
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
  previous: null,
  waist: null,
};
const service = jest.mocked(bodyService);
beforeEach(() => {
  jest.clearAllMocks();
  service.form.mockResolvedValue(loaded);
  service.saveForm.mockResolvedValue(undefined);
  service.save.mockResolvedValue(undefined);
});
test('personal details save separately and retain the same request after failure', async () => {
  service.saveForm.mockRejectedValueOnce(new Error('offline'));
  const saved = jest.fn();
  await render(
    <FeedbackTestRoot>
      <BodyDetailsEditor userId={owner} onSaved={saved} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Height (cm, optional)');
  expect(screen.queryByLabelText('Weight (kg)')).toBeNull();
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
  await fireEvent.press(screen.getByRole('button', { name: 'Save personal details' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(saved).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Height (cm, optional)').props.value).toBe('180');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(saved).toHaveBeenCalledTimes(1));
  expect(service.saveForm.mock.calls[1]).toEqual(service.saveForm.mock.calls[0]);
  expect(service.saveForm).toHaveBeenCalledWith(
    owner,
    {
      date: '2026-10-18',
      weight: '',
      height: '180',
      sex: 'female',
      birthDate: '1995-01-15',
      location: 'Example City',
      notes: '',
    },
    loaded.preferences,
  );
});
test('one body record shows weight, waist and details together with the change since the last weigh-in', async () => {
  service.form.mockResolvedValue({
    ...loaded,
    previous: {
      user_id: owner,
      local_date: '2026-10-15',
      weight_kg: 80,
      time_zone: 'UTC',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  });
  await render(
    <FeedbackTestRoot>
      <BodyFormEditor userId={owner} onSaved={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Weight (kg)');
  // Details and waist sit in the same record; nothing is behind another button.
  expect(screen.getByLabelText('Waist (cm, optional)')).toBeTruthy();
  expect(screen.getByLabelText('Location (city/country, optional)')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Female' })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Weight (kg)'), '79.6');
  expect(screen.getByText(`−0.4 kg since ${displayDate('2026-10-15')}`)).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Body log date: ' + displayDate('2026-10-18') }),
  );
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
  await waitFor(() => expect(screen.getByLabelText('Weight (kg)').props.value).toBe('79'));
  expect(screen.getByText('Your first weigh-in starts your trend.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Add a note' }));
  await fireEvent.changeText(
    screen.getByLabelText('Body record note (optional)'),
    'Before breakfast',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save body record' }));
  await waitFor(() =>
    expect(service.saveForm).toHaveBeenCalledWith(
      owner,
      {
        date: '2026-10-17',
        weight: '79',
        height: '',
        sex: '',
        birthDate: '',
        location: '',
        notes: 'Before breakfast',
      },
      loaded.preferences,
    ),
  );
  expect(service.save).not.toHaveBeenCalled();
  expect(service.form).toHaveBeenCalledWith(owner, '2026-10-17');
});
test('weight, changed details and waist save in one tap; unchanged height is not re-logged', async () => {
  service.form.mockResolvedValue({
    ...loaded,
    height: {
      user_id: owner,
      measurement: 'height',
      local_date: '2026-10-01',
      value_cm: 180,
      time_zone: 'UTC',
      notes: null,
      created_at: '',
      updated_at: '',
    },
  });
  service.saveForm.mockRejectedValueOnce(new Error('offline'));
  await render(
    <FeedbackTestRoot>
      <BodyFormEditor userId={owner} onSaved={jest.fn()} />
    </FeedbackTestRoot>,
  );
  await screen.findByLabelText('Weight (kg)');
  // Nothing entered or changed: nothing is written.
  await fireEvent.press(screen.getByRole('button', { name: 'Save body record' }));
  expect(screen.getByText(/Enter your weight, a measurement or a changed detail/)).toBeTruthy();
  expect(service.saveForm).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Weight (kg)'), '80');
  await fireEvent.changeText(screen.getByLabelText('Waist (cm, optional)'), '86');
  await fireEvent.changeText(
    screen.getByLabelText('Location (city/country, optional)'),
    'Example City',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Save body record' }));
  await screen.findByRole('button', { name: 'Retry saved request' });
  expect(screen.getByLabelText('Weight (kg)').props.value).toBe('80');
  await fireEvent.press(screen.getByRole('button', { name: 'Retry saved request' }));
  await waitFor(() => expect(service.save).toHaveBeenCalled());
  expect(service.saveForm).toHaveBeenLastCalledWith(
    owner,
    expect.objectContaining({ height: '', weight: '80', location: 'Example City' }),
    loaded.preferences,
  );
  expect(service.save).toHaveBeenCalledWith(
    owner,
    'measurement',
    '2026-10-18',
    '86',
    'cm',
    'UTC',
    'waist',
    '',
  );
});
