import type { HealthResult, HealthSource } from './health-model';

// Web and any platform without a health store: setup stays manual.
export const health: {
  source: HealthSource | null;
  available: () => Promise<boolean>;
  importForSetup: () => Promise<HealthResult>;
} = {
  source: null,
  available: async () => false,
  importForSetup: async () => ({
    status: 'unavailable',
    reason: 'Health data import is available in the iPhone and Android apps.',
  }),
};
