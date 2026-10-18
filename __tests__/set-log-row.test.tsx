import { afterEach, expect, jest, test } from '@jest/globals';
import { useState } from 'react';
import { PanResponder, Text, type PanResponderCallbacks } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SetLogRow } from '@/features/workouts/set-log-row';
import { FeedbackTestRoot } from './helpers/feedback-root';
afterEach(() => {
  jest.restoreAllMocks();
});

test('horizontal swipe logs/undoes while vertical scroll and short gestures do not; manual editing stays available', async () => {
  let handlers: PanResponderCallbacks = {};
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    handlers = config;
    return { panHandlers: {} };
  });
  const log = jest.fn(),
    undo = jest.fn();
  function Fixture() {
    const [complete, setComplete] = useState(false);
    return (
      <SetLogRow
        number={1}
        reps="8"
        weight="20"
        unit="kg"
        previous="8 x 18 kg"
        completed={complete}
        onLog={() => {
          log();
          setComplete(true);
        }}
        onUndo={() => {
          undo();
          setComplete(false);
        }}
      >
        <Text>Manual controls</Text>
      </SetLogRow>
    );
  }
  await render(
    <FeedbackTestRoot>
      <Fixture />
    </FeedbackTestRoot>,
  );
  if (!handlers.onMoveShouldSetPanResponder) throw Error('Gesture handler missing');
  expect(Reflect.apply(handlers.onMoveShouldSetPanResponder, null, [{}, { dx: 20, dy: 80 }])).toBe(
    false,
  );
  const release = async (dx: number) => {
    const handler = handlers.onPanResponderRelease;
    if (!handler) throw Error('Release handler missing');
    await act(() => {
      Reflect.apply(handler, null, [{}, { dx, dy: 0 }]);
    });
  };
  await release(30);
  expect(log).not.toHaveBeenCalled();
  await release(90);
  expect(log).toHaveBeenCalledTimes(1);
  await release(90);
  expect(log).toHaveBeenCalledTimes(1);
  await release(-90);
  expect(undo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Manual controls')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit set 1' }));
  expect(screen.getByText('Manual controls')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Complete set 1' }));
  expect(log).toHaveBeenCalledTimes(2);
  expect(PanResponder.create).toHaveBeenCalledTimes(1);
}, 15000);
