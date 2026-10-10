# Actaro — Development Status

Updated: 2026-10-09 (America/Los_Angeles).

## Overall

- Current Release: **v0.1 — Foundation**
- Release Completion: **52.25% (20.9 / 40 weight)**
- Current Phase: **Phase 0 — profile/preferences database foundation**
- Current Focus: Profile/preferences database foundation and ownership tests are complete. Next: feature-local typed reads/updates, then persisted Profile UI. User verified sign-in/sign-out on web and Expo Go; full email/reopen acceptance remains pending. Your Account remains the destination; Home/Today and product navigation are unimplemented.
- Status: **IN_PROGRESS**
- Blockers: Git is installed; Node.js/npm use temporary portable tools.
  Live email callbacks and native session persistence remain unverified; browser automation failed to start. Expo Doctor config-schema check has an external API blocker; dependency advisories remain open.
- Approval boundary: User authorized resuming v0.1 sequentially on 2026-10-09; complete and verify one task before the next. Later releases remain outside scope.

The supplied canonical plan is `docs/ACTARO_DECELOPMENT_PLAN.md`; the requested
`docs/ACTARO_DEVELOPMENT_PLAN_FINAL.md` is absent. Both canonical files are preserved.
Figma tools are available; no Figma reads or edits are necessary for initialization.

## Completion accounting

Use the Development Plan's weights exactly. For each active item, earned weight
is `weight × verified completed subtasks / total subtasks`. DONE earns full weight;
NOT_STARTED earns zero; BLOCKED earns only completed subtasks. DEFERRED and DROPPED
items are excluded from their release denominator. Never infer progress from Figma.
All future weighted tasks remain NOT_STARTED. No roadmap item has been removed.

v0.1 denominator: `2 + 3 + 3 + 2 + 5 + 3 + 3 + 6 + 3 + 6 + 4 = 40`.
Subtasks below define a reproducible foundation baseline; partial values are
fractions, not subjective estimates. CI remains unimplemented and counted until
its applicability is decided. v1.0 has no plan weight: track its nine explicit
release gates separately, without inventing a numeric weight.

Earned weight: `2 × 4/4 + 3 × 2/3 + 3 × 4/5 + 2 × 2/2 + 3 × 3/4 + 6 × 8/12 + 3 × 1/4 + 6 × 3/4 + 4 × 1/4 = 20.9`.
Release completion: `20.9 / 40 × 100 = 52.25%`. Rounded table percentages never
replace these exact fractions. This is verified foundation progress, not a completed v0.1 release.

## Feature Table

