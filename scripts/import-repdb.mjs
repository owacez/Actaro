import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  parseRepdb,
  REPDB_ROOT,
  REPDB_REVISION,
  REPDB_LICENSE,
  REPDB_ATTRIBUTION,
} from './repdb-data.mjs';

// Explicit admin command; no secret is used during ordinary npm start/check/export.
const args = process.argv.slice(2);
const directory = resolve(
  args.find((argument) => !argument.startsWith('--')) ?? '.actaro-tools/repdb',
);
const dryRun = args.includes('--dry-run');
const download = args.includes('--download');
const withMedia = args.includes('--media');

async function downloadFile(path) {
  const response = await fetch(`${REPDB_ROOT}/${path}`, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`RepDB download failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const target = resolve(directory, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return bytes;
}
function webp(bytes) {
  if (
    bytes.length > 1048576 ||
    bytes.toString('ascii', 0, 4) !== 'RIFF' ||
    bytes.toString('ascii', 8, 12) !== 'WEBP'
  )
    throw new Error('Invalid/oversized WebP');
}

async function run() {
  if (download) {
    await downloadFile('exercises.json');
    await downloadFile('LICENSE-DATA.md');
    await downloadFile('ATTRIBUTION.md');
    await writeFile(resolve(directory, 'revision.txt'), `${REPDB_REVISION}\n`);
  }
  const revision = (await readFile(resolve(directory, 'revision.txt'), 'utf8')).trim();
  if (revision !== REPDB_REVISION)
    throw new Error('Dataset revision differs from the reviewed revision');
  const records = parseRepdb(
    JSON.parse(await readFile(resolve(directory, 'exercises.json'), 'utf8')),
  );
  if (dryRun) {
    console.log(
      `Validated ${records.length} exercises, ${records.reduce((n, x) => n + x.media.length, 0)} poses; no database writes.`,
    );
    return;
  }
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in ignored .env');
  if (!key.startsWith('sb_secret_') && key.split('.').length !== 3)
    throw new Error('A server-only Supabase key is required');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.rpc('import_repdb', {
    p_exercises: records,
    p_revision: revision,
  });
  if (error)
    throw new Error('Database import failed; inspect schema/access without publishing credentials');
  console.log(`Imported ${records.length} exercises at ${revision}. Stable IDs preserved.`);
  if (!withMedia) return;
  const { data: exercises, error: readError } = await client
    .from('exercises')
    .select('id,source_external_id')
    .eq('source', 'repdb')
    .limit(1000);
  if (readError || !exercises) throw new Error('Cannot resolve imported exercise IDs');
  const ids = new Map(exercises.map((entry) => [entry.source_external_id, entry.id]));
  let uploaded = 0;
  // Bounded batches avoid hammering free-tier Storage; reruns replace the same paths.
  for (let start = 0; start < records.length; start += 4) {
    await Promise.all(
      records.slice(start, start + 4).map(async (record) => {
        const id = ids.get(record.source_external_id);
        if (!id) throw new Error('Imported exercise ID unavailable');
        for (const { pose, path } of record.media) {
          let bytes;
          try {
            bytes = await readFile(resolve(directory, path));
          } catch (failure) {
            if (failure.code !== 'ENOENT' || !download)
              throw new Error('Missing local image; use --download --media');
            bytes = await downloadFile(path);
          }
          webp(bytes);
          const storagePath = `${id}/${pose}.webp`;
          const { error: uploadError } = await client.storage
            .from('exercise-media')
            .upload(storagePath, bytes, {
              contentType: 'image/webp',
              upsert: true,
              cacheControl: '3600',
            });
          if (uploadError)
            throw new Error('Image upload failed; rerun safely after access/network recovery');
          // Publish metadata only after its actual object is stored successfully.
          const { error: metadataError } = await client.from('exercise_media').upsert(
            {
              exercise_id: id,
              pose,
              storage_path: storagePath,
              source: 'repdb',
              source_external_id: path,
              license: REPDB_LICENSE,
              attribution: REPDB_ATTRIBUTION,
              sha256: createHash('sha256').update(bytes).digest('hex'),
              byte_size: bytes.length,
            },
            { onConflict: 'exercise_id,pose' },
          );
          if (metadataError) throw new Error('Image metadata save failed; rerun safely');
          uploaded += 1;
        }
      }),
    );
    if ((start + 4) % 40 === 0) console.log(`Stored ${uploaded} poses…`);
  }
  console.log(`Stored ${uploaded} poses in private exercise-media; no runtime RepDB hotlinks.`);
}
run().catch((failure) => {
  console.error(failure.message);
  process.exitCode = 1;
});
