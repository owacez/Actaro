# ACTARO — DEVELOPMENT PLAN

> **Status:** Canonical execution plan
>
> **Purpose:** This file defines **when and in what order** the application is built.
>
> **Required companion:** `FITNESS_APP_SOURCE_OF_TRUTH_FINAL.md`
>
> Before coding, read the Source of Truth completely, then this file.
>
> **Core principle:** Build the simpler deterministic product first. Add complex sensing, GPS, advanced analytics, AI, and ecosystem integrations only after the core is stable.

---

## 1.0 Product Identity & Repo Setup

- Product name: **Actaro**.
- Use `actaro` as initial local project/repository slug, and `Actaro` as the Expo user-visible app name.
- Keep UI copy, splash/name references, and Figma aligned with Actaro without modifying scope or implementation order.
- Start with the v0.1 foundation only; don't build future-version designs early.
- Do not hardcode an unverified production bundle ID, website/domain, or claim trademark availability.
- When Codex creates `docs/DEVELOPMENT_STATUS.md`, refer to the project as **Actaro**.

## 1.1 Getting Started — VS Code + Codex (First-Day Checklist)

This section is the **hands-on entry point** for starting Actaro development. It supplements, rather than replaces, the release phases and acceptance criteria below. Perform the setup once; then use the living status file to guide future coding sessions.

### Step A — Prerequisites

Install/verify:

- VS Code and the official **Codex by OpenAI** extension; sign in and open the Actaro workspace folder.
- Current supported **Node.js LTS** and npm, and Git.
- **Expo Go** on a physical phone for the initial smoke test (or use an available simulator).
- A private GitHub repository is recommended after local initialization, but is **not required** for the first task.

From **VS Code → Terminal → New Terminal**, while inside the empty project folder:

```bash
node -v
npm -v
git --version
```

**If the folder is empty**, create the Expo TypeScript/Expo Router project **in place** (do not nest a second project directory):

```bash
npx create-expo-app@latest . --template default
```

If the directory already contains a generated Expo project, **do not rerun** the generator; inspect and use the existing files. Use the actual generated project structure rather than assuming every Expo version has identical directories.

### Step B — First run / smoke test

```bash
npx expo start
```

Open the displayed QR code in Expo Go, or run in an available simulator. If local networking prevents connection, try:

```bash
npx expo start --tunnel
```

Confirm the **starter Expo app** launches; this is *not* evidence that Actaro's feature set is implemented. Stop the development server with `Ctrl+C` when finished. Later GPS/sensor/native requirements may require **Expo development builds** rather than Expo Go.

### Step C — Place the authoritative docs in the workspace

Create `docs/` at the repository root and copy the two **canonical files** into it, preserving these filenames:

```text
actaro/
├── app/ or src/app/           # keep whichever Expo generated
├── assets/
├── docs/
│   ├── FITNESS_APP_SOURCE_OF_TRUTH_FINAL.md
│   ├── FITNESS_APP_DEVELOPMENT_PLAN_FINAL.md
│   └── DEVELOPMENT_STATUS.md  # Codex creates this
├── AGENTS.md                  # retain/update existing agent guidance
├── app.json or app.config.*
├── package.json
└── tsconfig.json
```

Sources of authority: Source of Truth = **what**; Development Plan = **when**; Figma = **how it looks**; Development Status = **what is actually built**. The 56-screen Figma design includes future features; **do not implement everything shown** in the current release.

Figma: https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW

### Step D — Optional Figma connection to Codex

Use the official Figma MCP server, if desired, and complete its authorization flow:

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
codex mcp list
```

This requires a Codex CLI installation and may depend on available account/integration permissions. An existing connection in a different ChatGPT session is **not necessarily connected to VS Code**. Figma MCP is useful when translating the actual screens; it is **not a prerequisite** for Step E. Read only relevant frames rather than re-fetching the full board for every task.

### Step E — FIRST Codex prompt (setup/assessment only)

Paste the following verbatim into the Codex sidebar **after** the Expo project and canonical Markdown files are in the workspace:

```text
We are beginning development of Actaro, a personal fitness and wellness mobile application.

