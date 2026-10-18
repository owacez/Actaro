import { expect, jest, test } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRecords } from '@/hooks/use-records';
import { FeedbackTestRoot } from './helpers/feedback-root';

test('refresh retains visible records and cannot overwrite a later acknowledged update', async () => {
  let finish: ((value: { count: number }) => void) | undefined;
  const load = jest
    .fn<() => Promise<{ count: number }>>()
    .mockResolvedValueOnce({ count: 1 })
    .mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  const { result } = await renderHook(() => useRecords(load), { wrapper: FeedbackTestRoot });
  await waitFor(() => expect(result.current.data?.count).toBe(1));
  await act(() => result.current.refresh());
  expect(result.current.loading).toBe(false);
  expect(result.current.data?.count).toBe(1);
  await act(() => result.current.updateData(() => ({ count: 2 })));
  await act(() => finish?.({ count: 1 }));
  expect(result.current.data?.count).toBe(2);
  expect(result.current.refreshing).toBe(false);
});

test('changing the data source hides the previous account/date immediately', async () => {
  const first = async () => ({ name: 'Account A' });
  const second = () => new Promise<{ name: string }>(() => {});
  const { result, rerender } = await renderHook(
    ({ read }: { read: () => Promise<{ name: string }> }) => useRecords(read),
    {
      initialProps: { read: first },
      wrapper: FeedbackTestRoot,
    },
  );
  await waitFor(() => expect(result.current.data?.name).toBe('Account A'));
  await rerender({ read: second });
  expect(result.current.data).toBeNull();
  expect(result.current.loading).toBe(true);
});
