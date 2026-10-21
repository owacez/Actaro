import { beforeEach, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TodayRunCard, RunProgressScreen } from '@/features/running/run-cards';
import { runService } from '@/features/running/run-service';
import { runFixture, runId, runOwner, runTime } from './helpers/run-fixture';
import { nutritionContext } from './helpers/nutrition-fixture';
import { FeedbackTestRoot } from './helpers/feedback-root';
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (value: unknown) => mockPush(value) },
  useFocusEffect: jest.fn(),
}));
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
jest.mock('@/features/running/use-run-draft', () => ({ useRunDraft: () => ({ draft: null }) }));
jest.mock('@/features/running/run-service', () => ({
  runService: { recent: jest.fn(), progress: jest.fn() },
}));
const service = jest.mocked(runService);
function row(id = runId, distance = 1000, seconds = 300) {
  const draft = runFixture(true);
  return {
    id,
    user_id: runOwner,
    created_at: draft.startedAt,
    started_at: draft.startedAt,
    ended_at: new Date(runTime + 60000).toISOString(),
    local_date: '2026-10-10',
    time_zone: 'UTC',
    duration_seconds: seconds,
    moving_seconds: seconds,
    distance_meters: distance,
    notes: '',
    route_preview: draft.route,
  };
}
beforeEach(() => {
  jest.clearAllMocks();
});
test('Today recent run opens its owned detail and a missing history stays empty', async () => {
  service.recent.mockResolvedValue(row());
  await render(<TodayRunCard userId={runOwner} unit="km" />, { wrapper: FeedbackTestRoot });
  await fireEvent.press(await screen.findByRole('button', { name: 'View recent run' }));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/runs/[id]', params: { id: runId } });
});
test('Running progress uses total time divided by total distance and the shared period filters', async () => {
  service.progress.mockResolvedValue({
    ...nutritionContext(),
    userId: runOwner,
    from: '2026-10-01',
    to: '2026-10-13',
    rows: [row(), row('12000000-0000-4000-8000-000000000004', 2000, 1200)],
  });
  await render(<RunProgressScreen userId={runOwner} navigation={null} />, {
    wrapper: FeedbackTestRoot,
  });
  await screen.findByText('8:20 /km');
  expect(screen.getByText('3.00 km')).toBeTruthy();
  expect(service.progress).toHaveBeenCalledWith(runOwner, '30D', undefined);
  await fireEvent.press(screen.getByRole('button', { name: 'Open run history' }));
  expect(mockPush).toHaveBeenCalledWith('/runs');
});
