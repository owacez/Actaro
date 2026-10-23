# Actaro — Development Status

Updated: 2026-10-23 (America/Los_Angeles).

## Overall

Expo SDK 58 upgrade (2026-10-23): dependency upgrade and local verification
**DONE**; device and development-build acceptance **DEFERRED**.

Why: the installed Expo Go is SDK 58.

Versions:

- expo ~58.0.17, React Native 0.88.0, React 19.3.0, Expo Router 58.
- jest ~30.5.2, jest-expo ~58.0.12, eslint-config-expo ~58.0.4.
- jest-expo now requires the dev dependency `@react-native/jest-preset` ~0.88.0.
- Added `@types/node` for the PKCE test's Node crypto reference.

Code changes for SDK 58 APIs:

- Tabs: `initialRouteName` moved to `unstable_settings`. The custom tab bar uses
  the new `emitter` and `navigateToTab`.
- Share export awaits the now-async `File.write`.
- Stricter React Native types:
  - The run map's WebView component type is declared once, with an explanation.
  - The habits ScrollView ref is typed.
  - The theme hook maps an unknown scheme (`null`) to light.
  - The Supabase app-state listener accepts any state string.
- Tests:
  - Typed mocks and `PermissionStatus` imported from `expo`.
  - The web colour-scheme test uses `null` instead of the removed `'unspecified'`.

Notifications: SDK 58 shows foreground notifications by default only when no
handler is set. The reminder coordinator always sets one, so behaviour is unchanged.

The lockfile was regenerated without `--legacy-peer-deps`, so CI's plain `npm ci`
installs it.

Evidence:

- `npx expo install --check`: up to date.
- `npm ci --ignore-scripts` on a clean copy: 1250 packages, no errors.
- `npm run check`: typecheck, lint and Prettier pass; 82 suites with 419 Jest tests
  pass, plus 6 dataset tests.
  - The first full run on this 4 GB machine hit out-of-memory or timeout failures.
    `workout-builder` then passed alone (15/15), and the full rerun passed.
- `npx expo export --platform all`: Android, iOS and web bundles exported.
- The offline web capture shows Today with the tab bar. Tapping Food opens Food
  with its tab highlighted, with 0 live Supabase requests.

Development builds must be rebuilt for SDK 58. Before that, the Live Activity
widget and native modules remain unverified on devices.

Colourful Today and daily plan targets (2026-10-22): implementation and local
verification **DONE**; device acceptance **DEFERRED**.

Today:

- Widgets use a shared `TintCard` (soft wash, coloured icon tile, title, optional
  action) built only from existing semantic tokens. The colours are weight blue,
  steps green, calories accent, habits volt, recovery teal and goals amber.
- Calories leads with kcal left or over, then eaten/target, macros with targets, and
  water.

Targets:

- "No target set" came from having no saved nutrition target (Food → Daily targets or
  first-run setup).
- Food and Today now offer "Set my calorie target".
- You gains "Daily plan & targets".
- That screen shows the current plan and opens on the calculator when no target
  exists. The calculator is prefilled from saved details and adds the Lose fat /
  Maintain / Build muscle choice; `bodyGoals` and `planTargets` moved to
  `target-estimate` and are shared with onboarding.

No schema change. Evidence:

- `nutrition-screens.test.tsx`: lose-fat plan 2,650 kcal / 128 g from saved
  details, calculator default and manual path.
- Onboarding and model tests unchanged and passing.
- Light and dark 390×844 captures.

Body record uniformity (2026-10-22): implementation and local verification **DONE**;
device acceptance **DEFERRED**.

