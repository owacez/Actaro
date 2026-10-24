import { expect, test } from '@jest/globals';
import { orderedKeys, shiftPositions } from '@/components/reorder-model';

const start = { a: 0, b: 1, c: 2, d: 3 };

test('dragging down shifts the rows it passes up by one', () => {
  const next = shiftPositions(start, 'a', 2);
  expect(next).toEqual({ a: 2, b: 0, c: 1, d: 3 });
  expect(orderedKeys(next)).toEqual(['b', 'c', 'a', 'd']);
});

test('dragging up shifts the rows it passes down by one; same slot changes nothing', () => {
  expect(orderedKeys(shiftPositions(start, 'd', 1))).toEqual(['a', 'd', 'b', 'c']);
  expect(shiftPositions(start, 'b', 1)).toEqual(start);
});

test('successive moves during one drag keep every slot filled exactly once', () => {
  let positions: Record<string, number> = start;
  for (const to of [1, 2, 3, 2, 0]) positions = shiftPositions(positions, 'a', to);
  expect(Object.values(positions).sort()).toEqual([0, 1, 2, 3]);
  expect(orderedKeys(positions)).toEqual(['a', 'b', 'c', 'd']);
});
