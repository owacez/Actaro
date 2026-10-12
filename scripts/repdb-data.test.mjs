import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseRepdb } from './repdb-data.mjs';

function dataset(patch = {}) {
  return {
    count: 1,
    exercises: [
      {
        id: 'fixture-exercise',
        name_en: 'Fixture exercise',
        description_en: null,
        instructions_en: ['Move with control.'],
        primary_muscles: ['pectoralis_major'],
        secondary_muscles: null,
        equipment: 'resistance_band',
        difficulty: 'beginner',
        category: 'strength',
        force_type: 'push',
        images: {
          flat: { start: 'images/flat/fixture-start.webp', peak: 'images/flat/fixture-peak.webp' },
        },
        ...patch,
      },
    ],
  };
}
test('preserves source IDs, normalizes taxonomy, and accepts null secondary muscles', () => {
  const [record] = parseRepdb(dataset({ id: 'provider_id' }));
  assert.equal(record.source_external_id, 'provider_id');
  assert.equal(record.equipment, 'resistance-band');
  assert.deepEqual(record.primary_muscles, ['pectoralis-major']);
  assert.deepEqual(record.secondary_muscles, []);
});
test('accepts a single main pose and null equipment without inventing equipment', () => {
  const [record] = parseRepdb(
    dataset({ equipment: null, images: { flat: { main: 'images/flat/fixture-main.webp' } } }),
  );
  assert.equal(record.equipment, null);
  assert.equal(record.media.length, 1);
});
test('rejects count mismatch, duplicate source IDs, missing instructions and incomplete poses', () => {
  assert.throws(() => parseRepdb({ ...dataset(), count: 2 }));
  const source = dataset();
  assert.throws(() =>
    parseRepdb({ count: 2, exercises: [...source.exercises, ...source.exercises] }),
  );
  assert.throws(() => parseRepdb(dataset({ instructions_en: [] })));
  assert.throws(() =>
    parseRepdb(dataset({ images: { flat: { start: 'images/flat/fixture.webp' } } })),
  );
});
test('rejects traversal, external hosts, paid previews, invalid taxonomy and blank steps', () => {
  for (const path of [
    '../private.webp',
    'https://external.invalid/image.webp',
    'premium-samples/image.webp',
    'images/flat/../../private.webp',
  ])
    assert.throws(() => parseRepdb(dataset({ images: { flat: { main: path } } })));
  assert.throws(() => parseRepdb(dataset({ equipment: '../../admin' })));
  assert.throws(() => parseRepdb(dataset({ instructions_en: ['   '] })));
});