| Area             | Feature                                | Release | Weight | Status      | Completion | Notes                                                                                                        |
| ---------------- | -------------------------------------- | ------- | -----: | ----------- | ---------: | ------------------------------------------------------------------------------------------------------------ |
| Phase 0 / 0.1    | Repository                             | v0.1    |      2 | DONE        |       100% | Git, ignores, README, env template verified (4/4).                                                           |
| Phase 0 / 0.2    | React Native / Expo                    | v0.1    |      3 | IN_PROGRESS |     66.67% | Config/exports and TypeScript verified (2/3); native build pending.                                          |
| Phase 0 / 0.3    | Quality Baseline                       | v0.1    |      3 | IN_PROGRESS |        80% | Typecheck, lint, formatting, test runner verified (4/5); CI pending.                                         |
| Phase 0 / 0.4    | App Structure                          | v0.1    |      2 | DONE        |       100% | Router scaffold and current architecture boundaries verified (2/2).                                          |
| Phase 0 / 0.5    | Design System                          | v0.1    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §0.5.                                                                           |
| Phase 0 / 0.6    | Navigation                             | v0.1    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §0.6.                                                                           |
| Phase 0 / 0.7    | Supabase Integration                   | v0.1    |      3 | IN_PROGRESS |        75% | Configuration, client/lifecycle contracts and live API probes verified (3/4); native checks pending.         |
| Phase 0 / 0.8    | Authentication                         | v0.1    |      6 | IN_PROGRESS |     66.67% | Six implementation contracts plus user-verified live sign-in/sign-out (8/12); four live groups pending.      |
| Phase 0 / 0.9    | Profile / Preferences                  | v0.1    |      3 | IN_PROGRESS |        25% | Schema/default records tested (1/4); typed feature access, UI and application persistence pending.           |
| Phase 0 / 0.10   | RLS / Security Foundation              | v0.1    |      6 | IN_PROGRESS |        75% | Grants/policies, database isolation/constraints and lifecycle tested (3/4); application integration pending. |
| Phase 0 / 0.11   | Data Access Layer                      | v0.1    |      4 | IN_PROGRESS |        25% | Generated database types wired into shared client (1/4); profile services/validation/integration pending.    |
| Phase 1 / 1.1    | Muscle & Equipment Schema              | v0.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §1.1.                                                                           |
| Phase 1 / 1.2    | Exercise Schema                        | v0.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §1.2.                                                                           |
| Phase 1 / 1.3    | Exercise Media Schema                  | v0.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §1.3.                                                                           |
| Phase 1 / 1.4    | RepDB Import Script                    | v0.2    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §1.4.                                                                           |
| Phase 1 / 1.5    | RepDB Media Import                     | v0.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §1.5.                                                                           |
| Phase 1 / 1.6    | Exercise Library UI                    | v0.2    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §1.6.                                                                           |
| Phase 1 / 1.7    | Exercise Detail                        | v0.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §1.7.                                                                           |
| Phase 1 / 1.8    | Equipment Profile                      | v0.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §1.8.                                                                           |
| Phase 2 / 2.1    | Workout Schema                         | v0.3    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §2.1.                                                                           |
| Phase 2 / 2.2    | Custom Workout Builder                 | v0.3    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §2.2.                                                                           |
| Phase 2 / 2.3    | Predefined Training Plans              | v0.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §2.3.                                                                           |
| Phase 2 / 2.4    | Workout Pre-Start                      | v0.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §2.4.                                                                           |
| Phase 2 / 2.5    | Session Mode Chooser                   | v0.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §2.5.                                                                           |
| Phase 2 / 2.6    | Dedicated Active Workout               | v0.3    |     10 | NOT_STARTED |         0% | Requirements: canonical plan §2.6.                                                                           |
| Phase 2 / 2.7    | Timed Session                          | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.7.                                                                           |
| Phase 2 / 2.8    | Log Only                               | v0.3    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §2.8.                                                                           |
| Phase 2 / 2.9    | Rest Timer                             | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.9.                                                                           |
| Phase 2 / 2.10   | Workout Summary                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.10.                                                                          |
| Phase 2 / 2.11   | Workout History                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.11.                                                                          |
| Phase 2 / 2.12   | PR Detection                           | v0.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §2.12.                                                                          |
| Phase 2 / 2.13   | Training Volume                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.13.                                                                          |
| Phase 2 / 2.14   | Training Status                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.14.                                                                          |
| Phase 2 / 2.15   | Recovery Check                         | v0.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §2.15.                                                                          |
| Phase 2 / 2.16   | Active Workout Resilience              | v0.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §2.16.                                                                          |
| Phase 3 / 3.1    | Nutrition Schema                       | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.1.                                                                           |
| Phase 3 / 3.2    | Nutrition Targets                      | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.2.                                                                           |
| Phase 3 / 3.3    | Food Database/Search                   | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.3.                                                                           |
| Phase 3 / 3.4    | Serving Units / Conversion             | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.4.                                                                           |
| Phase 3 / 3.5    | Portion Editor                         | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.5.                                                                           |
| Phase 3 / 3.6    | Nutrition Calculation Engine           | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.6.                                                                           |
| Phase 3 / 3.7    | Food Diary                             | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.7.                                                                           |
| Phase 3 / 3.8    | Custom Foods                           | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.8.                                                                           |
| Phase 3 / 3.9    | Favorites / Recent / Frequent          | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.9.                                                                           |
| Phase 3 / 3.10   | Saved Meals / Copy Meal / Copy Day     | v0.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §3.10.                                                                          |
| Phase 3 / 3.11   | Recipes                                | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.11.                                                                          |
| Phase 3 / 3.12   | Recipe-by-Weight                       | v0.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §3.12.                                                                          |
| Phase 3 / 3.13   | Hydration                              | v0.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §3.13.                                                                          |
| Phase 4 / 4.1    | Habit Schema                           | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.1.                                                                           |
| Phase 4 / 4.2    | Habit Creation                         | v0.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §4.2.                                                                           |
| Phase 4 / 4.3    | Habit Logging                          | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.3.                                                                           |
| Phase 4 / 4.4    | Habit History / Consistency            | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.4.                                                                           |
| Phase 4 / 4.5    | Motivation Mode                        | v0.5    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §4.5.                                                                           |
| Phase 4 / 4.6    | Goal Schema                            | v0.5    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §4.6.                                                                           |
| Phase 4 / 4.7    | Goal Creation                          | v0.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §4.7.                                                                           |
| Phase 4 / 4.8    | Goal Progress                          | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.8.                                                                           |
| Phase 4 / 4.9    | Bodyweight Logging                     | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.9.                                                                           |
| Phase 4 / 4.10   | Steps Foundation                       | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.10.                                                                          |
| Phase 4 / 4.11   | Today Dashboard                        | v0.5    |      8 | NOT_STARTED |         0% | Requirements: canonical plan §4.11.                                                                          |
| Phase 5 / 5.1    | Weight Progress                        | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.1.                                                                           |
| Phase 5 / 5.2    | Nutrition Progress                     | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.2.                                                                           |
| Phase 5 / 5.3    | Workout Frequency                      | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.3.                                                                           |
| Phase 5 / 5.4    | Strength Progress                      | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.4.                                                                           |
| Phase 5 / 5.5    | Training Volume                        | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.5.                                                                           |
| Phase 5 / 5.6    | Steps Progress                         | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.6.                                                                           |
| Phase 5 / 5.7    | Habit Progress                         | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.7.                                                                           |
| Phase 5 / 5.8    | Time Filters                           | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.8.                                                                           |
| Phase 5 / 5.9    | Weekly / Monthly Summary               | v0.6    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §5.9.                                                                           |
| Phase 6 / 6.1    | Accessibility                          | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.1.                                                                           |
| Phase 6 / 6.2    | Performance                            | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.2.                                                                           |
| Phase 6 / 6.3    | Security Review                        | v0.9    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §6.3.                                                                           |
| Phase 6 / 6.4    | Error / Crash Handling                 | v0.9    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §6.4.                                                                           |
| Phase 6 / 6.5    | Notifications                          | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.5.                                                                           |
| Phase 6 / 6.6    | Personal Beta                          | v0.9    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §6.6.                                                                           |
| Phase 6 / 6.7    | Bug Fix / Polish                       | v0.9    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §6.7.                                                                           |
| Phase 6 / 6.8    | Documentation Review                   | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.8.                                                                           |
| Phase 7          | Core release gate (nine prerequisites) | v1.0    |      — | NOT_STARTED |        0/9 | Release gate, no new weighted feature scope.                                                                 |
| Phase 8 / 8.1    | Motion / Activity Source Evaluation    | v1.1    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §8.1.                                                                           |
| Phase 8 / 8.2    | Active Minutes Calculation             | v1.1    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §8.2.                                                                           |
| Phase 8 / 8.3    | Today Integration                      | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.3.                                                                           |
| Phase 8 / 8.4    | Progress Integration                   | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.4.                                                                           |
| Phase 8 / 8.5    | Accuracy / Messaging Review            | v1.1    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §8.5.                                                                           |
| Phase 9 / 9.1    | Location Permission Flow               | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.1.                                                                           |
| Phase 9 / 9.2    | Run Session Schema                     | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.2.                                                                           |
| Phase 9 / 9.3    | Run Start                              | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.3.                                                                           |
| Phase 9 / 9.4    | GPS Route Recording                    | v1.2    |      8 | NOT_STARTED |         0% | Requirements: canonical plan §9.4.                                                                           |
| Phase 9 / 9.5    | Active Run                             | v1.2    |      7 | NOT_STARTED |         0% | Requirements: canonical plan §9.5.                                                                           |
| Phase 9 / 9.6    | Distance / Pace Calculation            | v1.2    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §9.6.                                                                           |
| Phase 9 / 9.7    | Run Summary                            | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.7.                                                                           |
| Phase 9 / 9.8    | Route Thumbnail                        | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.8.                                                                           |
| Phase 9 / 9.9    | Run History                            | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.9.                                                                           |
| Phase 9 / 9.10   | Run Detail                             | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.10.                                                                          |
| Phase 9 / 9.11   | Today Recent-Run Card                  | v1.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §9.11.                                                                          |
| Phase 9 / 9.12   | Progress Running Card                  | v1.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §9.12.                                                                          |
| Phase 10 / 10.1  | Performance Dashboard                  | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.1.                                                                          |
| Phase 10 / 10.2  | Training Block Comparison              | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.2.                                                                          |
| Phase 10 / 10.3  | Unified Timeline                       | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.3.                                                                          |
| Phase 10 / 10.4  | Advanced Cross-Metric Analytics        | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.4.                                                                          |
| Phase 10 / 10.5  | Badge Rules Engine                     | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.5.                                                                          |
| Phase 10 / 10.6  | Achievement UI                         | v1.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §10.6.                                                                          |
| Phase 11 / 11.1  | Image Capture                          | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.1.                                                                          |
| Phase 11 / 11.2  | Secure Vision Provider Integration     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.2.                                                                          |
| Phase 11 / 11.3  | Food Identification                    | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.3.                                                                          |
| Phase 11 / 11.4  | Portion Estimation                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.4.                                                                          |
| Phase 11 / 11.5  | Nutrition Matching                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.5.                                                                          |
| Phase 11 / 11.6  | Editable Review                        | v1.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §11.6.                                                                          |
| Phase 11 / 11.7  | Confirmed Logging                      | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.7.                                                                          |
| Phase 12 / 12.1  | Local Data Strategy                    | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.1.                                                                          |
| Phase 12 / 12.2  | Sync Queue                             | v1.5    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §12.2.                                                                          |
| Phase 12 / 12.3  | Idempotency                            | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.3.                                                                          |
| Phase 12 / 12.4  | Conflict Handling                      | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.4.                                                                          |
| Phase 12 / 12.5  | Reconciliation                         | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.5.                                                                          |
| Phase 12 / 12.6  | Offline Coverage Expansion             | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.6.                                                                          |
| Phase 13 / 13.1  | Apple Health                           | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.1.                                                                          |
| Phase 13 / 13.2  | Android Health Connect                 | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.2.                                                                          |
| Phase 13 / 13.3  | Imported Activities                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.3.                                                                          |
| Phase 13 / 13.4  | Sleep                                  | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.4.                                                                          |
| Phase 13 / 13.5  | Heart Rate                             | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.5.                                                                          |
| Phase 13 / 13.6  | HRV                                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.6.                                                                          |
| Phase 13 / 13.7  | Sensor-Enhanced Recovery               | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.7.                                                                          |
| Phase 13 / 13.8  | Physiological Training Load            | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.8.                                                                          |
| Phase 13 / 13.9  | Daily Suggested Workout                | v2.0    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §13.9.                                                                          |
| Phase 13 / 13.10 | Advanced Running Analytics             | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.10.                                                                         |

