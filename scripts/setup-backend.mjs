// One-command backend setup for your own Supabase project (cloud or self-hosted).
// Usage: npm run setup:backend [-- --dry-run] [--skip-data] [--skip-function] [--skip-auth]
// Reads the ignored .env (see .env.example and docs/SELF_HOSTING.md). Every step is safe to
// rerun: migrations apply only what is missing and imports keep stable IDs.
// Secrets are never printed; command lines that contain them are not echoed.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readSupabaseConfiguration } from '../src/lib/supabase/config.ts';
import { USDA_DOWNLOAD } from './usda-data.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const cli = resolve('node_modules', 'supabase', 'dist', 'supabase.js');
const tools = resolve('.actaro-tools');
const env = process.env;
// The shared TypeScript config module triggers a harmless module-type notice in child scripts.
const quiet = [env.NODE_OPTIONS, '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON']
  .filter(Boolean)
  .join(' ');
let failed = false;

const step = (title) => console.log(`\n== ${title}${dryRun ? ' (dry run)' : ''}`);
const note = (text) => console.log(`   ${text}`);
function run(command, commandArgs, extraEnv = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    env: { ...env, NODE_OPTIONS: quiet, ...extraEnv },
  });
  return result.status === 0;
}
const node = (script, scriptArgs = []) => run(process.execPath, [script, ...scriptArgs]);
const supabase = (cliArgs, extraEnv) => run(process.execPath, [cli, ...cliArgs], extraEnv);
function fail(message) {
  console.error(`   FAILED: ${message}`);
  failed = true;
}

// 1. Configuration --------------------------------------------------------------
step('Checking .env');
let config;
try {
  config = readSupabaseConfiguration(
    env.EXPO_PUBLIC_SUPABASE_URL,
    env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  note(`Project URL: ${config.url}`);
} catch (error) {
  console.error(`   ${error instanceof Error ? error.message : 'Invalid public configuration.'}`);
  console.error('   See docs/SELF_HOSTING.md for where to find these values.');
  process.exit(1);
}
const host = new URL(config.url).hostname;
const cloudRef = host.endsWith('.supabase.co') ? host.split('.')[0] : null;
const missing = ['SUPABASE_SECRET_KEY', 'SUPABASE_DB_URL'].filter((name) => !env[name]);
if (missing.length) {
  console.error(`   Missing in .env: ${missing.join(', ')}. See docs/SELF_HOSTING.md.`);
  process.exit(1);
}
if (env.SUPABASE_SECRET_KEY?.startsWith('sb_publishable_'))
  console.error('   SUPABASE_SECRET_KEY looks like a publishable key; imports will be denied.');
note(cloudRef ? `Supabase Cloud project: ${cloudRef}` : 'Self-hosted Supabase (not *.supabase.co)');
note(
  env.SUPABASE_ACCESS_TOKEN ? 'Access token: set' : 'Access token: not set (manual steps shown)',
);

// 2. Database schema -------------------------------------------------------------
step('Applying database migrations');
if (
  !supabase([
    'db',
    'push',
    '--db-url',
    env.SUPABASE_DB_URL,
    '--include-all',
    ...(dryRun ? ['--dry-run'] : []),
  ])
)
  fail('Migrations did not apply. Check SUPABASE_DB_URL (percent-encode the password).');

// 3. Account deletion function -------------------------------------------------
if (!args.has('--skip-function')) {
  step('Deploying the delete-account Edge Function');
  if (cloudRef && env.SUPABASE_ACCESS_TOKEN) {
    if (dryRun) note('Would deploy supabase/functions/delete-account with JWT verification.');
    else if (
      !supabase(['functions', 'deploy', 'delete-account', '--project-ref', cloudRef, '--use-api'], {
        SUPABASE_ACCESS_TOKEN: env.SUPABASE_ACCESS_TOKEN,
      })
    )
      fail('Function deploy failed. Check SUPABASE_ACCESS_TOKEN.');
  } else if (cloudRef) {
    note('Set SUPABASE_ACCESS_TOKEN to deploy automatically, or run:');
    note(`npx supabase functions deploy delete-account --project-ref ${cloudRef} --use-api`);
  } else {
    note('Self-hosted: copy supabase/functions/delete-account to volumes/functions/delete-account');
    note('in your Docker setup, then run `sh run.sh restart functions`.');
  }
}

// 4. Sign-in redirect URLs ------------------------------------------------------
if (!args.has('--skip-auth')) {
  step('Configuring sign-in redirect URLs');
  const siteUrl = env.ACTARO_AUTH_SITE_URL || 'http://localhost:8081/auth/callback';
  const wanted = [
    'http://localhost:8081/auth/callback',
    'http://localhost:8081/auth/recovery',
    'actaro://auth/callback',
    'actaro://auth/recovery',
    ...(env.ACTARO_AUTH_REDIRECT_URLS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  ];
  if (cloudRef && env.SUPABASE_ACCESS_TOKEN) {
    const endpoint = `https://api.supabase.com/v1/projects/${cloudRef}/config/auth`;
    const headers = {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };
    try {
      const current = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) });
      if (!current.ok) throw new Error(`reading auth settings returned HTTP ${current.status}`);
      const settings = await current.json();
      // The allow list is one comma-separated string; existing entries are always kept.
      const existing = String(settings.uri_allow_list ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      const added = wanted.filter((url) => !existing.includes(url));
      note(`Site URL: ${siteUrl}`);
      note(added.length ? `Adding: ${added.join(', ')}` : 'All redirect URLs already allowed.');
      if (!dryRun && (added.length || settings.site_url !== siteUrl)) {
        const update = await fetch(endpoint, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            site_url: siteUrl,
            uri_allow_list: [...existing, ...added].join(','),
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!update.ok) throw new Error(`updating auth settings returned HTTP ${update.status}`);
        note('Auth settings updated.');
      }
    } catch (error) {
      fail(`Auth settings: ${error instanceof Error ? error.message : 'request failed'}.`);
    }
  } else {
    note(
      cloudRef
        ? 'In the dashboard: Authentication > URL Configuration. Set:'
        : 'Self-hosted: set SITE_URL and ADDITIONAL_REDIRECT_URLS in the Docker .env, then run `sh run.sh restart auth`:',
    );
    note(`Site URL: ${siteUrl}`);
    note(`Redirect URLs: ${wanted.join(', ')}`);
  }
}

