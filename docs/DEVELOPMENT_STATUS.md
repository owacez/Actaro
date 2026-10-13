# Actaro — Development Status

Updated: 2026-10-13 (America/Los_Angeles).

## Overall

- Current Release: **v0.3 — Strength Workout System**
- Release Completion: **79.285714% (55.5 / 70 weight)**
- Previous Releases: **v0.2 functional scope DONE (100%); v0.1 84.375% verified with remaining acceptance DEFERRED**
- Current Phase: **Phase 2 — Strength Workout System; tasks 2.4–2.10 verified; history next**
- Current Focus: Workout pre-start, both session modes, real set logging, independent timers, saved summaries and minimum resilience are verified. History and richer training context are next. The user authorized completing all of v0.3 without stopping between tasks.
- Status: **IN_PROGRESS**
- Blockers: No current workout-schema blocker. Figma subtree access remains limited; approved PDF fallback is available. Device/native build and foundation acceptance deferrals remain unchanged. Existing Auth leaked-password protection and dependency advisories remain follow-ups.
- Approval boundary: User explicitly authorized advancing to the next features on 2026-10-12 and postponing the remaining v0.1 tests. User subsequently authorized completing v0.2, then continuing with the next features on 2026-10-12; implement v0.3 one focused task at a time. Custom native builds remain deferred until the application is ready; no build was submitted.

Latest design access: the user supplied a local Figma PDF export and authorized
it as fallback when MCP calls are exhausted. Its first foundation page retains
an older green accent, conflicting with the canonical orange-coral decision and
previously fetched auth nodes; those verified orange values remain in use.
Pages 1–2 were rendered and inspected. The oversized third page's text was
extracted; relevant auth and Profile/Settings regions were subsequently rendered
successfully using bounded PDF viewports. The export supplies no dark palette;
exact unshown dark design matching remains pending.

The supplied canonical plan is `docs/ACTARO_DECELOPMENT_PLAN.md`; the requested
`docs/ACTARO_DEVELOPMENT_PLAN_FINAL.md` is absent. Both canonical files are preserved.
Figma tools are available; no Figma reads or edits are necessary for initialization.

## Completion accounting

Use the Development Plan's weights exactly. For each active item, earned weight
is `weight × verified completed subtasks / total subtasks`. DONE earns full weight;
NOT_STARTED earns zero; BLOCKED earns only completed subtasks. DEFERRED and DROPPED
items are excluded from their release denominator. Never infer progress from Figma.
All eight v0.2 tasks and v0.3 tasks 2.1–2.2 are verified. Task 2.3 earns all five verified groups for splits and predefined plans. Tasks 2.4–2.10 and 2.16 are now verified. PR detection and basic volume each earn one of two groups; history, frequency/muscle aggregation, training status and recovery remain pending. No roadmap item has been removed.

v0.1 denominator: `2 + 3 + 3 + 2 + 5 + 3 + 3 + 6 + 3 + 6 + 4 = 40`.
Subtasks below define a reproducible foundation baseline; partial values are
fractions, not subjective estimates. CI is implemented and its remote run passed.
v1.0 has no plan weight: track its nine explicit
release gates separately, without inventing a numeric weight.

Earned weight: `2 × 4/4 + 3 × 2/3 + 3 × 5/5 + 2 × 2/2 + 5 × 4/5 + 3 × 2/3 + 3 × 3/4 + 6 × 10/12 + 3 × 4/4 + 6 × 3/4 + 4 × 4/4 = 33.75`.
Release completion: `33.75 / 40 × 100 = 84.375%`. Rounded table percentages never
replace these exact fractions. This is verified foundation progress, not a completed v0.1 release.

v0.2 denominator: `2 + 4 + 3 + 5 + 4 + 5 + 3 + 2 = 28`.
Earned weight: `2 + 4 + 3 + 5 + 4 + 5 + 3 + 2 = 28`.
Release completion: `28 / 28 × 100 = 100%`. Each verification group below has implementation evidence; this does not claim physical-device QA or v0.1 acceptance.
Deferred unweighted acceptance-check records below do not reweight completed
foundation work or turn the unchanged 84.375% full-scope baseline into 100%.

v0.3 denominator: `6 + 6 + 5 + 3 + 3 + 10 + 4 + 2 + 4 + 4 + 4 + 3 + 4 + 4 + 3 + 5 = 70`.
Earned weight: `6 + 6 + 5 + 3 + 3 + 10 + 4 + 2 + 4 + 4 + 0 + 3 × 1/2 + 4 × 1/2 + 0 + 0 + 5 = 55.5`. Release completion is `55.5 / 70 × 100 = 79.285714285…%`. PR detection and basic volume each have two groups; only the first is verified.

## Feature Table