## Phase Summary

| Phase    | Release | Purpose                           | Planned weight | Completion | Status      |
| -------- | ------- | --------------------------------- | -------------: | ---------: | ----------- |
| Phase 0  | v0.1    | Foundation                        |             40 |     52.25% | IN_PROGRESS |
| Phase 1  | v0.2    | Exercise Library                  |             28 |         0% | NOT_STARTED |
| Phase 2  | v0.3    | Strength Workout System           |             70 |         0% | NOT_STARTED |
| Phase 3  | v0.4    | Manual Nutrition                  |             57 |         0% | NOT_STARTED |
| Phase 4  | v0.5    | Habits, Goals & Today             |             38 |         0% | NOT_STARTED |
| Phase 5  | v0.6    | Basic Progress & Analytics        |             24 |         0% | NOT_STARTED |
| Phase 6  | v0.9    | Quality & Personal Beta           |             33 |         0% | NOT_STARTED |
| Phase 7  | v1.0    | Core Deterministic Release        |    — (9 gates) |         0% | NOT_STARTED |
| Phase 8  | v1.1    | Active Minutes                    |             16 |         0% | NOT_STARTED |
| Phase 9  | v1.2    | Running / GPS                     |             48 |         0% | NOT_STARTED |
| Phase 10 | v1.3    | Advanced Analytics & Achievements |             26 |         0% | NOT_STARTED |
| Phase 11 | v1.4    | Food Photo AI                     |             25 |         0% | NOT_STARTED |
| Phase 12 | v1.5    | Advanced Offline / Sync           |             28 |         0% | NOT_STARTED |
| Phase 13 | v2.0    | Health / Wearables                |             47 |         0% | NOT_STARTED |

## Foundation subtask ledger

Each numbered task retains its canonical weight. A checked item requires the
specific implementation and validation evidence listed in Last Completed.

- **0.1 Repository (4 subtasks):** Git initialized; secret/generated-file ignores
  verified; setup README; credential-free environment template. Verified: 4/4.
- **0.2 React Native / Expo (3 subtasks):** dependency/configuration and bundle
  validation; strict TypeScript configuration and check; native development
  build configured and launched. Verified: 2/3. Expo Go/device smoke testing is
  also required for the release's app-launch gate and is not inferred from export.
