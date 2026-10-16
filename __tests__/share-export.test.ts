import { beforeEach, expect, jest, test } from '@jest/globals';
import { shareExport } from '@/features/profile/share-export';
import * as Sharing from 'expo-sharing';
const mockFile = {
  uri: 'file:///test-cache/export.json',
  exists: true,
  create: jest.fn(),
  write: jest.fn(),
  delete: jest.fn(),
};
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => mockFile),
  Paths: { cache: 'test-cache' },
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn<() => Promise<boolean>>(),
  shareAsync: jest.fn<() => Promise<void>>(),
}));
beforeEach(() => {
  jest.mocked(Sharing.isAvailableAsync).mockResolvedValue(true);
  jest.mocked(Sharing.shareAsync).mockResolvedValue();
});
test('native export shares JSON and removes its temporary private file even when sharing fails', async () => {
  await shareExport({ records: { body_weights: [] } });
  expect(mockFile.write).toHaveBeenCalledWith(
    JSON.stringify({ records: { body_weights: [] } }, null, 2),
  );
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    mockFile.uri,
    expect.objectContaining({ mimeType: 'application/json' }),
  );
  expect(mockFile.delete).toHaveBeenCalledTimes(1);
  jest
    .mocked(Sharing.shareAsync)
    .mockRejectedValueOnce(new Error('Share cancelled or unavailable'));
  await expect(shareExport({})).rejects.toThrow();
  expect(mockFile.delete).toHaveBeenCalledTimes(2);
});