- The separate "Add another measurement" button is removed. Named measurements are
  added inside the card ("+ Add a measurement": name and value, the card's date) and
  saved with "Save body record". The history sheet remains for edits.
- Weight, waist, height and the other value use one centred stepper. Its new
  `heading` mode shows a full-width bold label, and `AuthInput`/`NumberStepper`
  `hideLabel` keep accessible names.
- Sex and location have matching headings.

Evidence: `v05-editors.test.tsx` (inline chest measurement saved with the card's
date, identical retry, no body-form write) and `body-form.test.tsx`; 390×844
captures.

Body records in one card (2026-10-22): implementation and local verification
**DONE**; device acceptance **DEFERRED**. This is a user-requested refinement of v0.5
task 4.9; weights are unchanged.

The card holds:

- A dated weigh-in (the date picker defaults to today).
- The live change since the previous weigh-in. `bodyService.form` now also reads
  the previous weight and that date's waist.
- An optional waist value.
- Personal details inline.

One save:

- Uses the existing atomic `save_body_form` for weight and details.
- Logs height only when it changes.
- Adds a waist measurement when it changes.
- Refuses an empty save.

Design decision: keep absolute dated weights. Entering increases or decreases
would compound mistakes and break with gaps. The change is shown instead.

The history filter is a date picker and history rows show friendly dates. The
calculator's details editor is unchanged, and there is no schema change. Evidence:
`body-form.test.tsx` (inline details, live change, date switch, one-tap save with
waist, unchanged height, empty-save refusal, retry), the v05 measurement sheet
test, and a 390×844 capture.

Live run on the lock screen (2026-10-22): implementation and local verification
**DONE**; device acceptance **DEFERRED** until the user makes a development build.
This is a user-authorized running refinement; Phase 9 weights are unchanged.

Dependency: `expo-widgets` ~57.0.27, installed with `expo install`, with the plugin
`frequentUpdates: true`.

Modules:

- `run-live-model` (pure props and throttling).
- `run-activity` (the SwiftUI Live Activity).
- `run-live.ios` (loaded only with the native module present).
- `run-live.android` (sticky low-importance notification).
- `run-live` (web no-op).

The run tracker mirrors every saved draft change, in order, and ends the display
on review, discard or an account change. The Discard run control is now an
outlined button.

Local evidence:

- `run-live.test.ts`: props, throttling, the iOS gate, start/update/end, and the
  Android notification and permission skip.
- `run-tracker.test.ts`: mirroring order.
- `expo config --type introspect`: Info.plist and entitlements.
- The widgets Babel transform stringifies the layout.
- `expo export --platform all` **PASS**.

Not verifiable here: iOS prebuild on Windows and on-device rendering. See
[RUNNING_TESTING.md](RUNNING_TESTING.md#lock-screen-live-run-2026-10-22-untested-on-device).

Train tab icons and Training summary (2026-10-22): implementation and local
verification **DONE**; device acceptance **DEFERRED**. These are user-requested
refinements of v0.3 tasks 2.13/2.14; weights are unchanged.

Changes:

- Train segments show icons (Workouts, Library, Plans, Run). The shared `Segments`
  accepts an optional icon.
- Training summary has icon stat tiles (workouts, training days, working sets/reps,
  Training Volume), one concise data note, status cards and a Muscle balance card
  with bars ordered by allocated sets.
- Recovery check is a row with an icon.
- `StatTile` moved to shared `product-ui` (Plans and Training summary).

The Library tab is kept: Source of Truth §§5 and 8.1–8.4 and Development Plan tasks
1.6–1.8 require it, so removal awaits the user's decision. Evidence: new
`training-screen.test.tsx` and 390×844 captures.

Training plan presentation (2026-10-22): implementation and local verification
**DONE**; device acceptance **DEFERRED**. This is a user-requested refinement of v0.3
task 2.3; weights are unchanged.

Plan detail:

- Goal and level chips.
- Icon stat tiles: days per week, session time, equipment (None when empty) and
  level.
- A weekly schedule card that letters each workout (A, B, …).
- Workout cards with chips (exercises, sets × reps, rest, ~minutes) and the
  numbered exercise list.

Plan list cards are tappable, with the schedule bar and the same chips. Session time
uses the pre-start rule (≈45 s per set plus rest between sets), shown as a range
when workouts differ, and is labelled as an estimate. No data change. Evidence:
`plans.test.tsx` (schedule labels, stat tiles, ~8 min estimate) and 390×844
captures with a fictional plan.

Logged-set lock (2026-10-22): a logged set's weight/reps are read-only (muted) until
undone, and its check uses the volt colour of the habit completion mark. This is
verified in `session-screen.test.tsx` (locked after logging, editable after undo).
No data change.

Skipped exercises and post-workout recovery (2026-10-22): implementation and local
verification **DONE**; device acceptance **DEFERRED**. These are user-requested
refinements of v0.3 tasks 2.6, 2.10 and 2.15; weights are unchanged.

Session flow:

- A completed exercise now leads to the first unfinished exercise from the start
  ("Go to …"). Before, the last exercise offered Finish even when earlier ones were
  unlogged.
- An exercise is done, partial, not started or skipped. Skipped is stored as an
  optional draft flag; older drafts still restore, and the flag is not sent to the
  server.
- Skip exercise and Undo skip are available, and logging a set un-skips the
  exercise.
- Chips show ✓ or "Skipped".
- Finishing with unfinished exercises lists them and offers Go to, Mark as skipped
  and finish, or Keep training.

Recovery:

- The workout summary includes an optional three-question recovery check (energy,
  soreness, sleep).
- It uses the existing `recoveryService.save` and daily replacement for the
  workout's date. The full Recovery screen keeps stress and notes.

No schema change. Evidence:

- `session-model.test.ts`: states, start-first order, flag restore and validation.
- `session-screen.test.tsx`: the user's scenario and the finish prompt.
- `quick-recovery.test.tsx`: required answers and the exact saved check-in.

Workout logging and history redesign (2026-10-22): implementation and local
verification **DONE**; device acceptance **DEFERRED**. These are user-requested
refinements of v0.3 tasks 2.6, 2.9, 2.10 and 2.11; weights are unchanged.

The direction was informed by a user-supplied Behance concept ("Gym Workout App",
Denis Saratovskii). Its patterns were adapted to Actaro's Chalk/Carbon tokens; no
assets were copied.

Session:

- The exercise name is large, with a muted line for muscles/equipment and best
  load.
- "N of M sets logged" sits above the set progress bar, which now uses the accent
  colour for logged sets.
- Set rows are pill inputs with the unit inside (`60 KG`, `8 REPS`). The column
  header is gone.
- Logged sets show a filled accent check.
- Rest is one bar: −15, a "Skip rest · 0:23" pill whose fill drains, +15, and
  pause/resume. All Source of Truth §9.3 controls remain.

Summary:

- "Workout complete" with the date.
- Stat tiles: duration (Timed), sets, reps and Training Volume.
- Each exercise card lists its sets (`60 kg × 8`), with PRs as volt chips.
- The duplicate volume and duration lines are removed.

History:

- The calendar view lists the month's sessions by default; choosing a day filters,
  and "Show whole month" resets.
- Sessions in both views are tappable cards (date, name, stats chips).
- Delete is a secondary link with the same confirmation.
- The pager shows only when more pages exist.

Data, persistence and accessible control names are unchanged, except that history
cards now include date and stats. Evidence: `session-screen.test.tsx` and
`history.test.tsx` updated (summary tiles and set rows, month list by default),
plus 390×844 captures with a seeded session and fictional history (0 live
Supabase requests).

First-run setup (2026-10-22): implementation and local verification **DONE**;
device acceptance **DEFERRED**. This is a user-requested refinement of profile
(0.9) and nutrition targets (3.2), so no weights change.

Who sees it: new accounts with no targets and no weigh-ins, on first sign-in. Each
step can be skipped, and completion or skipping is remembered on the device.

Steps:

1. Units.
2. Sex, date of birth and height.
3. Current weight and optional waist.
4. Goal (Lose fat/Maintain/Build muscle) with an optional target weight.
5. Usual activity and eligibility confirmation.
6. An editable plan from the 2023 DRI maintenance estimate.

The plan step, saving and data:

- Lose fat: −min(500, 20%). Build muscle: +min(300, 15%). Lose and gain use 1.6 g/kg
  protein (capped at 35% of energy) and 25% fat. Water is always the user's entry.
- With no estimate available, the plan step asks for manual targets.
- Saving reuses the existing preference, body-form, measurement, nutrition-target
  and goal paths, in order, and is retry-safe.
- No schema change.

Product rule change: the Source of Truth §11.1 and `TARGET_CALCULATION.md` now
allow an explicit, user-chosen deficit or surplus. It is never silent and promises
no rate of change.

Evidence: model, service, screen and navigation tests (new-account redirect,
existing-account Today, skip, manual fallback, exact saved request).

Workout session, habits and goals clarity (2026-10-22): implementation and local
verification **DONE**; device acceptance **DEFERRED**. These are user-requested
refinements of v0.3 task 2.6 and v0.5 tasks 4.2/4.7; weights are unchanged.

Active workout:

- Unlogged sets show a visible × to remove them from the current session. Before,
  this took select → "…" → Remove.
- Logged sets and the last remaining set cannot be removed.
- A session card shows a large elapsed time with inline pause/resume.
- Exercise chips show logged/planned sets and jump between exercises.

Goals:

- The editor asks the outcome first.
- Starting value appears only for change goals (bodyweight, measurements, strength
  targets, calories); daily and weekly counts start from zero.
- The name is optional, with a generated default.
- A "Your goal" summary and its source appear before Save.

Habits:

- The editor ends with a plain summary of the habit.
- Habits and Goals open with matching "How it works" steps that cross-reference each
  other.

Behaviour unchanged: the goal payload validation, the "Starting value" label and
the existing data. No schema change.

Evidence: model tests cover goal/habit summaries and schedules; screen tests cover
direct set removal, logged-set protection, exercise chips and goal defaults.
Screens were captured with a seeded local session at 390×844, with 0 live
Supabase requests.

App-wide UI/UX review (2026-10-22): implementation and local verification **DONE**;
device acceptance **DEFERRED**. The user asked for a whole-app UI/UX review,
because the plan defines features but not UI details.

Method: a fresh web export was captured in headless Edge at 390×844, light and
dark, using sample-data interception. 31 routes rendered with **0 live Supabase
requests**.

Changes (presentation only):

- Counts are pluralized ("1 exercise").
- Diary amounts read "150 g", not "150 × g".
- Energy displays as whole kcal/kJ; calculations stay unrounded.
- Civil dates read "Thu, Oct 22", with the year only when it differs. This applies
  to Food, date pickers, Progress, Weight Progress, Training summary and goals.
- Cards no longer end with a divider.
- Back links are renamed: "← More" → "← You", "← Nutrition" → "← Food", the bare
  "Back" → "← Food", and the My workouts back link → "← Train".
- Food search rows carry their nutrition and source; recipe edit is a link.
- Single-page lists hide their pagers.
- You: Recipes moves to Tracking with an icon, Body and Steps rows gain
  descriptions, and Sign out is a secondary button.
- The workout builder's "Edit 1" becomes "Edit"/"Done", with an "Edit exercise N"
  accessible name.

Not changed:

- A "Create habit" shortcut on Today was considered but not added. The Source of
  Truth keeps habit management under You → Habits.
- Data, schema, permissions and calculations are unchanged.

Release weights are unchanged.

Evidence:

- `npm run check` **PASS**: **397 Jest tests in 76 suites plus six dataset tests =
  403**.
- `git diff --check` **PASS**.
- Re-captured screens confirmed the changes.

No phone rendering is claimed.

Recipe builder clarity (2026-10-21): implementation and local verification
**DONE**; mobile acceptance **DEFERRED** pending the user's test. This is a v0.4
task 3.11 refinement requested by the user, so no weight changes.

Changes:

- The builder now reads name → ingredient list → total → servings → cooked weight.
- Each ingredient row shows its amount and weight, calories and macros, with
  edit/remove actions.
- A combined total sits below the ingredients, and the ingredient sheet shows what
  the ingredient adds and the new recipe total.
- Countable foods default to USDA's measured "1 medium" portion; other foods
  default to their base grams.
- Defect fixed: changing the unit kept the old number, so 100 g became 100 bananas.
  This also affected diary logging. Weight-unit switches now keep the same amount,
  and a household portion starts at one.
- The Food tab has a visible Recipes section (Create recipe, Your recipes).

USDA check: SR Legacy already has measured portions for 7,533 of 7,793 foods,
including Quaker Quick Oats (½ cup = 40 g) and bananas (small/medium/large).
No food data, schema, RLS or dependency changed, and no estimated foods were
added.

Evidence:

- The model test reproduces 70 g quick oats plus 1 medium banana = **364.72 kcal**
  from USDA 172989/173944 values.
- The screen test covers the same flow, plus live impact, unit switching, row
  calories, total and removal.
- `npm run check` **PASS**: **395 Jest tests in 75 suites plus six dataset tests =
  401**.
- `git diff --check` **PASS**.

No device or browser rendering is claimed.

iPhone map worker follow-up (2026-10-21): implementation and Chromium verification
**DONE**; iPhone rendering **DEFERRED** pending the user's retest.

The user's iPhone retest showed **Map stopped at: style · Worker failed to load**,
so the library loaded but its worker did not start. MapLibre's default worker is a
blob that imports the cross-origin worker module, and iOS WebKit refused it. The
page now downloads the pinned, self-contained worker module, starts it from a
same-origin blob via `setWorkerUrl`, and reports a new `worker` stage. Fit route
now pads the top so the finish marker clears the map buttons.

Evidence:

- Headless Edge, driven over its debugging protocol, loaded the generated page
  from `http://127.0.0.1` with a fictional route and reached `ready`.
- The screenshot showed positron tiles, the cased route, and the start and finish
  markers.
- The browser console showed the worker running from a same-origin blob.
- `npm run check` **PASS**: **391 Jest tests in 75 suites plus six dataset tests =
  397**.
- `git diff --check` **PASS**.

No WebKit/iPhone result is claimed. Phase 9 weights are unchanged.

Free map on every platform and Strava-style run layout (2026-10-21): implementation
and local verification **DONE**; iPhone map rendering, outdoor GPS and device
acceptance **DEFERRED** pending the user's retest. User decision: one free, keyless
map everywhere (option A). The interim, uncommitted native Apple Maps surface, its
test and `react-native-maps` were removed; package files match the last commit.
iPhone, Android and web use MapLibre 6.15.0 with OpenFreeMap tiles.

Likely iPhone cause, not yet proven on a device: MapLibre 6.15.0 starts a blob
module worker that imports its cross-origin worker script. On iOS, a WebView page
loaded from a string had an opaque origin. The page now has the secure,
non-routable origin `https://actaro-map.localhost/` (no request is sent there),
and its CSP allows `blob:` script/child fallbacks. The fallback now shows the
failing load stage and reason so a retest identifies any remaining cause.

User-authorized Strava-style scope:

- Recording: muted `positron`/`dark` styles; cased accent route; start, position
  and finish markers; a large live map (45% of screen height); time as the primary
  value with distance, live pace, average moving pace and moving time.
- Review leads with distance.
- Review and history detail show deterministic per-km/mi moving-pace splits from
  the saved route. Tests show splits sum to the summary's distance and moving time.

No schema, Supabase, permission, credential or build change.

Review correction: the earlier "empty route message" and "0,0 map" findings are
unreachable. `newRun` requires a confirmed fix and `readRunPoints` rejects empty
routes, so neither was changed. The flaky Log Only session test, caused by a
frozen `Date.now()` before a real-clock fixture, now builds its fixture from
`Date.now()`.

Results:

- `npm run check` **PASS**: strict TypeScript, lint and formatting; **391 Jest
  tests in 75 suites plus six dataset tests = 397**.
- `git diff --check` **PASS**.
- `npx expo export --platform all --output-dir .actaro-tools/run-map-free-export`
  **PASS**.

No browser, iPhone or Android rendering is claimed. The Phase 9 denominator stays
48, earning **23/48**; this layout and map work earns no device-dependent weight
until physical acceptance.

Next three checks:

1. Open a run on iPhone Expo Go. Confirm street tiles, or report the "Map stopped
   at" line.
2. Record a known outdoor route with a pause, then confirm the route, markers and
   splits.
3. Retest Android map rendering when a device is available.

See [running checklist](RUNNING_TESTING.md).

Running map/accuracy follow-up (2026-10-21): overall **IN_PROGRESS**; code and hosted
database changes **DONE**, actual map rendering/outdoor GPS acceptance **DEFERRED**
pending verification. Ingredient discovery implementation and hosted checks **DONE**.
MapLibre/OpenFreeMap street maps replace the outline on
active/review/detail screens, with follow/recenter, fit-route, visible attribution
and an outline/retry fallback. This uses Expo-compatible WebView and an isolated
web frame; no new key, paid provider, backend or Supabase request per GPS fix.
Live pace clears on stops/stale GPS; uncertainty/speed filtering rejects drift,
and stops create route segment boundaries. Database-derived moving_seconds keeps
Today/history/Progress average moving pace separate from elapsed recording time.

Ingredient investigation found the full **7,793-food** USDA catalogue already
contains plain oats and raw bananas. Alphabetic results and repeated-term ranking
buried direct ingredients under composite foods. Search now prioritizes direct,
concise names and offers an Ingredients filter excluding recipes. Recipe building
defaults to it; Recipes stays separately selectable. No records, nutrient values,
logging behavior or historical diary snapshots were replaced. Hosted read-only
acceptance **PASS**: first results for oats/banana match USDA IDs 169705/173944,
page size remains 24, recipe separation and ownership remain enforced.

`npm.cmd run check` **PASS**: typecheck/lint/format, **389 Jest tests in 74 suites
plus six dataset tests = 395**. Hosted rollback-only running SQL checks **PASS**,
including generated moving time, pause gaps, ownership and injection rejection.
New migrations: running_moving_time, ingredient_search_ranking and
food_search_concise_matches; generated running types updated. Earlier Windows
memory failures and one stale test assertion were resolved for the final check.
The local WebAssembly Postgres runner still failed allocation; no new local SQL
pass is claimed. Live-tile browser verification timed out and no connected browser
was available; real map/native rendering and device accuracy remain **DEFERRED**.
Final `npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/run-map-export-final`
**PASS** for Android/iOS Hermes bundles and web routes. No build was submitted
and no release weights/gates changed.

Next three checks: verify street tiles/follow/recenter on iPhone; record a known
outdoor route with one minute stationary before/after; build oats/banana recipes
and compare ingredient quantities/portion macros. See [running tests](RUNNING_TESTING.md).

Running (2026-10-21): implementation and automated/browser verification **DONE**;
physical GPS, permissions and background lifecycle acceptance **DEFERRED** by the
user. Early v1.2 scope adds Train → Run, permission rationale, foreground/background
tracking, account-bound local drafts, pause/resume, guarded back/discard,
review/save/retry, private history/detail/deletion and Today/Progress metrics.
Route outlines follow redesign page 15; no street-map service or new key is needed.

Migrations `20261021070556_running_sessions.sql` and
`20261021070938_running_route_previews.sql` are applied, with generated types.
The owner-protected table validates bounded routes, derives distance/preview and
cascades account deletion. Rollback-only SQL checks passed locally and on the
hosted database without retained test accounts. No running-specific advisor finding;
existing password-protection/index advisories are retained in
[running testing](RUNNING_TESTING.md).

Recording persists locally with **zero Supabase calls per GPS update**. Summaries
use previews; Progress reads metrics; detail/export reads full coordinates.
Account export includes runs/draft; confirmed deletion clears cloud and local data.
Web/Expo Go pause when leaving the foreground. No native build, outdoor GPS,
locked-screen or Android result is claimed. Browser fixtures passed 13 captures
using fictional recipe/GPS data and zero live Supabase requests.

Final verification: `npm.cmd run check` **PASS** (strict TypeScript, lint,
formatting, 383 Jest tests in 73 suites plus six dataset tests: **389 total**).
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/running-export`
**PASS**, 42 static routes. `git diff --check` **PASS**. The isolated Postgres
runner also passed after aligning local migration filenames with hosted versions.
An existing Metro watcher had stale route declarations after new routes were
added; stopping that server and regenerating with the installed SDK helper fixed
local validation, without route casts, disabled checks or dependency patches.

The unchanged Phase 9 denominator is **48**. Seven fully verified non-device items
earn **23/48 = 47.9167%** of full acceptance. Five hardware-dependent items have
implemented/tested contracts but earn zero pending physical acceptance; no
arbitrary partial credit is inferred. This measures full acceptance, not code
written. Other release weights and v1.0 gates are unchanged. Current focus: finish
this handoff. Next three checks: iPhone outdoor run and recipe portions; later
development-build locked-screen GPS; Android permissions/lifecycle when available.

Recipe UX (2026-10-21): implementation/local verification **DONE**; mobile
acceptance **DEFERRED**. The recipe-only library separates creating/editing recipes
from food-label entry and portion logging. Ingredient search/editing uses a sheet;
existing deterministic ingredient calculations now appear above the ingredient
list. The portion screen allows choosing the destination meal. Saving a recipe
never writes a diary entry. Existing recipe RLS, server recalculation and historical
diary snapshots are unchanged; no nutrition schema or dependency changes.
`npm.cmd run check` **PASS**: strict TypeScript/lint/format, 362 Jest tests in
67 suites plus six dataset tests (**368 total**). Focused nutrition checks **PASS**:
20 tests, including recipe creation math, recipe-only actions and explicit meal logging.
This is a v0.4 refinement; weights and retained release gates are unchanged.

User report (2026-10-21): confirmation now works perfectly on web. Phone
confirmation testing remains **DEFERRED** to the user's next mobile check;
the earlier Safari investigation below is historical, not a new web blocker.

Email-confirmation recovery (2026-10-21): implementation/local verification **DONE**;
live Safari return **IN_PROGRESS**. The latest supplied signup email
targets `http://localhost:8081/auth/callback` and the user reports the app's
expired/used-link screen. A localhost target cannot reach the computer from
iPhone; it may originate from web, an old email or Site URL fallback. The token
was not replayed, logged or retained in tracked files.

`auth-callback-screen.tsx` explains trying normal sign-in after a confirmation
return fails, without claiming success. `auth-screen.tsx` routes only Supabase's
`email_not_confirmed` sign-in rejection to the existing verification screen;
email is preserved, password cleared, and resend requires explicit action.
`auth-service.ts` removes the unconditional resend advice from expiry errors.
Password recovery retains separate reset-link guidance. Tests cover web/iOS
recovery, explicit resend, password clearing and no false success/session exchange.
No dependencies, credentials, schema, policies or callback hosts were changed.
This refinement does not change release weights or close live acceptance.

Verification: `npm.cmd run check` **PASS** (strict TypeScript, lint, formatting,
360 Jest tests in 67 suites plus six dataset tests, **366 total**).
`git diff --check` **PASS**. Auth SDK calls are mocked in the UI/service tests;
they do not establish live email delivery or iPhone handoff. Read-only aggregate
Auth logs were inspected without selecting tokens, email addresses or account IDs;
they do not identify why this individual token expired. No live token was used.

October 20 configuration evidence remains in AUTH_TESTING: after the user's
dashboard correction, invalid-token probes accepted the exact web and tunnel
callbacks. Those probes did not verify an emailed callback or phone handoff.
On October 21 the old tunnel was offline; two restarts timed out. A currently
reachable phone callback remains the blocker. MCP cannot edit Auth settings and
no dashboard browser is available. No extra live email was requested by the agent.
The standalone `actaro://` allowlist remains a retained native-build check.

Next three actions: try normal sign-in for the already-confirmed account; if
confirmation is still required, resend once from the intended running runtime;
verify a fresh callback and subsequent sign-in there. Web needs the original
computer/browser and running server; Expo Go needs a running hostname tunnel
and its exact allowed callbacks. Native builds and release approval remain deferred.

Swipeable Today habit cards and compact logged actions (2026-10-20): **DONE**
for implementation/local verification; physical-device acceptance **DEFERRED**.
`today-habits.tsx` pages every already-loaded scheduled habit with Habit 1 of 3,
horizontal swipes and Previous/Next buttons. `today-habit.tsx` places Log at the
bottom before logging, then keeps the selected result with a three-dot editor/
undo control. Partial amounts and explicit zero stay editable. Empty/single
lists, changing counts, width changes and offscreen accessibility are covered.
`today-screen.tsx` retains acknowledged in-place habit/goal updates and removes
Manage all habits. Management remains under You → Habits; logged list entries
also hide lower log/edit buttons, retaining schedule/history through their menu.
No dependency, schema, new API read or release-weight change (v0.5 refinement).

Verification: focused Today/Habits checks **PASS**, 16 tests.
`npm.cmd run check` **PASS**: strict TypeScript/lint/format, 357 Jest tests in
67 suites plus six dataset tests (**363 total**).
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/compact-habit-export`
**PASS**, 39 routes. `node --env-file=.env .actaro-tools/check-habit-cards-browser.mjs`
**PASS**: 11 fictional-data captures/flows covering actual swipes both ways,
arrow boundaries, selection after save, explicit undo, partial logs, linked
goals, resize/narrow dark/desktop layouts and You → Habits. Browsing cards adds
no record reads; no full-page refresh after logging; zero live Supabase requests.
README, canonical spec/plan and APP_TEST_PLAN document the final card flow.

User report (2026-10-20): sign-in/sign-up, basic habit logging and step counts
are working. This does not close unspecified deferred acceptance checks.
Next three actions: verify the new card gestures/log/options on iPhone; test
workout logging/draft recovery/history; test nutrition targets and diary totals.
Then compare linked goals and Progress against those saved records. No current
implementation blocker; personal beta/native acceptance and release approval
remain deferred as recorded below.

Simplified active-workout set table (2026-10-20): **DONE** for implementation/local
verification; physical-device acceptance **DEFERRED**. `session-screen.tsx` and
`set-log-row.tsx` replace guided swipe cards with visible inline weight/reps,
current-row highlighting, row completion/undo and a pinned Log set action.
Logging advances to the next unfinished set; reviewing a completed row offers
continuation without logging another row. Optional RPE/notes/removal stay in row
options; rest settings and workout notes expand separately. Actual values,
independent rest controls, frozen save retries and guarded draft recovery remain.
No dependency, schema, API contract or release-weight change (v0.3 polish).

Verification: focused session/row checks **PASS**, six tests. `npm.cmd run check`
**PASS**: strict TypeScript/lint/format, 350 Jest tests in 67 suites plus six
dataset tests (**356 total**); gesture-only tests were replaced by table-flow
coverage. `npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/set-table-export`
**PASS**, 39 routes. `node --env-file=.env .actaro-tools/check-set-table-browser.mjs`
**PASS**: seven fictional-data captures/flows covering direct edits, progression,
undo, add/remove, optional fields, reload recovery and 320px dark/desktop layouts;
zero live Supabase requests. `node .actaro-tools/check-set-table-artifacts.mjs`
**PASS**, 86 artifacts exclude the privileged key. README, canonical set-logging
spec/plan and APP_TEST_PLAN C10/C11 describe the revised flow.

Next three acceptance actions: on iPhone, edit weight/reps with the numeric
keyboard and log consecutive sets; check rest/undo and row options; save a draft,
reopen and finish it. No implementation blocker; these device checks remain
deferred with the user's wider acceptance pass. Release approval is unchanged.

Daily-target calculator and simplified body records (2026-10-20): **DONE** for
implementation/local verification. Manual targets remain available without extra body-data
reads. The local 2023 DRI adult maintenance estimator prefills saved age and
latest weight/height, accepts missing inputs, makes an editable calorie/macro
preview and saves only on explicit request. Water remains user-set. Scope,
sources and implementation bounds are in `docs/TARGET_CALCULATION.md`.

Body records now separates dated weight/note from the shared personal-details
editor. Daily saves do not update the profile. Unchanged height is not logged
again, unsaved weigh-ins survive personal-detail saves, and history starts
collapsed. Existing owned APIs, RLS, dated target history and measurement
editing/deletion are reused; no schema or dependency change.
`npm.cmd run check` **PASS**: strict TypeScript/lint/format, 352 Jest tests in
67 suites plus six dataset tests (**358 total**). Coverage includes the eight
published equations, birthday/leap-day boundaries, input guards, imperial/kJ
conversion, separate saves, notes preservation, owner/date query bounds and retries.
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/targets-body-export`
**PASS**, 39 routes.
`node --env-file=.env .actaro-tools/check-targets-body-browser.mjs` **PASS**:
ten fictional-data captures/flows covering separation, saved-data prefill,
review/save/reopen, unsupported age and narrow/dark layouts, with zero live
Supabase calls. Representative captures visually reviewed.
`node .actaro-tools/check-targets-body-artifacts.mjs` **PASS**, 86 artifacts
exclude the privileged key. `git diff --check` **PASS**.
Physical-device acceptance remains **DEFERRED**; release weights are unchanged.
Next three device checks: weigh-in versus personal save; generate and edit
targets from saved/missing details; save/reopen targets in preferred units.

Exercise quick-add and in-place targets (2026-10-19): **DONE** for implementation
and local verification; physical-device acceptance **DEFERRED**. Result plus
buttons add to the open workout draft without closing the picker. Query,
filters and pagination stay mounted; added rows show set count, a disabled
checkmark and an edit button. The existing per-set editor is shared in a sheet
between search and the builder, with a top-level Planned sets counter and
retained reps/load/rest/RPE/notes, ordering, removal and set limits. Resizing
preserves retained set targets and validates the 1–100 range. Quick additions guard against duplicate taps and the
100-exercise limit. General-library plus opens workout selection directly;
view/detail and direct logging remain available. Row controls are siblings,
avoiding nested web buttons. Save workout remains the owned atomic persistence
boundary; adding/editing itself makes no write or exercise-detail fetch.

Verification: focused exercise/builder checks **PASS**, 20 tests.
`npm.cmd run check` **PASS**: strict TypeScript/lint/format, 338 Jest tests in
66 suites plus six dataset tests (**344 total**).
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/quick-exercise-export`
**PASS**, 39 routes.
`node --env-file=.env .actaro-tools/check-quick-exercise-browser.mjs` **PASS**:
six isolated sample-data captures/flows covering quick add, added-state editing,
query retention with no search refetch, save/reopen targets, separate web row
buttons and narrow/dark layout. Zero live Supabase calls. No dependency, schema
or release-weight change. Next three device checks: quick-add several filtered
results; edit load/reps and set count without leaving search; save/reopen and
start the workout to check planned targets.

Completed daily-log button (2026-10-19): **DONE** for implementation/local
verification; device acceptance **DEFERRED**. Today disables the primary log
button after completion, showing Done today for check-off/weekly habits and
Target met for measured habits. A separate Edit today's log action retains
correction/undo. Pending/failed saves do not mark completion. The button becomes
available on the next eligible day, using the habit's time zone and existing
dashboard refresh. No new timer, request, dependency or schema change.
`npm.cmd run check` **PASS**: strict TypeScript/lint/format, 336 Jest tests in
66 suites plus six dataset tests (**342 total**). Regressions cover disabled
presses making no write, separate editing/undo, next-day and time-zone behavior.
Next three device checks: log today and inspect the disabled button; undo using
Edit today's log; reopen tomorrow and confirm logging is available. Release
weights and deferred v1.0 acceptance are unchanged.

Weekly habit days and live linked-goal correction (2026-10-19): **DONE** for
implementation/local verification; physical-device acceptance **DEFERRED**.
Today previously patched the habit while leaving the linked goal result stale.
Acknowledged writes now patch both from the same calculation used by the goal
service, including start/end dates, week boundaries and completion percentages.
No optimistic success, full-page reload or follow-up API read is needed.

User-requested semantics: Count days each week / Habit days per week counts
distinct positive dates, with targets 1–7. Marking today writes 1; repeated taps
open edit/undo rather than adding occurrences. History editing uses done/not-done
choices. Undo writes 0 and reduces the goal. Stored legacy counts remain intact,
but contribute only one day per positive date. Daily numeric habits still support
amounts/counts. Daily completion indicators and reminders respect today's log
even before the weekly target is reached. Schema, RLS and dependencies unchanged.

Verification: `npm.cmd run check` **PASS**, strict TypeScript/lint/format,
335 Jest tests in 66 suites plus six dataset tests (**341 total**).
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/weekly-habit-export`
**PASS**, 39 routes.
`node --env-file=.env .actaro-tools/check-weekly-browser.mjs` **PASS**:
six isolated sample-data captures, immediate linked day/completion-goal updates,
repeat tap opens editing without a second write, undo, saved-value reopening,
narrow/dark layout and no dashboard data reload. Zero live Supabase requests.
No release-weight change. Next three device checks: log one day and confirm
1/5 immediately; repeat tap then undo and confirm 0/5; reopen both screens and
check a different historical date contributes only one more day.

Habit/goal setup simplification (2026-10-19): **DONE** for implementation and
local verification; physical-device acceptance remains **DEFERRED**. Habits show
three plain-language logging choices with examples; More logging options retains
all five kinds. Goals show four common choices, with all 13 available under More
goals. Selected uncommon choices stay visible after collapsing the list. Removed
the category/selection mismatch. Goals explain their source records, use Starting
value instead of Baseline, and infer increasing/decreasing direction from the
entered values. Optional settings retain their values when hidden. Existing
persistence, validation and canonical units remain intact; no schema, dependency
or release-weight change.

Verification: `npm.cmd run check` **PASS**, strict TypeScript/lint/format,
332 Jest tests in 66 suites plus six dataset tests (**338 total**).
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/habit-goal-clarity-export`
**PASS**, 39 routes.
`node --env-file=.env .actaro-tools/check-clarity-browser.mjs` **PASS**:
habit/goal create and save, expanded choices, selection/settings preservation,
eight sample-data captures including narrow dark layouts, zero live Supabase
requests. Representative captures were visually reviewed. Next three device
checks: create/log a minutes habit; create a weight or weekly-workout goal and
update its source; edit an uncommon kind with optional settings and reopen it.
v1.0 acceptance and deferred device checks remain unchanged.

Workout list web button correction (2026-10-19): **DONE** for implementation
and local verification. The Start/Delete IconButtons were nested inside the
ActionRow's Edit button. React Native Web maps these roles to actual buttons;
the isolated pre-fix DOM probe found both nested buttons. The workout list now
renders edit/start/delete as sibling controls. Other ActionRow callers were
checked; the only other custom trailing content is a noninteractive food icon.
Shared button semantics and click handling remain intact, and chooser mode
continues to hide Start/Delete.

Verification: `npm.cmd run check` **PASS**, strict TypeScript/lint/format,
330 Jest tests in 66 suites plus six dataset tests (**336 total**). A regression
checks accessible, non-nested controls, separate callbacks and delete confirmation;
existing chooser, disabled/pending deletion and retry checks pass.
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/workout-row-export`
**PASS**, 39 routes. `node --env-file=.env .actaro-tools/check-workout-row-browser.mjs`
**PASS**: zero nested buttons, Start preview, Edit builder, Delete confirmation,
cancel preserves the row, three light/narrow-dark captures and zero live Supabase
calls. The narrow row capture was visually reviewed. `git diff --check` **PASS**.
No dependency, schema, auth or release-weight change. Device acceptance remains
deferred. Next three checks: reload Train on web; start/open a workout; cancel
then confirm deletion of a disposable workout while preserving recorded history.

Body/goal/Today habit usability (2026-10-18): **DONE** for implementation/local
verification; physical-device acceptance remains **DEFERRED**. Body records now
opens a single form with weight, height, sex, date of birth (including year
selection) and manual city/country. Weight/height remain dated kg/cm facts;
optional personal details stay on the existing private profile. Blank dated
values do not erase records. Additional named measurements, history editing,
deletion and measurement goals remain supported without primary measurement tabs.

Migration `20261018102713_unified_body_form.sql` is deployed and generated types
are updated. Its owner-checked SECURITY INVOKER RPC saves profile and dated facts
atomically under existing RLS. Local PostgreSQL and hosted rollback checks
passed for replacement, blank preservation, constraints, failure rollback,
foreign-owner rejection and anonymous denial. Zero fixture accounts remain.
Security advisors reported only the previously recorded disabled leaked-password
protection finding; no new database/RLS finding. Profile export already selects
owned profile fields and includes the new details without a separate export path.

Goal record/edit/delete/restore actions now use bounded buttons. Today displays
all due habits with explicit check-off/occurrence buttons and an in-place
amount/minutes/count editor. Weekly quick logs increment today's value, preserving
notes; retries repeat the same date-keyed value. Confirmed updates patch Today
without reloading its data. Shared habit status distinguishes unlogged,
in-progress, over-limit, rest/future/deleted states and target met.

Verification: `npm.cmd run check` **PASS**, strict TypeScript/lint/format,
329 Jest tests in 66 suites plus six dataset tests (**335 total**).
`node .actaro-tools/test-body-form.mjs` **PASS**; the same
`supabase/tests/body_form.sql` checks passed on the hosted project inside a
rolled-back transaction. `npm.cmd exec -- expo export --platform all --output-dir
.actaro-tools/body-habits-export` **PASS**, 39 routes and iOS/Android/web bundles.
`node --env-file=.env .actaro-tools/check-body-habits-browser.mjs` **PASS**, eight
isolated sample-data captures/flows: form save, birth-year selection, one-tap
completion, inline minutes and goal button borders, including narrow/dark
layouts. Zero live Supabase calls from browser verification. Captures visually
reviewed. `node .actaro-tools/check-body-habits-artifacts.mjs` **PASS**, 147
artifacts exclude the privileged key. `git diff --check` **PASS**.
README, canonical behavior/plan and the manual test guide are updated. No new
package, service, API key, GPS permission or release weight was introduced.

Next three device checks: save/reopen all body fields and a past-date record;
use goal record/edit/delete/restore buttons; log and edit each habit type from
Today, including a failed-save retry. v1.0 approval remains deferred.

Workout swipe/exit correction (2026-10-18): **DONE** for implementation/local
verification; physical iPhone edge-back/gesture acceptance remains **DEFERRED**.
Card travel now follows its measured width rather than stopping at 90px. A
deliberate drag commits with small vertical/release drift; pulling back near the
center cancels. Once claimed, a horizontal gesture resists scroll takeover;
vertical scrolling and explicit edit/log/undo buttons remain available.

The workout route disables full-screen native back gestures (enabled by default
on iOS 26), retaining edge back. Native removal uses the installed SDK 57
`expo-router/react-navigation` prevention hook. Native/in-app back and Cancel
offer Save as draft, Discard workout and Continue workout. Draft save pauses
clocks and awaits queued device storage; discard awaits local deletion. Failures
keep the dialog/screen open. Neither action nor undo finishes/uploads a workout.
Saved history is untouched. No dependency, migration or release-weight change.

Known web limitation: an actual browser `history.back()` bypassed the SDK 57
screen-removal listener in the isolated regression. The in-app back link provides
all three choices; automatic draft recovery still applies to browser navigation.
Browser-history dialog parity is **DEFERRED** and is not claimed verified.

Verification: `npm.cmd run check` **PASS**, strict TypeScript/lint/format,
321 Jest tests in 64 suites plus six dataset tests. Regressions cover swipe drift,
deliberate cancellation/termination, undo without navigation/server finish,
removal callback cancellation, failed local save/discard, acknowledgement before
exit and paused draft clocks. `npm.cmd exec -- expo export --platform all
--output-dir .actaro-tools/workout-gestures-export` **PASS**, 39 routes and
iOS/Android/web JavaScript bundles. The isolated
`node --env-file=.env .actaro-tools/check-workout-gestures-browser.mjs` **PASS**
after allowing the local headless browser outside sandbox process restrictions:
nine sample-data captures, left-log/right-undo, tap-edit, in-app back dialog,
draft save/resume, discard, narrow/dark layout and zero live Supabase calls.
`node .actaro-tools/check-workout-gestures-artifacts.mjs` **PASS**, 147 artifacts
exclude the privileged key. The dialog capture was visually reviewed.

Next three checks: on iPhone drag a card with slight vertical drift and undo;
edge-back then Continue; edge-back then Save as draft/resume and Discard.
Native device acceptance and v1.0 release approval remain deferred.

Guided set logging (2026-10-18): **DONE** for implementation/local verification.
The user's newer interaction direction supersedes the previous right-to-log flow:
left swipe logs the entire card, right swipe undoes. One planned set is shown by
default; a valid log advances to the next unfinished set. From a ready card,
right swipe undoes the most recently logged set and returns to it. Selecting a
completed card undoes that card instead. Tapping opens the existing actual-value
editor, and explicit edit/log/undo buttons remain accessible.

Selectable progress bars below the image/description change to the existing
completion color. Show all sets expands the full list; Hide other sets returns
to one card. All-complete stays reviewable and does not auto-finish the workout.
Add selects the new set; removal retains a valid selection. Technique media is
centered, uncropped and frameless at 224px, removing the white side gutters.
Local persistence, validation, rest/session clocks and server-save rules remain.
No dependency, database, RLS, private-data, paid-service or release-weight change.

Verification: `npm.cmd run check` **PASS** (strict TypeScript/lint/format,
318 Jest tests in 64 suites plus six dataset tests). New regression checks cover
directional/idempotent swipes, vertical-scroll rejection, card-tap editing,
invalid-input non-advancement, three-set progression/undo, progress selection,
list expansion/collapse and persisted completion. Seven isolated browser captures
passed with real touch input, decoded images, light/dark/narrow layouts, three
persisted completions and zero live Supabase/external requests. Physical iPhone
gesture feel remains **DEFERRED**; no native/cloud build was launched.
`npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/guided-sets-export`
**PASS** for the final source: 39 routes plus iOS/Android/web JavaScript bundles.
`node --env-file=.env .actaro-tools/check-guided-sets-browser.mjs` **PASS** on that
export (seven captures, 24 intercepted fixture requests, zero live calls).
`node .actaro-tools/check-guided-sets-artifacts.mjs` **PASS**: 147 artifacts exclude
the privileged Supabase key. `git diff --check` **PASS**.

Next three device checks: log/undo three planned sets; tap/edit and revisit sets
through progress bars/Show all sets; reopen the draft and check the frameless
image plus preserved actual values. Core acceptance and v1.0 approval stay deferred.

Workout image correction (2026-10-18): **DONE** for implementation/local
verification; iPhone retest **DEFERRED**. Direct exercise start now falls back to
the available pose instead of requiring `start`. Read-only hosted checks found
643 exercises, 1,138 media records/objects, zero missing objects, and 148 exercises
without a start pose. The existing authenticated-only metadata/Storage policies
remain unchanged. Both a main and a start WebP signed/downloaded successfully
(HTTP 200); no accounts, personal records, imports or schema changes were needed.

Active workouts now resolve the selected exercise's image on open/resume instead
of relying on the one-hour URL persisted in an old draft. This uses the existing
read cache, retains the previous image when offline, ignores late responses after
exercise changes, and never rewrites performed sets or clocks. Preview and active
images offer an actual retry action. Shared image failure state is URL-specific,
so a refreshed URL can recover without remounting the screen.

Verification: `npm.cmd run check` **PASS** (TypeScript/lint/format, 316 Jest tests
in 64 suites plus six dataset tests); targeted media/service tests **18 PASS**.
`npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/workout-media-export`
**PASS**, 39 routes and iOS/Android/web JavaScript bundles. Three isolated browser
captures verified single-main preview/start and resumed expired-link replacement,
including decoded image pixels and unchanged persisted reps/completion. Browser
requests were intercepted fixtures, with zero live Supabase calls. Live checks
above were limited to shared reference media; no email requests or private data.
`git diff --check` **PASS**. The previously recorded rest-timer assertion below is
resolved by pinning only its test wall clock; the app's timer behavior is unchanged.

Next three device checks: start a single-main exercise directly; reopen an older
saved workout and confirm its image loads with sets intact; disconnect/reconnect
and use Retry image. Release weights and deferred release acceptance are unchanged.

Manual testing guide: **DONE** for documentation. [App test plan](APP_TEST_PLAN.md)
maps implemented core features to numbered actions and expected results, including
all five habit types and 13 goal sources. User test outcomes remain unrecorded;
no device acceptance, release weight or v1.0 approval changes are implied.
Documentation verification: 81 unique test IDs and all three local guide links
passed; formatting and `git diff --check` passed. `npm.cmd run check` passed
TypeScript/lint/format, then reported 307 Jest passes and one existing rest-timer
assertion failure (`session-screen.test.tsx:41`, expected `1:30`, observed countdown
already at `1:28`). A focused x64-Node rerun reproduced the assertion failure.
The six dataset tests passed separately. This documentation task changes no app
or test code; the timer test needs a deterministic-clock follow-up, not a false
green result or a relaxed countdown assertion.

- Current Release: **v0.9 — Quality & Personal Beta**
- Release Completion: **100% active implementation (27 / 27 weight); personal beta DEFERRED (6 weight)**
- Previous Releases: **v0.1 active development and v0.2–v0.6 functional scopes DONE (100%); retained acceptance DEFERRED**
- Current Phase: **Phase 6; seven implementation/review tasks DONE, task 6.6 Personal Beta DEFERRED**
- Current Focus: User testing refinements: unified body form, bounded goal buttons, Today habit logging and workout swipe/exit handling. Implementation and local verification are DONE; physical-device acceptance remains DEFERRED. No v1.0 approval or future-release implementation.
- Status: **DONE — active v0.9 development; full beta/release acceptance DEFERRED**
- Blockers: No remaining authorized implementation blocker. Dependency advisories, disabled leaked-password protection, exact visual/device checks and native-build acceptance remain documented release-review findings. They are not claimed passed or waived.
- Approval boundary: The user authorized completing v0.9, retaining the earlier instruction that device acceptance, personal testing and v1.0 release approval happen afterward. No paid service or native/EAS build was used.

Testing feedback (2026-10-18): **DONE** for implementation/local verification.
314 tests, all-platform JavaScript export and 28 isolated sample-data browser captures passed.
Touch swipe log/undo and cached tab return were verified with zero live Supabase calls.
See [the acceptance/evidence checklist](TESTING_FEEDBACK_2026-10-18.md). These are
core testing refinements with unchanged plan weights; remaining device acceptance
is still DEFERRED. No database migration, cloud build, paid service or new API key.

Core redesign (2026-10-17): **DONE** for implementation/local verification — Chalk/Carbon foundations,
Today/Train/Food/Progress/You navigation, Quick log, compact records, sheets,
calendar controls and actual-data charts are implemented. TypeScript/lint/format,
293 Jest tests and six dataset tests passed; all-platform JavaScript export and
16 isolated sample-data layout captures passed with zero live Supabase requests.
See [coverage, retained differences and evidence](REDESIGN_IMPLEMENTATION.md).
The new PDF supersedes the older atlas and visual palette. Page 15 running was
originally deferred; the user authorized early implementation on 2026-10-21 as
recorded above. Release weights and deferred acceptance are unchanged.

Header reconciliation (2026-10-17): **DONE** for implementation/local verification.
Removed the detached full-width white/glass header strip. Page headings now share
the canvas, content margins and scroll area, including the virtualized Library.
Active workouts retain a canvas-colored pinned timer/finish header. This follows
the user's newer visual correction; the reference PDF remains unchanged.
`npm.cmd run check`: **PASS**, TypeScript/lint/format, 293 Jest + six dataset tests.
Web export and 16 isolated layout captures passed; the five main page headings
were checked inside their scroll containers. Zero live Supabase requests.
See [verification and changed files](REDESIGN_IMPLEMENTATION.md#header-reconciliation).
No dependency, data service, schema or release-weight change.

Historical offline reference (2026-10-16): **DONE** - a 91-page PDF atlas and 87
sample-data screen PNGs document the current implementation, including full
scrolling content and labelled source-derived native/date variants. See the
[atlas and verification scope](DESIGN_ATLAS.md). This does not close device
acceptance or earn additional release weight.

Latest design sync (2026-10-16): **BLOCKED** at final visual correction by the
Figma Starter MCP limit. The authorized code-to-design update applied 78 editable
screens/states and preserved 23 future concepts separately. Short-link wrapping,
blank exercise-image previews and native-only visual variants remain pending;
exact visual acceptance is not claimed. See [sync evidence and frame links](FIGMA_IMPLEMENTATION_SYNC.md).
No app implementation or weighted release-completion values changed.

Earlier design access: the user supplied a local Figma PDF export and authorized
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

v0.9 original denominator: `3 + 3 + 5 + 4 + 3 + 6 + 6 + 3 = 33`.
The user-deferred personal beta retains six weight and earns zero. Verified
active work earns **27**: `27 / (33 - 6) = 100%` active development. The unchanged
full-scope baseline is `27 / 33 = 81.818…%`; full beta/release acceptance remains
DEFERRED. Platform checks are retained unweighted follow-ups, not claimed passes.
See the v0.9 closure evidence and [testing handoff](V09_TESTING.md).

v0.6 denominator: `3 + 3 + 2 + 3 + 3 + 2 + 2 + 2 + 4 = 24`.
Earned weight: **24**, all nine tasks have implementation, calculation/data-access,
UI/state and local/live/browser evidence. Functional release completion:
`24 / 24 × 100 = 100%`. Shared time presets are now implemented across all modules;
weekly/monthly summaries reuse the same recorded sources and deterministic math.
Device/native-build acceptance remains user-DEFERRED.

Use the Development Plan's weights exactly. For each active item, earned weight
is `weight × verified completed subtasks / total subtasks`. DONE earns full weight;
NOT_STARTED earns zero; BLOCKED earns only completed subtasks. DEFERRED and DROPPED
items are excluded from their release denominator. Never infer progress from Figma.
All eight v0.2 tasks and all sixteen v0.3 functional tasks are verified. Their device acceptance remains an unweighted pending follow-up; native builds are user-deferred. v0.1's weighted acceptance split is recorded below. No future-release or retained feature has been silently removed.

v0.1 denominator: `2 + 3 + 3 + 2 + 5 + 3 + 3 + 6 + 3 + 6 + 4 = 40`.
Subtasks below define a reproducible foundation baseline. CI is implemented and
its remote run passed. The user's 2026-10-14 instruction closes the active
development scope and excludes the remaining 6.25 DEFERRED acceptance weight
from the active denominator: **33.75 / (40 - 6.25) = 100%, DONE**.
The unchanged full-scope verified baseline is **33.75 / 40 = 84.375%**;
full release acceptance is **DEFERRED**, not passed. Canonical weights are
preserved; no new weight is earned by this scope change. See the closure table
for each item's active/deferred weight and existing implementation evidence.
v1.0 has no plan weight: track its nine explicit
release gates separately, without inventing a numeric weight.

Earned weight: `2 × 4/4 + 3 × 2/3 + 3 × 5/5 + 2 × 2/2 + 5 × 4/5 + 3 × 2/3 + 3 × 3/4 + 6 × 10/12 + 3 × 4/4 + 6 × 3/4 + 4 × 4/4 = 33.75`.
Full-scope verified baseline: `33.75 / 40 × 100 = 84.375%`. Rounded table
percentages never replace these exact fractions. Active development completion
is 100% after the explicit check deferral; full v0.1 release acceptance is pending.

v0.2 denominator: `2 + 4 + 3 + 5 + 4 + 5 + 3 + 2 = 28`.
Earned weight: `2 + 4 + 3 + 5 + 4 + 5 + 3 + 2 = 28`.
Release completion: `28 / 28 × 100 = 100%`. Each verification group below has implementation evidence; this does not claim physical-device QA or v0.1 acceptance.
The 2026-10-14 weighted v0.1 acceptance split supersedes the earlier unweighted
deferral records. Its original full-scope verified baseline remains 84.375%.

v0.3 denominator: `6 + 6 + 5 + 3 + 3 + 10 + 4 + 2 + 4 + 4 + 4 + 3 + 4 + 4 + 3 + 5 = 70`.
Earned weight: `6 + 6 + 5 + 3 + 3 + 10 + 4 + 2 + 4 + 4 + 4 + 3 + 4 + 4 + 3 + 5 = 70`. Functional completion is `70 / 70 × 100 = 100%`. The physical-device/native-build follow-ups are not claimed passed.

## Feature Table

For v0.1, status/completion refer to active development only. Weight retains the
original planned total; the closure table splits each total into verified DONE
weight and DEFERRED check weight. Do not count a DONE row's deferred portion as earned.

v0.4 denominator: `5 + 3 + 5 + 5 + 6 + 6 + 6 + 3 + 3 + 4 + 5 + 4 + 2 = 57`.
Earned weight: **57**. Functional completion is `57 / 57 × 100 = 100%`.
All thirteen tasks have implementation, validation and integration evidence below.
User-deferred device checks are separate, unweighted acceptance records; they are not claimed passed.

| Area             | Feature                                | Release | Weight | Status      | Completion | Notes                                                                                                                                                    |
| ---------------- | -------------------------------------- | ------- | -----: | ----------- | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase 0 / 0.1    | Repository                             | v0.1    |      2 | DONE        |       100% | Git, ignores, README, env template verified (4/4).                                                                                                       |
| Phase 0 / 0.2    | React Native / Expo                    | v0.1    |      3 | DONE        |       100% | Config, TypeScript, exports and EAS setup verified. Active weight 2 DONE; native launch weight 1 DEFERRED.                                               |
| Phase 0 / 0.3    | Quality Baseline                       | v0.1    |      3 | DONE        |       100% | Typecheck, lint, format, tests and remote CI passed (5/5).                                                                                               |
| Phase 0 / 0.4    | App Structure                          | v0.1    |      2 | DONE        |       100% | Router scaffold and current architecture boundaries verified (2/2).                                                                                      |
| Phase 0 / 0.5    | Design System                          | v0.1    |      5 | DONE        |       100% | Tokens, shared controls/states and approved themes verified. Active weight 4 DONE; full visual acceptance weight 1 DEFERRED.                             |
| Phase 0 / 0.6    | Navigation                             | v0.1    |      3 | DONE        |       100% | Five routes and session/recovery guards verified; iPhone tab switching user-confirmed. Active weight 2 DONE; live transitions weight 1 DEFERRED          |
| Phase 0 / 0.7    | Supabase Integration                   | v0.1    |      3 | DONE        |       100% | Public config, client/lifecycle and live probes verified. Active weight 2.25 DONE; platform checks weight 0.75 DEFERRED.                                 |
| Phase 0 / 0.8    | Authentication                         | v0.1    |      6 | DONE        |       100% | Six flows implemented; sign-in/out/reset/persistence accepted. Active weight 5 DONE; signup/verification checks weight 1 DEFERRED.                       |
| Phase 0 / 0.9    | Profile / Preferences                  | v0.1    |      3 | DONE        |       100% | Schema/services/UI and web/iPhone profile/preferences save/reopen user-verified (4/4); separate native email-change follow-up remains.                   |
| Phase 0 / 0.10   | RLS / Security Foundation              | v0.1    |      6 | DONE        |       100% | Grants/RLS, SQL isolation, constraints and lifecycle verified. Active weight 4.5 DONE; app/security checks weight 1.5 DEFERRED.                          |
| Phase 0 / 0.11   | Data Access Layer                      | v0.1    |      4 | DONE        |       100% | Types, owned services, validation/error mapping and live profile/preferences reads/writes verified (4/4).                                                |
| Phase 1 / 1.1    | Muscle & Equipment Schema              | v0.2    |      2 | DONE        |       100% | Hosted catalogs, stable UUIDs/constraints, RLS and generated types verified (4/4).                                                                       |
| Phase 1 / 1.2    | Exercise Schema                        | v0.2    |      4 | DONE        |       100% | Source IDs, instructions, relationships and licenses deployed; repeat import preserves all 643 IDs (4/4).                                                |
| Phase 1 / 1.3    | Exercise Media Schema                  | v0.2    |      3 | DONE        |       100% | Separate pose metadata, validated paths/checksums, private bucket and signed reads verified (4/4).                                                       |
| Phase 1 / 1.4    | RepDB Import Script                    | v0.2    |      5 | DONE        |       100% | Pinned local parsing, taxonomy mapping, attribution and atomic idempotent hosted import verified (4/4).                                                  |
| Phase 1 / 1.5    | RepDB Media Import                     | v0.2    |      4 | DONE        |       100% | 1,138 WebP objects uploaded; metadata/checksums, signed retrieval and repeat upsert verified (4/4).                                                      |
| Phase 1 / 1.6    | Exercise Library UI                    | v0.2    |      5 | DONE        |       100% | Search, muscle/equipment/setup filters, thumbnails and bounded pagination tested in API/UI/browser (4/4).                                                |
| Phase 1 / 1.7    | Exercise Detail                        | v0.2    |      3 | DONE        |       100% | Actual poses, instructions, muscles/equipment and attribution; authenticated detail/back browser flow passed (4/4).                                      |
| Phase 1 / 1.8    | Equipment Profile                      | v0.2    |      2 | DONE        |       100% | Owned schema/RLS, atomic save service, editable UI and real browser save/reload passed (4/4).                                                            |
| Phase 2 / 2.1    | Workout Schema                         | v0.3    |      6 | DONE        |       100% | Six owned tables, snapshots/constraints, RLS/grants and hosted deployment/types verified (4/4).                                                          |
| Phase 2 / 2.2    | Custom Workout Builder                 | v0.3    |      6 | DONE        |       100% | Create/edit/delete, atomic owned save and search/detail → new/existing draft → discard/save/reopen verified (5/5).                                       |
| Phase 2 / 2.3    | Splits & Predefined Training Plans     | v0.3    |      5 | DONE        |       100% | Split CRUD/active choice and real catalog/filter/preview/private adoption verified (5/5).                                                                |
| Phase 2 / 2.4    | Workout Pre-Start                      | v0.3    |      3 | DONE        |       100% | Actual exercises/sets, explicit estimate and durable Start entry verified.                                                                               |
| Phase 2 / 2.5    | Session Mode Chooser                   | v0.3    |      3 | DONE        |       100% | Timed Workout / Log Only choices start the dedicated saved draft.                                                                                        |
| Phase 2 / 2.6    | Dedicated Active Workout               | v0.3    |     10 | DONE        |       100% | Compact media/metadata, previous/best, set table/add/remove/next/previous/finish verified.                                                               |
| Phase 2 / 2.7    | Timed Session                          | v0.3    |      4 | DONE        |       100% | Pause/resume excludes paused time; nonzero duration saves and rest stays independent.                                                                    |
| Phase 2 / 2.8    | Log Only                               | v0.3    |      2 | DONE        |       100% | No total timer; complete persistence and direct exercise entry verified.                                                                                 |
| Phase 2 / 2.9    | Rest Timer                             | v0.3    |      4 | DONE        |       100% | Auto start, pause/resume, skip and ±15 seconds verified in both modes.                                                                                   |
| Phase 2 / 2.10   | Workout Summary                        | v0.3    |      4 | DONE        |       100% | Actual completed exercises/sets/volume/duration/records and note displayed after acknowledgement.                                                        |
| Phase 2 / 2.11   | Workout History                        | v0.3    |      4 | DONE        |       100% | Owned search/mode/pagination, reopen/edit/add/remove, frozen retry, revision-safe delete and recalculated results verified.                              |
| Phase 2 / 2.12   | PR Detection                           | v0.3    |      3 | DONE        |       100% | Detection plus fresh history edit/delete and subsequent prior/best recalculation verified (2/2); repeated exercises share records.                       |
| Phase 2 / 2.13   | Training Volume                        | v0.3    |      4 | DONE        |       100% | Working sets/reps/known external volume, frequency and snapshot primary-muscle allocation verified (2/2).                                                |
| Phase 2 / 2.14   | Training Status                        | v0.3    |      4 | DONE        |       100% | Transparent planned-day, relative-volume and allocation rules; insufficient history/unassigned days handled without fake physiology.                     |
| Phase 2 / 2.15   | Recovery Check                         | v0.3    |      3 | DONE        |       100% | Owned daily energy/soreness/sleep and optional stress/notes; categories/context, save/update/reopen and RLS verified.                                    |
| Phase 2 / 2.16   | Active Workout Resilience              | v0.3    |      5 | DONE        |       100% | Owner-scoped queued device save, wall-time clock, restart and offline completion/retry verified; device smoke remains pending.                           |
| Phase 3 / 3.1    | Nutrition Schema                       | v0.4    |      5 | DONE        |       100% | Eight nutrition tables, FK/constraints, owned RLS, typed hosted deployment and local/hosted rollback checks.                                             |
| Phase 3 / 3.2    | Nutrition Targets                      | v0.4    |      3 | DONE        |       100% | Owned targets, kcal/kJ validation, date-effective history, UI checks and browser save/reopen.                                                            |
| Phase 3 / 3.3    | Food Database/Search                   | v0.4    |      5 | DONE        |       100% | 7,793 USDA foods/14,449 portions; stable repeated import, prefix search, detail and pagination.                                                          |
| Phase 3 / 3.4    | Serving Units / Conversion             | v0.4    |      5 | DONE        |       100% | Explicit food base; g/oz, volume and food-specific servings; no assumed density; tested math.                                                            |
| Phase 3 / 3.5    | Portion Editor                         | v0.4    |      6 | DONE        |       100% | Unit choices, direct quantity/stepper, base/live nutrition and meal impact; UI/browser retry checks.                                                     |
| Phase 3 / 3.6    | Nutrition Calculation Engine           | v0.4    |      6 | DONE        |       100% | Unrounded scaling, source energy, meal/daily totals and recipe math; Jest plus SQL parity.                                                               |
| Phase 3 / 3.7    | Food Diary                             | v0.4    |      6 | DONE        |       100% | Four meal groups/date, actual totals/remaining, edit/delete and browser reload verified.                                                                 |
| Phase 3 / 3.8    | Custom Foods                           | v0.4    |      3 | DONE        |       100% | Private label foods, known serving equivalents, create/edit/archive and historical retention.                                                            |
| Phase 3 / 3.9    | Favorites / Recent / Frequent          | v0.4    |      3 | DONE        |       100% | Authenticated recent/frequency ranking and favorites; API, ownership and browser selection.                                                              |
| Phase 3 / 3.10   | Saved Meals / Copy Meal / Copy Day     | v0.4    |      4 | DONE        |       100% | Snapshot saved meals, repeat/copy meal/day, stable retry and create/log/delete acceptance.                                                               |
| Phase 3 / 3.11   | Recipes                                | v0.4    |      5 | DONE        |       100% | Actual ingredient portions, servings/total/per-serving, owned create/edit/delete verified.                                                               |
| Phase 3 / 3.12   | Recipe-by-Weight                       | v0.4    |      4 | DONE        |       100% | Optional cooked total weight, per-100g and arbitrary grams; serving-only behavior verified.                                                              |
| Phase 3 / 3.13   | Hydration                              | v0.4    |      2 | DONE        |       100% | Persisted targets and ml/L/US fl oz entries with validation, reopen and delete verified.                                                                 |
| Phase 4 / 4.1    | Habit Schema                           | v0.5    |      3 | DONE        |       100% | Owned definitions/dated settings/logs; local/hosted constraints, ownership and grants pass.                                                              |
| Phase 4 / 4.2    | Habit Creation                         | v0.5    |      4 | DONE        |       100% | All five types, units, schedule/dates/reminder and create/reopen verified.                                                                               |
| Phase 4 / 4.3    | Habit Logging                          | v0.5    |      3 | DONE        |       100% | Explicit zero/not-done, dated edit/removal and exact acknowledged retry verified.                                                                        |
| Phase 4 / 4.4    | Habit History / Consistency            | v0.5    |      3 | DONE        |       100% | 90-date history, dated targets, rest/partial weeks; calendar tests and browser history pass.                                                             |
| Phase 4 / 4.5    | Motivation Mode                        | v0.5    |      2 | DONE        |       100% | Streaks/weekly/completion/None, actual in-app due reminders; OS delivery remains later.                                                                  |
| Phase 4 / 4.6    | Goal Schema                            | v0.5    |      2 | DONE        |       100% | Owned validated goals and compatible owned sources; hosted/local RLS and retries verified.                                                               |
| Phase 4 / 4.7    | Goal Creation                          | v0.5    |      4 | DONE        |       100% | Thirteen metrics, baseline/direction/date/unit validation and source selection; create/edit/delete/restore pass.                                         |
| Phase 4 / 4.8    | Goal Progress                          | v0.5    |      3 | DONE        |       100% | Body/workout/PR/activity/nutrition/habit facts; missing sources, deadlines and dated targets handled.                                                    |
| Phase 4 / 4.9    | Bodyweight Logging                     | v0.5    |      3 | DONE        |       100% | Dated kg/cm values, named measurements, preferences, replace/edit/delete/history verified.                                                               |
| Phase 4 / 4.10   | Steps Foundation                       | v0.5    |      3 | DONE        |       100% | Manual totals/targets verified; iPhone permission/read adapter unit tested. Physical sensor QA DEFERRED.                                                 |
| Phase 4 / 4.11   | Today Dashboard                        | v0.5    |      8 | DONE        |       100% | Saved weight/trend, steps, nutrition, workout, habits/goals, training/recovery; browser layouts and failed-load/retry pass.                              |
| Phase 5 / 5.1    | Weight Progress                        | v0.6    |      3 | DONE        |       100% | Owned dated history, kg/lb, recorded changes/averages, chart gaps and empty/error/retry; tests and live/browser checks pass.                             |
| Phase 5 / 5.2    | Nutrition Progress                     | v0.6    |      3 | DONE        |       100% | Owned complete food history, effective targets, logged-day averages/adherence, units and UI/retry verified.                                              |
| Phase 5 / 5.3    | Workout Frequency                      | v0.6    |      2 | DONE        |       100% | Completed owned sessions, distinct dates, modes, timed duration and calendar-normalized frequency verified.                                              |
| Phase 5 / 5.4    | Strength Progress                      | v0.6    |      3 | DONE        |       100% | Owned completed-set joins, recorded exercise search, daily external load/Epley trends and history verified.                                              |
| Phase 5 / 5.5    | Training Volume                        | v0.6    |      3 | DONE        |       100% | Reuses tested volume/muscle allocation; unknown loads and bodyweight semantics, daily chart/history verified.                                            |
| Phase 5 / 5.6    | Steps Progress                         | v0.6    |      2 | DONE        |       100% | Dated totals/provenance, explicit zero versus unknown, recorded-day averages and current-target labeling verified.                                       |
| Phase 5 / 5.7    | Habit Progress                         | v0.6    |      2 | DONE        |       100% | Dated versions, eligible periods/rest/partial weeks, explicit avoidance and archive exclusion verified.                                                  |
| Phase 5 / 5.8    | Time Filters                           | v0.6    |      2 | DONE        |       100% | 7D/30D/3M/6M/1Y/All on every module, month clamping, earliest records and inclusive custom dates verified.                                               |
| Phase 5 / 5.9    | Weekly / Monthly Summary               | v0.6    |      4 | DONE        |       100% | Weekly/monthly recorded summaries, partial boundaries, coverage and noncausal complete-period comparisons verified.                                      |
| Phase 6 / 6.1    | Accessibility                          | v0.9    |      3 | DONE        |       100% | Contrast/touch-target fixes; labels/chart alternatives and responsive themes reviewed; automated checks pass. Device assistive-tech acceptance deferred. |
| Phase 6 / 6.2    | Performance                            | v0.9    |      3 | DONE        |       100% | Bounded reads/charts reviewed; long-history benchmark and indexed summary fix; all-platform exports. Device profiling deferred.                          |
| Phase 6 / 6.3    | Security Review                        | v0.9    |      5 | DONE        |       100% | 35-table RLS review, 28-table isolation, live export/deletion and negative auth checks pass. Residual advisories retained for release review.            |
| Phase 6 / 6.4    | Error / Crash Handling                 | v0.9    |      4 | DONE        |       100% | Safe route fallback/retry; durable workout regression coverage and failure/cleanup tests pass. Native crash acceptance deferred.                         |
| Phase 6 / 6.5    | Notifications                          | v0.9    |      3 | DONE        |       100% | Free local habit scheduling, DST/owner/permission/cancellation/tap tests and native exports pass. OS delivery acceptance deferred; web in-app only.      |
| Phase 6 / 6.6    | Personal Beta                          | v0.9    |      6 | DEFERRED    |         0% | User will perform real daily logging and report findings. Six weight excluded from active denominator; no beta pass claimed.                             |
| Phase 6 / 6.7    | Bug Fix / Polish                       | v0.9    |      6 | DONE        |       100% | Regression suite, live/browser core/privacy smoke, SDK patches and responsive/dark polish verified; later beta findings remain actionable.               |
| Phase 6 / 6.8    | Documentation Review                   | v0.9    |      3 | DONE        |       100% | README, deployment/privacy/reminder usage, known findings, testing checklist and weighted status reviewed.                                               |
| Phase 7          | Core release gate (nine prerequisites) | v1.0    |      — | NOT_STARTED |        0/9 | Release gate, no new weighted feature scope.                                                                                                             |
| Phase 8 / 8.1    | Motion / Activity Source Evaluation    | v1.1    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §8.1.                                                                                                                       |
| Phase 8 / 8.2    | Active Minutes Calculation             | v1.1    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §8.2.                                                                                                                       |
| Phase 8 / 8.3    | Today Integration                      | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.3.                                                                                                                       |
| Phase 8 / 8.4    | Progress Integration                   | v1.1    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §8.4.                                                                                                                       |
| Phase 8 / 8.5    | Accuracy / Messaging Review            | v1.1    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §8.5.                                                                                                                       |
| Phase 9 / 9.1    | Location Permission Flow               | v1.2    |      3 | IN_PROGRESS |         0% | Permission rationale/denial contracts tested; native system permission acceptance DEFERRED.                                                              |
| Phase 9 / 9.2    | Run Session Schema                     | v1.2    |      4 | DONE        |       100% | Applied migrations, generated types, rollback-only ownership/constraint/cascade SQL checks PASS.                                                         |
| Phase 9 / 9.3    | Run Start                              | v1.2    |      3 | IN_PROGRESS |         0% | Explicit start, GPS timeout, draft and browser flow verified; outdoor start acceptance DEFERRED.                                                         |
| Phase 9 / 9.4    | GPS Route Recording                    | v1.2    |      8 | IN_PROGRESS |         0% | Local GPS queue, filters/bounds and account-isolation tests PASS; physical background GPS DEFERRED.                                                      |
| Phase 9 / 9.5    | Active Run                             | v1.2    |      7 | IN_PROGRESS |         0% | Timer, pause/resume, guarded navigation and browser flow verified; native lifecycle acceptance DEFERRED.                                                 |
| Phase 9 / 9.6    | Distance / Pace Calculation            | v1.2    |      5 | DONE        |       100% | Haversine, km/mi pace, pause gaps, noise and dateline tests PASS.                                                                                        |
| Phase 9 / 9.7    | Run Summary                            | v1.2    |      4 | IN_PROGRESS |         0% | Review/frozen retry/save tests and browser flow PASS; native end-to-end acceptance DEFERRED.                                                             |
| Phase 9 / 9.8    | Route Thumbnail                        | v1.2    |      4 | DONE        |       100% | Server-derived bounded previews and segmented SVG outline; SQL/browser PASS.                                                                             |
| Phase 9 / 9.9    | Run History                            | v1.2    |      3 | DONE        |       100% | Owned paginated history with preview; browser/service checks PASS.                                                                                       |
| Phase 9 / 9.10   | Run Detail                             | v1.2    |      3 | DONE        |       100% | Owned full-route detail and guarded deletion; SQL/service/browser flow verified.                                                                         |
| Phase 9 / 9.11   | Today Recent-Run Card                  | v1.2    |      2 | DONE        |       100% | Recent/active draft card and owned detail navigation; UI/browser PASS.                                                                                   |
| Phase 9 / 9.12   | Progress Running Card                  | v1.2    |      2 | DONE        |       100% | Shared periods, distance/time and distance-weighted average pace; UI/browser PASS.                                                                       |
| Phase 10 / 10.1  | Performance Dashboard                  | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.1.                                                                                                                      |
| Phase 10 / 10.2  | Training Block Comparison              | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.2.                                                                                                                      |
| Phase 10 / 10.3  | Unified Timeline                       | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.3.                                                                                                                      |
| Phase 10 / 10.4  | Advanced Cross-Metric Analytics        | v1.3    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §10.4.                                                                                                                      |
| Phase 10 / 10.5  | Badge Rules Engine                     | v1.3    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §10.5.                                                                                                                      |
| Phase 10 / 10.6  | Achievement UI                         | v1.3    |      3 | NOT_STARTED |         0% | Requirements: canonical plan §10.6.                                                                                                                      |
| Phase 11 / 11.1  | Image Capture                          | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.1.                                                                                                                      |
| Phase 11 / 11.2  | Secure Vision Provider Integration     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.2.                                                                                                                      |
| Phase 11 / 11.3  | Food Identification                    | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.3.                                                                                                                      |
| Phase 11 / 11.4  | Portion Estimation                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.4.                                                                                                                      |
| Phase 11 / 11.5  | Nutrition Matching                     | v1.4    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §11.5.                                                                                                                      |
| Phase 11 / 11.6  | Editable Review                        | v1.4    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §11.6.                                                                                                                      |
| Phase 11 / 11.7  | Confirmed Logging                      | v1.4    |      2 | NOT_STARTED |         0% | Requirements: canonical plan §11.7.                                                                                                                      |
| Phase 12 / 12.1  | Local Data Strategy                    | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.1.                                                                                                                      |
| Phase 12 / 12.2  | Sync Queue                             | v1.5    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §12.2.                                                                                                                      |
| Phase 12 / 12.3  | Idempotency                            | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.3.                                                                                                                      |
| Phase 12 / 12.4  | Conflict Handling                      | v1.5    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §12.4.                                                                                                                      |
| Phase 12 / 12.5  | Reconciliation                         | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.5.                                                                                                                      |
| Phase 12 / 12.6  | Offline Coverage Expansion             | v1.5    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §12.6.                                                                                                                      |
| Phase 13 / 13.1  | Apple Health                           | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.1.                                                                                                                      |
| Phase 13 / 13.2  | Android Health Connect                 | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.2.                                                                                                                      |
| Phase 13 / 13.3  | Imported Activities                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.3.                                                                                                                      |
| Phase 13 / 13.4  | Sleep                                  | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.4.                                                                                                                      |
| Phase 13 / 13.5  | Heart Rate                             | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.5.                                                                                                                      |
| Phase 13 / 13.6  | HRV                                    | v2.0    |      4 | NOT_STARTED |         0% | Requirements: canonical plan §13.6.                                                                                                                      |
| Phase 13 / 13.7  | Sensor-Enhanced Recovery               | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.7.                                                                                                                      |
| Phase 13 / 13.8  | Physiological Training Load            | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.8.                                                                                                                      |
| Phase 13 / 13.9  | Daily Suggested Workout                | v2.0    |      6 | NOT_STARTED |         0% | Requirements: canonical plan §13.9.                                                                                                                      |
| Phase 13 / 13.10 | Advanced Running Analytics             | v2.0    |      5 | NOT_STARTED |         0% | Requirements: canonical plan §13.10.                                                                                                                     |

## Phase Summary

| Phase    | Release | Purpose                           | Planned weight | Completion | Status      |
| -------- | ------- | --------------------------------- | -------------: | ---------: | ----------- |
| Phase 0  | v0.1    | Foundation                        |             40 |       100% | DONE        |
| Phase 1  | v0.2    | Exercise Library                  |             28 |       100% | DONE        |
| Phase 2  | v0.3    | Strength Workout System           |             70 |       100% | DONE        |
| Phase 3  | v0.4    | Manual Nutrition                  |             57 |       100% | DONE        |
| Phase 4  | v0.5    | Habits, Goals & Today             |             38 |       100% | DONE        |
| Phase 5  | v0.6    | Basic Progress & Analytics        |             24 |       100% | DONE        |
| Phase 6  | v0.9    | Quality & Personal Beta           |             33 |       100% | DONE        |
| Phase 7  | v1.0    | Core Deterministic Release        |    — (9 gates) |         0% | NOT_STARTED |
| Phase 8  | v1.1    | Active Minutes                    |             16 |         0% | NOT_STARTED |
| Phase 9  | v1.2    | Running / GPS                     |             48 |   47.9167% | IN_PROGRESS |
| Phase 10 | v1.3    | Advanced Analytics & Achievements |             26 |         0% | NOT_STARTED |
| Phase 11 | v1.4    | Food Photo AI                     |             25 |         0% | NOT_STARTED |
| Phase 12 | v1.5    | Advanced Offline / Sync           |             28 |         0% | NOT_STARTED |
| Phase 13 | v2.0    | Health / Wearables                |             47 |         0% | NOT_STARTED |

## v0.1 development closure — 2026-10-14

**DONE — 100% of active foundation development; full release acceptance DEFERRED.**
The user explicitly requested deferring the remaining checks and completing v0.1.
All eleven foundation items have existing implementation evidence. Review found
no unfinished non-deferred foundation feature; no placeholder, disabled security,
new dependency, schema, key, paid service or build was added to close the phase.
The next planned feature remains v0.6 task 5.2, not implemented by this work order.

The main feature/phase tables now report active completion. Their original plan
weights remain unchanged. Completed weight is still 33.75; it has not increased.

| Task                           | Original weight | Verified active weight | Deferred check weight | Active status | Evidence                                                                                        |
| ------------------------------ | --------------: | ---------------------: | --------------------: | ------------- | ----------------------------------------------------------------------------------------------- |
| 0.1 Repository                 |               2 |                      2 |                     0 | DONE          | Git, ignores, README and credential-free env template.                                          |
| 0.2 React Native / Expo        |               3 |                      2 |                     1 | DONE          | Strict TypeScript, supported project configuration/exports and configured development profiles. |
| 0.3 Quality Baseline           |               3 |                      3 |                     0 | DONE          | Typecheck, lint, format, tests and previously passing remote CI.                                |
| 0.4 App Structure              |               2 |                      2 |                     0 | DONE          | Expo Router composition and feature UI/business/data boundaries.                                |
| 0.5 Design System              |               5 |                      4 |                     1 | DONE          | Verified palette/type/layout, shared controls/states and approved functional dark mode.         |
| 0.6 Navigation                 |               3 |                      2 |                     1 | DONE          | Five guarded tabs, icons, account routes and recovery contracts.                                |
| 0.7 Supabase Integration       |               3 |                   2.25 |                  0.75 | DONE          | Validated public configuration, persistent client, lifecycle and prior live probes.             |
| 0.8 Authentication             |               6 |                      5 |                     1 | DONE          | Six flow implementations/contracts; existing user-verified sign-in/out/reset/persistence.       |
| 0.9 Profile / Preferences      |               3 |                      3 |                     0 | DONE          | Owned profile/preferences, account updates, units/time zone, opt-ins and saved themes.          |
| 0.10 RLS / Security Foundation |               6 |                    4.5 |                   1.5 | DONE          | Grants/ownership policies, SQL isolation, constraints, initialization and cascades.             |
| 0.11 Data Access Layer         |               4 |                      4 |                     0 | DONE          | Generated types, owned services, validated inputs/safe errors and persistence evidence.         |
| Total                          |              40 |                  33.75 |                  6.25 | DONE          | Active: 33.75 / 33.75 = 100%; original full scope: 33.75 / 40 = 84.375%.                        |

Deferred checks remain weighted and excluded only from the current active denominator:

| Check                                                            | Weight | Status   | Resume condition                                                                              |
| ---------------------------------------------------------------- | -----: | -------- | --------------------------------------------------------------------------------------------- |
| Custom native development-build compilation and launch           |      1 | DEFERRED | User authorizes builds; target/signing access is available.                                   |
| Full visual/theme acceptance, including unverified Figma parity  |      1 | DEFERRED | Foundation visual review against approved references.                                         |
| Complete live tab/back/sign-out/recovery transitions             |      1 | DEFERRED | Cross-platform acceptance pass; preserve accepted basic switching/icons.                      |
| Remaining Supabase platform integration                          |   0.75 | DEFERRED | iOS/Android target availability and live platform checks.                                     |
| Individually identified live signup/email verification groups    |      1 | DEFERRED | Fresh confirmation flows on the initiating platform within email limits.                      |
| Foundation two-account application isolation/security acceptance |    1.5 | DEFERRED | Dedicated foundation acceptance pass; reuse recorded SQL and later-module isolation evidence. |

Native email-change/post-crypto callback checks remain within the Auth follow-up;
they do not add another weight. None of these checks is claimed passed. Before
v1.0 release acceptance, resume every retained check and fix any discovered defect.
At foundation closure, account deletion/export remained unimplemented. They are
subsequently completed under v0.9 task 6.3 below; no foundation weight was added.
Residual dependency/advisor findings remain documented for release review.

Verification for this documentation-only closure:

- Reread both canonical documents and inspected foundation config, route/session
  guards, shared controls, client lifecycle, profile/preferences/security services,
  the foundation migration and existing regression coverage. Existing code and
  historical user/database evidence support the completed active groups above.
- `npm.cmd run check`: PASS — strict TypeScript, lint, formatting, 251 Jest tests
  across 48 suites and 6 dataset tests (257 total).
- `git diff --check` and `git check-ignore .env .actaro-tools/close-foundation.cjs`:
  PASS. Only the six scoped documentation files are staged for the closure commit.
- No live Supabase call, confirmation email, native build or device check was run;
  the user's deferral is respected. The supplied design PDF is unchanged/untracked.

## Historical foundation subtask ledger (before 2026-10-14 closure)

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

## Historical v0.1 dependencies and remaining acceptance (2026-10-11)

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

Historical record: the weighted closure above supersedes the earlier unweighted
status treatment. All retained checks remain DEFERRED; none is newly passed.

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

All sixteen v0.3 functional tasks are verified. Device smoke testing is
NOT_STARTED; browser responsive layouts and native exports do not count as device
tests. Real disposable-account sessions have been logged by the new session flow.

## v1.0 release gate

**Session verification groups (2026-10-13):** tasks 2.4–2.10 are each verified
end to end by model/service/UI tests, hosted rollback SQL and real public-client
browser logging. Task 2.16 covers durable owner-scoped drafts/serialized storage,
wall-time pause/background/restart math with foreground refresh, and frozen
offline completion/acknowledged retry (3/3). Native device background smoke remains
an unweighted pending acceptance check; no EAS/native build was requested or run.
Task 2.12 has detection/tests and edit/delete recalculation DONE (2/2).
Task 2.13 has completed working-set/repetition/known-load volume and
frequency/primary-muscle aggregation DONE (2/2).

| Prerequisite                 | Status      | Evidence                                                                               |
| ---------------------------- | ----------- | -------------------------------------------------------------------------------------- |
| Foundation stable            | NOT_STARTED | v0.1 release acceptance pending.                                                       |
| Exercise library stable      | DONE        | v0.2 canonical functional acceptance passed; device follow-up remains recorded.        |
| Strength workout flow stable | IN_PROGRESS | v0.3 functional scope passed; device smoke and v0.9 quality acceptance remain pending. |
| Manual nutrition stable      | IN_PROGRESS | v0.4 functional acceptance passed; deferred device and v0.9 quality acceptance remain. |
| Habits/goals stable          | NOT_STARTED | v0.5 pending.                                                                          |
| Today stable                 | NOT_STARTED | v0.5 pending.                                                                          |
| Basic Progress stable        | NOT_STARTED | v0.6 pending.                                                                          |
| Security review complete     | NOT_STARTED | v0.9 pending.                                                                          |
| Personal beta complete       | NOT_STARTED | v0.9 pending.                                                                          |

## Retained and deferred scope

These source-of-truth requirements have no separate plan weight. Preserve them
without assigning an invented release/weight; resolve their exact task placement
before implementation. DEFERRED means intentionally not in this setup's scope.

| Feature or requirement                                                     | Release / placement                                          | Status      | Authority / note                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account deletion and data export                                           | Core security, v0.9 task 6.3 (no new weight)                 | DONE        | Owned 28-table JSON export and password-verified Edge deletion; live/browser/cascade/isolation evidence below.                                                                        |
| Body measurements and measurement history                                  | Body goals/progress; exact task not separately numbered      | NOT_STARTED | Source §§13–14, 21.                                                                                                                                                                   |
| User-created exercises                                                     | Placement undecided                                          | DEFERRED    | Source §21 ownership/RLS.                                                                                                                                                             |
| Warm-up sets, supersets, drop sets, advanced set types                     | Later strength enhancement; release unassigned               | DEFERRED    | Source §8.4.                                                                                                                                                                          |
| Optional RPE and recovery stress input                                     | Strength enhancement / v0.3 recovery                         | IN_PROGRESS | Builder targets/history actual RPE and recovery stress implemented; active actual-RPE input retained DEFERRED to later strength work. Planned RPE is not copied into performed facts. |
| Fiber, sodium, potassium, micronutrients                                   | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.1.                                                                                                                                                                         |
| Barcode and nutrition-label scanning                                       | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                                                                                                                                        |
| What-If Nutrition and deterministic meal substitutions                     | Later nutrition enhancement; release unassigned              | DEFERRED    | Source §11.11.                                                                                                                                                                        |
| Dashboard customization/layout preferences                                 | Later enhancement; release unassigned                        | DEFERRED    | Source §§6, 7.                                                                                                                                                                        |
| Units, theme, notifications, privacy, gamification preferences             | v0.1 preferences; notifications also v0.9                    | IN_PROGRESS | Private schema/services tested; UI and behavior integration pending.                                                                                                                  |
| Initial strength plan families and equipment/goal/experience/day filters   | v0.3 plan task                                               | DONE        | Seven strength families verified. Beginner Running retained DEFERRED until v1.2 running sessions; no early GPS or fake strength log.                                                  |
| Plateau detection, muscle balance, goal/step/running trends, What changed? | Analytics phases; exact subtask placement to be reviewed     | NOT_STARTED | Source §14.7; basic/advanced boundaries must be respected.                                                                                                                            |
| Running goals/events, elevation, splits, start/end markers, cadence and HR | Running / later advanced running; exact placement unassigned | DEFERRED    | Source §§13, 16; supported data and later release approval required.                                                                                                                  |
| Activity distance/active days and richer phone activity context            | Activity phases; exact placement to be reviewed              | NOT_STARTED | Source §§13–16; simplest supported steps source first.                                                                                                                                |
| Semantic search, exercise-form vision, optional AI explanations            | Only if justified; release unassigned                        | DEFERRED    | Source §18.2.                                                                                                                                                                         |
| Wearable-specific integrations beyond named health platforms               | v2.0 direction; provider decisions pending                   | NOT_STARTED | Source §22; no provider implementation assumed.                                                                                                                                       |
| Branding/store-name/domain clearance and production bundle IDs             | Before public launch                                         | NOT_STARTED | Source §1.0; no ownership or identity invented.                                                                                                                                       |
| Generic chatbot, autonomous coach, AI motivational spam                    | Explicitly excluded unless user changes scope                | DROPPED     | Source §§18, 23; documented exclusion, not a new scope decision.                                                                                                                      |
| Medical/injury diagnosis and accurate-looking AI body-fat estimates        | Explicitly excluded unless scope changes                     | DROPPED     | Source §§18, 23.                                                                                                                                                                      |
| Fake physiological readiness, Fitness Age, Body Battery imitation          | Explicitly excluded unless scope changes                     | DROPPED     | Source §23.                                                                                                                                                                           |
| Early microservices, Kubernetes/GKE, unnecessary custom backend            | Explicitly excluded for early versions                       | DROPPED     | Source §§19, 23; real future backend triggers remain documented.                                                                                                                      |

## Last Completed

**DONE — v0.9 active implementation (2026-10-15).** Seven tasks earn 27/27
active weight. Privacy export/deletion, local reminders and quality improvements
have local/live/browser evidence in the closure entry below. Personal beta's six
weight and device/native/v1.0 acceptance remain DEFERRED, not passed.

**DONE — v0.6 Basic Progress & Analytics (2026-10-14).** All nine tasks
are verified at 24/24 weight. Detailed evidence is recorded in the completion
entry below. User-deferred device/build checks and v1.0 gates remain separate.

**DONE — v0.1 active development closure (2026-10-14).** All foundation
implementation groups are complete; the remaining 6.25 check weight is explicitly
user-DEFERRED. The closure table records weights, evidence and resume conditions.
No app behavior changed and no full-release acceptance was granted.

**DONE — v0.6 task 5.1 Weight Progress (2026-10-14).** Full owned weight
history within chosen dates, saved units, recorded change/average/range, bounded
chart with missing dates, exact history, logging link and loading/error/retry.
Supporting evidence is in the Weight Progress acceptance entry below. v0.5
remains functionally complete; the earlier dated evidence is retained.

**DONE — v0.4 Manual Nutrition (2026-10-13).**

- Applied four migrations: `20261013165850_nutrition_foundation.sql`,
  `20261013170346_nutrition_operations.sql`,
  `20261013172811_nutrition_retry_and_search.sql`, and
  `20261013174311_nutrition_target_history.sql`; regenerated hosted types.
- Added shared USDA reference foods and private targets/history, diary logs,
  favorites, recipes, saved meals, hydration and copy acknowledgements. Constraints,
  grants/RLS, source ownership, expected-actor checks and invoker RPCs are verified.
- Imported all **7,793 foods / 14,449 portions** from the reviewed USDA SR Legacy
  April 2018 JSON. Repeat import kept every stable UUID: catalog fingerprint before
  and after `8c941d8bd0f630152c6a90e2bc83bb60`. SHA256 and source/license details are
  recorded in decision 006. No new package, external runtime API or API key.
- Added `src/features/nutrition/` model/services, load/save feedback, target editor,
  diary, real food search/detail, portion editor, custom label foods, recipe editor
  and saved-meal list. Replaced the Nutrition placeholder; More links to Recipes.
  Routes compose guarded screens and own navigation; raw queries stay in services.
- Added three Jest suites and two SQL rollback suites, plus USDA parser tests and
  a shared test-only fixture. README documents normal use, admin import and limits;
  decision 006 records data provenance, serving math, target dates and snapshot/retry semantics.

Verification:

| Command / check                                                                                                | Result                 | Evidence                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm.cmd run check`                                                                                            | PASS                   | Strict typecheck, lint, formatting; 220 Jest tests in 38 suites plus 6 Node tests (226 total).                                                                                                                                                                                                                                 |
| `.\node_modules\.bin\expo.cmd export --platform all`                                                           | PASS                   | Android/iOS/web bundles and 31 static routes, including `/nutrition/manage`.                                                                                                                                                                                                                                                   |
| `node .actaro-tools/test-nutrition.mjs`                                                                        | PASS                   | All migrations in PostgreSQL/PGlite; existing workout contracts plus nutrition math, ownership, bounds, history, copies and retries.                                                                                                                                                                                           |
| Both `supabase/tests/nutrition_*.sql` via Supabase MCP                                                         | PASS                   | Hosted rollback checks, two-account/anonymous denial, target history, whole-day meal groups and changed-source retries; no email sends.                                                                                                                                                                                        |
| `node scripts/import-usda.mjs <extracted-json> --dry-run`                                                      | PASS                   | Validates all required nutrients, source IDs and portion weights without writes.                                                                                                                                                                                                                                               |
| `node --env-file=.env scripts/import-usda.mjs <extracted-json>` (twice)                                        | PASS                   | 7,793 records; identical count/UUID fingerprint after repeat. Uses ignored local admin key only.                                                                                                                                                                                                                               |
| `node --env-file=.env .actaro-tools/check-nutrition-live.mjs`                                                  | PASS                   | Real public-client search/paging, log/edit, shortcuts, recipes, saved meals/copy, targets/water and two-account isolation.                                                                                                                                                                                                     |
| Isolated browser scripts `check-nutrition-browser.mjs`, `check-nutrition-tail.mjs`, `check-nutrition-crud.mjs` | PASS (combined flows)  | 390px/desktop checks: targets, save-failure/exact retry, custom volume/servings/favorites/edit, saved-meal log/copy/delete, recipe cooked-weight/edit/serving-only behavior, hydration reopen/delete and retained historical logs. Harness selector issues were corrected; no passing result is inferred from failed attempts. |
| `node --env-file=.env .actaro-tools/check-bundle-privacy.mjs`                                                  | PASS                   | Privileged import credential absent from exported artifacts.                                                                                                                                                                                                                                                                   |
| Supabase security advisor                                                                                      | PASS — no new warnings | Existing Auth leaked-password warning remains unchanged and separately tracked.                                                                                                                                                                                                                                                |

Implementation accounting (all groups verified):

Performance advisor returned INFO items for five existing workout composite FKs
and unused-index statistics, including the new food search index. No nutrition
FK lacks an index. These are v0.9 profiling follow-ups, not evidence for deleting
freshly introduced indexes or refactoring another release. References:
[FK indexing](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys),
[unused index statistics](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

| Task                     | Weight | Status | Verified requirements                                                                         |
| ------------------------ | -----: | ------ | --------------------------------------------------------------------------------------------- |
| 3.1 Schema               |      5 | DONE   | Tables/types; constraints/FKs; grants/RLS; local/hosted deployment tests (4/4).               |
| 3.2 Targets              |      3 | DONE   | Persisted goals/history; kcal/kJ validation; editor/states; save/reopen/date checks (4/4).    |
| 3.3 Food database/search |      5 | DONE   | Licensed import/reimport; real paged prefix search; detail/source; shortcuts/selection (4/4). |
| 3.4 Units/conversion     |      5 | DONE   | Explicit bases; g/oz; known volume/named portions; tested client/server agreement (4/4).      |
| 3.5 Portion editor       |      6 | DONE   | Unit choice; direct input/stepper; base/live preview; meal impact and save/retry (4/4).       |
| 3.6 Calculation engine   |      6 | DONE   | Source nutrient scaling; totals; recipe math; tested precision/invalid values (4/4).          |
| 3.7 Diary                |      6 | DONE   | Four groups/dates; actual totals/remaining; edit/delete; persistence/states (4/4).            |
| 3.8 Custom foods         |      3 | DONE   | Label creation; known servings; owned edit/delete; snapshot retention (4/4).                  |
| 3.9 Shortcuts            |      3 | DONE   | Favorites; recent; frequency ranking; ownership/real selection (4/4).                         |
| 3.10 Saved meals/copy    |      4 | DONE   | Saved snapshot/create/log/delete; repeat/copy meal; whole-day groups; atomic retry (4/4).     |
| 3.11 Recipes             |      5 | DONE   | Ingredients/quantities; servings/totals; owned save/reopen/edit/delete; tested math (4/4).    |
| 3.12 Recipe-by-weight    |      4 | DONE   | Cooked batch weight; per-gram/100g; arbitrary grams; serving-only guard (4/4).                |
| 3.13 Hydration           |      2 | DONE   | Daily target; ml/L/US fl oz; persisted quantity/reopen; deletion/states (4/4).                |

Device testing is **DEFERRED** by the user. Screens were checked against relevant
approved fallback/verified components; exact visual polish, accessibility and
platform lifecycle acceptance remain quality work. No photo AI, barcode scanner,
meal recommendations, v0.5 module, paid SMTP, native build or durable food-sync queue
was introduced. Nutrition drafts/retries remain on their current screen, not across
termination. The dated USDA catalog is not a current worldwide branded catalog.

Cleanup verified: both reserved `actaro-v04-…@example.invalid` Auth accounts and
their owned test data were removed. Ignored session state is marked cleaned. Task-owned
preview/Metro/headless processes were stopped (remaining count 0); the user's usual
development server was excluded. Final export and secret scan passed after the
small stale-copy correction in More/Sign In. The supplied design PDF remains untracked.

**DONE — Remaining v0.3 history, training context and recovery tasks (2026-10-13).**

- Applied `20261013111751_workout_history_and_volume.sql`,
  `20261013112910_recovery_check_ins.sql` and
  `20261013113329_workout_request_identity.sql`; regenerated hosted types.
- History supports real name/mode filters, bounded pages, snapshot-preserving
  edit/add/remove, validated values, frozen same-mutation retry, explicit reload
  and revision-matched confirmed deletion. Reopening recalculates PR/volume;
  subsequent session previous/best values exclude deleted logs. Matching saved
  device summaries are invalidated without dropping active/pending workouts.
- Typed owner-scoped aggregate queries calculate frequency, completed sets/reps,
  known external volume and equally allocated recorded primary muscles. Missing
  weights/muscles remain explicit. Repeated exercises share record calculations.
- Status rules show their thresholds/evidence and handle insufficient history,
  split changes and unassigned days. Recovery persists owned daily reports with
  actual save/update/reopen, optional stress/notes and categorical context; no
  physiological score. Server checks bind the expected actor on health saves.
- Planned RPE is cleared from new performed drafts; actual RPE can be entered
  in history. Active RPE input is retained separately as a later optional enhancement.
  Invalid finish clocks are rejected before freezing an active draft.
- `node .actaro-tools/test-recovery.mjs`: PASS all migrations, foundation/session
  regressions, history edit/delete aggregation, two-primary allocation, recovery
  categories/date/upsert and actor/anonymous/two-owner checks. Final committed
  session/recovery SQL suites also PASS hosted, rollback only/no emails.
- `npm.cmd run check`: PASS typecheck/lint/format and 205 Jest + 4 Node tests
  (209 total; 35 Jest suites). Android/iOS/web export and 30 static routes PASS.
- `node .actaro-tools/check-history-recovery-browser.mjs`: PASS history
  edit/save/reload, volume/record recalculation, cancel/confirm delete, remaining
  aggregate totals, recovery save/update/reload and later-session deleted-PR checks.
  The test's premature reload was corrected; no app-side artificial wait was added.
- `node .actaro-tools/check-v03-final-browser.mjs`: PASS final search/empty/reset,
  summary/recovery readback and Exercise Detail → direct Log Only → persisted
  summary → confirmed deletion, preserving existing logs. Light/dark layouts inspected.
- `node --env-file=.env .actaro-tools/check-bundle-privacy.mjs`: PASS privileged
  import credential absent from exported artifacts. No new app dependencies,
  paid services, native builds or v0.4 implementation were introduced.
- Physical iPhone/Android workout smoke and exact unshown design matching remain
  pending for acceptance/quality follow-up. v0.3 functional weight is 70/70;
  foundation remains 84.375% and v1.0 is not complete.
- Acceptance fixture cleanup: the reserved test account was removed after all
  checks; its owned templates/splits/sessions/check-ins cascade. No real user or
  email was modified. Ignored harness credentials are cleared from its state file.

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

v0.9 active implementation/review is DONE: seven tasks, 27/27 active weight.
Personal beta (6 weight), physical-device/native-build acceptance and v1.0
approval remain DEFERRED. Earlier release implementation remains DONE. No v1.1+
work has begun. Use [V09_TESTING.md](V09_TESTING.md) for the retained acceptance.

## Next 3 Actions

1. User personal beta: log real workouts, nutrition and habits; report reproducible findings.
2. Verify deferred phone flows, local-notification delivery, native export and account/email callbacks when available.
3. Fix findings, resolve/accept documented release risks and complete the retained v1.0 gates before approval.

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
- Earlier reported Supabase exhaustion remains undiagnosed for the native/email follow-up. Database/API access and v0.2/v0.3 acceptance now pass using bounded disposable fixtures and no test emails; pending foundation email/device acceptance is not credited.
- Latest `npm audit --json` reports 67 affected package nodes (50 high, 17 moderate, zero critical). Compatible SDK patches and non-breaking fixes were applied; remaining recommendations include incompatible major changes. No forced SDK/Jest replacement or safety claim. See [quality findings](V09_TESTING.md#quality-findings-retained-for-release-review); no production release gate has passed.
- Expo selected ESLint 9.39.5, which npm marks unsupported; lint tooling support
  should be reviewed alongside SDK-compatible dependency remediation.

## Recent Decisions

- 2026-10-14: User explicitly closed v0.1 active development with remaining
  acceptance checks DEFERRED. Preserve original weights and historical evidence;
  report active DONE separately from unaccepted full release gates. This overrides
  the earlier IN_PROGRESS development status, not the product requirements.

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

## v0.5 functional acceptance — 2026-10-14

**DONE: 38 / 38 = 100% functional implementation. Device QA remains DEFERRED.**
Weights: `3 + 4 + 3 + 3 + 2 + 2 + 4 + 3 + 3 + 3 + 8 = 38`. Each task above has implementation and verification evidence. This does not change v0.1's 84.375% baseline or declare v1.0 ready.

- Read both canonical documents completely; applied Ponytail full, Supabase and RLS guidance. Used relevant approved Habits/Goals/Today PDF regions and existing verified primitives. No Figma edits, new backend, AI, paid service or build submission.
- Six hosted migrations, matching local versions: `20261014104828_habit_foundation.sql`, `20261014111517_goals_body_activity.sql`, `20261014112105_record_save_operations.sql`, `20261014112253_activity_optional_metrics.sql`, `20261014113535_goal_source_lifecycle.sql`, `20261014115349_habit_ownership_indexes.sql`. Generated database types match. Eight owned tables, actor-checked invoker RPCs, empty search paths, role grants, constraints, source ownership and covering indexes verified.
- Habits: five types, explicit logging, dated target/schedule settings, optional end/reminder, all motivation styles, history, edit/remove logs, archive/restore. Rest days and partial frequency weeks do not create false consistency misses. Reminders are in-app due states; OS delivery remains later notification work.
- Goals: thirteen body/training/activity/nutrition/habit metrics. Progress reads recorded facts; missing food/body/activity is unavailable, not success. Decreasing targets, deadlines, chosen units, recurring periods and estimated-PR semantics are explicit. Running/pace/event sources remain DEFERRED to v1.2.
- Body/activity: canonical kg/cm/km, preference conversion, dated edit/delete/history, named measurements, provenance and explicit daily steps targets. iPhone adapter checks availability/permission and reads since midnight; it requires review/save and replaces, never adds, manual/sensor totals. Android/web use manual daily totals. Actual sensor accuracy/permissions on devices remain DEFERRED.
- Today reuses underlying module services/models for weight/week change/seven-date trend, steps/target/remaining, nutrition/macros/hydration, planned workout/pre-start totals, local workout resume, habits/goals, Training Status and manual Recovery. No mock values or duplicate workout/nutrition formulas. Empty/loading/error/retry states are implemented.
- `npm.cmd run check`: **PASS** — strict TypeScript, lint, formatting, **243 Jest tests / 45 suites + 6 dataset tests = 249 tests**. New tests cover calendar/rest/partial weeks, explicit zero, goal direction/source validation, unit conversion, DST, sensor denial/platform fallback, input correction, ownership and exact failed-save retries.
- `node .actaro-tools/test-v05.mjs`: **PASS** — all migrations on PostgreSQL 18.3/PGlite, prior workout/nutrition contracts and new `supabase/tests/habits.sql` / `goals_body_activity.sql`. Both new rollback SQL suites also executed on hosted Supabase: **PASS**.
- `node --env-file=.env .actaro-tools/check-habits-live.mjs` and `check-v05-live.mjs`: **PASS** — two disposable confirmed accounts, all five habit types and thirteen goal metrics save/retry/reopen, source records, archive/restore, foreign read/write denial and invalid/future denial. No signup/confirmation emails. Fixture credentials/tooling remain ignored.
- Browser: `check-habits-browser.mjs` **PASS** for create/reopen/log/history/archive/restore. `check-v05-browser.mjs` verified body/measurement/activity edit/reopen, goal create/edit/archive/restore and real Today facts at 390px, 320px dark and 1280px without overflow. Its final negative scenario initially targeted Goals; corrected standalone `check-today-error-browser.mjs` **PASS** for failed Today load and Retry recovery. Screenshots inspected; viewport emulation is not physical-device evidence.
- `npm.cmd exec --no -- expo export --platform all --output-dir .actaro-tools/v05-export`: **PASS** — Android/iOS JS bundles plus web export with 37 routes. No native build was submitted.
- `npm.cmd exec --no -- expo install --check`: **FAIL** — existing SDK 57 patch recommendations for `@expo/ui`, `expo`, `expo-crypto`, `expo-dev-client`, `expo-router`, `expo-splash-screen`, `jest-expo`. New `expo-sensors ~57.0.3` matches SDK guidance. Working dependency versions were preserved; patch upgrades/device regressions and existing dependency advisories are tracked for v0.9. No forced audit upgrade.
- Hosted security advisor: only existing Auth leaked-password protection WARN; no new table security errors. Both new habit FK index findings resolved. Five existing workout composite-FK INFO findings and unused-index INFO notices remain quality follow-ups.
- Device/native builds, physical iPhone count/permission checks, Android activity and cross-platform acceptance remain user-**DEFERRED**. Existing environment configuration is reused; no new API key or privileged app secret.
- `node .actaro-tools/check-v05-artifacts.mjs`: **PASS**, 145 exported artifacts contain no privileged Supabase key. `node --env-file=.env .actaro-tools/cleanup-v05.mjs`: **PASS**, both verified disposable accounts and their owned records removed; expired access tokens were already unusable. Real user data was preserved.
- Focused implementation commits: `84c8a6a` (`feat(tracking): add habits goals and daily activity records`) and `6f6785d` (`feat(today): add record editors and daily dashboard`). README and this ledger record usage, functional acceptance and explicit device/future-release deferrals.

## Historical v0.6 task 5.1 — Weight Progress acceptance (2026-10-14)

**DONE — 3 / 3 task weight; v0.6 3 / 24 = 12.5%.** Other v0.6 tasks remain NOT_STARTED. Weight-only custom dates are a necessary query/UI dependency, not completion of shared task 5.8 time presets. Device/native-build testing remains user-DEFERRED.

- Read both canonical documents completely, applied Ponytail full and Supabase guidance, and inspected the relevant approved PDF Progress reference. No Figma edits, dependency, migration, privileged app credential or extra analytics module. No native build submitted.
- `src/features/body/body-service.ts`: new read uses authenticated, expected-owner preferences, saved time zone and explicit owned/date filters. Fetches all pages with exact counts; incomplete or changing counts fail instead of showing partial summaries. The existing `(user_id, local_date)` primary key/RLS covers this read; policies/schema are unchanged.
- `weight-progress-model.ts`: inclusive calendar bounds, first/latest recorded change and percentage, mean/min/max of actual weigh-ins, duplicate/invalid data checks and at most 60 plotted intervals. Empty calendar positions remain gaps; long-range means use recorded values only. No missing day is imputed or treated as zero.
- `weight-progress-screen.tsx` and the existing Progress tab route: saved kg/lb units, compact verified-theme chart, exact paginated dates/weights, default last 30 calendar dates, expandable custom dates, loading/empty/error/retry and existing body-editor navigation. No sample analytics values or inferred physiological outcome.
- Three focused test files cover period boundaries, gaps, long-range averaging, empty/single/constant histories, invalid records/dates, full-response pagination including a reduced API response cap, changing/partial counts, ownership failure, kg/lb UI conversion, date validation, navigation and retry.
- `npm.cmd run check`: **PASS**, TypeScript, lint, formatting, **251 Jest tests / 48 suites + 6 dataset tests = 257 tests**. `git diff --check`: **PASS**.
- `node --env-file=.env .actaro-tools/check-weight-progress-live.mjs`: **PASS**, only two disposable confirmed accounts, six bounded weigh-ins and 38 extended-period records, exact count/date order and two-account RLS isolation. No signup/confirmation emails were sent and no real user history was queried.
- `node .actaro-tools/check-weight-browser.mjs`: **PASS**, actual persisted summaries, history beyond the previous 30-row page, missing/empty date ranges, saved preference changes from kg to lb, responsive 390px/320px-dark/1280px layouts, failed-load/retry and body-editor navigation. Final screenshots inspected against the PDF reference. Repeated runs reset the fixture's saved unit explicitly; no app state was bypassed.
- `npm.cmd exec --no -- expo export --platform web` and `npm.cmd exec --no -- expo export --platform all --output-dir .actaro-tools/v06-export`: **PASS**, web plus iOS/Android JavaScript bundles and 37 routes. These exports are not physical-device or native-build passes.
- Existing SDK patch recommendations/security/dependency advisories remain the previously recorded quality follow-ups. No new implementation blocker or API key requirement. Next tasks are 5.2 Nutrition Progress, 5.3 Workout Frequency and 5.4 Strength Progress.
- `node .actaro-tools/check-v06-artifacts.mjs`: **PASS**, 145 exported artifacts exclude the privileged Supabase key. `node --env-file=.env .actaro-tools/cleanup-v06.mjs`: **PASS**, both verified disposable accounts and their owned fixture records removed; real user accounts/data preserved. Test-only clock compensation and credentials remained in ignored tooling, not application code.

## v0.6 functional completion — 2026-10-14

**DONE — 24 / 24 = 100% functional implementation.** Weights:
`3 + 3 + 2 + 3 + 3 + 2 + 2 + 2 + 4 = 24`. Device/native-build checks remain
DEFERRED; v0.9 and v1.0 acceptance have not passed or started through this task.

- Added feature-local progress services, deterministic models/period math, shared
  controls/charts/history and module views. Routes retain session/recovery guards.
  Weight keeps its verified calculations and now shares presets and complete-page
  loading. Source editors and saved kg/lb, kcal/kJ and distance preferences are reused.
- All reads verify the expected owner through existing profile services and use
  owned/RLS-protected queries. Exact-count pagination handles project response caps;
  incomplete/changing histories fail safely. Summary verifies preferences once and
  shares bounds across source reads. No new table, RPC, dependency, API key or AI.
- Nutrition uses historical targets and logged-date means; missing intake is unknown.
  Frequency/volume reuse completed-session aggregates; external load is never
  inferred. Strength reuses the 1–10-rep Epley calculation and preserves unknowns.
  Steps do not combine sources or invent past targets. Habits reuse dated versions,
  exclude rest/partial/open periods, and explicitly exclude currently archived habits
  because archival intervals are not retained. All excludes future records.
- Weekly/monthly summaries show coverage and partial boundaries. Percentage
  comparisons need complete adjacent periods and a nonzero measured baseline.
  No causal, physiological or AI-generated interpretation is introduced.
- Approved PDF Progress reference and verified stone/orange/dark components were
  used. Browser screenshots were inspected at 390px, 320px dark and desktop; no
  overflow was found. Exact unprovided Figma states remain quality-phase review.

| Verification                                                                            | Result                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd run check`                                                                     | PASS — strict TypeScript, lint, formatting; 269 Jest tests / 51 suites plus 6 dataset tests (275 total).                                                                                                                                            |
| `npm.cmd exec --no -- expo export --platform all --output-dir .actaro-tools/v06-export` | PASS — iOS/Android JS bundles, web and 37 routes; not a native build.                                                                                                                                                                               |
| `node --env-file=.env .actaro-tools/seed-v06-analytics.mjs`                             | PASS — two disposable confirmed accounts; historical targets/33 food dates, three completed sessions, unknown loads, step provenance, three habit types and weights; joined strength query, exact volume and eight-table isolation. No email sends. |
| `node .actaro-tools/check-analytics-browser.mjs`                                        | PASS — all eight views, six presets/All, long history, custom validation, weekly/monthly summaries, unknown states, offline retry, saved units, editor navigation and responsive/dark layouts.                                                      |

- `node --env-file=.env .actaro-tools/check-v06-artifacts.mjs`: PASS — all
  exported artifacts scanned for privileged-key exclusion after the completed export.
- `node --env-file=.env .actaro-tools/cleanup-v06.mjs`: PASS — both disposable
  accounts revoked/deleted with owned fixtures removed. Browser test processes
  closed; the isolated preview was stopped. The user's Metro was not stopped.
- Final `npm.cmd run format:check` and `git diff --cached --check`: PASS.

The host/server clock difference is corrected only inside ignored fixture/browser
tooling. No app clock, redirect, secret, authentication bypass or personal machine
address was added to the product. Fixture tooling/artifacts remain ignored, and
the supplied design PDF remains unchanged/untracked. No paid build/service used.

## v0.9 active development closure — 2026-10-15

**DONE — 27/27 active weight (100%).** Original plan: 33; six-weight Personal Beta
is user-DEFERRED and earns zero. Full baseline: 27/33 = 81.818…%. This closes the
authorized implementation, not full beta/device acceptance or v1.0 approval.

| Task                     | Verified evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 Accessibility (3)    | Shared charcoal-on-orange button text and readable small labels; minimum 44px choice width; existing labels/headers/selected state and chart text alternatives reviewed. Contrast tests and browser 390px/320px dark/desktop screenshots pass. VoiceOver/TalkBack/large-text device checks remain deferred.                                                                                                                                                                                                                                                                              |
| 6.2 Performance (3)      | Exact-count/bounded pagination and chart bins retained. Weekly/monthly summaries index habit logs once; training frequency uses a date Map. Synthetic ten-year benchmark (14,612 foods, 36,530 habit logs) median 1,511ms before → 1,061ms after on this host (three samples each, not a phone latency guarantee). Historical frequency/partial-period regression test passes. Final JS bundles: iOS ~5MB, Android ~5.2MB, web ~2.9MB.                                                                                                                                                   |
| 6.3 Security/privacy (5) | All 35 public tables have RLS; cross-account reads empty for all 28 owned tables. New export uses explicit table allowlist, owner checks before/after, stable pagination and selected account metadata; no session/key/password. New Edge Function verifies JWT + authoritative owner + password + exact confirmation, revokes sessions then hard-deletes with cascades. No caller owner ID accepted; app binds the request to its verified access token. Wrong-password/body/owner and CORS live tests pass. First browser-deleted fixture's rows removed and second fixture preserved. |
| 6.4 Error handling (4)   | Root route fallback gives safe retry guidance without logging raw errors or clearing drafts. Existing offline/session recovery tests plus duplicate-submit, unconfirmed deletion, local-cleanup failure, stale export and temporary-file cleanup tests pass. No external telemetry or native crash pass claimed.                                                                                                                                                                                                                                                                         |
| 6.5 Notifications (3)    | SDK local date notifications only; explicit permission and saved opt-in, generic content, owned taps including cold start, clearing on account changes, refresh after edits/resume. Seven-day/48 cap, DST gaps/folds and partial-failure cleanup tested. Web states in-app-only support. Physical OS delivery remains deferred.                                                                                                                                                                                                                                                          |
| 6.7 Bugfix/polish (6)    | Compatible SDK 57 patches, stable same-name habit ordering, correct reminder copy, shared controls/error recovery, verified-canvas splash background; full tests, real browser core-tab/privacy flows and iOS/Android/web exports. Starter icon artwork and exact unprovided Figma states remain acceptance work.                                                                                                                                                                                                                                                                        |
| 6.8 Documentation (3)    | README includes privacy/reminder usage, required public configuration, server-only deletion deployment, Deno check and links to the retained beta checklist. Canonical plan records privacy placement and user deferral; all release weights preserved.                                                                                                                                                                                                                                                                                                                                  |

Files/reasons: shared auth controls and the route error boundary provide contrast,
touch targets and safe fallback; notification model/device adapters/service/coordinator/
screen implement local reminders; profile data service/share helper/screen and privacy
route implement export/deletion; the Supabase function owns privileged deletion;
habit/preferences routes emit refresh changes; progress models remove measured repeated
scans. Package/config changes add only Notifications, FileSystem and Sharing for those
current needs, plus SDK-compatible patches. App TypeScript excludes only the Deno
entry point; its handler is checked by app tests and entry is checked separately by Deno.

Verification (2026-10-15):

- `npm.cmd run check`: PASS — strict TypeScript, lint, formatting; 288 Jest tests / 58 suites + six dataset tests = 294 tests. Initial formatting/mock issues were corrected before final verification.
- `npm.cmd exec --no -- expo install --check`: PASS — dependencies up to date.
- `npm.cmd exec --yes -- expo-doctor`: PASS — 21/21 checks.
- `npm.cmd exec --yes -- deno check supabase/functions/delete-account/index.ts`: PASS.
- `npm.cmd exec --no -- expo export --platform all --output-dir .actaro-tools/v09-export`: PASS — 39 routes and three-platform JS export. A stale Metro cache fell back to a successful full crawl; no app workaround.
- `node --env-file=.env .actaro-tools/setup-v09-fixture.mjs` and `seed-v09.mjs`: PASS — two disposable confirmed accounts with bounded core fixtures; no email sends or real-account changes.
- `node --env-file=.env .actaro-tools/check-v09-live.mjs`: PASS — all 28 owned-table isolation checks, deployed wrong-password/invalid-body/foreign-owner rejection and CORS.
- `node .actaro-tools/check-v09-browser.mjs`: PASS — all 28 tables and seeded rows in actual browser JSON download, no tokens/password, destructive guard, successful deletion/sign-out, all five tabs and responsive/dark layouts. Screenshots inspected.
- `node --env-file=.env .actaro-tools/check-v09-deletion.mjs`: PASS — deleted fixture/cascades absent; second account and record intact.
- `node .actaro-tools/check-v09-final-browser.mjs`: PASS — repeated final session-bound export/deletion on the remaining disposable fixture after the race fix.
- `node .actaro-tools/check-v09-artifacts.mjs`: PASS — 147 final exported artifacts exclude the privileged Supabase key.
- `node --env-file=.env .actaro-tools/cleanup-v09.mjs`: PASS — both fixtures removed; no real user data touched.
- `git diff --check`: PASS. No paid service, build, real confirmation email, production domain or privileged client credential added. The supplied PDF remains unchanged/untracked.

The deployment is `delete-account` with platform JWT verification enabled. Runtime
server credentials come from Supabase, not Expo public variables. No new app API
key is required. Data export is an interval collection, not a transactional backup
or restore feature. Native share and scheduled delivery still require user device QA.

Security findings remain visible: latest audit 67 affected nodes (50 high, 17 moderate),
disabled Supabase leaked-password protection and five INFO composite-FK suggestions.
No forced major upgrades, speculative indexes, paid protection or production-readiness
claim. See [V09_TESTING.md](V09_TESTING.md) for links, limitations and release actions.

## v0.9 CI fetch-mock correction — 2026-10-15

- GitHub Actions [run 38780621787](https://github.com/owacez/Actaro/actions/runs/38780621787)
  failed TypeScript in `account-data.test.ts`. Jest's mock of the overloaded global
  `fetch` narrowed its input and rejected `URL`, producing a second client-inference
  error. The Ubuntu runner migration annotation was a notice, not the cause.
- Reused the explicit `(input: unknown, init?: unknown) => Promise<Response>` mock
  signature from existing Supabase tests. Request options are narrowed at runtime;
  the exact deletion body and session Authorization header remain asserted.
- `npm.cmd ci`: PASS from the unchanged lockfile. A tracked-source-only TypeScript
  configuration, excluding ignored generated Expo declarations, reproduces both
  errors with the original test and passes with the corrected test. Commands:
  `node node_modules/typescript/bin/tsc --noEmit --project .actaro-tools/tsconfig.ci-original.json`
  (expected FAIL) and the same command with `tsconfig.ci-fixed.json` (PASS).
- `npm.cmd run check`: PASS — TypeScript, lint, formatting, 288 Jest tests across
  58 suites and six dataset tests. The new remote workflow is checked after push
  before reporting this correction complete. No app behavior, dependency, workflow,
  credential, Supabase setting or completion weight changed; deferred acceptance
  and retained security findings remain unchanged.