Read completely:
1. docs/FITNESS_APP_SOURCE_OF_TRUTH_FINAL.md
2. docs/FITNESS_APP_DEVELOPMENT_PLAN_FINAL.md

Figma visual reference:
https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW

TASK: Repository assessment and development setup ONLY.

1. Inspect the existing Expo application, dependencies, configuration and Git state.
2. Confirm the intended architecture: React Native, TypeScript, Expo Router and Supabase (for the later v0.1 integration task).
3. Ensure the local project slug is 'actaro' and the user-visible Expo app name is 'Actaro'. Do not invent production domains, bundle identifiers or credentials.
4. Read any existing AGENTS.md. Preserve useful Expo guidance; add the project's surgical-change rules, architecture boundaries, release discipline, security and verification requirements.
5. Create docs/DEVELOPMENT_STATUS.md with ALL roadmap phases using actual initial statuses (NOT_STARTED / IN_PROGRESS / BLOCKED / DONE / DEFERRED / DROPPED), completed evidence and an honest weighted progress baseline.
6. Identify the precise implementation steps for v0.1 Foundation based on the Development Plan, including the later Supabase/Auth/RLS tasks.
7. Run appropriate non-destructive baseline checks; report results and blockers.

RULES:
- Read docs first; respect Source of Truth > Development Plan > Figma > code when deciding behavior, while preserving actual code and flagging conflicts.
- Make only changes required for this setup task. No speculative abstractions or unsolicited refactors.
- No application-feature implementation or premature Supabase connection yet.
- No fake backend, fake authentication, or mocked features presented as complete.
- Do not change Figma or implement later-version functionality.
- Do not hardcode API credentials, secrets, production domains or unverified IDs.
- Do not claim passing tests that were not run.