| Area             | Feature                                | Release | Weight | Status      | Completion | Notes                                                                                                                                           |
| ---------------- | -------------------------------------- | ------- | -----: | ----------- | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 / 0.1    | Repository                             | v0.1    |      2 | DONE        |       100% | Git, ignores, README, env template verified (4/4).                                                                                              |
| Phase 0 / 0.2    | React Native / Expo                    | v0.1    |      3 | IN_PROGRESS |     66.67% | Config/exports, TypeScript and EAS setup verified; native compilation/launch pending (2/3).                                                     |
| Phase 0 / 0.3    | Quality Baseline                       | v0.1    |      3 | DONE        |       100% | Typecheck, lint, format, tests and remote CI passed (5/5).                                                                                      |
| Phase 0 / 0.4    | App Structure                          | v0.1    |      2 | DONE        |       100% | Router scaffold and current architecture boundaries verified (2/2).                                                                             |
| Phase 0 / 0.5    | Design System                          | v0.1    |      5 | IN_PROGRESS |        80% | Palette, typography, layout and current component/state catalog verified (4/5); exact visual/theme acceptance pending.                          |
| Phase 0 / 0.6    | Navigation                             | v0.1    |      3 | IN_PROGRESS |     66.67% | Five routes and authenticated/recovery routing contracts verified (2/3); iPhone switching user-confirmed; complete live tab acceptance pending. |
| Phase 0 / 0.7    | Supabase Integration                   | v0.1    |      3 | IN_PROGRESS |        75% | Configuration, client/lifecycle contracts and live API probes verified (3/4); native checks pending.                                            |
| Phase 0 / 0.8    | Authentication                         | v0.1    |      6 | IN_PROGRESS |     83.33% | Six implementation contracts plus sign-in/out, reset and session persistence user-verified (10/12); signup/verification acceptance open.        |
| Phase 0 / 0.9    | Profile / Preferences                  | v0.1    |      3 | DONE        |       100% | Schema/services/UI and web/iPhone profile/preferences save/reopen user-verified (4/4); separate native email-change follow-up remains.          |
| Phase 0 / 0.10   | RLS / Security Foundation              | v0.1    |      6 | IN_PROGRESS |        75% | Grants/policies, database isolation/constraints and lifecycle tested (3/4); application integration pending.                                    |
| Phase 0 / 0.11   | Data Access Layer                      | v0.1    |      4 | DONE        |       100% | Types, owned services, validation/error mapping and live profile/preferences reads/writes verified (4/4).                                       |
| Phase 1 / 1.1    | Muscle & Equipment Schema              | v0.2    |      2 | DONE        |       100% | Hosted catalogs, stable UUIDs/constraints, RLS and generated types verified (4/4).                                                              |
| Phase 1 / 1.2    | Exercise Schema                        | v0.2    |      4 | DONE        |       100% | Source IDs, instructions, relationships and licenses deployed; repeat import preserves all 643 IDs (4/4).                                       |
| Phase 1 / 1.3    | Exercise Media Schema                  | v0.2    |      3 | DONE        |       100% | Separate pose metadata, validated paths/checksums, private bucket and signed reads verified (4/4).                                              |
| Phase 1 / 1.4    | RepDB Import Script                    | v0.2    |      5 | DONE        |       100% | Pinned local parsing, taxonomy mapping, attribution and atomic idempotent hosted import verified (4/4).                                         |
| Phase 1 / 1.5    | RepDB Media Import                     | v0.2    |      4 | DONE        |       100% | 1,138 WebP objects uploaded; metadata/checksums, signed retrieval and repeat upsert verified (4/4).                                             |
| Phase 1 / 1.6    | Exercise Library UI                    | v0.2    |      5 | DONE        |       100% | Search, muscle/equipment/setup filters, thumbnails and bounded pagination tested in API/UI/browser (4/4).                                       |
| Phase 1 / 1.7    | Exercise Detail                        | v0.2    |      3 | DONE        |       100% | Actual poses, instructions, muscles/equipment and attribution; authenticated detail/back browser flow passed (4/4).                             |
| Phase 1 / 1.8    | Equipment Profile                      | v0.2    |      2 | DONE        |       100% | Owned schema/RLS, atomic save service, editable UI and real browser save/reload passed (4/4).                                                   |
| Phase 2 / 2.1    | Workout Schema                         | v0.3    |      6 | DONE        |       100% | Six owned tables, snapshots/constraints, RLS/grants and hosted deployment/types verified (4/4).                                                 |
| Phase 2 / 2.2    | Custom Workout Builder                 | v0.3    |      6 | DONE        |       100% | Create/edit/delete, atomic owned save and search/detail → new/existing draft → discard/save/reopen verified (5/5).                              |
| Phase 2 / 2.3    | Splits & Predefined Training Plans     | v0.3    |      5 | DONE        |       100% | Split CRUD/active choice and real catalog/filter/preview/private adoption verified (5/5).                                                       |
| Phase 2 / 2.4    | Workout Pre-Start                      | v0.3    |      3 | DONE        |       100% | Actual exercises/sets, explicit estimate and durable Start entry verified.                                                                      |
| Phase 2 / 2.5    | Session Mode Chooser                   | v0.3    |      3 | DONE        |       100% | Timed Workout / Log Only choices start the dedicated saved draft.                                                                               |
| Phase 2 / 2.6    | Dedicated Active Workout               | v0.3    |     10 | DONE        |       100% | Compact media/metadata, previous/best, set table/add/remove/next/previous/finish verified.                                                      |
| Phase 2 / 2.7    | Timed Session                          | v0.3    |      4 | DONE        |       100% | Pause/resume excludes paused time; nonzero duration saves and rest stays independent.                                                           |
| Phase 2 / 2.8    | Log Only                               | v0.3    |      2 | DONE        |       100% | No total timer; complete persistence and direct exercise entry verified.                                                                        |
| Phase 2 / 2.9    | Rest Timer                             | v0.3    |      4 | DONE        |       100% | Auto start, pause/resume, skip and ±15 seconds verified in both modes.                                                                          |
| Phase 2 / 2.10   | Workout Summary                        | v0.3    |      4 | DONE        |       100% | Actual completed exercises/sets/volume/duration/records and note displayed after acknowledgement.                                               |
| Phase 2 / 2.11   | Workout History                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.11.                                                                                                             |
| Phase 2 / 2.12   | PR Detection                           | v0.3    |      3 | IN_PROGRESS |        50% | Deterministic detection/first record/matched load/Epley verified; history recalculation pending (1/2).                                          |
| Phase 2 / 2.13   | Training Volume                        | v0.3    |      4 | IN_PROGRESS |        50% | Completed working sets/reps/known external volume verified; frequency/muscle aggregation pending (1/2).                                         |
| Phase 2 / 2.14   | Training Status                        | v0.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §2.14.                                                                                                             |
| Phase 2 / 2.15   | Recovery Check                         | v0.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §2.15.                                                                                                             |
| Phase 2 / 2.16   | Active Workout Resilience              | v0.3    |      5 | DONE        |       100% | Owner-scoped queued device save, wall-time clock, restart and offline completion/retry verified; device smoke remains pending.                  |
| Phase 3 / 3.1    | Nutrition Schema                       | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.1.                                                                                                              |
| Phase 3 / 3.2    | Nutrition Targets                      | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.2.                                                                                                              |
| Phase 3 / 3.3    | Food Database/Search                   | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.3.                                                                                                              |
| Phase 3 / 3.4    | Serving Units / Conversion             | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.4.                                                                                                              |
| Phase 3 / 3.5    | Portion Editor                         | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.5.                                                                                                              |
| Phase 3 / 3.6    | Nutrition Calculation Engine           | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.6.                                                                                                              |
| Phase 3 / 3.7    | Food Diary                             | v0.4    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §3.7.                                                                                                              |
| Phase 3 / 3.8    | Custom Foods                           | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.8.                                                                                                              |
| Phase 3 / 3.9    | Favorites / Recent / Frequent          | v0.4    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §3.9.                                                                                                              |
| Phase 3 / 3.10   | Saved Meals / Copy Meal / Copy Day     | v0.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §3.10.                                                                                                             |
| Phase 3 / 3.11   | Recipes                                | v0.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §3.11.                                                                                                             |
| Phase 3 / 3.12   | Recipe-by-Weight                       | v0.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §3.12.                                                                                                             |
| Phase 3 / 3.13   | Hydration                              | v0.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §3.13.                                                                                                             |
| Phase 4 / 4.1    | Habit Schema                           | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.1.                                                                                                              |
| Phase 4 / 4.2    | Habit Creation                         | v0.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §4.2.                                                                                                              |
| Phase 4 / 4.3    | Habit Logging                          | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.3.                                                                                                              |
| Phase 4 / 4.4    | Habit History / Consistency            | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.4.                                                                                                              |
| Phase 4 / 4.5    | Motivation Mode                        | v0.5    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §4.5.                                                                                                              |
| Phase 4 / 4.6    | Goal Schema                            | v0.5    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §4.6.                                                                                                              |
| Phase 4 / 4.7    | Goal Creation                          | v0.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §4.7.                                                                                                              |
| Phase 4 / 4.8    | Goal Progress                          | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.8.                                                                                                              |
| Phase 4 / 4.9    | Bodyweight Logging                     | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.9.                                                                                                              |
| Phase 4 / 4.10   | Steps Foundation                       | v0.5    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §4.10.                                                                                                             |
| Phase 4 / 4.11   | Today Dashboard                        | v0.5    |      8 | NOT_STARTED |         0% | Requirements: canonical plan §4.11.                                                                                                             |
| Phase 5 / 5.1    | Weight Progress                        | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.1.                                                                                                              |
| Phase 5 / 5.2    | Nutrition Progress                     | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.2.                                                                                                              |
| Phase 5 / 5.3    | Workout Frequency                      | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.3.                                                                                                              |
| Phase 5 / 5.4    | Strength Progress                      | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.4.                                                                                                              |
| Phase 5 / 5.5    | Training Volume                        | v0.6    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §5.5.                                                                                                              |
| Phase 5 / 5.6    | Steps Progress                         | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.6.                                                                                                              |
| Phase 5 / 5.7    | Habit Progress                         | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.7.                                                                                                              |
| Phase 5 / 5.8    | Time Filters                           | v0.6    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §5.8.                                                                                                              |
| Phase 5 / 5.9    | Weekly / Monthly Summary               | v0.6    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §5.9.                                                                                                              |
| Phase 6 / 6.1    | Accessibility                          | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.1.                                                                                                              |
| Phase 6 / 6.2    | Performance                            | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.2.                                                                                                              |
| Phase 6 / 6.3    | Security Review                        | v0.9    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §6.3.                                                                                                              |
| Phase 6 / 6.4    | Error / Crash Handling                 | v0.9    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §6.4.                                                                                                              |
| Phase 6 / 6.5    | Notifications                          | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.5.                                                                                                              |
| Phase 6 / 6.6    | Personal Beta                          | v0.9    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §6.6.                                                                                                              |
| Phase 6 / 6.7    | Bug Fix / Polish                       | v0.9    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §6.7.                                                                                                              |
| Phase 6 / 6.8    | Documentation Review                   | v0.9    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §6.8.                                                                                                              |
| Phase 7          | Core release gate (nine prerequisites) | v1.0    |      — | NOT_STARTED |        0/9 | Release gate, no new weighted feature scope.                                                                                                    |
| Phase 8 / 8.1    | Motion / Activity Source Evaluation    | v1.1    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §8.1.                                                                                                              |
| Phase 8 / 8.2    | Active Minutes Calculation             | v1.1    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §8.2.                                                                                                              |
| Phase 8 / 8.3    | Today Integration                      | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.3.                                                                                                              |
| Phase 8 / 8.4    | Progress Integration                   | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.4.                                                                                                              |
| Phase 8 / 8.5    | Accuracy / Messaging Review            | v1.1    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §8.5.                                                                                                              |
| Phase 9 / 9.1    | Location Permission Flow               | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.1.                                                                                                              |
| Phase 9 / 9.2    | Run Session Schema                     | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.2.                                                                                                              |
| Phase 9 / 9.3    | Run Start                              | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.3.                                                                                                              |
| Phase 9 / 9.4    | GPS Route Recording                    | v1.2    |      8 | NOT_STARTED |         0% | Requirements: canonical plan §9.4.                                                                                                              |
| Phase 9 / 9.5    | Active Run                             | v1.2    |      7 | NOT_STARTED |         0% | Requirements: canonical plan §9.5.                                                                                                              |
| Phase 9 / 9.6    | Distance / Pace Calculation            | v1.2    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §9.6.                                                                                                              |
| Phase 9 / 9.7    | Run Summary                            | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.7.                                                                                                              |
| Phase 9 / 9.8    | Route Thumbnail                        | v1.2    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §9.8.                                                                                                              |
| Phase 9 / 9.9    | Run History                            | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.9.                                                                                                              |
| Phase 9 / 9.10   | Run Detail                             | v1.2    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §9.10.                                                                                                             |
| Phase 9 / 9.11   | Today Recent-Run Card                  | v1.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §9.11.                                                                                                             |
| Phase 9 / 9.12   | Progress Running Card                  | v1.2    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §9.12.                                                                                                             |
| Phase 10 / 10.1  | Performance Dashboard                  | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.1.                                                                                                             |
| Phase 10 / 10.2  | Training Block Comparison              | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.2.                                                                                                             |
| Phase 10 / 10.3  | Unified Timeline                       | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.3.                                                                                                             |
| Phase 10 / 10.4  | Advanced Cross-Metric Analytics        | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.4.                                                                                                             |
| Phase 10 / 10.5  | Badge Rules Engine                     | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.5.                                                                                                             |
| Phase 10 / 10.6  | Achievement UI                         | v1.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §10.6.                                                                                                             |
| Phase 11 / 11.1  | Image Capture                          | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.1.                                                                                                             |
| Phase 11 / 11.2  | Secure Vision Provider Integration     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.2.                                                                                                             |
| Phase 11 / 11.3  | Food Identification                    | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.3.                                                                                                             |
| Phase 11 / 11.4  | Portion Estimation                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.4.                                                                                                             |
| Phase 11 / 11.5  | Nutrition Matching                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.5.                                                                                                             |
| Phase 11 / 11.6  | Editable Review                        | v1.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §11.6.                                                                                                             |
| Phase 11 / 11.7  | Confirmed Logging                      | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.7.                                                                                                             |
| Phase 12 / 12.1  | Local Data Strategy                    | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.1.                                                                                                             |
| Phase 12 / 12.2  | Sync Queue                             | v1.5    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §12.2.                                                                                                             |
| Phase 12 / 12.3  | Idempotency                            | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.3.                                                                                                             |
| Phase 12 / 12.4  | Conflict Handling                      | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.4.                                                                                                             |
| Phase 12 / 12.5  | Reconciliation                         | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.5.                                                                                                             |
| Phase 12 / 12.6  | Offline Coverage Expansion             | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.6.                                                                                                             |
| Phase 13 / 13.1  | Apple Health                           | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.1.                                                                                                             |
| Phase 13 / 13.2  | Android Health Connect                 | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.2.                                                                                                             |
| Phase 13 / 13.3  | Imported Activities                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.3.                                                                                                             |
| Phase 13 / 13.4  | Sleep                                  | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.4.                                                                                                             |
| Phase 13 / 13.5  | Heart Rate                             | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.5.                                                                                                             |
| Phase 13 / 13.6  | HRV                                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.6.                                                                                                             |
| Phase 13 / 13.7  | Sensor-Enhanced Recovery               | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.7.                                                                                                             |
| Phase 13 / 13.8  | Physiological Training Load            | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.8.                                                                                                             |
| Phase 13 / 13.9  | Daily Suggested Workout                | v2.0    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §13.9.                                                                                                             |
| Phase 13 / 13.10 | Advanced Running Analytics             | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.10.                                                                                                            |

## Phase Summary

| Phase    | Release | Purpose                           | Planned weight | Completion | Status      |
| -------- | ------- | --------------------------------- | -------------: | ---------: | ----------- |
| Phase 0  | v0.1    | Foundation                        |             40 |    84.375% | IN_PROGRESS |
| Phase 1  | v0.2    | Exercise Library                  |             28 |       100% | DONE        |
| Phase 2  | v0.3    | Strength Workout System           |             70 | 79.285714% | IN_PROGRESS |
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
  appropriate). Verified: 5/5; GitHub CI passed locked installation, all checks and all-platform export. Dependency security advisories remain separate open release concerns.
- **0.4 App Structure (2 subtasks):** working Expo Router entry/layout with
  non-route code outside routes; feature/UI/business/data boundaries documented
  and applied to the current minimal scaffold. Verified: 2/2.
- **0.7 Supabase Integration (4 subtasks):** validated environment; shared client/storage/lifecycle configuration; read-only live Auth/database probes; native integration smoke tests on Android and iOS. Verified: 3/4. Native boundary mocks and exports do not count as device tests.
- **0.8 Authentication (12 subtasks):** each of the six canonical flows has an implementation/contract-test subtask and a live acceptance subtask: signup, sign-in, sign-out, password reset, session persistence and verification. Verified: 10/12. Six implementation contracts pass; the user verified sign-in/sign-out, password reset/new-password sign-in and session persistence on web/iPhone. The broad report says mobile features work except email change; signup/email verification have not been individually identified, so those two live groups remain open. Web email change passed; native email change and post-crypto device acceptance remain open. Android is unavailable.
- **0.9 Profile / Preferences (4 subtasks):** schema/default record creation; typed feature reads/updates; complete Profile/preferences UI and states; authenticated application save/reopen acceptance. Verified: 4/4. UI/validation/save contracts pass, and the user verified name/preferences save/reopen and themes on web/iPhone. Native email change remains a separately tracked Auth follow-up; two-account application isolation is tracked under security. Exact Figma parity remains a separate design-system gate.
- **0.10 RLS / Security Foundation (4 subtasks):** least-privilege grants and ownership policies; real database anonymous/two-user/protected-write/constraint tests; secure initialization/backfill/timestamps/deletion cascades and private-function privileges; authenticated application integration and foundation security acceptance. Verified: 3/4. Real SQL roles and anonymous SDK probes pass; application integration and the observed Auth security warning remain tracked.
- **0.11 Data Access Layer (4 subtasks):** actual generated database types in shared client; feature-local owned queries/mutations; permitted-field validation and safe error mapping; meaningful feature request/integration tests. Verified: 4/4. The 36 SDK transport/validation tests pass; user-verified live profile/preferences persistence now establishes the current authenticated read/write integration. Two-account application isolation remains the security gate, not inferred from these saves.
- **0.5 Design System (5 subtasks):** shared verified palette; shared typography; shared layout/radius/touch-target values; complete current component catalog and screen states; full Figma matching including themes. Verified: 4/5. Shared controls now cover buttons, inputs, account cards, preference chips, selected tabs and real loading/empty/error states. Theme-aware styling uses verified light values and the user-approved functional dark palette; explicit preference selection/save contracts pass. Full visual/theme acceptance remains pending. No unused future performance component or guessed lime color was added.
- **0.6 Navigation (3 subtasks):** five-tab composition and bundle validation; signed-in landing/signed-out/recovery routing contracts; live switching/back/sign-out acceptance on web and native. Verified: 2/3. Navigator contract tests mock rendering; separate isolated browser checks exercise actual tab selection with a local session fixture. The user confirms tab switching and the new icon rendering. Complete live back/sign-out/recovery acceptance remains open; the icon request intentionally replaces the PDF's dots.