- **0.3 Quality Baseline (5 subtasks):** typecheck command passes; lint command
  passes; formatting command passes; meaningful test runner; basic CI (if
  appropriate). Verified: 4/5; test runner now verified, CI pending.
- **0.4 App Structure (2 subtasks):** working Expo Router entry/layout with
  non-route code outside routes; feature/UI/business/data boundaries documented
  and applied to the current minimal scaffold. Verified: 2/2.
- **0.7 Supabase Integration (4 subtasks):** validated environment; shared client/storage/lifecycle configuration; read-only live Auth/database probes; native integration smoke tests on Android and iOS. Verified: 3/4. Native boundary mocks and exports do not count as device tests.
- **0.8 Authentication (12 subtasks):** each of the six canonical flows has an implementation/contract-test subtask and a live acceptance subtask: signup, sign-in, sign-out, password reset, session persistence and verification. Verified: 8/12. Six implementation contracts pass; the user reports working sign-in/sign-out on web and Expo Go. The phone OS was not specified, so this is not evidence of both Android and iOS. Live signup/confirmation, password reset and session persistence remain pending. Figma screenshot parity is pending and does not earn weight.
- **0.9 Profile / Preferences (4 subtasks):** schema/default record creation; typed feature reads/updates; Profile/preferences UI and states; authenticated application save/reopen acceptance. Verified: 1/4 (database only).
- **0.10 RLS / Security Foundation (4 subtasks):** least-privilege grants and ownership policies; real database anonymous/two-user/protected-write/constraint tests; secure initialization/backfill/timestamps/deletion cascades and private-function privileges; authenticated application integration and foundation security acceptance. Verified: 3/4. Real SQL roles and anonymous SDK probes pass; application integration and the observed Auth security warning remain tracked.
- **0.11 Data Access Layer (4 subtasks):** actual generated database types in shared client; feature-local owned queries/mutations; permitted-field validation and safe error mapping; meaningful feature request/integration tests. Verified: 1/4.
- **0.5–0.6:** no subtasks implemented. Their criteria remain in the canonical plan.

## v1.0 release gate

| Prerequisite                 | Status      | Evidence                         |
| ---------------------------- | ----------- | -------------------------------- |
| Foundation stable            | NOT_STARTED | v0.1 release acceptance pending. |
| Exercise library stable      | NOT_STARTED | v0.2 pending.                    |
| Strength workout flow stable | NOT_STARTED | v0.3 pending.                    |
| Manual nutrition stable      | NOT_STARTED | v0.4 pending.                    |
| Habits/goals stable          | NOT_STARTED | v0.5 pending.                    |
| Today stable                 | NOT_STARTED | v0.5 pending.                    |
| Basic Progress stable        | NOT_STARTED | v0.6 pending.                    |
| Security review complete     | NOT_STARTED | v0.9 pending.                    |
| Personal beta complete       | NOT_STARTED | v0.9 pending.                    |

## Retained and deferred scope

These source-of-truth requirements have no separate plan weight. Preserve them
without assigning an invented release/weight; resolve their exact task placement
before implementation. DEFERRED means intentionally not in this setup's scope.

| Feature or requirement                                                     | Release / placement                                          | Status      | Authority / note                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------- |
| Account deletion and data export                                           | Core security work; exact task not separately numbered       | NOT_STARTED | Source §20; retain ownership/privacy requirements.                     |
| Body measurements and measurement history                                  | Body goals/progress; exact task not separately numbered      | NOT_STARTED | Source §§13–14, 21.                                                    |
| User-created exercises                                                     | Placement undecided                                          | DEFERRED    | Source §21 ownership/RLS.                                              |
| Warm-up sets, supersets, drop sets, advanced set types                     | Later strength enhancement; release unassigned               | DEFERRED    | Source §8.4.                                                           |
| Optional RPE and recovery stress input                                     | When corresponding training tasks are approved               | NOT_STARTED | Source §§8.4, 10.2, 10.4; optional, no extra weight.                   |
| Fiber, sodium, potassium, micronutrients                                   | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.1.                                                          |
| Barcode and nutrition-label scanning                                       | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                         |
| What-If Nutrition and deterministic meal substitutions                     | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                         |
| Dashboard customization/layout preferences                                 | Later enhancement; release unassigned                        | DEFERRED    | Source §§6, 7.                                                         |
| Units, theme, notifications, privacy, gamification preferences             | v0.1 preferences; notifications also v0.9                    | NOT_STARTED | Source §6; plan §§0.9, 6.5.                                            |
| Initial training plan families and equipment/goal/experience/day filters   | v0.3 plan task                                               | NOT_STARTED | Source §8.5; plan §2.3. Beginner Running does not authorize early GPS. |
| Plateau detection, muscle balance, goal/step/running trends, What changed? | Analytics phases; exact subtask placement to be reviewed     | NOT_STARTED | Source §14.7; basic/advanced boundaries must be respected.             |
| Running goals/events, elevation, splits, start/end markers, cadence and HR | Running / later advanced running; exact placement unassigned | DEFERRED    | Source §§13, 16; supported data and later release approval required.   |
| Activity distance/active days and richer phone activity context            | Activity phases; exact placement to be reviewed              | NOT_STARTED | Source §§13–16; simplest supported steps source first.                 |
| Semantic search, exercise-form vision, optional AI explanations            | Only if justified; release unassigned                        | DEFERRED    | Source §18.2.                                                          |
| Wearable-specific integrations beyond named health platforms               | v2.0 direction; provider decisions pending                   | NOT_STARTED | Source §22; no provider implementation assumed.                        |
| Branding/store-name/domain clearance and production bundle IDs             | Before public launch                                         | NOT_STARTED | Source §1.0; no ownership or identity invented.                        |
| Generic chatbot, autonomous coach, AI motivational spam                    | Explicitly excluded unless user changes scope                | DROPPED     | Source §§18, 23; documented exclusion, not a new scope decision.       |
| Medical/injury diagnosis and accurate-looking AI body-fat estimates        | Explicitly excluded unless scope changes                     | DROPPED     | Source §§18, 23.                                                       |
| Fake physiological readiness, Fitness Age, Body Battery imitation          | Explicitly excluded unless scope changes                     | DROPPED     | Source §23.                                                            |
| Early microservices, Kubernetes/GKE, unnecessary custom backend            | Explicitly excluded for early versions                       | DROPPED     | Source §§19, 23; real future backend triggers remain documented.       |