END: Report files inspected/modified, validation results, blockers, initial status and the next proposed v0.1 task. STOP and wait for explicit approval before implementing app features.
```

**Approval checkpoint:** Review the setup changes and status report, then explicitly authorize only the first small v0.1 implementation task. The setup prompt is **not** authorization to autonomously complete v0.1 or advance to v0.2.

### Step F — Implement Phase 0 / v0.1 incrementally

After the first setup review, execute **one independently testable scope at a time**, following Phase 0 below. Suggested sequence:

1. Repository quality baseline and stable app structure.
2. Figma-aligned design tokens, reusable primitives and the five-tab navigation shell.
3. Supabase project/configuration and minimal typed data-access layer (ask for required project URL and publishable/anon key; never embed privileged service-role secrets in the app).
4. Authentication flows, profile/preferences, and database RLS policies with ownership/security verification.
5. End-to-end foundation testing and the v0.1 release gate.

The exact breakdown follows the numbered **Phase 0** items and their acceptance criteria; if dependencies require reordering, document the reason. Do not use placeholder navigation as proof of functional authentication or security. The user approves each work order, and Codex updates `docs/DEVELOPMENT_STATUS.md` **only when there is implementation/test evidence**.

### Step G — Inspect diffs, save progress, and hand off

Before committing:

```bash
git status
git diff
```

Initialize Git only if the Expo generator/repository has not already done so:

```bash
git init
```

Confirm `.env*` files with secrets, credentials, signing files and generated artifacts are excluded from Git. Review changes first; then make focused commits, e.g.:

```bash
git add .
git commit -m "chore: initialize Actaro development workflow"
```

At the end of every Codex task, request: **changed files, decisions, test commands/results, scope exceptions, status progress, blockers and next three actions**. Start a fresh Codex session by re-reading the two canonical files plus `docs/DEVELOPMENT_STATUS.md` and inspecting the current repository; there is no need to rebuild context from scratch.

---

# 1. Authority & Conflict Rules

Use these sources in this order:

1. **Source of Truth** — product behavior and architecture
2. **Development Plan** — implementation order and release boundaries
3. **Figma** — visual/interaction implementation
4. Existing code — implementation reality

If Figma conflicts with product behavior, Source of Truth wins.

If a designed feature is scheduled for a later release, do not implement it early.

Figma reference:

https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW

---

# 2. Coding-Agent Operating Rules

1. Do not rewrite the project.
2. Do not create speculative architecture.
3. Do not implement later-release features early.
4. Follow the Surgical Scope Rule.
5. One task = one focused change.
6. Reuse existing patterns.
7. Keep code understandable.
8. Never fake completion.
9. Inspect before editing.
10. Validate schema/security impact for persisted features.
11. Test before marking done.
12. Update `docs/DEVELOPMENT_STATUS.md` after meaningful work.
13. If blocked, use `BLOCKED` and state the concrete blocker.
14. Do not change product scope without explicit user instruction.
15. AI comes after the deterministic system it enhances.

---

# 3. Status Vocabulary

Use exactly:

- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `DONE`
- `DEFERRED`
- `DROPPED`

---

# 4. Completion Percentage

Use weighted completion.

```text
Current Release Completion %
=
completed active-release weight
/
total active-release weight
× 100
```

Rules:

- DONE = 100% of item weight
- IN_PROGRESS = verified completed subtasks / total subtasks
- BLOCKED = completed subtasks only
- NOT_STARTED = 0%
- DEFERRED = excluded from current denominator
- DROPPED = excluded from denominator

Never estimate completion subjectively.

---

# 5. Required Status Report

Whenever the user asks for development status, respond with:

## Overall

```text
Current Release: vX.X
Release Completion: XX%
Current Phase: ...
Current Focus: ...
Blockers: ...
```

## Feature Status

| Area | Feature | Release | Status | Completion | Notes |
|---|---|---|---|---:|---|

## Phase Summary

| Phase | Completion | Status |
|---|---:|---|

## Next 3 Actions

1. ...
2. ...
3. ...

## Blockers / Decisions Needed

Only real blockers.

---

# 6. Development Strategy

Development is split into two parts.

# PART I — CORE DETERMINISTIC PRODUCT

Goal:

> Ship a genuinely useful fitness application before building complex sensors, GPS, AI, or advanced ecosystem integrations.

Order:

```text
Foundation
→ Exercise Library
→ Strength Workouts
→ Manual Nutrition
→ Habits & Goals
→ Today Dashboard
→ Basic Progress
→ Quality / Personal Beta
→ v1.0 Core Release
```

# PART II — COMPLEX / ADVANCED PRODUCT

Order:

```text
Active Minutes
→ Running / GPS
→ Advanced Analytics
→ Badges
→ Food Photo AI
→ Advanced Offline / Sync
→ Health / Wearables
```

---

# 7. PART I — Core Deterministic Product

# Phase 0 — v0.1 Foundation

## 0.1 Repository — Weight 2

- Git
- `.gitignore`
- README
- env template

## 0.2 React Native / Expo — Weight 3

- React Native
- TypeScript
- Expo development builds

## 0.3 Quality Baseline — Weight 3

- Typecheck
- Lint
- Formatting
- Test runner
- Basic CI if appropriate

## 0.4 App Structure — Weight 2

Recommended:

```text
src/
  app/
  features/
  components/
  services/
  hooks/
  lib/
  types/
  constants/