## v0.1 dependencies and remaining acceptance (2026-10-11)

The user confirms that the new icons load correctly. That closes the reported
icon-rendering follow-up; it does not by itself verify every back/sign-out/recovery
transition or the unavailable Android target. Release completion remains
**84.375%**, with **6.25 / 40** weight still unearned. A focused task ending is not
an approval boundary for the already authorized remainder of v0.1.

| Plan item                 | Included features                                                                                                                                                  | Dependency                                                                                                                                        | Current evidence / remaining work                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 Repository            | Git, ignores, README, env template                                                                                                                                 | Local filesystem/Git only                                                                                                                         | DONE, 100%. No new credentials needed.                                                                                                                                                                                                                            |
| 0.2 React Native / Expo   | App configuration, TypeScript, development-build setup/launch                                                                                                      | Local checks; custom launch needs build service/toolchain, signing and target device                                                              | 2/3 verified. Expo Go launches and exports pass; custom native launch is user-deferred. Android is unavailable.                                                                                                                                                   |
| 0.3 Quality Baseline      | Typecheck, lint, formatting, tests, CI                                                                                                                             | Installed tooling; remote CI needs GitHub                                                                                                         | DONE, 100%. Current tests run without live Supabase. Remote CI previously passed.                                                                                                                                                                                 |
| 0.4 App Structure         | Expo Router layouts and feature/UI/business/data boundaries                                                                                                        | Local code only                                                                                                                                   | DONE, 100%. No infrastructure or additional state framework needed.                                                                                                                                                                                               |
| 0.5 Design System         | Palette, type, spacing/radii/borders, buttons, inputs, cards, choices, loading/empty/error states, approved themes                                                 | Local components and approved Figma/PDF/user decisions                                                                                            | 4/5 verified. Current controls exist; complete visual/interaction review and any evidenced fixes can proceed without Supabase. PDF fallback is available; unavailable exact designs must stay disclosed rather than guessed.                                      |
| 0.6 Navigation            | Today, Fitness, Nutrition, Progress, More; Profile/Preferences back paths; signed-out/recovery guards; icons                                                       | Local rendering/route checks; full live session transitions need functioning Auth                                                                 | 2/3 verified. Five tabs, guards, offline browser selection and user-reported icons/switching pass. Local back/guard review can continue; finish the remaining live transition checklist when backend access recovers.                                             |
| 0.7 Supabase Integration  | Environment validation, shared client, session storage/lifecycle, live connectivity, platform integration                                                          | Existing public URL/key and Supabase availability; remaining target-platform checks need devices                                                  | 3/4 verified. Connected and previously probed; further live probes are paused. No replacement keys are required.                                                                                                                                                  |
| 0.8 Authentication        | Signup, sign-in, sign-out, password reset, session persistence, email verification; email/password account updates                                                 | Local validation/contracts are independent; live signup/verification needs Supabase Auth, email delivery and a working initiating-device callback | 10/12 verified. All six implementation contracts pass; sign-in/out, reset and session persistence are user-confirmed. Individually identified signup/verification live groups, native email change and post-crypto device checks remain. Web email change passed. |
| 0.9 Profile / Preferences | Name, current email/change email, password update, four unit families, time zone, notification/gamification opt-ins, System/Light/Dark; account-private defaults   | Existing Auth, profile/preferences services and private tables for actual saves; draft/UI checks are local                                        | DONE, 100% of its four groups. User verified persistence/themes. Native email change is tracked under Auth; account isolation under Security; visual parity under Design. Opt-ins do not implement later reminders/achievements.                                  |
| 0.10 RLS / Security       | Ownership policies/grants, anonymous/two-user SQL isolation, protected fields/constraints, initialization/cascades, safe validation/logging, app account isolation | Local review/contracts are independent; real two-account application isolation needs working Auth/database and two test accounts                  | 3/4 verified. Real SQL RLS tests already passed. Remaining app-level isolation and native crypto/device acceptance cannot be replaced by mocks. No service-role key belongs in the mobile app.                                                                    |
| 0.11 Data Access Layer    | Generated types, feature-owned reads/writes, identity/field validation, safe errors and integration contracts                                                      | Existing integration/schema; contract tests are local                                                                                             | DONE, 100%. Current live profile/preferences reads/writes are user-verified; no generic backend framework needed.                                                                                                                                                 |

### Exact remaining weighted groups

- Expo native-build launch: **1.00 weight**, user-deferred; do not submit a build.
- Design visual/theme acceptance: **1.00 weight**, local review can proceed with
  available approved references. Exact unprovided Figma states remain disclosed.
- Navigation live acceptance: **1.00 weight**, mixed local interaction work and
  live session-transition checks; the icons themselves are user-confirmed.
- Supabase platform integration acceptance: **0.75 weight**, remaining device
  checks depend on available targets/backend. Repeating health probes earns nothing.
- Signup and verification live groups: **1.00 weight total**, depend on Auth/email
  availability and valid callbacks. Existing sign-in/out/reset/session evidence
  must not be re-requested merely to repeat completed testing.
- Security application integration: **1.50 weight**, two-account app isolation
  and relevant device acceptance remain; SQL security evidence is already recorded.

Backend quotas are user-reported; their exact type/reset time has not been probed.
No paid SMTP, new API key, new backend, additional schema or approval is required
to continue the independent work. No later module should be implemented just to
fill this verification gap. Full account deletion/data export remain retained
Source-of-Truth requirements with no separately assigned plan task/weight; their
placement is unresolved, not silently declared complete. Privacy currently means
account ownership/RLS and an explanatory Preferences section, not a sharing feature.

**Historical work order (2026-10-11):** foundation review first. Superseded by the
user's 2026-10-12 instruction to defer remaining checks and advance to v0.2.
Full release acceptance still requires the unverified gates; no completion is inferred.

Inventory verification: reread both canonical documents, the weighted ledger,
Auth/Profile acceptance checklists and current shared controls/preferences code.
`npm.cmd run check`: PASS (132 tests / 18 suites, TypeScript, lint, formatting).
The final documentation formatting check and `git diff --check` also pass. This
reconciliation changes documentation only, adds no completion weight and sends
no Supabase request. Reuse the existing local preview for the next visual task.

## Deferred v0.1 testing (2026-10-12)

The user explicitly requested testing these later. These are unweighted acceptance
records, not removed roadmap features. Preserve the 84.375% full-scope baseline and
existing passing evidence; no repeat of accepted sign-in/out, reset, persistence or
theme checks is required. Every item below is **DEFERRED**, not passed.

| Remaining check                                                                                     | Status   | Resume condition                                                                               |
| --------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Individually identified signup/email verification and native email change after the PKCE correction | DEFERRED | Auth/email availability recovers; validate callbacks on the initiating platform.               |
| Two-account application isolation                                                                   | DEFERRED | Live Auth/data checks resume; keep already-passing SQL RLS evidence.                           |
| Complete Profile/Preferences visual and theme acceptance                                            | DEFERRED | Next foundation review using approved references and user-approved differences.                |
| Complete back/sign-out/recovery transitions across tabs                                             | DEFERRED | Next web/native acceptance pass; icon rendering and basic tab switching are already confirmed. |
| Remaining cross-platform Supabase integration                                                       | DEFERRED | Device/backend availability, including an Android target.                                      |
| Custom native development-build compilation and launch                                              | DEFERRED | User authorizes builds when the application is ready; no build now.                            |

## Exercise Library subtask ledger

Each task has four independently verified groups and earns its full canonical weight.

| Task                  | Weight | Status | Verification groups (4/4)                                                                                                       |
| --------------------- | -----: | ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Muscle/equipment  |      2 | DONE   | Migration; constraints/stable IDs; grants/RLS; hosted deployment/generated types.                                               |
| 1.2 Exercises         |      4 | DONE   | Core/source fields; muscle/equipment relationships; validation/read security; hosted import/reimport.                           |
| 1.3 Media schema      |      3 | DONE   | Separate pose metadata; paths/size/checksum constraints; private bucket/read policy; signed retrieval.                          |
| 1.4 Data import       |      5 | DONE   | Pinned local parser; taxonomy/source mapping; license/attribution; idempotent atomic import.                                    |
| 1.5 Media import      |      4 | DONE   | Validated WebP downloads; storage upload; metadata after upload; checksum/repeat upsert.                                        |
| 1.6 Library           |      5 | DONE   | Search/filter API; compact real-data rows/images; bounded pagination/error states; authenticated responsive browser flow.       |
| 1.7 Detail            |      3 | DONE   | Typed detail reads; poses/instructions; muscles/equipment/attribution; detail/back and loading/error contracts.                 |
| 1.8 Equipment profile |      2 | DONE   | Owned schema/atomic replacement; typed validated service; save/discard/error UI; two-account isolation and browser save/reopen. |

Physical iPhone/Android smoke tests of the new library module remain NOT_STARTED;
responsive browser checks and native exports are not device tests. Custom native
builds remain DEFERRED under the user's instruction. Figma quota fallback and
design differences are documented in `docs/decisions/004-repdb-import.md`.

## Workout subtask ledger

**2.1 Workout Schema (weight 6; 4/4 verified):**

| Verification group                | Status | Evidence                                                                                                                                                   |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Templates/sessions/sets           | DONE   | Six owned tables with explicit ordering, planned versus actual facts, modes/timestamps/notes.                                                              |
| Historical/measurement validation | DONE   | Snapshot preservation, finite times, recorded date/timezone, Timed/Log Only duration rules, numeric constraints and deletion behavior pass real SQL tests. |
| Grants/RLS/ownership              | DONE   | All six tables reject anonymous access, cross-account reads/writes, spoofed parents and protected identity/snapshot changes.                               |
| Hosted deployment/generated types | DONE   | Migrations 20261012114346 and 20261012114520 applied; generated types, hosted rollback suite and npm check pass.                                           |

**2.2 Custom Workout Builder (weight 6; 5/5 verified after expanded acceptance):**

| Verification group       | Status | Evidence                                                                                                                                                       |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atomic owned persistence | DONE   | Invoker RPC with Auth-derived owner; retries preserve template ID; invalid children roll back; anonymous/cross-owner saves denied in hosted SQL.               |
| Typed service/validation | DONE   | Account checks, bounded list/load/save, kg/lb conversion, nullable weight/RPE and safe errors; SDK/model tests pass.                                           |
| Functional builder/list  | DONE   | Real searchable exercise picker, thumbnails, reorder/remove, editable sets/reps/weight/rest/RPE/notes, loading/empty/retry/discard/pending states.             |
| Integration/verification | DONE   | Real-session create/save/reload/reopen/edit/save/reopen browser flow; responsive light/dark inspection; all checks/exports pass.                               |
| Standalone add shortcut  | DONE   | Search/detail → choose new/existing workout → load actual exercise into draft → discard or save/reopen. URL guards, limits, retry and original targets tested. |

