import type { RunDraft } from './run-model';

// Web has no lock-screen surface; iOS and Android variants live beside this file.
export const runLive = {
  async show(_draft: RunDraft) {},
  async end() {},
};
