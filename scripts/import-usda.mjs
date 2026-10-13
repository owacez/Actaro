import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { parseUsda, USDA_REVISION, USDA_DOWNLOAD } from './usda-data.mjs';

async function run() {
  const path = process.argv[2];
  if (!path || path.startsWith('--'))
    throw new Error('Usage: npm run import:usda -- <extracted USDA SR Legacy JSON> [--dry-run]');
  const bytes = await readFile(path),
    records = parseUsda(JSON.parse(bytes.toString('utf8')));
  const checksum = createHash('sha256').update(bytes).digest('hex');
  if (process.argv.includes('--dry-run')) {
    console.log(
      `Validated ${records.length} foods; ${USDA_REVISION}; SHA256 ${checksum}. No writes.`,
    );
    return;
  }
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key || (!key.startsWith('sb_secret_') && key.split('.').length !== 3))
    throw new Error('Set the project URL and server-only SUPABASE_SECRET_KEY in ignored .env');
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  for (let start = 0; start < records.length; start += 200) {
    const { error } = await client
      .from('foods')
      .upsert(records.slice(start, start + 200), { onConflict: 'source,source_external_id' });
    if (error)
      throw new Error(
        `USDA import failed at batch ${start}; rerun safely after checking access/schema. Credentials are not logged.`,
      );
  }
  await writeFile(
    '.actaro-tools/usda/import-evidence.json',
    JSON.stringify(
      {
        source: USDA_DOWNLOAD,
        revision: USDA_REVISION,
        sha256: checksum,
        foods: records.length,
        portions: records.reduce((total, food) => total + food.portions.length, 0),
      },
      null,
      2,
    ),
  );
  console.log(
    `Imported ${records.length} USDA foods. Stable source IDs and attribution preserved.`,
  );
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