```

Do not create unused future abstractions.

## 0.5 Design System — Weight 5

Implement from Figma:

- Warm stone/off-white background
- Soft surface color
- Near-black text
- Orange-coral primary accent
- Limited performance lime
- Typography scale
- Spacing
- Radii
- Borders
- Buttons
- Inputs
- Cards
- Chips/tabs
- Loading/empty/error states

The app must preserve the sharper athletic visual language.

## 0.6 Navigation — Weight 3

Bottom tabs:

- Today
- Fitness
- Nutrition
- Progress
- More

## 0.7 Supabase Integration — Weight 3

## 0.8 Authentication — Weight 6

- Sign up
- Sign in
- Sign out
- Password reset
- Session persistence
- Verification where appropriate

## 0.9 Profile / Preferences — Weight 3

## 0.10 RLS / Security Foundation — Weight 6

## 0.11 Data Access Layer — Weight 4

Raw Supabase access must not be scattered throughout UI components.

### v0.1 Acceptance Criteria

- App launches
- Navigation works
- Figma-aligned design foundation exists
- Auth works
- Session persists
- Profile persists
- User A cannot read User B data
- Typecheck/lint/tests pass
- `docs/DEVELOPMENT_STATUS.md` exists

---

# Phase 1 — v0.2 Exercise Library

## 1.1 Muscle & Equipment Schema — Weight 2

## 1.2 Exercise Schema — Weight 4

Include:

- source
- source_external_id
- muscle/equipment relationships
- instructions
- attribution/license metadata

## 1.3 Exercise Media Schema — Weight 3

Keep media independent from exercise core data.

## 1.4 RepDB Import Script — Weight 5

Requirements:

- Parse local dataset
- Map muscles/equipment
- Stable app IDs
- Preserve source ID
- Preserve license/attribution metadata
- Idempotent import

## 1.5 RepDB Media Import — Weight 4

Use Supabase Storage.

Do not hotlink RepDB/Hugging Face/Kaggle/GitHub at runtime.

## 1.6 Exercise Library UI — Weight 5

- Search
- Muscle filter
- Equipment filter
- Compact thumbnail
- Name
- Muscle
- Equipment
- Pagination/caching

## 1.7 Exercise Detail — Weight 3

- Start/peak media
- Instructions
- Muscles
- Equipment
- Attribution if required

## 1.8 Equipment Profile — Weight 2

### v0.2 Acceptance Criteria

- Exercise DB is queryable
- Search/filters work
- Media loads from our storage
- Import can be rerun safely
- No runtime dependency on external dataset hosting

---

# Phase 2 — v0.3 Strength Workout System

## 2.1 Workout Schema — Weight 6

Include:

- Workout templates
- Template exercises
- Sessions
- Session exercises if required
- Sets
- Session mode
- Start/end timestamps
- Duration
- Notes

## 2.2 Custom Workout Builder — Weight 6

## 2.3 Predefined Training Plans — Weight 5

## 2.4 Workout Pre-Start — Weight 3

Show:

- Exercises
- Working sets
- Estimated duration
- Start Workout

## 2.5 Session Mode Chooser — Weight 3

- Timed Workout
- Log Only

## 2.6 Dedicated Active Workout — Weight 10

Must include:

- Workout header
- Timer only in Timed mode
- Exercise X of N
- Compact exercise media
- Exercise metadata
- Previous performance
- Best performance
- Set table
- Add/remove set
- Next/previous exercise
- Finish

## 2.7 Timed Session — Weight 4

- Start timer only in Timed mode
- Pause/resume
- Persist duration

## 2.8 Log Only — Weight 2

- No total session timer
- Full workout persistence remains

## 2.9 Rest Timer — Weight 4

- Auto-start after completed set
- Pause/resume
- Skip
- ±15 sec
- Both session modes

## 2.10 Workout Summary — Weight 4

- Exercises
- Sets
- Volume
- Duration if Timed
- PRs
- Optional note

## 2.11 Workout History — Weight 4

## 2.12 PR Detection — Weight 3

## 2.13 Training Volume — Weight 4

## 2.14 Training Status — Weight 4

## 2.15 Recovery Check — Weight 3

## 2.16 Active Workout Resilience — Weight 5

At minimum, an active session should survive:

- Temporary network loss
- App backgrounding
- Reasonable restart/recovery scenarios where feasible

Full offline sync is later.

### v0.3 Acceptance Criteria

- Workout is a dedicated route
- Timed/Log Only behavior is correct
- Set logging is fast
- Rest timer independent from session timer
- Previous values visible
- Session persists safely
- Volume/PR logic tested
- No fake physiological claims

---

# Phase 3 — v0.4 Manual Nutrition

## 3.1 Nutrition Schema — Weight 5

## 3.2 Nutrition Targets — Weight 3

## 3.3 Food Database/Search — Weight 5

Support:

- Search
- Recent
- Frequent
- Favorites
- Saved meals
- Food detail

## 3.4 Serving Units / Conversion — Weight 5

Support applicable:

- g
- oz
- ml
- serving
- piece
- slice
- cup
- tbsp
- tsp

## 3.5 Portion Editor — Weight 6

Must visibly support:

- Unit selector
- Quantity stepper
- Direct numeric input
- Gram/ounce entry where relevant
- Live calories/macros
- Base serving
- Meal-total impact

## 3.6 Nutrition Calculation Engine — Weight 6

Deterministically calculate:

- Calories
- Protein
- Carbs
- Fat
- Meal totals
- Daily totals

Important math must have tests.

## 3.7 Food Diary — Weight 6

## 3.8 Custom Foods — Weight 3

## 3.9 Favorites / Recent / Frequent — Weight 3

## 3.10 Saved Meals / Copy Meal / Copy Day — Weight 4

## 3.11 Recipes — Weight 5

Custom recipe form:

- Name
- Ingredients
- Quantities
- Servings
- Total nutrition
- Per-serving nutrition

## 3.12 Recipe-by-Weight — Weight 4

- Cooked total weight
- Nutrition per gram
- Arbitrary logged grams

## 3.13 Hydration — Weight 2

### v0.4 Acceptance Criteria

- Portion changes update nutrition immediately
- Unit behavior is correct
- Daily totals are accurate
- Recipe math tested
- User-owned foods/recipes protected by RLS
- Manual nutrition is complete without AI

---

# Phase 4 — v0.5 Habits, Goals & Today

## 4.1 Habit Schema — Weight 3

## 4.2 Habit Creation — Weight 4

Types:

- Boolean
- Numeric
- Duration
- Frequency
- Avoidance

## 4.3 Habit Logging — Weight 3

## 4.4 Habit History / Consistency — Weight 3

## 4.5 Motivation Mode — Weight 2

## 4.6 Goal Schema — Weight 2

## 4.7 Goal Creation — Weight 4

## 4.8 Goal Progress — Weight 3

## 4.9 Bodyweight Logging — Weight 3

## 4.10 Steps Foundation — Weight 3

Use the simplest reliable supported source available at this stage.

Do not build advanced sensing yet.

## 4.11 Today Dashboard — Weight 8

Use real data from underlying modules.

Must include:

- Bodyweight
- Steps/activity
- Calories/macros
- Today's workout
- Habits
- Goal summary
- Training Status
- Recovery

Do not build the dashboard first with duplicate/mock business logic.

### v0.5 Acceptance Criteria

- Today uses persisted data
- Habits/goals work end-to-end
- No duplicated calculation logic in dashboard
- Empty/loading/error states exist

---

# Phase 5 — v0.6 Basic Progress & Analytics

## 5.1 Weight Progress — Weight 3

## 5.2 Nutrition Progress — Weight 3

## 5.3 Workout Frequency — Weight 2

## 5.4 Strength Progress — Weight 3

## 5.5 Training Volume — Weight 3

## 5.6 Steps Progress — Weight 2

## 5.7 Habit Progress — Weight 2

## 5.8 Time Filters — Weight 2

- 7D
- 30D
- 3M
- 6M
- 1Y
- All

## 5.9 Weekly / Monthly Summary — Weight 4

Deterministic only.

### v0.6 Acceptance Criteria

- Date-bounded queries are correct
- Important calculations tested
- No AI is used for ordinary analytics
- Correlation is not presented as causation

---

# Phase 6 — v0.9 Quality & Personal Beta

## 6.1 Accessibility — Weight 3

## 6.2 Performance — Weight 3

## 6.3 Security Review — Weight 5

## 6.4 Error / Crash Handling — Weight 4

## 6.5 Notifications — Weight 3

## 6.6 Personal Beta — Weight 6

Use the product for real daily logging.

## 6.7 Bug Fix / Polish — Weight 6

## 6.8 Documentation Review — Weight 3

### v0.9 Acceptance Criteria

- Core flows reliable
- Security reviewed
- No major data-loss bugs
- Personal beta completed
- Known issues documented
- Figma/system consistency reviewed

---

# Phase 7 — v1.0 Core Deterministic Release

v1.0 is a release gate, not a large new feature phase.

Before marking v1.0:

- Foundation stable
- Exercise library stable
- Strength workout flow stable
- Manual nutrition stable
- Habits/goals stable
- Today stable
- Basic Progress stable
- Security review complete
- Personal beta complete

The app must be genuinely useful without:

- GPS running
- Photo-food AI
- Wearables
- Advanced cross-metric analytics

---

# 8. PART II — Complex / Advanced Product

# Phase 8 — v1.1 Active Minutes

## 8.1 Motion / Activity Source Evaluation — Weight 4

Determine what the target mobile platforms expose reliably.

## 8.2 Active Minutes Calculation — Weight 5

## 8.3 Today Integration — Weight 2

## 8.4 Progress Integration — Weight 2

## 8.5 Accuracy / Messaging Review — Weight 3

### Acceptance Criteria

- Estimate source documented
- Limitations communicated
- No false HR-based intensity claims
- No Garmin-equivalent claims

---

# Phase 9 — v1.2 Running / GPS

## 9.1 Location Permission Flow — Weight 3

## 9.2 Run Session Schema — Weight 4

## 9.3 Run Start — Weight 3

## 9.4 GPS Route Recording — Weight 8

## 9.5 Active Run — Weight 7

Show:

- Elapsed time
- Distance
- Pace
- Route
- Pause/stop

## 9.6 Distance / Pace Calculation — Weight 5

## 9.7 Run Summary — Weight 4

## 9.8 Route Thumbnail — Weight 4

## 9.9 Run History — Weight 3

## 9.10 Run Detail — Weight 3

## 9.11 Today Recent-Run Card — Weight 2

## 9.12 Progress Running Card — Weight 2

### Acceptance Criteria

- Permission behavior correct
- GPS session survives normal lifecycle transitions
- Route saved correctly
- Distance/pace calculations tested
- Summary/history/detail agree
- Route preview integrated into Today/Progress
- Battery/privacy considerations documented

---

# Phase 10 — v1.3 Advanced Analytics & Achievements

## 10.1 Performance Dashboard — Weight 5

## 10.2 Training Block Comparison — Weight 4

## 10.3 Unified Timeline — Weight 5

## 10.4 Advanced Cross-Metric Analytics — Weight 5

## 10.5 Badge Rules Engine — Weight 4

## 10.6 Achievement UI — Weight 3

### Analytics Rules

- Prefer SQL/statistics/rules
- Require sufficient data
- Do not imply causation
- Explain metric definitions

### Badge Rules

Badges must derive from persisted events/history.

Examples:

- First Workout
- 50 Workouts
- First 5K
- 10K Steps
- 150 Active Minutes
- Protein Goal 7 Days
- Weight Goal Reached

---

# Phase 11 — v1.4 Food Photo AI

Do not start until manual nutrition is stable.

## 11.1 Image Capture — Weight 2

## 11.2 Secure Vision Provider Integration — Weight 4

## 11.3 Food Identification — Weight 4

## 11.4 Portion Estimation — Weight 4

## 11.5 Nutrition Matching — Weight 4

## 11.6 Editable Review — Weight 5

## 11.7 Confirmed Logging — Weight 2

### Acceptance Criteria

- API secrets server-side
- Estimate clearly labeled
- Food editable
- Portion editable
- Add/remove items supported
- User confirmation mandatory
- Uses the same deterministic nutrition logging engine
- Manual fallback available
- Never silently auto-logs

---

# Phase 12 — v1.5 Advanced Offline / Sync

## 12.1 Local Data Strategy — Weight 5

Evaluate/use SQLite or suitable relational local storage.

## 12.2 Sync Queue — Weight 6

## 12.3 Idempotency — Weight 4

## 12.4 Conflict Handling — Weight 5

## 12.5 Reconciliation — Weight 4

## 12.6 Offline Coverage Expansion — Weight 4

Prioritize:

- Active workouts
- Food logging where practical
- Habits

---

# Phase 13 — v2.0 Health / Wearables

## 13.1 Apple Health — Weight 5

## 13.2 Android Health Connect — Weight 5

## 13.3 Imported Activities — Weight 4

## 13.4 Sleep — Weight 4

## 13.5 Heart Rate — Weight 4

## 13.6 HRV — Weight 4

## 13.7 Sensor-Enhanced Recovery — Weight 5

## 13.8 Physiological Training Load — Weight 5

Only when supported by valid source data.

## 13.9 Daily Suggested Workout — Weight 6

## 13.10 Advanced Running Analytics — Weight 5

---

# 9. Definition of Done

A feature is `DONE` only when all relevant requirements are satisfied:

- UI works
- Persistence works
- Validation exists
- Auth/RLS works
- Loading state exists
- Empty state exists
- Error state exists
- Acceptance criteria pass
- Tests pass
- Typecheck passes
- Lint passes
- No known regression in touched flows
- Development status updated

---

# 10. Coding Order Within a Feature

Default sequence:

1. Read Source of Truth
2. Read Development Plan
3. Inspect existing code
4. Define acceptance criteria
5. Determine schema impact
6. Determine RLS/security impact
7. Create migration if needed
8. Update data-access layer
9. Implement business logic
10. Implement UI
11. Add loading/empty/error states
12. Add tests
13. Run lint/typecheck/tests
14. Manual verification
15. Update status
16. Focused commit

Do not refactor unrelated areas unless required.

---

# 11. Development Status File

Maintain:

```text
docs/DEVELOPMENT_STATUS.md
```

Required structure:

## Overall

- Current release
- Release completion %
- Current phase
- Current focus
- Blockers

## Feature Table

| Area | Feature | Release | Weight | Status | Completion | Notes |
|---|---|---|---:|---|---:|---|

## Phase Summary

| Phase | Release | Completion | Status |
|---|---|---:|---|

## Last Completed

## Current Work

## Next 3 Actions

## Blockers / Decisions

## Recent Decisions

---

# 12. Decision Records

Use:

```text
docs/decisions/
```

Suggested ADRs:

```text
001-mobile-stack.md
002-supabase-auth.md
003-core-schema.md
004-repdb-import.md
005-active-workout-persistence.md
006-nutrition-serving-model.md
007-active-minutes-source.md
008-running-gps-provider.md
009-map-provider.md
010-vision-provider.md
011-offline-sync.md
```

---

# 13. Initial Status

All implementation work begins:

```text
NOT_STARTED
```

Do not infer progress from Figma.

Design completion is not development completion.

---

# 14. First Codex Work Order

When this project is first handed to Codex:

1. Read `FITNESS_APP_SOURCE_OF_TRUTH_FINAL.md`.
2. Read `FITNESS_APP_DEVELOPMENT_PLAN.md`.
3. Inspect the repository.
4. If starting from zero, execute **only Phase 0 / v0.1 Foundation**.
5. Create React Native + TypeScript + Expo setup.
6. Establish quality tooling.
7. Create Figma-aligned design tokens/components.
8. Create the navigation shell.
9. Configure Supabase project integration structure.
10. Create `docs/DEVELOPMENT_STATUS.md`.
11. Create initial ADRs only when a real decision is made.
12. Report exact status.
13. Stop before beginning v0.2 unless the user explicitly authorizes continuation.

Do not begin AI, GPS, running, or advanced analytics during the first work order.

---

# 15. Release Summary

| Release | Purpose |
|---|---|
| v0.1 | Foundation, design system, Supabase, auth, security |
| v0.2 | Exercise library + RepDB |
| v0.3 | Full strength workout logging |
| v0.4 | Manual nutrition |
| v0.5 | Habits + Goals + Today |
| v0.6 | Basic Progress & analytics |
| v0.9 | Quality, testing, personal beta |
| v1.0 | Core deterministic release |
| v1.1 | Active Minutes |
| v1.2 | Running + GPS + route maps |
| v1.3 | Advanced analytics + timeline + block comparison + badges |
| v1.4 | Food-photo AI |
| v1.5 | Advanced offline/sync + polish |
| v2.0 | Health/wearables + sensor-enhanced intelligence |

This plan is the implementation sequencing authority.
