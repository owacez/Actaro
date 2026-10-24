// Moves one key to slot `to` and shifts the rows between its old and new slot by one, so
// every slot stays filled. Runs on the UI thread while dragging.
export function shiftPositions(
  positions: Record<string, number>,
  id: string,
  to: number,
): Record<string, number> {
  'worklet';
  const from = positions[id];
  const next: Record<string, number> = {};
  for (const key of Object.keys(positions)) {
    const at = positions[key];
    next[key] =
      key === id
        ? to
        : from < to && at > from && at <= to
          ? at - 1
          : from > to && at >= to && at < from
            ? at + 1
            : at;
  }
  return next;
}

export function orderedKeys(positions: Record<string, number>) {
  'worklet';
  return Object.keys(positions).sort((a, b) => positions[a] - positions[b]);
}