**2.3 Splits and plans (weight 5; 5/5 verified):**

| Verification group                | Status | Evidence                                                                                                                                     |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Split persistence/security        | DONE   | Owned split/day tables, seven-day atomic save, one active split, owner/FK/rollback/grant checks pass locally and hosted.                     |
| Split editor/list                 | DONE   | Create/reopen/edit/delete; actual named workout selection; rest/unassigned states; active choice; draft/discard/error/pending states tested. |
| Split integration                 | DONE   | Real browser save/reopen/edit/reload, active switch, cancel/delete and retained workouts; responsive light/dark inspection.                  |
| Predefined catalog/filter/preview | DONE   | Seven source-referenced editable strength families, actual RepDB exercise/equipment names, weekly preview and all four filters verified.     |
| Owned plan adoption               | DONE   | Atomic private copy/active split, idempotent retry, rollback/ownership; real browser adopt/edit/save/reload passed.                          |

Tasks 2.4–2.10 and 2.16 are verified; 2.12–2.13 are partial. Tasks 2.11 and 2.14–2.15 remain NOT_STARTED. Device smoke testing is
NOT_STARTED; browser responsive layouts and native exports do not count as device
tests. Real disposable-account sessions have been logged by the new session flow.

## v1.0 release gate

**Session verification groups (2026-10-13):** tasks 2.4–2.10 are each verified
end to end by model/service/UI tests, hosted rollback SQL and real public-client
browser logging. Task 2.16 covers durable owner-scoped drafts/serialized storage,
wall-time pause/background/restart math with foreground refresh, and frozen
offline completion/acknowledged retry (3/3). Native device background smoke remains
an unweighted pending acceptance check; no EAS/native build was requested or run.
Task 2.12 has detection/tests DONE and edit/delete recalculation NOT_STARTED (1/2).
Task 2.13 has completed working-set/repetition/known-load volume DONE and
frequency/primary-muscle aggregation NOT_STARTED (1/2).

| Prerequisite                 | Status      | Evidence                                                                        |
| ---------------------------- | ----------- | ------------------------------------------------------------------------------- |
| Foundation stable            | NOT_STARTED | v0.1 release acceptance pending.                                                |
| Exercise library stable      | DONE        | v0.2 canonical functional acceptance passed; device follow-up remains recorded. |
| Strength workout flow stable | NOT_STARTED | v0.3 pending.                                                                   |
| Manual nutrition stable      | NOT_STARTED | v0.4 pending.                                                                   |
| Habits/goals stable          | NOT_STARTED | v0.5 pending.                                                                   |
| Today stable                 | NOT_STARTED | v0.5 pending.                                                                   |
| Basic Progress stable        | NOT_STARTED | v0.6 pending.                                                                   |
| Security review complete     | NOT_STARTED | v0.9 pending.                                                                   |
| Personal beta complete       | NOT_STARTED | v0.9 pending.                                                                   |

## Retained and deferred scope

These source-of-truth requirements have no separate plan weight. Preserve them
without assigning an invented release/weight; resolve their exact task placement
before implementation. DEFERRED means intentionally not in this setup's scope.

| Feature or requirement                                                     | Release / placement                                          | Status      | Authority / note                                                                                                                     |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Account deletion and data export                                           | Core security work; exact task not separately numbered       | NOT_STARTED | Source §20; retain ownership/privacy requirements.                                                                                   |
| Body measurements and measurement history                                  | Body goals/progress; exact task not separately numbered      | NOT_STARTED | Source §§13–14, 21.                                                                                                                  |
| User-created exercises                                                     | Placement undecided                                          | DEFERRED    | Source §21 ownership/RLS.                                                                                                            |
| Warm-up sets, supersets, drop sets, advanced set types                     | Later strength enhancement; release unassigned               | DEFERRED    | Source §8.4.                                                                                                                         |
| Optional RPE and recovery stress input                                     | When corresponding training tasks are approved               | NOT_STARTED | Source §§8.4, 10.2, 10.4; optional, no extra weight.                                                                                 |
| Fiber, sodium, potassium, micronutrients                                   | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.1.                                                                                                                        |
| Barcode and nutrition-label scanning                                       | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                                                                                       |
| What-If Nutrition and deterministic meal substitutions                     | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                                                                                       |
| Dashboard customization/layout preferences                                 | Later enhancement; release unassigned                        | DEFERRED    | Source §§6, 7.                                                                                                                       |
| Units, theme, notifications, privacy, gamification preferences             | v0.1 preferences; notifications also v0.9                    | IN_PROGRESS | Private schema/services tested; UI and behavior integration pending.                                                                 |
| Initial strength plan families and equipment/goal/experience/day filters   | v0.3 plan task                                               | DONE        | Seven strength families verified. Beginner Running retained DEFERRED until v1.2 running sessions; no early GPS or fake strength log. |
| Plateau detection, muscle balance, goal/step/running trends, What changed? | Analytics phases; exact subtask placement to be reviewed     | NOT_STARTED | Source §14.7; basic/advanced boundaries must be respected.                                                                           |
| Running goals/events, elevation, splits, start/end markers, cadence and HR | Running / later advanced running; exact placement unassigned | DEFERRED    | Source §§13, 16; supported data and later release approval required.                                                                 |
| Activity distance/active days and richer phone activity context            | Activity phases; exact placement to be reviewed              | NOT_STARTED | Source §§13–16; simplest supported steps source first.                                                                               |
| Semantic search, exercise-form vision, optional AI explanations            | Only if justified; release unassigned                        | DEFERRED    | Source §18.2.                                                                                                                        |
| Wearable-specific integrations beyond named health platforms               | v2.0 direction; provider decisions pending                   | NOT_STARTED | Source §22; no provider implementation assumed.                                                                                      |
| Branding/store-name/domain clearance and production bundle IDs             | Before public launch                                         | NOT_STARTED | Source §1.0; no ownership or identity invented.                                                                                      |
| Generic chatbot, autonomous coach, AI motivational spam                    | Explicitly excluded unless user changes scope                | DROPPED     | Source §§18, 23; documented exclusion, not a new scope decision.                                                                     |
| Medical/injury diagnosis and accurate-looking AI body-fat estimates        | Explicitly excluded unless scope changes                     | DROPPED     | Source §§18, 23.                                                                                                                     |
| Fake physiological readiness, Fitness Age, Body Battery imitation          | Explicitly excluded unless scope changes                     | DROPPED     | Source §23.                                                                                                                          |
| Early microservices, Kubernetes/GKE, unnecessary custom backend            | Explicitly excluded for early versions                       | DROPPED     | Source §§19, 23; real future backend triggers remain documented.                                                                     |

## Last Completed

**DONE — Dedicated Timed / Log Only workout flow and minimum resilience (2026-10-13).**

- Applied `20261013103845_persist_workout_sessions.sql` and regenerated types:
  invoker atomic performed-fact save, revision/mutation acknowledgement, stable
  historical snapshots, owned previous/best queries and safe rollback.
- Connected saved workout preview → mode → dedicated logger; direct search/detail
  entry uses the same flow. Compact technique media and metadata accompany fast
  editable rows, real previous/best values, add/remove and next/previous controls.
- Timed uses pause-aware elapsed duration; Log Only persists null duration. Rest
  auto-start/pause/resume/skip/±15 is independent. Completed sets alone contribute
  to saved facts and summary. First records are distinguished from improvements.
- One account-scoped device draft uses queued AsyncStorage writes. Failed local
  writes are reported. Failed network completion keeps a frozen same-mutation copy;
  only acknowledgement enables a saved summary and Done clearing the local copy.
- `node .actaro-tools/test-sessions.mjs`: PASS all migrations, existing foundation
  constraints and session retry/stale edit/snapshot/invalid-save/ownership tests.
  `supabase/tests/workout_sessions.sql` also PASS hosted, rollback only/no emails.
- `npm.cmd run check`: PASS typecheck/lint/format and 192 Jest + 4 Node tests
  (196 total; 31 Jest suites). `expo.cmd export --platform all`: PASS Android,
  iOS and web bundles, 27 static routes. No new application package was added.
- `node .actaro-tools/check-sessions-browser.mjs`: PASS both modes, actual logs,
  independent rest/session controls, reload, offline finish/frozen retry, saved
  summaries/previous results and direct exercise cancellation. Browser harness
  DOM serialization was corrected; no production auth bypass was introduced.
- `node .actaro-tools/check-session-timer.mjs`: PASS nonzero persisted duration,
  excluded pause time, four-exercise navigation, completed-only summary and zero
  external load. 390 light/320 dark session and summary screenshots inspected.
