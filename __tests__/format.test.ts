import { expect, test } from '@jest/globals';
import { displayDate, displayRange, plural } from '@/lib/format';
import { loggedAmount } from '@/features/nutrition/nutrition-model';
test('dates read naturally, add the year only when it differs and never shift by time zone', () => {
  const now = new Date('2026-10-22T23:30:00Z');
  expect(displayDate('2026-10-22', now)).toBe('Thu, Oct 22');
  expect(displayDate('2025-12-31', now)).toBe('Wed, Dec 31, 2025');
  expect(displayDate('2024-02-29', now)).toBe('Thu, Feb 29, 2024');
  expect(displayRange('2026-09-23', '2026-10-22', now)).toBe('Sep 23 – Oct 22');
  expect(displayDate('not a date', now)).toBe('not a date');
});
test('counts and diary amounts use natural units', () => {
  expect(plural(1, 'exercise')).toBe('1 exercise');
  expect(plural(3, 'exercise')).toBe('3 exercises');
  expect(loggedAmount(150, 'g')).toBe('150 g');
  expect(loggedAmount(1, '1 medium (118 g)')).toBe('1 medium (118 g)');
  expect(loggedAmount(2, '1 medium (118 g)')).toBe('2 × 1 medium (118 g)');
});
