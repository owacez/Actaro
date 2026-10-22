import { beforeEach, expect, jest, test } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { onboardingService } from '@/features/onboarding/onboarding-service';
import { bodyService } from '@/features/body/body-service';
import { goalService } from '@/features/goals/goal-service';
import { nutritionService } from '@/features/nutrition/nutrition-service';
import { profileService } from '@/features/profile/profile-service';
import { nutritionContext } from './helpers/nutrition-fixture';
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));
const mockFetch = jest.fn<(input: unknown, init?: unknown) => Promise<Response>>();
const makeClient = () =>
  createClient<Database>('https://setup-fixture.supabase.co', 'test-public-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: mockFetch },
  });
let mockClient: ReturnType<typeof makeClient>;
jest.mock('@/lib/supabase/client', () => ({ getSupabase: () => mockClient }));
jest.mock('@/features/body/body-service', () => ({
  bodyService: { saveForm: jest.fn(), save: jest.fn() },
}));
jest.mock('@/features/goals/goal-service', () => ({ goalService: { save: jest.fn() } }));
jest.mock('@/features/nutrition/nutrition-service', () => ({
  nutritionService: { targets: jest.fn() },
}));
jest.mock('@/features/profile/profile-service', () => ({
  profileService: { updatePreferences: jest.fn() },
}));
const preferences = nutritionContext().preferences;
const owner = preferences.user_id;
const storage = jest.mocked(AsyncStorage);
const rows = (count: number) =>
  new Response(JSON.stringify(Array.from({ length: count }, () => ({ user_id: owner }))), {
    headers: { 'Content-Type': 'application/json' },
  });
beforeEach(() => {
  jest.clearAllMocks();
  mockClient = makeClient();
  const user: User = {
    id: owner,
    aud: 'authenticated',
    created_at: '',
    app_metadata: {},
    user_metadata: {},
  };
  jest.spyOn(mockClient.auth, 'getUser').mockResolvedValue({ data: { user }, error: null });
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});
test('setup is offered only to accounts with no targets and no weigh-ins', async () => {
  mockFetch.mockImplementation(async () => rows(0));
  await expect(onboardingService.needed(owner)).resolves.toBe(true);
  expect(storage.setItem).not.toHaveBeenCalled();
  // Existing records mark the device so later launches skip the check.
  mockFetch.mockImplementation(async (input) =>
    rows(String(input).includes('body_weights') ? 1 : 0),
  );
  await expect(onboardingService.needed(owner)).resolves.toBe(false);
  expect(storage.setItem).toHaveBeenCalledWith(`actaro:onboarding:v1:${owner}`, 'done');
  mockFetch.mockClear();
  storage.getItem.mockResolvedValue('done');
  await expect(onboardingService.needed(owner)).resolves.toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});
test('completion saves units, body, waist, targets and goal in order, then remembers setup', async () => {
  const updated = { ...preferences, weight_unit: 'lb' };
  jest.mocked(profileService.updatePreferences).mockResolvedValue(updated);
  const order: string[] = [];
  jest.mocked(bodyService.saveForm).mockImplementation(async () => void order.push('body'));
  jest.mocked(bodyService.save).mockImplementation(async () => void order.push('waist'));
  jest.mocked(nutritionService.targets).mockImplementation(async () => {
    order.push('targets');
    return {} as never; // The saved row is not read by completion.
  });
  jest.mocked(goalService.save).mockImplementation(async () => void order.push('goal'));
  const body = {
    date: '2026-10-22',
    weight: '176',
    height: '180',
    sex: 'male',
    birthDate: '1996-01-15',
    location: '',
    notes: '',
  };
  const targets = { calories: 2650, protein: 128, carbs: 368, fat: 74, water_ml: 2500 };
  await onboardingService.complete(owner, preferences, {
    units: { weight_unit: 'lb', length_unit: 'cm' },
    body,
    waist: '86',
    targets,
    goal: null,
  });
  expect(order).toEqual(['body', 'waist', 'targets']);
  // The body save uses the just-saved units so lb input converts correctly.
  expect(bodyService.saveForm).toHaveBeenCalledWith(owner, body, updated);
  expect(bodyService.save).toHaveBeenCalledWith(
    owner,
    'measurement',
    '2026-10-22',
    '86',
    'cm',
    'UTC',
    'waist',
    '',
  );
  expect(nutritionService.targets).toHaveBeenCalledWith(owner, targets);
  expect(goalService.save).not.toHaveBeenCalled();
  expect(storage.setItem).toHaveBeenCalledWith(`actaro:onboarding:v1:${owner}`, 'done');
});