- Supabase security advisor: no new RLS/function warnings; existing Auth
  [leaked-password warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
  remains unchanged. History UI, aggregate context and recovery remain pending.

**DONE — Predefined strength plans; final two task 2.3 groups (2026-10-13).**

- Applied `20261013084115_predefined_training_plans.sql`; regenerated hosted types.
- Seven shared editable strength recipes reference stable RepDB IDs; filters use
  actual goal/experience/days/equipment; preview shows exercises, targets and week.
- Authenticated atomic adoption creates private templates and an active split.
  Stable-ID retry avoids duplicates. Invalid/foreign adoption rolls back; edits and
  split deletion preserve independent templates. No test emails were sent.
- `node .actaro-tools/test-plans.mjs`: PASS all migrations, actual 643-exercise
  import twice, existing builder regressions and plan ownership/filter/adoption SQL.
  The committed `supabase/tests/training_plans.sql` also PASS on hosted rollback.
- `npm.cmd run check`: PASS typecheck/lint/format and 178 Jest + 4 Node tests
  (182 total; 26 Jest suites). `expo.cmd export --platform all`: PASS iOS,
  Android and web bundles, 25 static routes. This is not native/device acceptance.
- `node .actaro-tools/check-plans-browser.mjs`: PASS preview, day/equipment
  filters/empty results, adopt/edit/save/reload; 390 light/320 dark screenshots
  inspected with no horizontal overflow. Expired fixture JWT was refreshed only
  in the ignored acceptance harness; no production Auth bypass or change.
- Beginner Running is retained DEFERRED to v1.2; strength logs do not represent
  running sessions. This does not remove future running requirements.

**DONE — Seven-day training split module; first three task 2.3 groups (2026-10-13).**

- Migration `20261013073144_weekly_training_splits.sql` is applied and generated
  types refreshed. Immutable ownership/grants, composite FKs and RLS guard both tables.
  Saving exactly seven ordered days is atomic; a profile-row lock and unique index
  serialize the active choice. Failed replacements retain the old split/active flag.
- Deleting a workout leaves its scheduled day visibly unassigned; it is not silently
  converted into rest. Deleting a split preserves workouts and performed history.
- `node .actaro-tools/test-splits.mjs` and hosted `supabase/tests/training_splits.sql`:
  PASS save/edit/rest/retry/active switching, invalid/cross-owner rollback and deletion.
- `npm.cmd run check`: PASS TypeScript/lint/formatting, **173 Jest tests / 24 suites
  plus four Node importer tests**. Initial effect-state lint errors were fixed.
- `.\node_modules\.bin\expo.cmd export --platform all`: PASS Android/iOS/web,
  24 static routes. Router types regenerated by the isolated Metro process on 8083.
- Browser acceptance in two stages: create/assign/rest/save, then
  `node .actaro-tools/check-splits-resume.mjs` PASS edit/save/reopen/reload, active
  switch, cancellation/deletion and workout preservation. The harness now waits
  for save completion before reloading. 390px light/320px dark layouts inspected.
- Reused components and the owned workout selector; new workout creation can return
  to the split draft. No dependency added. Split drafts are not persisted after
  termination; active-workout resilience remains task 2.16. Fixture account retained
  only for the continuing v0.3 acceptance run; no email sent or real user modified.
- Security advisor has only the pre-existing Auth leaked-password warning; no new
  split/RLS/function warning. Its remediation remains a release follow-up:
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

**DONE — Search/detail add-to-workout shortcut; task 2.2 acceptance closed (2026-10-13).**

- Fitness results and Exercise Detail expose real Add to workout actions. Existing
  chooser/builder routes carry validated exercise IDs; malformed arrays/IDs and
  signed-out/recovery access are rejected. Search buttons have contextual accessible names.
- The builder fetches actual catalog/media, appends once to a new/existing draft
  using shared defaults, preserves prior targets and requires explicit Save.
  Discard, retry and the 100-exercise bound do not persist partial changes.
- Reused existing services, atomic RPC, owner checks, RLS, components and routes;
  no dependency, schema, credential or future-session implementation added.
- `npm.cmd run check`: PASS TypeScript/lint/formatting and **166 Jest tests /
  22 suites plus four Node importer tests**. Component and route checks cover
  new/existing/discard/retry/limit/parameter/auth behavior and picker isolation.
- `.\node_modules\.bin\expo.cmd export --platform all`: PASS Android/iOS/web,
  23 static web routes. Exports do not establish a physical-device/native launch.
- Ignored browser acceptance ran in two stages: search → create/edit/save;
  `node .actaro-tools/check-shortcut-resume.mjs` then passed detail → existing,
  discard, reload without duplicates, save/reopen with original targets and actual images.
  390px light and 320px dark screenshots inspected. Initial harness runs needed
  corrected arrow labels/loading waits; its clock was aligned with the server-issued
  disposable session to avoid an environment clock-skew refresh loop. No app Auth
  workaround or foundation acceptance credit is claimed.
- Disposable account and its templates are cleaned up after verification; no
  confirmation email or real-user modification. Device shortcut smoke testing remains
  NOT_STARTED. README and the workout decision record describe the completed flow.

**DONE — Confirmed workout-template deletion; real-world scope clarified (2026-10-12).**

- `workout-service.ts` deletes only a validated ID owned by the current Auth user,
  checks the returned row and keeps raw database diagnostics out of errors.
- `workouts-screen.tsx` provides row-specific confirmation/cancel, pending guards,
  safe failure/retry feedback and previous-page fallback after its last row is deleted.
- Existing RLS/grants and FK cascades are reused; no migration or dependency change.
  `node .actaro-tools/test-workout.mjs`: PASS actual PostgreSQL ownership/cascade
  suite, including cross-user/anonymous denial and preservation of performed history.
- Targeted Jest tests: PASS 15 tests in two suites for builder/service behavior,
  including deletion cancellation, failure retention, duplicate-tap guards and pagination.
- Final `npm.cmd run check`: PASS strict TypeScript, lint, formatting and
  **158 Jest tests / 22 suites plus four Node importer tests**. Final
  `.\node_modules\.bin\expo.cmd export --platform all`: PASS Android/iOS/web,
  23 static routes; native/device launch acceptance remains pending.
- `node .actaro-tools/check-delete-browser.mjs`: PASS real disposable-session
  cancel/reload/confirm/delete/reload; light 390px and dark 320px confirmation screenshots
  inspected. The confirmation was subsequently moved next to its corresponding row;
  final component tests cover that same cancel/confirm flow.
- `node --env-file=.env .actaro-tools/check-delete-fixture.mjs --verify`: PASS
  template/child removal with the recorded session and performed reps/weight unchanged.
  Fixture account/history removed afterward; no confirmation email sent.
- Canonical source/plan now retain seven-day splits/rest days, workout management,
  standalone add/direct logging and editable/deletable history. Only deletion was
  implemented here; planning/logging/history shortcuts are not claimed complete.

**DONE — v0.3 task 2.2 custom workout builder (2026-10-12).**

- Applied migration `20261012123044_save_workout_template.sql`; local filename
  aligned with hosted history and database types regenerated. No new dependency.
- `node .actaro-tools/test-builder.mjs`: PASS all real local PostgreSQL
  migrations, library regression/import checks and `supabase/tests/workout_builder.sql`.
  The same builder rollback suite passed through hosted Supabase execute_sql:
  create/edit/retry, nullable/zero targets, invalid-child rollback and owner isolation.
- `npm.cmd run check`: PASS strict typecheck, lint without warnings, formatting,
  **154 Jest tests in 22 suites plus four Node importer tests**. Added model/SDK/UI
  checks cover conversion, validation, reorder/removal, failed drafts and pending saves.
- `.\node_modules\.bin\expo.cmd export --platform all`: PASS Android/iOS/web,
  **23 static routes**. This is JS/export evidence, not native compilation/launch.
- `node .actaro-tools/check-builder-browser.mjs`: PASS real JWT create/select/
  configure/save/reload/reopen/edit/save/reopen. Actual exercise thumbnails and
  320/390/1280px light/dark layouts were inspected. The disposable fixture account
  and its owned workout were removed afterward; no confirmation emails were sent.
- Reused the approved PDF's compact builder structure. Extra fields required by
  the canonical Source are expandable; native targets/short labels preserve
  contextual accessibility names. Exact unavailable dark Figma parity is not claimed.
- Current ceilings: last-save-wins for concurrent edits; unsaved builder drafts
  are React state and not retained after termination. Active-session persistence,
  timers, predefined plans and workout logging remain separate tasks.

**DONE — v0.3 task 2.1 workout schema (2026-10-12).**

- Two migrations applied and local filenames aligned with hosted history;
  generated database types refreshed from Supabase. No application dependency added.
- `node .actaro-tools/test-workout.mjs`: PASS all real local PostgreSQL migrations
  and `supabase/tests/workout_foundation.sql`. The same rollback suite passed
  through hosted MCP execute_sql. Tests cover all six tables, anonymous/A/B isolation,
  ownership-preserving FKs, protected columns, constraints, Timed/Log Only rules,
  historical snapshots and deletion cascades. All disposable SQL fixtures rolled back.
- `npm.cmd run check`: PASS typecheck, lint, formatting, 143 Jest tests plus
  four importer tests. No UI change required an Expo export or device-test claim.
- Advisor security: no new RLS/function finding; existing Auth password warning
  unchanged. All workout FKs have usable covering indexes. Four advisor column-order
  INFO notices remain documented with actual index/catalog/EXPLAIN evidence in
  `docs/decisions/005-workout-foundation.md`.

**DONE — v0.2 Exercise Library functional scope (2026-10-12).**

- Hosted migrations `20261012084226`, `20261012084232`, `20261012084240`,
  `20261012084248` and `20261012084255` applied. The original taxonomy filename
  was aligned with actual hosted history; SQL was preserved. Database types were
  generated from the applied schema, not fabricated.
- Imported pinned RepDB revision `d86f9612bee19db1069557bcac5c957021057eb9`:
  **643 exercises, 31 muscles, 59 equipment and 1,138 private Storage images**
  (18,911,630 bytes). License/source IDs/attribution are retained and visible.
  Running clients read only Supabase; no external dataset hotlink is used.
- `node .actaro-tools/test-library.mjs`: PASS real local PostgreSQL execution,
  all migrations, rollback SQL and full repeat import with identical exercise IDs.
  Hosted `supabase/tests/exercise_library.sql`: PASS constraints, grants/RLS,
  owner isolation, literal search/filter/pagination and atomic equipment rollback.
- `node --env-file=.env scripts/import-repdb.mjs .actaro-tools/repdb --download --media`:
  PASS all catalog/media uploads. `node --env-file=.env .actaro-tools/check-live-library.mjs`:
  PASS real JWT API search/filter/pagination, 643-ID reimport, two-account isolation,
  equipment persistence, signed-image SHA-256 retrieval, anonymous/public denial
  and repeat Storage upsert. Disposable accounts were removed after browser checks;
  no confirmation emails or real user records were modified.
- `npm.cmd run check`: PASS strict typecheck, lint (no warnings), formatting,
  **143 Jest tests in 20 suites plus 4 Node importer tests**.
  `.\node_modules\.bin\expo.cmd export --platform all`: PASS Android/iOS/web,
  21 web routes. Privileged import key absent from all 129 exported files.
- Scoped headless Edge checks: PASS real-session pagination/bodyweight filters,
  light/dark and 320/390/1280px layouts, equipment save/reload and exercise detail/back.
  Signed technique images loaded; screenshots inspected. Device QA is still pending.
- No additional app dependency, state framework, backend, AI feature, native build
  or v0.3 workout action was introduced. Supabase security advisor found no new RLS
  issue; existing leaked-password protection warning remains a foundation follow-up.

**DONE — Local muscle/equipment schema and SQL verification (2026-10-12).**

- Three of four task 1.1 verification groups pass locally. Hosted deployment/types
  remain pending; the entire task stays IN_PROGRESS. No live Supabase call, catalog
  import, application dependency or Exercise Library UI was added.
- Remaining v0.1 acceptance is explicitly recorded as DEFERRED above, preserving
  earned weight and user-confirmed results.

**DONE — Shared foundation heading/button accessibility correction (2026-10-11).**

- Current screen titles expose heading semantics; loading buttons keep their
  original action name while busy/disabled. Existing validation, pending-request
  guards and visual styling remain. All 132 tests and local auth browser checks
  pass; complete authenticated browser/device review remains open.

**DONE — Bottom tab icons; user confirms rendering (2026-10-11).**

- Five cross-platform icons reuse installed Expo Symbols and the existing labels,
  selected states and approved colors. Commit `fc067ed` is pushed to `main`.
- Offline browser selection/rendering checks and all-platform export passed;
  `npm.cmd run check` passed 132 tests in 18 suites plus typecheck/lint/format.
- Profile/preferences persistence, theme switching and password-reset/session
  acceptance on web/iPhone are user-confirmed. Those existing results remain
  credited; unavailable live checks are distinct from missing implementation.
- The dependency inventory above is the current remaining-work explanation.
  Older dated entries below preserve history and do not override current status.

**IN_PROGRESS — v0.1 closing tasks (2026-10-10).**

- Preferences UI and service identity guards are implemented and contract-tested;
  saved units/time zone and notification/gamification preference values use the
  private existing schema. Theme switching and live save/reopen are pending.
- Shared light palette, typography and layout tokens retain the previously
  verified auth values; complete Figma component matching remains blocked.
- EAS authorization/project linkage, approved development identifiers,
  SDK-compatible development client, internal profiles and local archive checks
  pass. No cloud build or paid service was started.
- CI workflow is implemented and its GitHub run passed. See the closing
  verification entry for commands, evidence and remaining release gates.

**IN_PROGRESS — Account management and five-tab navigation (2026-10-10).**

Name/email/password UI, tab composition and routing contracts are implemented;
live email/password, navigation and visual acceptance remain pending. User reports
working name editing on iPhone Expo Go. See the verification entry below.

**IN_PROGRESS — Profile editor (2026-10-10).**

- Added protected routing, display-name loading/editing/validation/save/discard/retry and existing snackbar/toast feedback. Saves bind to the account that opened the editor; stale results after account remount/unmount are ignored. Exact Figma matching and live web/native save/reopen checks remain pending; see [profile testing](PROFILE_TESTING.md).

**DONE — Profile/preferences data-access service task (2026-10-09); the module remains IN_PROGRESS.**

- Added typed, Auth-derived owned reads/updates and runtime validation restricted to permitted fields, with safe errors and no cached account data. Tested the installed SDK with simulated transport responses; reran live SQL ownership checks with rollback. The Profile screen and authenticated SDK save/reopen acceptance remain pending.

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
  The commit accompanies the handoff (see Git log); the user published this commit to `origin/main` on GitHub.

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

v0.3 planning and the dedicated session flow are verified. History and training context are next;
the user authorized continuing through remaining v0.3 tasks without stopping.
PR detection and basic volume are verified; history recalculation and richer aggregation remain pending.
v0.2 device smoke follow-up and v0.1 acceptance/native build deferrals remain recorded.

## Next 3 Actions

1. v0.3 task 2.11: reopen/edit/delete performed history with revision-safe saves.
2. v0.3 tasks 2.12–2.13: history recalculation and frequency/primary-muscle aggregation.
3. v0.3 tasks 2.14–2.15: transparent rules-based training status and owned recovery check-ins.

Device acceptance and custom native builds remain separately recorded.

## Blockers / Decisions

- Git and system Node.js/npm are installed. The ARM64 ngrok binary lookup failed;
  ignored portable x64 tools resolve the executable in the configured terminal
  session. They are not application code or deployment configuration. Actual
  tunnel connectivity and native compilation/launch remain pending.
- Git identity is configured locally using the user's supplied values.
  Each developer configures their own repository identity; it is not shared app configuration.
- EAS authorization, project linkage, development profiles and a credential-free
  local Android archive are verified. Native compilation/launch remain pending;
  iPhone Expo Go smoke tests do not establish a custom development-build launch.
- Canonical filename mismatch is documented; original content is preserved.
  It does not block initialization using the supplied plan.
- Supabase public configuration and MCP authorization are established. The profile/preferences migration is applied and database-tested. Both Android and iOS remain test targets; the latest user report identifies iPhone Expo Go and confirms the name editor works. Android and new account-update flows remain unverified.
- The user reports exhausted Supabase limits after testing. No quota diagnosis, backend probe, confirmation email or Supabase MCP request was made for the tab-icon task. The specific exhausted limit remains unverified; live acceptance is paused rather than credited as complete.
- Latest `npm audit --json` reports 66 affected packages (50 high, 16 moderate).
  Review runtime/tooling exposure and dependency chains before release; no safety
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

- User reports web authentication testing, explicitly including sign-out. Confirmation/reset coverage and persistence after reopening are not specified. The follow-up confirms that native testing is pending: `npx expo login` was launched outside the project root, offered a temporary Expo install and was cancelled once with Ctrl+C. This is CLI setup evidence, not a captured Expo Go app runtime error.
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
- Ignored the CLI-generated `supabase/.temp/` cache; migration/test SQL stays tracked. Verified its cache file and `.env` are ignored. The migration and snackbar commits were pushed without rewriting history.

## Portable setup documentation (2026-10-09)

**DONE — Remove machine-specific setup assumptions, unweighted maintenance task.**

- README now starts from any checkout's root (`package.json`), with a relative clone workflow and generic terminal/Node setup. Removed personal absolute paths, dated temporary-tool PATH commands and the assumption that a newly cloned checkout already has configured `.env` values.
- Generalized project references in development/auth testing guides. Callback addresses are explicitly runtime-dependent; localhost:8081 remains a labelled example. Removed personal Git identity and system-directory details from status prose while preserving the underlying test/commit evidence.
- Inspected tracked application code, scripts, tests and configuration: no personal filesystem paths, fixed LAN addresses or live project identifiers in runtime code. Supabase configuration already comes from environment variables; callback URLs use Linking.createURL; script/config paths use relative roots. Dummy test URLs, the actual repository clone URL and product/design references remain intentional portable references.
- No runtime code, environment values, schema, dependencies or release weights changed. Foundation completion remains 52.25%. The next tasks remain profile/preferences data access, persisted UI and application acceptance.
- `npm.cmd run check` PASS (exit 0): typecheck, lint, formatting and all 46 tests across nine suites. Tracked-file portability audit found no personal checkout paths, temporary tool paths or fixed development-project references; architecture-specific lockfile package names remain intentional. `git diff --check` PASS.

## Profile/preferences data access (2026-10-09)

**DONE — Typed service and validation task; roadmap items 0.9–0.11 remain IN_PROGRESS.**

- Re-read both canonical documents and confirmed the recorded headless persistence sequence. No visual work, database migration, Auth setting, credential or dependency change.
- Added `src/features/profile/profile-model.ts`: generated row types, restricted update types and runtime permitted-field/value validation. Display names are trimmed; blank/null clears the optional name, and the 80-character limit counts Unicode code points. Preferences validate unit/theme choices, actual booleans and runtime-supported IANA timezone names/UTC. Database constraints remain authoritative.
- Added `src/features/profile/profile-service.ts`: four read/update methods derive identity from Auth `getUser`, filter explicitly by that owner and return actual server records. No owner/timestamp input, insert/upsert fallback, optimistic save, logging or private-record cache. Missing rows and failures are explicit safe errors.
- Added `__tests__/profile-service.test.ts`: 36 passing tests using the actual installed Supabase SDK with simulated transport responses. Covers owned request paths, partial PATCH payloads/server timestamps, name clearing, mass-assignment rejection, auth/network failures, empty/multiple results, account changes and invalid inputs. These are request contracts, not live authenticated service acceptance.
- Re-executed the full `supabase/tests/profile_preferences.sql` via authorized MCP: PASS for initialization, defaults, anonymous/missing-JWT denial, two-user RLS, own updates, protected writes, constraints, timestamps and deletion cascades. All fixtures rolled back. Both tables still have RLS enabled.
- Initial typecheck exposed generic literal widening and a Jest cleanup return type; corrected both. A test incorrectly expected older SDK zero-row mutation semantics; inspected the installed SDK and corrected the response fixture to an empty array. No checks are bypassed.
- The full check initially stopped at formatting after a new untracked `docs/.obsidian/` folder appeared. Added only that local editor configuration path to Git/Prettier ignores; preserved its contents. Post-SQL counts remain one Auth account, one profile and one preferences record.
- Final `npm.cmd run check` PASS (exit 0): typecheck, lint, formatting and all 82 tests across ten suites. Focused `npm.cmd test -- --runTestsByPath __tests__/profile-service.test.ts` PASS (36 tests). `git diff --check` PASS. No UI/device persistence completion is inferred from these tests.

## Profile editor implementation (2026-10-10)

**IN_PROGRESS — Profile / Preferences UI subtask; display-name editor implementation and automated checks verified.**

- Figma metadata fetch was blocked by the Starter-plan tool limit. User explicitly authorized existing verified components. No Figma file changes or claimed Profile screenshot parity. Broader design-system completion is not inferred.
- Added `/profile`, guarded by a normal signed-in session, and Edit profile on Your Account. The route keys the editor by session user ID. Recovery sessions return to the auth entry; product navigation remains pending.
- Added feature-local `use-profile-editor.ts` and `profile-screen.tsx`: load/optional empty name, validation, save, discard, retry, safe errors, disabled controls during save and existing snackbar/web toast success feedback. Saves return actual server values; failures preserve the draft. Stale load/save results after unmount/account remount are ignored.
- Added expected-session identity checks to profile reads/updates. This is a rejection guard, never an owner override. The new SDK test verifies that an editor from another account cannot issue a read or mutation for the current account.
- Nine screen tests cover loading/unnamed records, unchanged values, discard, validation, duplicate save prevention, server-confirmed success, failed-save retry, clearing and stale account-remount feedback. These mock the feature service; live authenticated UI persistence is still pending.
- Initial typecheck used stale generated route types. Ran `npx.cmd --no-install expo start --offline --go --port 8082` to regenerate the ignored types through Expo CLI, then stopped that server. No generated file was edited or committed. Corrected the hook cleanup lint warning without suppressing checks.
- First full check had a single 5-second test timeout while bundle exports were running; the focused rerun passed. Final `npm.cmd run check` PASS (exit 0): typecheck, lint without warnings, formatting and all 92 tests in eleven suites. `npx.cmd --no-install expo export --platform all` PASS: Android/iOS Hermes bundles, web bundle and eight static routes including `/profile`. `git diff --check` PASS.
- Browser automation initialization failed twice. No interactive browser visual check or phone runtime claim. [Profile testing](PROFILE_TESTING.md) records the live save/reopen, failure/retry and account-isolation checklist; no additional credentials are required.
- Preferences UI and live module acceptance remain pending, so task 0.9 stays 2/4, data access 3/4 and RLS 3/4. Foundation remains 23.65/40 (59.125%). No migration, environment value, dependency or privileged credential change.
- Profile/preferences earns 2/4; data access earns 3/4, with live application integration still pending; RLS stays 3/4. Foundation totals 23.65/40 (59.125%). No new input/key is needed for the next UI task; relevant Figma access and manual acceptance remain required.

## Account management, navigation and snackbar (2026-10-10)

**IN_PROGRESS — Foundation account/navigation acceptance; implementation and automated checks verified.**

- Expanded Profile to show the session email, request a confirmed email change and update the authenticated account password. Services validate inputs, reject a stale account identity and surface safe errors. Passwords clear after requests; duplicate submissions and concurrent name/security saves are blocked. Email requests distinguish pending confirmation from an immediate server-confirmed update. Supabase remains responsible for confirmation and reauthentication policies; no current-password verification or bypass is claimed.
- Added Today, Fitness, Nutrition, Progress and More tabs with existing verified colors/components. Normal sign-in opens Today; signed-out/recovery sessions cannot enter tabs or Profile. More retains real email/sign-out and opens Profile; Back returns to More. Four module views describe scheduled work without invented tracking data. Exact Profile/navigation Figma parity remains pending under the approved fallback.
- Raised mobile notification clearance from safe-area plus 40 to plus 112 points, leaving web upper-right positioning intact. User reports working name editing and identifies iPhone Expo Go; new account updates/tab interactions/snackbar placement still require live checks.
- Added seven account-security service/UI tests and three routing contract tests. Tests cover validation, expected-user checks, confirmation messaging, safe failures, password clearing, duplicate submission and signed-out/recovery destinations. Navigator/service mocks are not live Supabase or interactive navigation proof.
- Initial checks caught an unsupported SDK 57 tab option and a Jest callback return type. Corrected both. The first test run exposed two test-boundary setup issues (mock hoisting and native storage import); corrected those fixtures without disabling checks.
- Final `npm.cmd run check`: PASS (exit 0), strict typecheck, lint, formatting and all 102 tests across 14 suites. `npx.cmd --no-install expo export --platform all`: PASS (exit 0), Android/iOS Hermes bundles, web bundle and 18 static route entries. Exports are not device launches.
- Expo CLI regenerated ignored route types via `npx.cmd --no-install expo start --offline --go --port 8082`; stopped after startup. No generated types, environment values, migrations or dependencies changed. `git diff --check` and `git check-ignore .env`: PASS.
- Navigation earns 2/3 of weight 3; foundation is 25.65/40 (64.125%). Profile/preferences remains 2/4 while preferences and full acceptance are pending. No later-release feature is marked complete. README and Profile testing describe the real current screens and remaining checks.

## Ponytail review and standing development preference (2026-10-10)

**DONE — Focused simplification and instruction update; unweighted maintenance.**

- Confirmed the installed `engineering-suite-ponytail` entry, audit, simplification and full-mode skills are readable. Reviewed the implemented auth/session/client, profile validation/services/editor, feedback and navigation flows plus dependency declarations. Their security validation, stale-request guards and feature service boundaries serve current requirements; no new framework, generic data layer or state library is justified.
- Removed unused `src/components/app-tabs.tsx` and `app-tabs.web.tsx`: 149 lines of obsolete Expo starter navigation. Repository reference searches found no external callers; the active five-tab layout remains in `src/app/(tabs)/_layout.tsx`. Existing dependencies, schema, credentials and test expectations were preserved.
- Added the user's standing Ponytail full-mode preference to `AGENTS.md`: apply the simplicity ladder before each coding change/command, reuse existing/native solutions and keep required security/accessibility/verification. This is a reasoning check rather than an invented per-command plugin tool. If unavailable, disclose that and use the recorded principles. The user can override it with "stop ponytail" or "normal mode".
- `npm.cmd run check`: PASS (exit 0), typecheck, lint, formatting and all 102 existing tests in 14 suites without test changes. `npx.cmd --no-install expo export --platform all`: PASS (exit 0), Android/iOS/web bundles and 18 static route entries. No live device flow is inferred from these checks. `git diff --check` and `git check-ignore .env`: PASS.
- Foundation remains 64.125%; this cleanup earns no feature weight. Existing Figma/live acceptance blockers and the Next 3 Actions remain unchanged.

## v0.1 closing verification (2026-10-10)

- Used Ponytail full mode: reused existing UI/service/validation/feedback and React state; no new state framework, speculative module schema or future product feature.
- Preferences: `src/features/profile/preferences-screen.tsx`, protected `/preferences`, More entry and identity-bound service reads/updates. Units, IANA time zone, notification/gamification values save only changed fields; loading/retry/discard/validation/failure/duplicate-save/account-remount contracts pass. Theme controls remain pending. No new database migration or API credential.
- Design foundation: `src/constants/actaro-theme.ts` shares the already verified palette, typography and layout values with current controls/navigation without changing their appearance. Full component catalog, theme states and exact visual acceptance are unfinished.
- Build setup: `app.json`, `eas.json`, package/lockfile add approved `com.actaro.app`, actual linked EAS project and compatible `expo-dev-client` (~57.0.19). `npx.cmd eas-cli@latest whoami` and `init --account chmuhammadowais --non-interactive --json`: PASS. No privileged key, native source directory, cloud build, signing identity or paid service was added.
- `npx.cmd eas-cli@latest build:inspect --platform android --stage archive --profile development --output .actaro-tools/eas-archive-20261010`: PASS. Archive was inspected: ignored environment/signing credentials were absent; generated inspection copy was removed. This is archive validation, not native compilation/launch.
- `npm.cmd run check`: PASS (exit 0), TypeScript, lint, formatting and **108 tests in 15 suites**. New preferences suite has six meaningful state/mutation tests; service tests reject prior-account preferences reads/writes. Typecheck using a temporary CI-shaped config without generated Expo route/environment typings: PASS.
- `npx.cmd --no-install expo export --platform all` with `EXPO_NO_DOTENV=1`, `CI=1` and both public variables absent: PASS (exit 0), Android/iOS Hermes, web and 19 static routes. No credentials are required for bundle CI.
- `.github/workflows/check.yml`: locked `npm ci`, `npm run check`, all-platform export, Node 24 and read-only job permissions. Initial GitHub run exposed fetch overload/return-type differences in a clean checkout; `fix: make Supabase test fetch typing portable` corrected the test fixture without casts or disabled checks. [Rerun 38082924731](https://github.com/owacez/Actaro/actions/runs/38082924731) at `ca05693` **PASS**: installation, checks and exports. Quality baseline earns its fifth subtask.
- `npx.cmd --no-install expo install --check`: PASS (up to date). `npx.cmd expo-doctor`: PASS (21/21 checks).
- `npm.cmd run check:supabase`: PASS, live Auth settings/public configuration and anonymous denial on both private tables. Live MCP execution of `supabase/tests/profile_preferences.sql`: PASS, defaults, anonymous/missing-JWT denial, two-user RLS, own updates, protected columns, constraints, timestamps and deletion cascades; fixtures rolled back.
- Live security advisor: no database ownership/RLS findings; leaked-password protection is disabled. [Supabase documents this protection as Pro-plan and above](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no paid setting was enabled. `npm.cmd audit --json`: FAIL (exit 1), 66 affected packages, 50 high/16 moderate; proposed fixes include incompatible Expo/RN/test major changes, so no force fix was applied. Release security review remains open.
- README, development inputs and Profile testing now include real preference behavior, native-build instructions, environment requirements and remaining acceptance. `git diff --check` and secret/build ignores: PASS. User-supplied PDF remains unchanged and untracked; no temporary PDF tooling is committed.
- User evidence: iPhone Expo Go sign-in/out, tabs and name editing work. Android unavailable; confirmation/reset/session reopen, email/password changes, preference save/reopen/two-account app integration, complete visual foundation and custom native-build launch remain pending. **v0.1 is IN_PROGRESS (29.25/40 = 73.125%); v0.2 was not started.**

## Expo Go email-change callback correction (2026-10-11)

**IN_PROGRESS — Callback implementation verified; remote configuration and live acceptance pending.**

- User reports starting the email change in Expo Go, then opening a confirmation
  on the desktop and reaching an unreachable `localhost:3000` address. The
  provider message indicates the first link was accepted and another inbox must
  confirm; it does not prove the email change or app callback completed.
- The account service already sends `emailRedirectTo: authRedirectUrl()`, derived
  from the running app through Expo Linking. No fixed localhost address, new
  credential, schema change, dependency or confirmation-policy bypass was added.
- `auth-callback-screen.tsx` previously rejected the legitimate message-only
  first confirmation because it had no code. It now shows **Check your other
  inbox** and a return action. Only a valid code can enter the existing session
  exchange; URL message text never authorizes or claims an account update.
- Added eight regression cases for the first step, malformed/duplicate/error
  parameters, recovery isolation and the final code exchange. `npm.cmd run check`:
  **PASS (exit 0)**, TypeScript, lint, formatting and **116 tests in 15 suites**.
  Mocked callback tests do not establish live email delivery or native launch.
- Read-only Auth health probe: **HTTP 200**, version **v2.197.0**. Its tagged
  redirect validator rejects non-loopback literal IP destinations before the
  allowlist unless Site URL matches. This is a possible explanation for LAN Expo
  Go fallback, not proof of the project's uninspected configuration. See
  [the tagged source](https://github.com/supabase/auth/blob/v2.197.0/internal/utilities/request.go).
- Connected MCP tools cannot inspect/edit Auth URL settings or templates; browser
  automation failed to initialize. No remote setting was changed and no new
  confirmation email was sent. README/Auth/Profile testing now document an actual
  hostname-based tunnel callback allowlist, same-phone PKCE verification, fresh
  links and stable development-build alternatives. No personal LAN address is stored.
- Foundation completion remains **73.125% (29.25/40)**. Email-change confirmation,
  server-reported updated email and replacement-email sign-in still require live
  acceptance. No further release work was started.

## Functional appearance preferences (2026-10-11)

**DONE — Theme implementation/contract verification; v0.1 remains IN_PROGRESS.**

- Read both canonical documents, current status and relevant code before editing.
  Applied Ponytail full: existing React context/state, installed Expo status bar,
  existing preference validation/service and shared controls; no new dependency,
  environment value, migration, credential or raw UI database query.
- Figma metadata access again returned the Starter MCP limit. The approved PDF
  export supplies a System-theme setting but no dark palette, and retains stale
  green foundation values. The user explicitly approved functional dark colors:
  `#121211` background/surface, `#fffdf8` text, `#ddd5c8` secondary text,
  `#6d6961` borders and `#ff681e` accent. Existing light visuals remain;
  dark orange buttons use charcoal text for contrast. Exact Figma matching stays pending.
- Preferences offers accessible System/Light/Dark choices. Draft/discard/failed
  save does not change the applied appearance; a confirmed server record does.
  Account-owned preferences restore on sign-in. System follows device changes
  and is the signed-out/loading/failure fallback; opening Preferences can retry
  the owned read. Stale requests/records cannot apply another account's theme.
- Shared auth/Profile/Preferences/tab-shell screens, inputs, notices, links,
  navigation surfaces and status-bar contrast consume the resolved palette.
  The feedback provider remains mounted across account changes, preserving
  sign-in feedback. The preserved `/explore` starter is outside Actaro theme parity.
- Added eight meaningful tests: provider restoration/system/explicit modes,
  account isolation and stale loads, safe fallback, feedback retention, deferred
  application, discard/failed save and confirmed saves. `npm.cmd run check`:
  **PASS (exit 0)**, strict TypeScript, lint, formatting and **124 tests / 16 suites**.
  Initial lint exposed render-ref/effect-state violations and a test used an
  unavailable matcher; corrected without disabling checks, then the full check passed.
- `npx.cmd --no-install expo export --platform all`: **PASS (exit 0)**,
  iOS/Android bundles and 19 static web routes. Exports are not native build or
  interactive device acceptance. README and Profile testing describe real behavior
  and the remaining manual checklist. The supplied PDF and ignored local tooling
  remain uncommitted.
- Profile/Preferences UI/state group earns 3/4; live acceptance remains pending.
  Foundation becomes **30/40 = 75%**. Design stays 3/5; all later releases remain
  NOT_STARTED. Live Supabase/email tests were postponed at the user's request;
  no confirmation emails or backend setting changes were made during this task.

## Navigation design foundation (2026-10-11)

**DONE — PDF-verified navigation treatment; release acceptance remains IN_PROGRESS.**

- Rendered and inspected PDF pages 1–2 and bounded page-3 auth/Profile/Settings
  regions. Page 2 shows dot markers, compact labels and rounded selected
  backgrounds for all five tab states. Implemented that treatment in
  `navigation-tab-label.tsx` and the existing Expo Router tab configuration,
  using current approved light/dark tokens. The fallback's stale green accent
  does not replace canonical orange or newer verified auth values.
- Preserved native safe-area/tab interaction, signed-out/recovery guards,
  keyboard hiding and release boundaries. No icon library, dependency, route
  restructuring or future product behavior was added.
- `npm.cmd run check`: PASS, TypeScript/lint/formatting and **125 tests / 17 suites**.
  Navigation label regression covers readable selected/inactive dark states;
  existing five-route and auth/recovery contracts still pass. Real visual/device
  switching remains separate, so no additional completion weight is claimed.
- `npm.cmd run check:supabase`: initial restricted-network attempt failed;
  authorized network-enabled rerun PASS, Auth settings and anonymous denial
  for both private tables. Supabase MCP reports ACTIVE_HEALTHY.
- Browser automation again failed during runtime initialization. An EAS
  environment-list operation was rejected by automatic approval review because
  it could expose variables beyond the public settings; no environment values
  were read or changed. Build history is empty. The user explicitly deferred
  cloud/native builds and has no Apple Developer membership; no build was submitted.
- The supplied PDF and all local rendering tools remain untracked/ignored.
  Next focused work: resolve current confirmation redirect diagnosis, finish
  current component states, then remaining live foundation acceptance.

## Current component catalog (2026-10-11)

**DONE — Shared current-release controls and states; full visual acceptance remains open.**

- Added reusable cards, compact selected preference chips and an accessible
  loading row to the existing theme-aware controls. Reused them for account
  details, explicit unit/appearance choices, session restoration and owned
  Profile/Preferences loads. Scheduled-module views retain honest empty states.
- Chips use the approved orange accent, readable dark text and 44-point press
  targets. All four units are selectable directly; server validation, changed-field
  writes, failed-save handling and draft/discard behavior remain intact.
- Added a preference interaction test covering all four selected units and the
  confirmed save. `npm.cmd run check`: PASS, TypeScript/lint/formatting and
  **128 tests / 17 suites** in the working tree, including the separately scoped
  callback diagnostic tests. No dependency, schema or environment change.
- Design's current component/state group now earns 4/5. Foundation is
  **31/40 = 77.5%**. This does not establish full Figma parity, email delivery,
  native build completion or remaining live authenticated acceptance.

## Web confirmation diagnosis (2026-10-11)

**IN_PROGRESS — Safe callback diagnostic correction verified; live final confirmation pending.**

- User-provided redirects point to `http://localhost:8081/auth/callback`, proving
  the web request's requested destination. The first secure email-change link
  correctly asks for the other inbox; the second failed. A phone opening this
  web localhost destination cannot reach the desktop app. Same-machine use
  alone does not prove the same browser profile/origin or retained PKCE storage.
  No supplied one-use token was opened, logged or stored in the repository.
- Replaced the callback's unconditional retry-email instruction with safe mapped
  messages for missing local PKCE verification data, a mismatched verifier,
  expired/used links and generic failures. Development diagnostics contain only
  mapped text, never URLs/codes/provider responses. Existing code-only session
  exchange, duplicate-exchange guard and recovery isolation remain unchanged.
- Added two callback regressions and a safe-log assertion. Final
  `npm.cmd run check`: PASS, **128 tests / 17 suites** plus typecheck/lint/format.
  The first rerun caught a test cleanup callback's unintended return type;
  corrected it without disabling checks. This is an error-reporting fix, not proof of a
  successful real email change or a change to Supabase confirmation policy.
- Read-only aggregated Supabase Auth logs did not establish a PKCE or expired
  flow failure. Missing local verifiers can fail before a server request; the
  exact second-link cause remains unknown. No Auth setting/template was changed
  and no extra confirmation email was sent by the agent.
- Headless Edge with a fresh isolated profile rendered Sign In, first-step
  email-change instruction and expired-link error at **390 × 844**; all three
  smoke checks passed and screenshots were inspected. Used an ignored local
  script and the already available x64 Node fallback after the default browser
  runtime failed. No normal browser profile, user session or real email link was
  opened. Browser testing does not establish Expo Go/native acceptance.
- `AUTH_TESTING.md` documents same-origin/profile testing, one request/both inbox
  links and safe-message-only reporting. Native builds remain user-deferred;
  v0.1 remains **77.5%**, with no further acceptance credit from this diagnosis.

### User retest result

- Both fresh web email-change confirmation links worked in the original browser;
  the account email updated. This web flow is verified by the user. Replacement
  email sign-in and phone callback acceptance have not been separately reported.
- The user reports 1–2 minutes on the provider confirmation step, then an instant
  app redirect. No app-side artificial wait or repeated session exchange was
  found. Provider/browser latency has not been independently measured; no remote
  setting, speculative timeout/retry or confirmation bypass was added.

## Native PKCE crypto and live persistence evidence (2026-10-11)

**DONE — Crypto correction/SDK verification and current profile/data acceptance; native callback retest remains open.**

- Installed only `expo-crypto` **~57.0.3** using
  `npx.cmd --no-install expo install expo-crypto`: PASS. It supplies the missing
  secure RNG and SHA-256 digest used by the existing Supabase PKCE flow. The
  small native-only initializer preserves available crypto functions and leaves
  browser crypto untouched. No handwritten hashing, implicit-flow downgrade,
  native build, private key, redirect override or database change was added.
- This adapter supplies PKCE operations, not full WebCrypto. Unsupported digests
  fail closed. Current owned services validate identity through server-side
  `getUser`; local JWT verification via `getClaims` is not introduced or claimed.
  Expo SDK 57 includes TextEncoder in Hermes and
  [Expo Crypto is included in Expo Go](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/).
- Four meaningful regressions exercise the real Supabase SDK with mocked native
  crypto/network boundaries: S256 request equals the hash of its stored verifier;
  RFC 7636 Appendix-B vector; unsupported/failed digest sends no plain request;
  browser/complete existing crypto preservation. No real signup or email was sent.
- `npm.cmd run check`: **PASS**, strict TypeScript, lint, formatting and
  **132 tests / 18 suites**. Initial test iterations exposed BufferSource typing
  differences and the SDK's rejection contract; corrected fixtures/expectations,
  without assertions, ignored errors or disabled checks.
- `npx.cmd --no-install expo install --check`: **PASS**, dependencies up to date.
  `npx.cmd --no-install expo export --platform all`: **PASS**, Android/iOS Hermes
  bundles, web bundle and 19 static routes. Exports and native mocks are not a
  device retest or compiled development build.
- User separately confirms session reopening, name/preferences save/reopen,
  System/Light/Dark switching and password reset/new-password sign-in on web
  and iPhone. Those results complete the profile/data integration groups and
  auth reset/persistence live groups. Broad mobile assurance excludes email
  change; signup/verification have not been individually identified in that
  reply. Two-account app isolation remains open despite passing real SQL RLS tests.
- Foundation earns **33.75/40 = 84.375%**. Current Profile/Preferences and Data
  Access are DONE. Native email change, post-crypto device checks, remaining
  Auth/security/navigation/visual acceptance and deferred native builds prevent
  claiming the full foundation release complete. No v0.2 work was started.

## User-requested bottom tab icons (2026-10-11)

**DONE — Icon implementation and local checks; native/live navigation acceptance remains open.**

- Applied Ponytail full: reused installed `expo-symbols` (~57.0.3), the existing
  tab-label component, Expo Router and current light/dark colors. Added no
  dependency, environment setting, database change or future-release feature.
- The approved PDF shows dots. The user's explicit request replaces them with
  calendar, dumbbell, utensils, chart and more icons while preserving labels,
  selected pills, route guards, safe areas and keyboard behavior. iOS uses SF
  Symbols; Android/web use the package's bundled Material Symbols. Decorative
  icon wrappers are hidden from accessibility announcements; labels remain.
- Changed `src/app/(tabs)/_layout.tsx` and
  `src/components/navigation-tab-label.tsx`; adapted the existing theme
  regression in `__tests__/navigation-tab-label.test.tsx` for its required icon
  prop and mocked native renderer. No new test framework or production mock.
- `npm.cmd run check`: **PASS (exit 0)**, TypeScript, lint, formatting and
  **132 tests / 18 suites**. `npx.cmd --no-install expo export --platform all`:
  **PASS (exit 0)**, iOS/Android bundles and 19 static web routes.
- Isolated headless Edge checks: **PASS** at 390×844 light/dark, 320×568 light
  and 1280×720 light. All five glyphs rendered, every tab selected successfully
  and measured tab targets were at least 44 CSS pixels. All four screenshots
  were inspected. This was responsive web verification, not an iPhone/Android
  device run or full assistive-technology acceptance.
- The ignored local preview used fake configuration and an isolated stored
  session fixture, with all Supabase fetches intercepted locally (one blocked
  request). The real project was not used; auth guards were not modified. No
  Supabase MCP/probe or email request was made. Fixture rendering earns no live
  authentication, RLS or persistence credit. Temporary preview processes stopped.
- Foundation remains **33.75/40 = 84.375%**, IN_PROGRESS. User-reported quota
  exhaustion pauses live tests; exact quota, remaining acceptance and deferred
  builds are not claimed complete. All later releases remain NOT_STARTED.

## Independent foundation control review (2026-10-11)

**DONE — Focused accessibility correction; broader visual acceptance remains IN_PROGRESS.**

- Applied Ponytail full; reviewed the approved PDF's auth/Profile/Settings
  regions, current shared controls and route/preferences code. Reused the
  installed React Native accessibility properties; no dependency, theme redesign,
  schema, credentials or backend behavior change.
- `src/features/auth/auth-components.tsx`: titles/section headings now have
  header semantics; buttons retain their action label when a spinner replaces
  visible text. Previously the browser exposed no headings and pending actions
  lost their action name. Styles, disabled/busy guards and request logic remain.
- Extended existing auth/Profile tests for heading navigation and named disabled
  loading actions; no new suite/framework. `npm.cmd run check`: **PASS (exit 0)**,
  TypeScript/lint/formatting and **132 tests / 18 suites**.
- `npx.cmd --no-install expo export --platform all`: **PASS (exit 0)**,
  iOS/Android bundles and 19 static web routes. Exports are not native launches.
- Isolated browser checks: Sign In, Sign Up, invalid-signup feedback and Reset
  rendered at **390×844**, with no document horizontal overflow; the corrected
  titles appear as headings. Four screenshots inspected. The first local fixture
  run could not load Profile; the subsequent authenticated navigation timed out.
  Full Profile/Preferences browser review is therefore not claimed complete.
- Preview used fake configuration with Supabase fetch interception; no request
  reached the real project, no email was sent and no live persistence/security
  credit is claimed. Ignored scripts/screenshots are excluded from commits.
- Own preview/browser processes stopped; no further interactive checks are
  running. Final documentation formatting and `git diff --check` pass.
- Foundation remains **84.375%**. Remaining live gates and user-deferred builds
  are unchanged. No v0.2 implementation and no new approval request.

## First Exercise Library schema (2026-10-12)

**IN_PROGRESS — Task 1.1; three of four local/hosted verification groups completed.**

- Applied Ponytail full and Supabase schema guidance. Added only the current
  muscle/equipment catalog requirement: stable UUIDs/slugs, validated names,
  timestamps, authenticated read-only grants and RLS. No hardcoded exercises,
  images, dataset seed, app dependency, native build or analytics infrastructure.
- Supabase CLI **2.120.0** generated the local migration using
  `supabase migration new exercise_taxonomy`: **PASS**. The cached CLI was used;
  restricted execution initially could not write its local telemetry file, so
  only local migration generation was retried with authorized escalation. No
  project connection or hosted migration was performed.
- `supabase/migrations/20261012081416_exercise_taxonomy.sql` defines both tables.
  `supabase/tests/exercise_taxonomy.sql` is an administrative, rollback-only SQL
  suite for invalid/duplicate values, ID-preserving upserts, role permissions and
  anonymous RLS denial even with a temporary read grant. All fixtures/grants roll back.
- `npm.cmd install --prefix .actaro-tools/postgres-check --no-audit --no-fund --save-exact @electric-sql/pglite@0.5.8`:
  **PASS**, temporary ignored tooling only; root dependency files unchanged.
  `node .actaro-tools/test-taxonomy.mjs`: **PASS**, actual PostgreSQL **18.3**
  execution via PGlite **0.5.8**, including empty post-rollback catalogs and restored
  anonymous grants. This runtime does not include the hosted Supabase API/Auth stack.
- `npm.cmd run check`: **PASS (exit 0)**, strict TypeScript, lint, formatting and
  **132 tests / 18 suites**. `git diff --check`: **PASS**. No Expo API/UI was changed,
  so no new export/native build or live authentication test was required.
- Reviewed the current RepDB README and data license after the user reinforced
  dataset-driven content. Free dataset import, attribution and own Storage are
  planned; no paid preview assets or external runtime hotlinks. Source review earns
  no task 1.4/1.5 completion credit; details are in `decisions/003-core-schema.md`.
- Hosted application, regenerated database types and hosted verification remain
  NOT_STARTED while Supabase calls are paused. Task 1.1 is **75%**; v0.2 earns
  **1.5/28 = 5.357143%**. Remaining v0.1 tests are DEFERRED by the user, with the
  full-scope baseline unchanged at **84.375%**; no false release completion.