## Last Completed

**DONE — Profile/preferences database foundation (2026-10-09).**

- Applied the two-table migration, verified signup defaults, existing-account backfill, timestamps, deletion cascades, grants and real anonymous/two-user ownership restrictions. Generated database types are used by the shared client.
- Profile editing and authenticated application persistence are pending; the full module remains IN_PROGRESS. See the deployment evidence below and `docs/decisions/003-core-schema.md`.

**IN_PROGRESS — Email/password authentication (2026-10-09), task 0.8.**

- Added feature-local UI, service calls and an auth context; routes compose those features. Signup, sign-in, local sign-out, reset/update, verification/resend and session restoration have contract tests. PKCE callbacks forward the SDK flow ID and reject ambiguous/expired links.
- Added only the current Inter font package through Expo. Replaced the starter root/index with the authorized auth entry and a minimal real-session account screen; remaining starter files were preserved. This does not complete product navigation or the broader design system.
- Supabase MCP access is verified, project ACTIVE_HEALTHY, public tables empty. No migration, Auth security-setting change, paid resource or SMTP configuration was performed.
- Sign In/Reset Figma references were fetched. User approved composing the other auth states from those components after the Figma limit blocked Sign Up. Exact Sign Up visual matching remains pending. Browser preview tooling failed twice; no interactive visual verification is claimed.
- See [auth testing](AUTH_TESTING.md) for callback allowlists, free team-email testing and the live/device checklist. No additional application credentials are required.

**DONE — Analytics-aware schema design document (2026-10-09), unweighted planning work.**

- `docs/decisions/003-core-schema.md` specifies the first two private foundation tables, identity/foreign keys, constraints, default decisions, least-privilege grants and ownership acceptance tests.
- Documents historical facts/snapshots, canonical units, local dates/timezones, ownership-preserving relationships, query-driven indexes and reproducible deterministic reports. Later domain entities stay in their approved releases.
- Design is not applied SQL, generated database types, working profile persistence, or verified RLS. Items 0.9/0.10/0.11 earn no implementation weight from this document.
- At the earlier schema-design handoff, Supabase project/database tools were unavailable. Access is now verified; see Authentication verification.

### Client integration history

**DONE — Supabase client/configuration task (2026-10-09); release item 0.7 remains IN_PROGRESS.**

- Added a validated lazy singleton client, native session storage and foreground refresh with cleanup; browser branch and static export remain supported.
- Public configuration lives only in ignored `.env`; `.env.example` contains empty values. No privileged credentials.
- Configuration and native/browser contract tests pass. Live Auth settings return HTTP 200; SDK database probe returns the expected missing-profile `PGRST205` response without reading user rows.
- Android/iOS/web exports pass. Authentication UI, actual session persistence, profiles/schema/RLS, and native launch verification are not complete.
- `docs/DEVELOPMENT_INPUTS.md` records supplied configuration and remaining inputs.

### Quality baseline history

**DONE — Expo-compatible test runner (2026-10-09).**

- Added Jest/SDK 57 preset, React Native Testing Library and a React 19.2-compatible renderer.
- Two tests exercise the real web color-scheme hook: stable light server rendering, client preference and later preference changes.
- A deliberate server snapshot regression correctly failed the test (exit 1); the source was restored immediately.
- `npm run check` now includes tests; CI/native runtime remain unverified. Quality baseline earns 4/5 completed subtasks.

### Initialization history

**DONE — Initial repository assessment and authorized setup (2026-10-08).**

