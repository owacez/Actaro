import { appendRunFix, finishRun, newRun } from '@/features/running/run-model';
export const runOwner = '12000000-0000-4000-8000-000000000001';
export const runId = '12000000-0000-4000-8000-000000000003';
export const runTime = Date.parse('2026-10-21T10:00:00Z');
export const runFix = { latitude: 0, longitude: 0, timestamp: runTime, accuracy: 5, speed: 3.7 };
export function runFixture(review = false) {
  let draft = newRun(runId, runOwner, 'UTC', false, runFix, runTime);
  draft = appendRunFix(draft, { ...runFix, longitude: 0.001, timestamp: runTime + 30000 });
  return review ? finishRun(draft, runTime + 60000) : draft;
}