// 5. Reference data --------------------------------------------------------------
if (!args.has('--skip-data')) {
  step('Importing the RepDB exercise library (pinned free dataset)');
  if (!node('scripts/import-repdb.mjs', ['--download', dryRun ? '--dry-run' : '--media']))
    fail('RepDB import failed. Rerunning resumes safely.');

  step('Importing USDA SR Legacy foods (public domain)');
  const folder = join(tools, 'usda');
  mkdirSync(folder, { recursive: true });
  const archive = join(folder, 'sr-legacy.zip');
  if (!existsSync(archive)) {
    note('Downloading the USDA archive...');
    const response = await fetch(USDA_DOWNLOAD, { signal: AbortSignal.timeout(300000) });
    if (!response.ok) fail(`USDA download returned HTTP ${response.status}.`);
    else writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  }
  const json = () =>
    readdirSync(folder)
      .filter((name) => name.endsWith('.json'))
      .map((name) => join(folder, name))
      .sort((a, b) => statSync(b).size - statSync(a).size)[0];
  if (existsSync(archive) && !json()) {
    // tar reads zip archives on Windows and macOS; most Linux systems provide unzip.
    const extracted =
      spawnSync('tar', ['-xf', archive, '-C', folder], { stdio: 'ignore' }).status === 0 ||
      spawnSync('unzip', ['-o', archive, '-d', folder], { stdio: 'ignore' }).status === 0;
    if (!extracted) fail(`Could not extract ${archive}. Unzip it into ${folder} and rerun.`);
  }
  const extractedJson = json();
  if (extractedJson) {
    if (!node('scripts/import-usda.mjs', [extractedJson, ...(dryRun ? ['--dry-run'] : [])]))
      fail('USDA import failed. Rerunning is safe.');
  } else if (!failed) fail('No USDA JSON file was found after extraction.');
}

// 6. Verification ----------------------------------------------------------------
step('Verifying the public connection');
if (!node('scripts/check-supabase.mjs')) fail('Connection checks failed.');

console.log(
  failed
    ? '\nSetup finished with problems. Fix the FAILED items above and rerun; completed steps are skipped or kept.'
    : `\nBackend ${dryRun ? 'dry run complete. Run again without --dry-run to apply.' : 'ready. Start the app with npm start.'}`,
);
process.exitCode = failed ? 1 : 0;
