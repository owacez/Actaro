This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Actaro authority and scope

- Before implementation, read `docs/ACTARO_SOURCE_OF_TRUTH_FINAL.md` and
  `docs/ACTARO_DECELOPMENT_PLAN.md` completely, then inspect
  `docs/DEVELOPMENT_STATUS.md` and relevant code. The plan's actual filename is
  misspelled in this checkout; do not assume a different file exists.
- Source of Truth defines WHAT; Development Plan defines WHEN; Figma defines
  HOW it looks; Development Status records implementation evidence. Flag
  conflicts and follow the user's explicitly authorized scope.
- Figma reference: https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW.
  Read only relevant nodes when visual work is authorized. Never edit Figma
  without explicit authorization. Starter visuals are not Actaro design evidence.
- User-approved Figma fallback: when MCP calls are exhausted, consult the local
  `docs/Actaro Design.pdf` export if present. Inspect only relevant release
  screens; flag conflicts with the canonical product decisions or newer fetched
  nodes. The export does not authorize future-release implementation or guessed
  themes/assets. Preserve the supplied file unless instructed otherwise.
- One task = one focused, independently verifiable change. Make surgical
  changes only; no unsolicited refactoring, renames, reorganizations, cleanup,
  dependency replacement, or unrelated design changes.
- Respect the ordered releases v0.1, v0.2, v0.3, v0.4, v0.5, v0.6, v0.9, v1.0,
  v1.1, v1.2, v1.3, v1.4, v1.5, v2.0. Designed future features are not authorized
  implementation. Keep retained/deferred work documented.
- Initialization ends at the setup report. Stop and wait for explicit approval
  before design-system, product navigation, Supabase, authentication, schema,
  or other feature work. Subsequent work orders remain individually scoped.

## Architecture and implementation standards

- Standing user preference: use the `engineering-suite-ponytail` plugin in
  `full` mode for every coding task. Read its entry and Ponytail skills on first
  use in a session; apply its simplicity ladder before each implementation change
  and command: establish the current need, reuse existing code, prefer standard
  library/native features and installed dependencies, then make the smallest
  correct change. This is a reasoning check, not a separate tool call for every
  command. Do not remove validation, security, accessibility, persistence or
  required checks to shorten code. Use the existing test tools; add no test
  framework for this workflow. Scope audits and fixes to the user's request.
  If the plugin is unavailable, report that and apply these recorded principles.
  This preference persists until the user says "stop ponytail" or "normal mode".

- Approved stack: React Native, Expo, TypeScript, Expo Router; Supabase later
  for PostgreSQL, Auth, Row Level Security, and Storage. Do not connect Supabase
  during initialization or add an independent backend or speculative infrastructure.
- Keep `src/app/` for routing and composition. Add `src/features/<feature>/`
  only with real feature work, separating its UI, business logic, and data access.
  Reuse `src/components/` for justified shared UI. Never scatter raw Supabase
  queries or domain calculations throughout route/UI components.
- React state is the default. Add TanStack Query for demonstrated server-state
  needs and Zustand only for justified shared local state. Do not preinstall them.
- Preserve working template dependencies. Add packages only for current needs,
  checking Expo compatibility. Do not create unused future abstractions or folders.
- Keep TypeScript strict. Do not bypass correctness with unexplained `any`,
  assertions, ignored errors, or disabled checks. Reuse components when a real
  shared requirement exists; do not abstract hypothetical reuse.
- Never present mocked UI, hardcoded data, bypassed authorization, missing
  persistence, untested integration, or unmet acceptance criteria as complete.
- Never commit credentials, privileged Supabase keys, signing files, or private
  health data. `EXPO_PUBLIC_*` values are public app content. Keep privileged
  secrets server-side. Do not invent bundle IDs, domains, credentials, or user identity.
- Persisted features require validation, ownership/RLS checks, and safe logging.
  Use deterministic calculations before considering approved selective AI.

## Verification and reporting

- Derive acceptance criteria before editing; inspect schema/security implications
  when applicable. Implement the smallest correct change and review the diff.
- Run `npm run check` before marking work complete. Run meaningful relevant
  tests and manual flow checks when applicable. Do not add tests that merely
  mirror trivial code or claim checks that were not run.
- Jest/Expo and React Native Testing Library are configured; `npm run check`
  includes tests. CI remains a separate quality-baseline task. Never create a
  fake passing test script or use `--passWithNoTests` to claim coverage.
- Update `docs/DEVELOPMENT_STATUS.md` with exact evidence, approved statuses,
  and the Development Plan's weights. Partial progress counts only verified
  completed subtasks. A scaffold, export, or passing lint is not feature completion.
- Report changed files/reasons, decisions/conflicts, exact commands/results,
  progress, real blockers, and next three small actions after each task.
- Make focused local commits when Git identity is configured and scope checks
  pass. Do not invent identity or publish/push without authorization.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
