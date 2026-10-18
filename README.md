# Actaro

Premium personal fitness and wellness mobile application, developed incrementally.
Current implementation: Expo/Supabase foundation, account management and preferences,
plus a dataset-backed Exercise Library, full strength workout logging, and manual
nutrition with USDA foods, recipes and hydration; habits, measurable goals, body
records, daily steps/activity, a Today dashboard and complete basic progress analytics. **v0.1 foundation
development is complete for the active scope.** The user deferred its remaining
acceptance checks; native builds, platform/visual checks and final live acceptance
remain documented in [Development Status](docs/DEVELOPMENT_STATUS.md#v01-development-closure--2026-10-14).
Version `0.1.0` is project metadata; deferred checks have not passed and the full
v0.1 release gate is not accepted.

## Project authority

- [Source of Truth](docs/ACTARO_SOURCE_OF_TRUTH_FINAL.md): product behavior.
- [Development Plan](docs/ACTARO_DECELOPMENT_PLAN.md): release order and weights.
  This is the supplied file's actual name; the requested
  `ACTARO_DEVELOPMENT_PLAN_FINAL.md` is absent. Both supplied documents retain
  older `FITNESS_APP_*` references. Original canonical files are preserved.
- [Actaro v1 redesign](docs/Actaro-v1-redesign.pdf): current user-approved visual authority.
  It supersedes the older [Figma](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW)
  foundation and screen atlas for the core app. See [implementation coverage](docs/REDESIGN_IMPLEMENTATION.md).
- [Development Status](docs/DEVELOPMENT_STATUS.md): verified implementation.
- [Agent instructions](AGENTS.md): development rules and verification.

Explicit user work orders determine the authorized scope. Initialization does
not authorize completing the rest of v0.1.

## Local development

For a feature-by-feature walkthrough, examples explaining habits versus goals,
and expected results, use the [manual app test plan](docs/APP_TEST_PLAN.md).

### Requirements

- Install [Node.js 24 LTS with npm](https://nodejs.org/en/download), then reopen
  your terminal. SDK 57 requires Node 22.13 or later; this checkout was verified
  with Node 24.21.0. Check with `node --version` and `npm --version`.
- Install [Git](https://git-scm.com/downloads) if cloning or pulling updates.
- Install Expo Go on your Android phone or iPhone. Use a version that supports
  **Expo SDK 57**, the version in this project. Check the
  [Expo Go downloads](https://expo.dev/go) if an SDK mismatch appears.
- Connect the computer and phone to the same Wi-Fi network. Internet access is
  needed for dependency installation and Supabase authentication.
- For a physical iPhone, sign in to Expo CLI with `npx expo login`, then sign in
  to Expo Go with the same Expo account. This is separate from your Actaro account.

No Android Studio, Xcode, EAS build, or custom SMTP setup is needed to start
testing the current app in a compatible Expo Go. The user verified sign-in,
sign-out, tab switching and name editing on iPhone Expo Go. Android and the
remaining live acceptance checks are pending.

References: [SDK requirements](https://docs.expo.dev/versions/v57.0.0/),
[opening the app on a phone](https://docs.expo.dev/get-started/start-developing/).

### First-time setup

Run all commands from your checkout's root directory, which contains
`package.json`. In VS Code, open the Actaro folder and select **Terminal > New
Terminal**. The checkout can live anywhere on your computer.

If you have not cloned the repository yet:

```bash
git clone https://github.com/owacez/Actaro.git
cd Actaro
```

Install the locked dependencies:

```bash
npm ci
```

`npm install` (or `npm i`) also installs dependencies. Prefer `npm ci` for a fresh
checkout so it uses the committed lockfile. You only need to install again after
pulling dependency changes or when `node_modules` is missing.

Create `.env` from `.env.example` **only if `.env` does not already exist**.
Keep an existing configured `.env`; it is local to your checkout and is not
included when cloning the repository. In Windows PowerShell:

```powershell
if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

On macOS/Linux, use `cp -n .env.example .env`. Edit `.env` and fill both values
from your Supabase project's Connect dialog:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use the HTTPS API origin, not the dashboard URL. `.env` is ignored by Git;
the publishable key is public app configuration. Never put a privileged key in an
`EXPO_PUBLIC_` variable. The optional local administrator import key described
below is separate and is never required by the app.

### Start Expo Go on your phone

From the project root:

```bash
npm start -- --go --lan
```

Equivalent direct command: `npx expo start --go --lan`. The `--go` flag selects
Expo Go explicitly. Leave the terminal running while you test.

1. Android: open Expo Go and use its QR scanner to scan the terminal QR code.
2. iPhone: scan the QR code with Camera and open the link in Expo Go. Use the
   same Expo account in CLI and Expo Go as described above.
3. The app should show Sign In, or Today if a session was previously
   saved. Create Account and Forgot Password are available from Sign In.
4. Press `r` in the terminal to reload; press `Ctrl+C` to stop the server.

For subsequent sessions, run only the start command unless dependencies or
environment configuration changed. Restart the server after `.env` edits.

### Authentication testing in Expo Go

The project requires email confirmation. With the current default sender, test
using your Supabase team email. Confirmation/reset callbacks must be allowed in
Supabase and opened on the initiating phone; detailed steps and sender limits
are in [authentication testing](docs/AUTH_TESTING.md).

Expo Go uses the running server's `exp://.../--/auth/callback` and recovery URLs,
not `actaro://...`. Use your actual server address when configuring callbacks;
LAN IPs and tunnel addresses can change. The current Supabase Auth version can
reject LAN IP redirects even when allowlisted; use `npm start -- --go --tunnel`
and allow the actual tunnel callbacks for email-link testing. Stable `actaro://`
links require a development build. Follow the
[Expo Go email-change checklist](docs/AUTH_TESTING.md#email-changes-started-in-expo-go)
before repeating requests. No additional app key or paid SMTP service was configured.

Native email-link requests use the SDK-compatible `expo-crypto` module for secure
randomness and SHA-256 PKCE challenges. It is included in Expo Go; after pulling
dependency changes, run `npm ci` and restart Metro. Web retains browser crypto
and needs a secure origin (HTTPS or localhost). This does not change callback
allowlists or remove the original-device/browser requirement.

### Troubleshooting

- **`npx expo login` asks to install Expo:** run it from the Actaro folder,
  where `package.json` and the installed dependencies live. Running outside
  your checkout can make npx offer a temporary Expo download. Open a terminal
  in the project root, then run `npx --no-install expo login` (or
  `npx.cmd --no-install expo login` on Windows). The `--no-install` flag prevents a temporary
  download. If dependencies are genuinely missing, run `npm ci` (`npm.cmd ci`
  on Windows) in the project root first. Pressing `Ctrl+C` cancels the current command; it does not
  establish an Expo login.
- **`npm` or `node` is not recognized:** install Node 24 LTS and reopen the
  terminal. Confirm that `node --version` and `npm --version` work before
  continuing. Use the installer for your operating system and processor.
- **PowerShell blocks `npm.ps1`:** use `npm.cmd ci` and
  `npm.cmd start -- --go --lan`; use `npx.cmd` for direct CLI commands.
- **QR code will not connect:** check Wi-Fi, VPN and guest-network isolation.
  Allow Node.js through Windows Firewall on your private network. Do not use
  `--localhost` for a physical phone.
- **LAN remains unavailable:** optionally use Expo's tunnel helper and rescan
  the new QR code. These commands are an alternative to LAN, not extra required
  app dependencies:

  ```bash
  npm install -g @expo/ngrok
  npm start -- --go --tunnel
  ```

- **Stale bundle or configuration:** stop the server and run
  `npm start -- --go --lan --clear`.
- **Expo Go reports an SDK mismatch:** check SDK 57 support in the installed
  Expo Go. If unavailable on your device, use a compatible version or a
  development build; do not change project dependencies just to bypass it.
- **iPhone reports an Expo account mismatch:** run `npx expo login` and sign in
  to Expo Go with that same account.
- **Authentication unavailable:** check both `.env` values, restart Expo, and
  optionally run the read-only `npm run check:supabase` probe.
- **Confirmation opens localhost on your phone:** a desktop web signup must be
  completed in that same computer browser, with the web server running. Localhost
  on the phone targets the phone. Verify the callback allowlist using the
  [web confirmation checklist](docs/AUTH_TESTING.md#desktop-web-confirmation-and-localhost-errors).

### Current screens

These views exist in code and have automated logic/contract tests; full
live email and Android/iOS verification remain pending.

Auth errors appear as plain text beside the form. On mobile, successful actions
and email instructions use a bottom snackbar. On web, errors and successful
actions also use a dismissible notification at the upper right. Notifications
expire automatically; hovering or focusing the web notification pauses dismissal.

| Screen / state              | Present behavior                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sign In                     | Validated email/password sign-in.                                                                                                  |
| Sign Up                     | Email, password and confirmation; creates a Supabase account.                                                                      |
| Check Your Email            | Confirmation instructions and resend.                                                                                              |
| Reset Password              | Requests a recovery link without revealing account existence.                                                                      |
| Set a New Password          | Updates the password after the SDK recovery event.                                                                                 |
| Callback processing / error | Exchanges a one-use code or displays a safe link error.                                                                            |
| Email Confirmed             | Shows verified status from the Supabase session, then Continue to Account.                                                         |
| Today                       | Persisted bodyweight, steps, calories/macros, planned workout, habits, goals, Training Status and recovery.                        |
| Progress                    | Date-bounded weight history, recorded changes/averages, kg/lb preferences and an honest chart with missing dates.                  |
| Habits                      | Five habit types, schedules, dated target settings, logging, history and configurable motivation.                                  |
| Goals                       | Body, training, activity, nutrition and habit targets; progress from recorded facts, editing and deletion/restoration.             |
| Body records                | Dated bodyweight and named measurements, unit conversion, editing and deletion.                                                    |
| Steps & activity            | Automatic iPhone steps after Motion permission, live foreground count, daily target, synced history and optional distance.         |
| Nutrition                   | Daily targets, food search, portion preview, four meal groups, diary editing/copying and hydration.                                |
| Custom foods / Recipes      | Private label foods, food-specific portions, ingredient recipes, servings and cooked-weight logging.                               |
| Saved meals                 | Create from a logged meal, log its snapshot to another meal/date or delete the saved template.                                     |
| Train / Exercise Library    | Search 643 imported exercises, filter by muscle/equipment/your saved setup, paginate and open technique details.                   |
| Exercise Detail             | Start/peak or main poses from private Supabase Storage, instructions, muscles, equipment and source attribution.                   |
| My equipment                | Save available equipment, discard drafts or clear the selection; available-equipment filtering always includes no-equipment moves. |
| My workouts                 | List and reopen your saved workout templates. Open Train → Workouts.                                                               |
| Build Workout               | Select real exercises, reorder/remove them, configure sets/reps/weight/rest/RPE/notes and save atomically.                         |
| You                         | Real signed-in email, Profile management and local sign-out.                                                                       |
| Profile                     | Edit/clear name, view/change email and change password. Open You → Profile management.                                             |
| Preferences                 | Save units, time zone, notification/gamification preferences and System/Light/Dark appearance. Open You → Preferences.             |

The remaining `/explore` route is an Expo starter example, not an Actaro feature.
The five-tab navigation shell is implemented; sign-in opens Today. The populated
Today dashboard is implemented in v0.5. Workout templates and their builder are implemented;
plans, pre-start and active-session logging are implemented in v0.3. Manual nutrition
is implemented in v0.4; habits/goals/body/activity are implemented in v0.5. Weight
Progress is implemented as v0.6 task 5.1; other progress modules follow in the plan.
Physical-device acceptance remains deferred.

Tunnel setup and flags follow the [Expo CLI documentation](https://docs.expo.dev/more/expo-cli/).

### Other commands

### Native development builds

`expo-dev-client` is installed and `eas.json` defines internal development and
iOS Simulator profiles. Android and iOS use the approved development identifier
`com.actaro.app`. This checkout is linked to the verified EAS project through
`app.json`; a fork should link its own project with `npx eas-cli@latest init`.

Before building, sign in with `npx eas-cli@latest login` and set the two public
Supabase variables in that project's **development** EAS environment. Ignored
local `.env` files are not uploaded in the build archive. Use the same API URL
and publishable key as your local checkout; never add privileged secrets.
Check your account's available build allowance first. No cloud build, paid
subscription or store submission was performed by this setup.

```bash
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

A physical iPhone EAS build requires Apple signing/account setup. Continue using
Expo Go while that is unavailable. The `development-simulator` profile creates
an iOS Simulator build for a Mac. A configured profile or successful JS export
does not establish a successful native build or device launch.
See [Expo's development-build guide](https://docs.expo.dev/develop/development-builds/introduction/).

After installing your development build, start Metro with:

```bash
npm start -- --dev-client --lan
```

For Expo Go, keep using `npm start -- --go --lan` instead.

### Checks and other platforms

For web testing, run `npm run web`. For an installed Android emulator, use
`npm run android`; `npm run ios` requires an iOS Simulator on a Mac. A physical
iPhone can connect to your computer's Expo Go server through the QR code.

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
server/client hydration, Supabase configuration, auth forms/services, callback handling and session transitions. `npm run check` includes tests
and fails if any check fails. `.github/workflows/check.yml` runs the locked
install, these checks and Android/iOS/web exports on pushes to `main` and pull
requests. CI requires no Supabase credentials; exports do not run authenticated requests.

For database ownership regression checks, run the entire
[profile/preferences SQL test](supabase/tests/profile_preferences.sql) through
the authorized Supabase MCP connection or the project's SQL Editor as an
administrator. It creates disposable test users, checks grants/RLS and validation,
then rolls back all fixtures. It sends no emails and does not edit the existing
account. These database checks complement the app tests; profile UI acceptance
remains pending.

## Structure and architecture

The scaffold follows Expo's default template and supported SDK versions:
[create-expo-app](https://docs.expo.dev/more/create-expo/) and
[SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/).

```text
src/app/          Expo Router route entry points and auth layout
src/features/auth/ Auth UI, business/service logic and session context
src/features/profile/ Typed profile/preferences services and input validation
src/components/   Existing Expo starter components
src/hooks/        Existing starter presentation hooks
src/constants/    Actaro light/approved functional dark tokens and preserved starter theme
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
configured; auth screens and service flows exist. The profile/preferences schema
and ownership policies are applied and database-tested; typed profile/preferences
services have SDK request tests. Profile edits names through the database service;
email/password changes use Supabase Auth, with required confirmation and safe errors.
Preferences save units, time zone, notification/gamification opt-in values and
System/Light/Dark appearance. Save applies the server-confirmed theme across the
current product screens and tabs; drafts remain unapplied. Owned preferences load
on sign-in, with System as the loading/failure and signed-out fallback.
Reminder delivery and achievements belong to later releases. Exact Figma dark
matching and full live acceptance are pending; follow [the checklist](docs/PROFILE_TESTING.md#preferences-acceptance).
React state
is the default; TanStack Query and Zustand require demonstrated needs.
See [mobile stack decision](docs/decisions/001-mobile-stack.md).

## Environment and security

Copy `.env.example` to `.env` and supply your project API URL and public
publishable key before launching the app. The client validates these values;
restart Expo after changes. Actual `.env` variants are ignored. Public Expo variables are bundled app content: never use
these for service-role keys, database passwords, signing secrets, or AI provider
credentials. The user approved `com.actaro.app` for Android/iOS development;
production identifiers and domains still require release review.

Run `npm run check:supabase` with Node 24 for the read-only live connection check.
The probe requires anonymous permission denial for the private profile/preferences tables.
See [required development inputs](docs/DEVELOPMENT_INPUTS.md) and
[Supabase client decision](docs/decisions/002-supabase-auth.md).
The [schema design](docs/decisions/003-core-schema.md) specifies the first
profile/preferences and Exercise Library schemas plus historical data rules;
later module schemas remain pending.

## Exercise dataset and import

Exercise data by [RepDB](https://repdb.co). The reviewed free-tier snapshot contains
643 exercises with 1,138 512px WebP poses. Actaro serves metadata from its own
PostgreSQL schema and images from private `exercise-media` Supabase Storage through
signed URLs. No RepDB/GitHub dataset hosting is used by the running app.

The import uses the pinned source revision in `scripts/repdb-data.mjs`. Preserve
the source license/attribution; do not commit or redistribute the downloaded dataset
or include paid preview assets. See [the import decision](docs/decisions/004-repdb-import.md)
and [RepDB's data license](https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md).

For a fresh Supabase project, apply the committed migrations in timestamp order
before importing. A public publishable key cannot administer imports. Add a
**server-only** project key to ignored `.env` as `SUPABASE_SECRET_KEY`; never prefix
it with `EXPO_PUBLIC_`, add it to EAS app environments or put it in app code. The
import script runs locally with Node 24 and the existing installed Supabase SDK.
Regular installation/start/check commands do not run the importer or need this key.

```bash
# Download the pinned source and validate it without database writes:
npm run import:repdb -- --download --dry-run

# Import metadata and images into your project; rerunning preserves IDs/paths:
npm run import:repdb -- --download --media
```

Downloads stay under ignored `.actaro-tools/repdb`. Metadata is imported atomically;
image metadata is saved only after its object uploads successfully. Failed image
imports can be rerun safely. At runtime, open **Train → Library → My equipment** to save
your setup; use **Filters → Use my available equipment** to apply it. Equipment
drafts do not affect results until saved. Search submits through the Search action
or keyboard; Previous/Next load 24 exercises per page. Refresh retries image loading.

## Building and editing workouts

Open **Train → Workouts → Create workout**. Enter a name, add exercises from
the searchable library, and use **Edit** on a row to change its sets, targets,
rest, optional RPE and notes. Exercises can be moved or removed; each exercise
keeps at least one set in the editor. New selections start with three editable
sets of eight reps and 90 seconds rest; these are planned targets, not logged results.

You can also tap **Add to workout** in a Train → Library result’s actions or on Exercise
Detail. Choose **Create workout** or one of your saved workouts. The real selected
exercise is added to an editable draft; review its targets and tap **Save workout**
to persist it. Discarding the draft leaves the saved workout unchanged. Returning
from an unsaved builder takes you back to the workout chooser for that exercise.

Weight entry follows your kg/lb preference and is stored in kilograms. Blank weight
means unspecified; zero explicitly means bodyweight. **Save workout** writes the
whole template in one transaction. Reopen it from My workouts to edit it. Failed
saves keep the current draft; retrying uses the same workout ID. Leaving through
the editor's back action asks before discarding changes. Unsaved builder drafts
are not persisted across app termination; active-session resilience is a later task.
Concurrent edits use last-save-wins semantics for the same owned template.

To delete a saved template, open **My workouts → Delete [workout name]**, review
the confirmation and choose **Delete workout**. This removes planned exercises
and sets while preserving recorded sessions. **Keep workout** cancels deletion;
failed requests retain the visible row for retry.

Saving a template does not log training. **My workouts → Start [name]** opens an
exercise/working-set preview with an explicit duration estimate. **Start Workout**
then offers **Timed Workout** or **Log Only**. Both open the dedicated set logger.
Search results and Exercise Detail also offer **Log exercise** without a template.

One set card appears at a time. Swipe **left to log**, **right to undo**, or use
the completion button. Logging advances to the next unfinished set; swiping right
from a ready card returns to and undoes the last logged set. Tap the card to edit.
Progress bars show each set's status and let you revisit it; **Show all sets**
reveals the full list. Planned reps/load are prefilled. **Edit set** exposes actual reps/load,
RPE/notes and removal; **Add set** remains available. Blank weight means unknown;
zero means no added external load. The independent rest timer starts after logging; pause/resume, skip and
±15 seconds work in both modes. Only Timed has a total duration timer.

The active draft is saved under your account on this device. **Resume saved
workout** recovers it; leaving the screen keeps it. Finish saves only completed
sets atomically, then shows real volume, duration (Timed only), records and your
optional note. Failed network saves keep a frozen local copy for the same-ID retry;
they are not reported as saved. **Done** clears the acknowledged device copy.
Cancel asks before discarding an unfinished draft. Advanced multi-device offline
sync is v1.5; recovery requires the same signed-in account and intact app storage.
Open **My workouts → Workout history** for a month calendar of completed sessions.
Tap a marked day to open its workouts; select **History** to search by name,
filter Timed/Log Only and reopen completed logs. Edit actual weights/reps, optional RPE/notes, add/remove
sets or exercises, then **Save recorded workout**. New history sets use the
original finish instant as their reported completion time. Mode/start/timezone stay
fixed. Invalid values block Save; stale edits cannot overwrite a newer revision.
A failed attempt stays frozen for the same retry, or can be discarded/reloaded.
History edit drafts stay on that screen and are not retained after termination.
Delete asks for confirmation and preserves templates/splits. Volume and records
are recalculated from remaining logs, including subsequent sessions’ prior values.

**My workouts → Training summary** shows the past 28 recorded dates, workout
frequency, sets/reps, known external volume and primary-muscle allocation. Sets
and volume are divided equally across recorded primary muscles to avoid double
counting. Status rules show their evidence, use your own prior-volume baseline,
and exclude planned days before the latest split change. Insufficient history
receives no invented judgement. These are log descriptions, not physiology.

**Training summary → Recovery check** saves today’s energy, soreness and sleep,
with optional stress/notes. Daily entries reopen and can be updated; recent checks
remain visible. Good/Moderate/Consider Recovery uses explicit reports and recorded
frequency/volume/rest-day context. No numerical readiness score is produced.

Open **My workouts → Training splits** to create a recurring Monday–Sunday split.
Choose a saved workout or rest for every day, and select **Use this as my active
split** if desired. One split can be active at a time. Save and reopen it to edit;
deleting a split preserves its workouts and history. If a scheduled workout is
deleted, its day visibly needs a new assignment. Unsaved split drafts are not
retained after termination. Recorded sessions remain separate from the schedule.

Open **My workouts → Training plans** to filter by goal, experience, days per
week or your saved available equipment. Preview actual exercise names, set/repetition
targets, rest and the seven-day schedule. **Use this plan** creates independent,
editable owned workout templates and an active split; existing plans/workouts stay.
Loads start unspecified. A failed request can be retried to recover the same copy.
These seven strength templates are Actaro-authored starting points with general
programming references, not endorsed prescriptions or logged results. Beginner
Running remains deferred to the running release, v1.2.

## Manual nutrition (v0.4)

Open **Food → Food options → Daily targets** to save energy, protein, carbohydrates, fat and
water goals. Energy follows your kcal/kJ preference. Changes take effect from
today in your saved time zone; previous diary dates retain their earlier goals.
Logging is available without setting targets.

Choose a diary date and **Add to Breakfast/Lunch/Dinner/Snacks**. Search the imported
USDA catalog or choose Recent, Frequent, Favorites, Custom or Recipes. Select the
food, its exact preparation/label and a serving unit. Enter a quantity or use the
stepper; live calories/macros and the meal's new total appear before **Log**.
Named servings use that food's known weight. Volume-based custom foods use ml;
Actaro does not assume ml equals grams for other foods. Source calories are used
directly rather than reconstructed from macros.

**Custom foods** accepts package-label values for an explicit base amount and unit.
Add known serving equivalents such as one bottle, slice, cup, tablespoon or piece.
**Recipes → New recipe** uses actual selected ingredients and quantities. Enter
servings and optionally total cooked edible weight. Without cooked weight, log by
servings; with weight, log any gram amount. Recipes are also reachable from You.
Editing food/recipe nutrition affects new portions; existing diary snapshots stay.
Library deletion removes a food from search while retaining earlier diary values.

Diary **Edit** changes the recorded quantity using its original portion/nutrition.
To change its food or unit, delete it and add a replacement. Deletion asks for
confirmation. **Save [meal] as meal** creates a reusable snapshot. **Saved meals**
logs it into the selected meal/date. **Repeat [meal]**, **Copy yesterday**, and
**Copy another meal or day** append entries; whole-day copies retain meal groups.
Hydration supports ml, liters and explicitly US fluid ounces, with saved entries
and deletion. The diary shows real meal/daily totals and target remaining/over values.

An uncertain save retains its request ID and locks inputs for **Retry saved
request**. Known rejected requests allow correction or reload. No success is shown
before server acknowledgement. These food/recipe forms are not durable offline
drafts; keep their screen open during retries. Offline sync remains v1.5.

The initial catalog contains **7,793 foods and 14,449 portions** from USDA SR Legacy
April 2018. It includes some named products but is not a current worldwide branded
catalog; use a current package label when its formulation differs. The data is
[public domain/CC0](https://fdc.nal.usda.gov/api-guide/), imported into our Supabase
database with source IDs and attribution. The app requires **no USDA API key**.

For a new backend, apply the repository's migrations, download/extract the
[SR Legacy April 2018 JSON](https://fdc.nal.usda.gov/download-datasets/), then run
from the project root:

```bash
npm run import:usda -- path/to/extracted-usda.json --dry-run
npm run import:usda -- path/to/extracted-usda.json
```

Only the administrator's local import uses `SUPABASE_SECRET_KEY` from ignored
`.env`; ordinary app users need the public configuration already documented above.
Never rename the secret to `EXPO_PUBLIC_*`. The parser validates all required
nutrients and portions, and repeat imports preserve stable source IDs. Do not run
an import for ordinary app testing. See the [serving/data decision](docs/decisions/006-nutrition-serving-model.md).
Physical-device acceptance is deferred; exported native bundles are not device tests.

## Habits, goals and Today (v0.5)

Open **You → Habits**, **Goals**, **Body records**, or **Steps & activity**. Today
summarizes the same saved records. It refreshes when opened and has a manual
refresh action; no sample health data is shown.

- Habits support boolean, numeric, duration (minutes), weekly frequency and
  avoidance. The editor uses friendly type descriptions, calendar dates and a
  native time picker (a time input on web). Confirmed quick checks update in place
  with a brief animation; failed saves keep the original retry. Enable optional
  device alerts through habit reminders in Preferences. Start date/type/unit/time zone are fixed after
  creation. Target/schedule edits take effect from today, preserving prior dates.
  Rest days and partial first/last weeks do not create false consistency misses.
  An avoidance value of zero must be explicitly recorded.
- Goals use measured sources: bodyweight/measurements, weekly workouts,
  exercise load/estimated 1RM, daily steps/manual distance, active days, recorded
  calories/protein, macro adherence and habit completion/frequency. Choose a
  baseline, target, direction and dates. Missing food/body/activity records
  display as unavailable. The current day/week can change; meeting a recurring
  target today does not permanently complete later periods. Running/pace/event
  goals remain scheduled for v1.2.
- Body records store kg/cm and daily activity stores steps/km, displaying your
  saved unit preferences. Saving the same date/measurement replaces its value.
  Edit/delete recorded entries from history; goals recalculate from the records.
- **Steps & activity** contains your daily step target. After Motion permission,
  iPhone steps load automatically from midnight in your saved time zone, update
  while the app is open and catch up when you return. There is no manual step
  entry or read/save button. Cloud writes are limited to changed totals, normally
  at most once per minute, with a best-effort flush when leaving the app. This
  replaces the date's total; it never adds multiple device totals. Expo Go does
  not deliver pedometer events in the background. Android/web show synced history;
  unsupported/denied sensing is explained without fabricating zero steps.

Habits are actions you repeat; goals are outcomes measured from those saved
records. Goal cards show the actual source value and provide a shortcut to update
the relevant records. You do not manually mark a goal complete.

Recent server reads are reused in memory for up to 60 seconds, including reference
data and signed image URLs. Matching concurrent requests share one network call.
Confirmed writes/auth changes invalidate reads; explicit refresh forces a new
read. Existing records stay visible during background refresh. Authentication
verification remains remote and uncached. This cache does not persist health
data to disk or implement an offline mutation queue.

After pulling this update, run `npm ci` for the SDK-compatible sensors and native
time picker, then start Expo Go using the commands above. No new API key or paid
service is required. Hosted migrations are already applied to the connected
project. A different Supabase project needs the committed migrations applied
before using these screens. Native builds and physical sensor QA remain deferred.

## Progress and analytics (v0.6)

Open **Progress**, then select **Body, Nutrition, Training, Activity, Habits, or Summary**.
Training contains **Frequency / Strength / Volume**. All modules use owned, persisted records. The shared
**7D / 30D / 3M / 6M / 1Y / All** controls select dates through today in your saved
time zone; month/year windows clamp to valid calendar dates. All starts at the
module's earliest available record; Summary considers every source. Custom dates
are inclusive, validated and cannot include the future. Filters reset to 30D when
switching modules. Refresh reloads current records; returning from an editor also
refreshes. No analytics provider, AI, new API key or schema migration is required.

- Nutrition shows energy/protein averages on logged dates, protein target days,
  and the average share of calories/protein/carbs/fat within ±10% of each date's
  saved targets. Missing logs are unknown intake; even a logged day may be incomplete.
- Frequency counts completed sessions and distinct training dates, with Timed/
  Log Only counts and timed duration. Plans and unfinished drafts are excluded;
  rest dates are not failures. Volume reuses existing completed-set calculations
  and primary-muscle allocation. Unknown loads are excluded, not estimated.
- Strength lets you search recorded exercises and inspect daily heaviest external
  load, estimated 1RM and first-to-latest load change. The Epley estimate uses
  1–10 reps; period best is not necessarily an all-time PR or a tested maximum.
- Steps distinguishes explicit zero, missing values, distance-only dates and
  manual/reviewed iPhone provenance. The displayed steps target is the current
  setting; historical target attainment is not invented.
- Habits uses dated target/schedule versions and saved habit time zones. Rest,
  open uncompleted periods and partial boundary weeks are excluded from completion.
  Avoidance requires an explicit report. Currently archived habits are excluded
  because archive intervals are not recorded; their logs remain in Habits history.
- Summary groups the selected range into Monday-based weeks or calendar months,
  marks partial periods, and shows coverage alongside weight, nutrition, steps,
  training and habit facts. Only complete adjacent periods are compared; missing
  or zero baselines have no percentage change. Differences do not establish causation.

Charts display at most 60 intervals with their aggregation explained. Exact
history remains paginated; complete API pagination prevents silent row-cap truncation.
Loading, empty, failure and retry states are available. Physical-device/native-build
acceptance remains deferred. Advanced cross-metric analytics belong to v1.3.

### Weight details

Open **Progress** to see the latest 30 calendar dates of recorded weights.
**Change weight dates** accepts an inclusive start/end range. Future dates and
reversed ranges are rejected. Full history is fetched across response pages,
so summaries are not limited to the 30-entry body-record editor page.

The chart uses real weigh-ins, preserves missing dates and displays kg/lb from
Preferences. Period change compares the first and latest recorded weights; it
needs two dated records. Average means the average of recorded weigh-ins, not
an estimate for unlogged days. Long ranges display up to 60 intervals averaging
only recorded values, with exact weights available in the paginated history.

Use **Log or edit bodyweight** to open the existing body-record editor, then
return to Progress to refresh. Empty/error states and retry are supported. No
new API key, dependency or database migration is needed. Weight uses the same
period presets as the other completed v0.6 modules.

## Privacy controls and local reminders (v0.9)

In **You → Profile → Privacy & account data**, export your owned records as JSON
or permanently delete your account after password verification and typing `DELETE`.
Export files contain private health information; store them carefully. Native export
uses the device share sheet. An export is not an atomic backup or restore feature.

In **You → Preferences → Manage habit reminders**, explicitly enable notification
permission on your phone. Set a reminder time and weekdays inside each habit.
Actaro schedules the next seven days, up to the earliest 48 local reminders, and
refreshes them on app open/resume or edits. Keep opening Actaro regularly. There is
no server push or background sync; web retains in-app due reminders only.

The app still needs only the two public Supabase environment values. Account
deletion uses the deployed `delete-account` Supabase Edge Function: it verifies the
signed-in user and current password, revokes refresh sessions, then deletes that
account and cascading records. Its administrative credentials are provided inside
Supabase, never bundled in the app. A separate Supabase project needs the repository's
migrations, reference imports and this function deployed, in addition to public app
configuration. Keep the function's `verify_jwt = true` setting. See
[Supabase deployment](https://supabase.com/docs/guides/functions/deploy).

Local quality checks include `npm run check`; the Deno entry point was separately
checked with `npm exec --yes -- deno check supabase/functions/delete-account/index.ts`.
No native/cloud build was submitted. For deferred device checks, real daily use,
notification limits and retained security findings, use the
[v0.9 testing checklist](docs/V09_TESTING.md). Passing automated checks does not
approve v1.0.

## Release discipline

Core order: v0.1 Foundation → v0.2 Exercise Library → v0.3 Strength Workouts →
v0.4 Manual Nutrition → v0.5 Habits, Goals & Today → v0.6 Basic Progress →
v0.9 Quality & Personal Beta → v1.0 Core Release.

Future order: v1.1 Active Minutes → v1.2 Running & GPS → v1.3 Advanced Analytics
& Achievements → v1.4 Food Photo AI → v1.5 Advanced Offline & Sync → v2.0 Health
& Wearables. Retained unassigned/deferred work is tracked in Development Status.

Initialization stops at review. Feature development requires explicit approval
of the next small, independently verifiable task.

For signup, verification and reset testing, see [authentication testing](docs/AUTH_TESTING.md). After sign-in, Today opens within the five-tab shell; You contains account management and the v0.5 record editors.
For name/email/password and account-isolation checks, see [profile testing](docs/PROFILE_TESTING.md).
