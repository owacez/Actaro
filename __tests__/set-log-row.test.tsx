import { expect, jest, test } from '@jest/globals';
import { useState } from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SetLogRow } from '@/features/workouts/set-log-row';
import { FeedbackTestRoot } from './helpers/feedback-root';

test('inline actual values are editable without opening options; completion and undo are separate', async () => {
  const log = jest.fn(),
    undo = jest.fn(),
    select = jest.fn();
  function Fixture() {
    const [complete, setComplete] = useState(false);
    const [values, setValues] = useState({ weight: '20', reps: '8' });
    return (
      <SetLogRow
        number={1}
        {...values}
        unit="lb"
        previous="8 x 18 lb"
        completed={complete}
        selected
        onSelect={select}
        onChange={(field, value) => setValues((old) => ({ ...old, [field]: value }))}
        onLog={() => {
          log();
          setComplete(true);
        }}
        onUndo={() => {
          undo();
          setComplete(false);
        }}
      >
        <Text>Optional RPE and notes</Text>
      </SetLogRow>
    );
  }
  await render(
    <FeedbackTestRoot>
      <Fixture />
    </FeedbackTestRoot>,
  );
  expect(screen.queryByText('Optional RPE and notes')).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Weight (lb) · set 1'), '22.5');
  await fireEvent.changeText(screen.getByLabelText('Reps · set 1'), '10');
  expect(screen.getByLabelText('Weight (lb) · set 1').props.value).toBe('22.5');
  expect(screen.getByLabelText('Reps · set 1').props.value).toBe('10');
  await fireEvent.press(screen.getByRole('button', { name: 'Complete set 1' }));
  expect(log).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole('button', { name: 'Unmark set 1' }));
  expect(undo).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText('Reps · set 1').props.value).toBe('10');
  await fireEvent.press(screen.getByRole('button', { name: 'Edit set 1' }));
  expect(screen.getByText('Optional RPE and notes')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close editor for set 1' }));
  expect(screen.queryByText('Optional RPE and notes')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Select set 1, not logged' }));
  expect(select).toHaveBeenCalled();
});
