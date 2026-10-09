# Actaro

Premium personal fitness and wellness mobile application, developed incrementally.
Current implementation: official Expo starter, repository initialization and a verified test baseline.
The starter screens, colors, icons, and assets are Expo examples, not the approved
Actaro design system or implemented product features. Version `0.1.0` is project
metadata; v0.1's release gate has not passed.

## Project authority

- [Source of Truth](docs/ACTARO_SOURCE_OF_TRUTH_FINAL.md): product behavior.
- [Development Plan](docs/ACTARO_DECELOPMENT_PLAN.md): release order and weights.
  This is the supplied file's actual name; the requested
  `ACTARO_DEVELOPMENT_PLAN_FINAL.md` is absent. Both supplied documents retain
  older `FITNESS_APP_*` references. Original canonical files are preserved.
- [Figma](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW): visual authority.
- [Development Status](docs/DEVELOPMENT_STATUS.md): verified implementation.
- [Agent instructions](AGENTS.md): development rules and verification.

Explicit user work orders determine the authorized scope. Initialization does
not authorize completing the rest of v0.1.

## Local development

Install a supported Node.js LTS with npm, and Git. This setup uses portable
Node.js 24.21.0/npm 11.19.0 and Git 2.56.0 from a temporary directory because
Node/npm were not installed on PATH. Git is now installed system-wide. Optionally
make these temporary tools available in the current Windows terminal:

```powershell
$actaroToolRoot = Join-Path $env:TEMP 'actaro-init-tools-20261008'
$env:Path = (Join-Path $actaroToolRoot 'node-v24.21.0-win-arm64') + ';' + (Join-Path $actaroToolRoot 'git/cmd') + ';' + $env:Path
```

Run from this folder (no nested project):

```bash
npm ci
npm start
```

On Windows PowerShell, use `npm.cmd`/`npx.cmd` if execution policy blocks the
PowerShell wrapper. Open the app with compatible Expo Go, an available simulator,
or a development build. Bundle export does not verify native runtime behavior.
Native development builds will be configured when authorized and required.

```bash
npm run typecheck
npm run lint
npm run format:check
npm run check
npm test
npm run test:watch
```

`npm run format` applies Prettier. Canonical documents and binary assets are
excluded from formatting. Jest uses the SDK 57 Expo preset and React Native Testing Library. Tests cover
server/client hydration and preference updates. `npm run check` includes tests
and fails if any check fails. CI remains a separate task.

## Structure and architecture

The scaffold follows Expo's default template and supported SDK versions:
[create-expo-app](https://docs.expo.dev/more/create-expo/) and
[SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/).

```text
src/app/          Expo Router route entry points and layout
src/components/   Existing Expo starter components
src/hooks/        Existing starter presentation hooks
src/constants/    Existing starter theme (not Actaro tokens)
src/expo.d.ts     Expo global typings for checks before generated files exist
assets/           Expo starter media and icons
scripts/          Generator-provided reset script
docs/             Canonical documents, status, and decisions
```

Add `src/features/<feature>/` only with approved feature work; separate its UI,
business logic, and data access. Routes compose feature UI. Shared UI belongs
in `src/components/` when reuse is justified. Avoid unused folders or placeholder
services. The generator's `reset-project` moves starter code; do not run it as
unrelated cleanup.

Backend: Supabase PostgreSQL, Auth, RLS and Storage. The shared client is
configured; auth screens, schema and RLS policies are not implemented. React state
is the default; TanStack Query and Zustand require demonstrated needs.
See [mobile stack decision](docs/decisions/001-mobile-stack.md).

## Environment and security

Copy `.env.example` to `.env` and supply your project API URL and public
publishable key before launching the app. The client validates these values;
restart Expo after changes. Actual `.env` variants are ignored. Public Expo variables are bundled app content: never use
these for service-role keys, database passwords, signing secrets, or AI provider
credentials. Production domains, bundle IDs, and EAS project IDs are undecided.

Run `npm run check:supabase` with Node 24 for the read-only live connection check.
The probe expects the `profiles` table to be missing until schema migrations run.
See [required development inputs](docs/DEVELOPMENT_INPUTS.md) and
[Supabase client decision](docs/decisions/002-supabase-auth.md).
The [schema design](docs/decisions/003-core-schema.md) specifies the first
profile/preferences migration and historical data rules; no schema is applied yet.

## Release discipline

Core order: v0.1 Foundation → v0.2 Exercise Library → v0.3 Strength Workouts →
v0.4 Manual Nutrition → v0.5 Habits, Goals & Today → v0.6 Basic Progress →
v0.9 Quality & Personal Beta → v1.0 Core Release.

Future order: v1.1 Active Minutes → v1.2 Running & GPS → v1.3 Advanced Analytics
& Achievements → v1.4 Food Photo AI → v1.5 Advanced Offline & Sync → v2.0 Health
& Wearables. Retained unassigned/deferred work is tracked in Development Status.

Initialization stops at review. Feature development requires explicit approval
of the next small, independently verifiable task.