- Read both supplied canonical documents completely; preserved their content
  (working hashes match the generator's original Git snapshot).
- Created the official default Expo application in the existing root: SDK 57,
  React Native 0.86.3, React 19.2.3, strict TypeScript 6, Expo Router 57.
- Set visible name `Actaro`, slug/package name `actaro`, metadata version `0.1.0`.
  No production identifiers or credentials were added.
- Initialized Git with user-supplied repository-local author identity. Added
  verified secret/generated-file ignores and LF line-ending conventions.
- Preserved template dependencies and Expo guidance; added ESLint/Expo config,
  Prettier, explicit typecheck/lint/format commands, README, architecture ADR,
  empty environment template, and the full roadmap tracker.
- Fixed two verified starter baseline defects: missing pre-generated Expo CSS
  typings via `src/expo.d.ts`, and synchronous effect state in the web hydration
  hook via React's server/client snapshots. Other source edits are formatting.
- Final typecheck/lint/format checks pass. Android/iOS/web export and four static
  routes pass. These are bundle checks, not evidence of a native device launch.
- Focused local change set: `chore: initialize Actaro development foundation`.
  The commit accompanies the handoff (see Git log); the user published this commit to `origin/main` on GitHub (`owacez/Actaro`).

## Validation evidence

Commands used the temporary Node.js/Git PATH described in README.

| Command/check                                                                  | Result                  | Evidence / limits                                                                                                                                                              |
| ------------------------------------------------------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npx.cmd --yes create-expo-app@latest . --template default --no-install --yes` | PASS                    | Official starter created in root; existing docs preserved.                                                                                                                     |
| `npm.cmd install`                                                              | PASS                    | Generated runtime dependencies installed; package lock created.                                                                                                                |
| `npx.cmd expo install eslint eslint-config-expo prettier --dev`                | PASS                    | Only current lint/format dependencies added; compatible versions selected by Expo.                                                                                             |
| Node configuration assertions via stdin                                        | PASS                    | Name, slug, Router entry/plugin, strict typing, absent production IDs and Supabase dependency checked.                                                                         |
| `npm.cmd run format`                                                           | PASS                    | Fresh scaffold standardized; canonical docs excluded.                                                                                                                          |
| `npm.cmd run check`                                                            | PASS                    | Runs `npm run typecheck`, `npm run lint`, `npm run format:check`; all exit 0 after the targeted fixes.                                                                         |
| `npx.cmd expo install --check`                                                 | PASS                    | Dependencies are up to date for SDK 57.                                                                                                                                        |
| `npx.cmd expo export --platform all`                                           | PASS                    | Final Android/iOS Hermes bundles, web bundle, and four static routes generated into ignored `dist/`.                                                                           |
| `npx.cmd expo-doctor`                                                          | FAIL / external blocker | Final exit 1: config-schema check cannot fetch from Expo API (`SocketError: other side closed`). Earlier ignore false-positive was resolved by including portable Git on PATH. |
| `npm.cmd audit --json`                                                         | FAIL / open advisories  | Exit 1: 29 affected packages, 18 high and 11 moderate. Incompatible automatic fixes were not applied.                                                                          |
| `git check-ignore`                                                             | PASS                    | Environment/signing/credential/build files ignored; `.env.example` remains trackable.                                                                                          |
| `git diff --check`                                                             | PASS                    | Setup changes reviewed for whitespace errors.                                                                                                                                  |
| Native device smoke test / development build                                   | NOT_STARTED             | No native runtime success is claimed.                                                                                                                                          |
| Test runner / CI                                                               | NOT_STARTED             | No fake passing test command or test result.                                                                                                                                   |

Initial typecheck and lint failures were corrected and rechecked. External
Doctor/audit failures remain documented; this setup is not release readiness.

## Current Work

The first profile/preferences migration is applied and database-tested. One confirmed existing account was backfilled; disposable test accounts were rolled back. Real SQL ownership checks and anonymous SDK permission probes pass. Actual generated types are used by the shared client. The next task is feature-local profile/preferences data access, followed by the Figma-aligned persisted UI. Authentication remains partially verified: the user tested sign-in/sign-out on web and Expo Go, while confirmation, reset and reopen persistence still need acceptance evidence.

## Next 3 Actions

1. Profile/preferences data-access task: add typed feature-local reads/updates restricted to editable fields and verify successful saves, invalid writes and auth/network failures.
2. Profile/preferences UI task: implement the relevant verified Figma screen with real persistence and loading/error states, using the tested data-access layer.
3. Profile/preferences acceptance task: verify own-account save/reload and access isolation through the application on the test platforms; close the module only after its acceptance criteria pass.

Confirm the remaining auth test matrix alongside these tasks; do not mark task 0.8 DONE until its six live acceptance groups are verified. Then finish the broader design system, five-tab navigation, CI/native build checks and v0.1 release gate before starting v0.2. Keeping this headless schema/data work ahead of visual foundation work follows the previously documented Supabase/auth sequencing exception and prevents implementing a profile form before secure persistence exists.

## Blockers / Decisions

- Git is installed; system-wide Node.js/npm are unavailable on PATH. Temporary portable tools
  allow this session; standard development requires installation or the README's
  temporary PATH setup.
- Git identity is configured locally as `owacez <devowais@outlook.com>` using
  the user's supplied values. A focused local initialization commit follows the reviewed checks.
- A compatible phone/simulator is required for native launch verification; no
  native development build or device smoke test has been run.
- Canonical filename mismatch is documented; original content is preserved.
  It does not block initialization using the supplied plan.
- Supabase public configuration and MCP authorization are established. The profile/preferences migration is applied and database-tested. Both Android and iOS remain test targets; the user's successful Expo Go sign-in/sign-out test did not specify the phone OS.
- `npm audit --json` reports 29 affected packages (18 high, 11 moderate), rooted
  in advisories for braces, decode-uri-component, node-forge, uuid, and their
  dependency chains. Review runtime/tooling exposure before release; no safety
  claim is made. Automated suggestions include incompatible SDK changes, so
  `npm audit fix --force` was not run. No production release gate has passed.
- Expo selected ESLint 9.39.5, which npm marks unsupported; lint tooling support
  should be reviewed alongside SDK-compatible dependency remediation.

## Recent Decisions

- Preserve official default template structure and dependencies (SDK 57), with
  lowercase slug `actaro`, visible name `Actaro`, and metadata version `0.1.0`.
- Keep template visuals explicitly identified as starter content.
- Preserve generated Expo guidance and append Actaro operating rules.
- Add only current lint/format tooling; no speculative application packages.
- Initialization itself included no Supabase connection or feature work. The resumed client task uses the supplied public configuration; no production identifiers or Figma edits.
- Architecture recorded in `docs/decisions/001-mobile-stack.md`.
- The user supplied Git identity; configured only for this repository. A focused
  local commit accompanies this reviewed setup. The user published initialization; subsequent local commits are not pushed without authorization.

## Resumed verification (2026-10-09)

- `npm test`: two regression tests pass; deliberate server-snapshot mutation fails as expected (exit 1) and was restored.
- `npm run check`: typecheck, lint, formatting and tests required before commit.
- `npm audit --json`: 29 affected packages before test tooling. Registry has no patched braces/node-forge releases; no incompatible forced framework change was applied.
- Test tooling installation reports 66 affected packages (16 moderate, 50 high). These advisories remain open and prevent a release-readiness claim.

## Supabase task verification (2026-10-09)

- `npm run check`: typecheck, lint, formatting and 19 tests pass (final check before commit).
- `npm run check:supabase`: PASS, Auth settings HTTP 200 and database SDK missing-table response `PGRST205`; no users/tables created or user rows read. The preliminary bare REST-root probe returned 401 and was replaced with the actual SDK request.
- `npx expo install --check`: PASS, SDK-compatible dependencies.
- `npx expo export --platform all`: PASS, Android/iOS Hermes bundles, web bundle and all four static routes.
- `git check-ignore .env`: PASS. `git diff --check`: required before commit.
- Native launches, real sign-in/session persistence, profile persistence and two-user RLS verification remain NOT_STARTED. No product feature completion inferred from these connection checks.

## Schema design evidence (2026-10-09)

- Read canonical profile/preferences, ownership, analytics and release-boundary requirements; cross-checked current Supabase RLS/user-trigger/type-generation and PostgreSQL timestamp documentation.
- Design scope is a first v0.1 migration specification plus later-domain data rules, not early implementation of future features. No schema was applied.
- `npm run check`: PASS (exit 0), including typecheck, lint, formatting and 19 tests. Blueprint review and passing application checks do not constitute database security verification.
- Client commit: `31849bd` (`feat: configure validated Supabase client integration`). Test baseline commit: `f5e2cc6` (`test: establish Expo foundation regression checks`). Neither was pushed.

## Authentication verification (2026-10-09)

- Supabase MCP get_project: PASS, ACTIVE_HEALTHY; list_tables(public): PASS, empty. Authorization is established. Earlier records of unavailable tools describe the previous session state.
- Auth settings previously returned HTTP 200, email signup enabled and confirmation required. This setting is preserved.
- Automated auth tests use mocked SDK boundaries. They establish app logic/contracts, not live signup or native persistence.
- Initial check failed on synchronous effect state; corrected initialization and reran. An initial callback test fixture captured an uninitialized mock; corrected the fixture. One cold-render timeout passed on rerun.
- `npm run check`: PASS (exit 0), typecheck, lint, formatting and 37 tests across seven suites.
- `npx expo export --platform all`: PASS (exit 0), final Android/iOS Hermes bundles, web bundle and six static routes. Exports do not prove native launch.
- `npm run check:supabase`: PASS (exit 0) outside the network sandbox after the restricted attempt failed. Auth settings accept public configuration; profiles still absent. No users or tables created.
- `npx expo install @expo-google-fonts/inter`: PASS; only current auth font dependency added. Existing dependencies preserved.
- Browser preview: BLOCKED, automation runtime failed to start twice. Live emails, callbacks and native runtime tests remain NOT_STARTED.
- `git diff --check`: PASS. Ignored `.env` remains outside the change set.

## Expo Go setup documentation (2026-10-09)

**DONE — README phone-testing instructions, unweighted documentation task.**

- Added Node/Expo Go requirements, fresh clone/root setup, `npm ci` and `npm i`, safe environment-file creation, LAN startup and Android/iPhone QR instructions.
- Included the physical iPhone Expo account requirement, SDK 57 compatibility, PowerShell wrappers, optional tunnel helper and cache/network troubleshooting. Linked the existing auth callback/testing guide.
- Verified flags against the installed CLI with `npx expo start --help`; inspected SDK 57 bundled native dependencies and current versioned/start/CLI docs. No dependencies or application code changed.
- `npm run check`: PASS (exit 0), typecheck, lint, formatting and 37 tests. Documentation does not prove a phone launch, live email callbacks or session persistence. Foundation completion remains 34.125%.
- Previous four development commits were pushed to `origin/main`, through `4481f8c`, with explicit user authorization. The user also authorized pushing future verified changes when ready.

## Confirmation feedback fix (2026-10-09)

**DONE — Confirmation success feedback and screen inventory; auth task 0.8 remains IN_PROGRESS.**

- User reported web signup, opening the confirmation email on a phone, an unreachable localhost redirect, then a successful password sign-in. Record this as user-reported evidence; it does not verify the full callback or native flow.
- Added `/auth/confirmed` using approved auth components. Successful signup callback exchange replaces the code URL with that route. The view shows success only when the SDK session has Supabase-owned `email_confirmed_at`; anonymous sessions and user-editable metadata cannot trigger the success state.
- Recovery callbacks retain the root destination and the existing SDK PASSWORD_RECOVERY state gate. Sign-in still opens Your Account. Home/Today and product tab navigation are not implemented: the shell is v0.1 work, the populated Today dashboard is v0.5 work.
- README lists all present auth states. AUTH_TESTING documents same-browser web confirmation, localhost on a phone, exact callback allowlists and the distinction between backend confirmation and a failed browser redirect. Remote Auth settings were not changed or inspected; no production hostname was invented.
- Corrected documentation about optional SDK PKCE flow-ID appending: the current client does not enable that experimental setting; callback forwarding remains supported when a flow ID is present.
- `npm run check`: PASS (exit 0), typecheck, lint, formatting and 41 tests across eight suites. Tests cover confirmation proof, one-use callback success/error and recovery routing.
- `npx expo export --platform all`: PASS (exit 0), Android/iOS/web bundles and seven static routes including `/auth/confirmed`. Exports are not phone launches or live email verification.
- Weighted completion remains 34.125%; this bug fix adds no new plan weight. Callback configuration/live confirmation, reset, sign-out and native persistence acceptance remain pending.

## Auth feedback presentation (2026-10-09)

**DONE — Auth feedback presentation fix; auth task 0.8 remains IN_PROGRESS.**

- Replaced input-like error cards with persistent plain text. Mobile success/information messages use a bottom snackbar; web error/success/information messages use a dismissible upper-right notification.
- Mounted feedback above the auth routes so successful sign-in/sign-out messages survive screen replacement. Success/information messages expire after eight seconds, errors after ten; hover and keyboard focus pause dismissal. A newer message replaces the previous message safely.
- Preserved existing safe error mapping, generic reset/resend responses and actual SDK success requirements. Web form errors have one live announcement through the notification; standalone and native inline errors retain accessible announcements. No dependencies, credentials, remote Auth settings or Figma content changed.
- Added notification regression tests and updated README/AUTH_TESTING with behavior and manual checks.
- `npm.cmd run check`: PASS (exit 0), typecheck, lint, formatting and 46 tests across nine suites.
- `npx.cmd expo export --platform all`: PASS (exit 0), Android/iOS/web bundles and seven static routes. Exports do not establish native runtime behavior.
- `git diff --check` and `git check-ignore .env`: PASS. The environment file remains outside the change set.
- Browser visual verification: BLOCKED; the automation runtime failed to start with a Windows sandbox helper error. No screenshot comparison or device check is claimed. Native safe-area/keyboard and live auth acceptance checks remain pending in AUTH_TESTING.
- Weighted foundation completion remains 34.125%; this bug fix adds no plan weight. Next actions remain web confirmation/reset verification, Android/iOS persistence/sign-out checks, then the independently verified profile/preferences migration.

## User testing and next module (2026-10-09)

- User reports web authentication testing, explicitly including sign-out. Confirmation/reset coverage and persistence after reopening are not specified. The follow-up confirms that native testing is pending: `npx expo login` was launched from `C:\Windows\System32`, offered a temporary Expo install and was cancelled once with Ctrl+C. This is CLI setup evidence, not a captured Expo Go app runtime error.
- Authentication remains IN_PROGRESS. Weighted foundation completion remains 34.125% until the live acceptance groups can be reconciled with specific evidence; the user report is preserved rather than treated as a complete Android/iOS test matrix.
- Next proposed module: v0.1 Profile / Preferences, split into independently verifiable schema/RLS, typed data-access and persisted UI tasks. The existing schema design is the starting specification; no migration or feature code is implemented by this planning update.
- No new API key is required for those tasks; the existing authorized Supabase connection and public application configuration suffice. Figma access is needed for exact profile UI matching.
- Planning-update validation: `npm.cmd run check` PASS (exit 0), including typecheck, lint, formatting and all 46 tests across nine suites. `git diff --check` PASS. No application code or database changes were made.

## Expo CLI working-directory guidance (2026-10-09)

- Confirmed that `node_modules/expo/package.json` exists in the Actaro root. `npx.cmd --no-install expo login --help` PASS (exit 0), using the installed CLI without downloading a second package.
- Added README troubleshooting for running login from the project root and using `--no-install`; Command Prompt uses `cd /d` to switch directories/drives. No dependencies or app configuration changed, and no interactive Expo account login was performed by the agent.
- Web auth/sign-out tests are user-reported; Android/iOS launch, confirmation/reset and persistence acceptance remain pending. Foundation completion stays 34.125%.
- `npm.cmd run check` PASS (exit 0): typecheck, lint, formatting and 46 tests across nine suites. No native launch or Expo account authentication is inferred from these checks.

## Expo Go testing and snackbar clearance (2026-10-09)

**DONE — Raise mobile snackbar; authentication remains IN_PROGRESS.**

- User reports successful sign-in and sign-out in Expo Go, following earlier web testing. Credit these two live acceptance groups; do not infer signup/email confirmation, password reset, reopen persistence or both native platforms.
- Raised mobile snackbar clearance from safe-area inset plus 16 points to inset plus 40 points, a 24-point increase. Web positioning is unchanged. The user's device must still confirm the adjusted position visually.
- `npm.cmd run check` PASS (exit 0): typecheck, lint, formatting and all 46 tests across nine suites. `git diff --check` required before commit. No dependencies changed.
- Auth earns 8/12 subtasks; foundation earns 14.65/40 (36.625%). The next authorized task is the profile/preferences database foundation.

## Profile/preferences database foundation (2026-10-09)

**DONE — First schema migration and database ownership verification; roadmap items 0.9–0.11 remain IN_PROGRESS.**

- Inspected the database: no public/private application tables, custom functions, Auth triggers or migrations; one Auth account, already confirmed. Preserved the account and backfilled its profile/preferences without copying credentials or identity fields.
- CLI generated the migration file; Supabase MCP applied `profile_preferences_foundation`, version `20261009165708`. The saved local filename matches remote history. Created only profiles/preferences plus necessary private validation/timestamp/initialization functions.
- Enabled RLS and four explicit SELECT/UPDATE ownership policies. Anonymous access and client INSERT/DELETE are denied. Column-level UPDATE grants protect owner IDs and server timestamps. Units/theme/timezone/display-name validation, initial defaults and account-deletion cascades are enforced by PostgreSQL.
- The migration's signup-trigger smoke check passed atomically. Executed `supabase/tests/profile_preferences.sql` through MCP: PASS for defaults, anonymous/missing-JWT denial, own reads/updates, two-user isolation, protected writes, invalid values, timestamps, trigger privileges and deletion cascades. All fixtures roll back; no emails sent.
- Post-test counts: one Auth account, one profile, one preference record; no missing confirmed profiles or preferences. Both tables have RLS. Generated actual TypeScript types and wired them into the shared client; feature services and Profile UI are not implemented yet.
- Updated the read-only probe to require anonymous PostgreSQL permission denial for both private tables. The restricted network attempt failed; the first unrestricted probe exposed HTTP 401 rather than the initially assumed 403. Corrected handling to require `42501` with HTTP 401/403, then `npm.cmd run check:supabase` PASS (exit 0). Auth settings HTTP 200; both private tables deny anonymous SDK access without reading user rows.
- Performance advisor: no findings. Security advisor: no table/RLS findings; [leaked-password protection is disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No Auth setting, paid service, secret or application dependency changed.
- Profile/preferences earns 1/4, RLS/security 3/4, data access 1/4; foundation totals 20.9/40 (52.25%). SQL verification is not proof of Profile UI or authenticated SDK persistence.
- `npm.cmd run check` PASS (exit 0): typecheck, lint, formatting and all 46 tests across nine suites after generated types were wired into the client. `git diff --check` and `git check-ignore .env` PASS. No privileged key or private user fields are committed.
