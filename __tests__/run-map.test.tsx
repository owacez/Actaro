import { expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RunMap } from '@/features/running/run-map';
import { runMapDocument, runMapPayload } from '@/features/running/run-map-document';
import { runFixture } from './helpers/run-fixture';
import { FeedbackTestRoot } from './helpers/feedback-root';
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/running/run-map-surface', () => ({
  MapSurface: ({ onStatus }: { onStatus: (value: string) => void }) => {
    const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fail map fixture"
        onPress={() => {
          onStatus('actaro-map:stage:style');
          onStatus('actaro-map:error:Failed to fetch worker script (403)');
        }}
      >
        <Text>Map surface</Text>
      </Pressable>
    );
  },
}));
test('map geometry preserves pause gaps and dateline continuity; document exposes no auth bridge', () => {
  const route = runFixture().route;
  const payload = runMapPayload(
    [...route, { ...route[1], segment: 1, timestamp: route[1].timestamp + 10000 }],
    true,
  );
  expect(payload.lines).toHaveLength(2);
  expect(payload.lines[1]).toHaveLength(1);
  const wrapped = runMapPayload(
    [
      { ...route[0], longitude: 179.999 },
      { ...route[1], longitude: -179.999 },
    ],
    false,
  );
  expect(wrapped.position[0]).toBeCloseTo(180.001);
  const html = runMapDocument(payload, '#ff681e', false);
  expect(html).toContain('https://tiles.openfreemap.org/styles/positron');
  expect(runMapDocument(payload, '#ff681e', true)).toContain(
    'https://tiles.openfreemap.org/styles/dark',
  );
  // WebKit may fall back from worker-src to script-src for MapLibre's blob module worker.
  expect(html).toMatch(/script-src [^;]*blob:/);
  expect(html).toContain('actaro-map:stage:library');
  expect(html).toContain('Recenter');
  expect(html).not.toMatch(/supabase|localStorage|geolocation|getUser/);
});
test('map failure preserves route outline with explicit retry instead of blocking recording', async () => {
  await render(<RunMap points={runFixture().route} live />, { wrapper: FeedbackTestRoot });
  await fireEvent.press(screen.getByRole('button', { name: 'Fail map fixture' }));
  expect(screen.getByText(/Street map unavailable/)).toBeTruthy();
  expect(
    screen.getByText('Map stopped at: style · Failed to fetch worker script (403)'),
  ).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Retry street map' }));
  expect(screen.getByRole('button', { name: 'Fail map fixture' })).toBeTruthy();
});
