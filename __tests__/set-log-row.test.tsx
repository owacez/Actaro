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
  await release(-130);
  expect(log).toHaveBeenCalledTimes(1);
  await release(-130);
  expect(log).toHaveBeenCalledTimes(1);
  await release(130);
  expect(undo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Manual controls')).toBeNull();
  await fireEvent.press(screen.getByText('8 reps · 20 kg'));
  expect(screen.getByText('Manual controls')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Close editor for set 1' }));
  expect(screen.queryByText('Manual controls')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Edit set 1' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Complete set 1' }));
  expect(log).toHaveBeenCalledTimes(2);
  expect(PanResponder.create).toHaveBeenCalledTimes(1);
}, 15000);

test('right swipe on the next ready card can undo the previous logged set', async () => {
  let handlers: PanResponderCallbacks = {};
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    handlers = config;
    return { panHandlers: {} };
  });
  const undo = jest.fn();
  await render(
    <FeedbackTestRoot>
      <SetLogRow
        number={2}
        reps="8"
        weight="20"
        unit="kg"
        previous=""
        completed={false}
        undoAvailable
        onLog={() => {}}
        onUndo={undo}
      />
    </FeedbackTestRoot>,
  );
  const release = handlers.onPanResponderRelease;
  if (!release) throw Error('Release handler missing');
  await act(() => {
    Reflect.apply(release, null, [{}, { dx: 130, dy: 0 }]);
  });
  expect(undo).toHaveBeenCalledTimes(1);
});

test('horizontal intent locks through vertical drift and a small release drift, but pulling back cancels', async () => {
  let handlers: PanResponderCallbacks = {};
  jest.spyOn(PanResponder, 'create').mockImplementation((config) => {
    handlers = config;
    return { panHandlers: {} };
  });
  const log = jest.fn();
  await render(
    <FeedbackTestRoot>
      <SetLogRow
        number={1}
        reps="8"
        weight="20"
        unit="kg"
        previous=""
        completed={false}
        onLog={log}
        onUndo={() => {}}
      />
    </FeedbackTestRoot>,
  );
  const invoke = async (name: keyof PanResponderCallbacks, gesture: { dx: number; dy: number }) => {
    const callback = handlers[name];
    if (!callback) throw Error('Gesture callback missing: ' + name);
    let result: unknown;
    await act(() => {
      result = Reflect.apply(callback, null, [{}, gesture]);
    });
    return result;
  };
  expect(await invoke('onMoveShouldSetPanResponderCapture', { dx: 35, dy: 28 })).toBe(true);
  expect(await invoke('onMoveShouldSetPanResponderCapture', { dx: 20, dy: 80 })).toBe(false);
  await invoke('onPanResponderGrant', { dx: 0, dy: 0 });
  expect(await invoke('onPanResponderTerminationRequest', { dx: -90, dy: 40 })).toBe(false);
  await invoke('onPanResponderMove', { dx: -180, dy: 45 });
  await invoke('onPanResponderRelease', { dx: -90, dy: 55 });
  expect(log).toHaveBeenCalledTimes(1);
  await invoke('onPanResponderGrant', { dx: 0, dy: 0 });
  await invoke('onPanResponderMove', { dx: -180, dy: 40 });
  await invoke('onPanResponderRelease', { dx: -25, dy: 40 });
  expect(log).toHaveBeenCalledTimes(1);
  await invoke('onPanResponderGrant', { dx: 0, dy: 0 });
  await invoke('onPanResponderMove', { dx: -180, dy: 40 });
  await invoke('onPanResponderTerminate', { dx: -180, dy: 40 });
  expect(log).toHaveBeenCalledTimes(1);
});
