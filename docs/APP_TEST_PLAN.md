# Actaro manual app test plan

Use this guide for the implemented v0.1–v0.6 and v0.9 core features. It is a
checklist for your testing, not a claim that device acceptance or v1.0 approval
has passed. There are no v0.7/v0.8 releases in the approved plan.

## 1. Start the app

Run these commands from the folder containing `package.json`:

```powershell
npm.cmd ci
npm.cmd start -- --go
```

Keep Metro running and scan the QR code with your iPhone to open Expo Go. For
web, use a separate terminal in the same folder:

```powershell
npm.cmd run web
```

On macOS/Linux, use `npm` instead of `npm.cmd`. Existing project `.env` needs
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. No Redis,
new API key, dataset import or native build is needed for ordinary app testing.
See [README setup/troubleshooting](../README.md) if the phone cannot reach Metro.

Use a test account and fictional records. Record the platform and Git commit
(`git rev-parse --short HEAD`) for each testing session. Mark each test **PASS**,
**FAIL**, **NOT_TESTED**, or **BLOCKED**, with notes. An unavailable device feature
is BLOCKED on that platform, rather than a passing test.

## 2. Understand what you are testing

| Item                     | What it means                                   | How it changes                                                                     |
| ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| Habit                    | An action you repeat on a schedule              | You record done/not done, an amount, minutes or occurrences                        |
| Goal                     | A desired outcome with a baseline and target    | Actaro reads the relevant saved records and calculates progress                    |
| Daily target             | A setting such as daily protein, water or steps | You set it in Food/Steps; the corresponding screen compares actual records with it |
| Workout template / split | What you plan to train and on which weekdays    | Editing a plan does not count as a completed workout                               |
| Completed workout        | What you actually logged and finished           | It contributes to history, training goals and analytics                            |
| Today / Progress         | Views of saved records                          | These summarize data; they are not separate copies you must log again              |

A habit and a goal are optional, independent tools. Creating a protein goal does
not create a habit, and checking off a "Drink water" habit does not create a
hydration entry. The Food diary and hydration log remain the measured sources.
A goal linked to a habit reads that habit's logs.

### All five habit types

Open **You → Habits → Create habit**.

| Type shown in the app | Example test                     | Expected result                                                                        |
| --------------------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| Check off             | "Stretch", scheduled today       | Mark done; it completes in place. Explicit not-done is different from no log           |
| Count or amount       | "Read pages", target 10 pages    | Log 6: incomplete. Edit today's value to 10: target met                                |
| Minutes               | "Read", target 20 minutes        | Log 15 then edit to 20; completion follows the saved minutes                           |
| Times per week        | "Practice", target 3 occurrences | Record occurrences on dates this Monday–Sunday; the weekly total determines completion |
| Limit a habit         | "Sugary drinks", limit 1 per day | Log 0 or 1: target met; log 2: not met. No entry must not silently count as zero       |

For amounts/occurrences, editing a date replaces that date's value; it is not an
automatic increment button. Dates outside the schedule are not failed days.
Choose a motivation display (Streaks, Weekly consistency, Completion %, or None).
This changes the feedback presentation, not the underlying logs.

### All 13 goal types and their sources

Open **You → Goals → Create goal**. Baseline means your starting value; target
means the desired value. Choose the appropriate direction and dates. The target
must improve from the baseline in that direction. Goals are not checked off by hand.

| Goal                        | Records you must create to test it                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Bodyweight                  | Body records: a dated weight on/after the goal's start                                                          |
| Body measurement            | Body records: the same named measurement selected by the goal                                                   |
| Workouts per week           | Finished workouts in the current Monday–Sunday week                                                             |
| Strength target             | Completed sets for the selected exercise with a known external load                                             |
| Exercise PR (estimated 1RM) | Completed sets for the selected exercise; Epley estimate uses 1–10 reps, not a tested maximum                   |
| Daily steps                 | Synced daily activity; automatic iPhone Motion reading                                                          |
| Daily distance (manual)     | Distance saved in Steps & activity; no GPS tracking                                                             |
| Active days per week        | Distinct dates with completed workouts or positive recorded steps/distance                                      |
| Daily calories              | Food diary entries for the evaluated day                                                                        |
| Daily protein               | Food diary entries for the evaluated day                                                                        |
| Daily macro adherence       | Food diary plus that date's nutrition targets; evaluates calories/protein/carbs/fat within the chosen tolerance |
| Habit weekly completion     | Select a habit; its scheduled-day completions this week, excluding rest days                                    |
| Habit weekly frequency      | Select a habit; its recorded occurrences this week                                                              |

**Worked example A — bodyweight:** create a goal with baseline 80 kg and target
75 kg, decreasing, starting today. Record 79 kg today. Expect current value 79 kg
and 20% progress from the starting value. Recording 75 kg meets the target.
Use the units shown in the goal form; these are fictional test values.

**Worked example B — workouts:** create a goal with baseline 0, target 3 workouts
per week, increasing. Finish two short test logs this week. Expect current value
2 and about 67% progress. Merely creating two workout templates must not count.

**Worked example C — habit:** create a Check off habit scheduled today, then a
Habit weekly completion goal linked to it, baseline 0%, target 100%, starting
today. Mark the habit done. Return to Goals: progress comes from that log.
To test a partly completed week, use a habit/start date covering several scheduled
dates and record only some of them; inspect the source explanation.

Missing food/body/activity records should show no recorded data, not invented
zeroes. Daily/weekly goals evaluate their period: target met this week does not
permanently complete future weeks. Strength goals use best recorded performance
through the evaluation date, rather than only workouts since the goal start.

## 3. Test in this order

For each saved item, leave its screen and reopen it. For important persistence
checks, fully reopen the app too. Test web and iPhone separately; a web pass does
not establish native acceptance.

### Pass A — account, navigation and preferences (v0.1)

| ID  | Feature / action                                             | Expected result                                                                     |
| --- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| A01 | Sign up once; complete confirmation                          | Clear email instructions and confirmed state; sign-in works                         |
| A02 | Sign in with valid and invalid details                       | Valid goes to Today; invalid shows a readable error without losing the form         |
| A03 | Reopen while signed in, then sign out                        | Session persists when expected; sign-out protects private screens                   |
| A04 | Request reset; open a fresh link; set password               | New password signs in, old one fails; used/expired links give a useful error        |
| A05 | Profile: save, change and clear display name                 | Correct value survives reopening                                                    |
| A06 | Profile: change email and password                           | Required confirmations are clear; email updates and new credentials work            |
| A07 | Switch Today / Train / Food / Progress / You; open Quick log | Correct views/actions, back navigation and no accidental lost drafts                |
| A08 | Preferences: units, timezone, System/Light/Dark              | Settings survive reopen; displays use the selected settings consistently            |
| A09 | Toggle notification/gamification preferences                 | Saved choices persist; unsupported features are not invented                        |
| A10 | Trigger success/error feedback                               | Readable snackbar/toast, correct position, dismissal and no input-like notification |

For email tests, use the initiating browser profile on the machine running web.
A phone cannot use your computer's `localhost`. Follow [Auth testing](AUTH_TESTING.md)
for Expo Go callbacks. Secure email change can require both old and new emails.
Do not repeatedly request links during a cooldown; report rate limits as a blocker.

### Pass B — exercise library (v0.2)

| ID  | Feature / action                                                 | Expected result                                                                |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| B01 | Train → Library: search, empty search, no matches and pagination | Relevant results, clear empty states and working next/previous pages           |
| B02 | Filter by muscle, equipment and bodyweight                       | Results obey filters; clearing them restores results                           |
| B03 | My equipment: save/edit/clear; apply available-equipment filter  | Selection persists; no-equipment movements remain available                    |
| B04 | Open several exercise details                                    | Correct readable image poses, instructions, muscles, equipment and attribution |
| B05 | Use result/detail actions to Add to workout or Log exercise      | Real selected exercise reaches the chosen draft or logger                      |

### Pass C — strength training (v0.3)

| ID  | Feature / action                                                    | Expected result                                                                                              |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| C01 | Create a named workout with two exercises                           | Set planned sets, reps, load, rest and optional RPE/notes; save/reopen matches                               |
| C02 | Reorder/remove exercises; add/remove sets; discard an edit          | Saved order/targets are correct; discard leaves the saved template unchanged                                 |
| C03 | Add a library exercise to an existing workout                       | Draft includes it; only Save makes the change permanent                                                      |
| C04 | Create a seven-day split with workout/rest assignments              | Every weekday retains its assignment; one active split feeds Today's plan                                    |
| C05 | Edit/switch/delete a split or delete an assigned template           | Existing history survives; missing assignments are explained                                                 |
| C06 | Filter/preview/adopt a training plan                                | Actual exercises/schedule shown; adoption creates editable private workouts/split                            |
| C07 | Start a workout and inspect pre-start preview                       | Exercises and planned sets match; estimate is clearly an estimate                                            |
| C08 | Start Timed; pause/resume; background and return                    | Total timer behaves correctly and excludes paused time                                                       |
| C09 | Start Log Only, including direct Log exercise                       | Set logging works without a total workout timer                                                              |
| C10 | Inspect exercise image; swipe right then left on a set              | Large centered image; right logs, left unlogs; repeating right does not toggle it off                        |
| C11 | Edit set reps/load/RPE/notes; add/remove sets; change exercise      | Actual values persist in the active draft; manual completion buttons also work                               |
| C12 | Complete a set; pause/resume/skip rest; adjust ±15 seconds          | Independent rest timer follows controls in both modes                                                        |
| C13 | Leave and resume; fully reopen with an active workout               | Same account recovers the device draft and its completed sets                                                |
| C14 | Finish with one completed and one uncompleted set                   | Summary/history include only completed sets; real totals, optional note and duration are correct             |
| C15 | Finish while offline, then reconnect and retry                      | No false saved message; acknowledged retry creates one session, not duplicates                               |
| C16 | Cancel an unfinished workout                                        | Confirmation allows keeping it; confirmed cancellation removes the draft                                     |
| C17 | Workout history: previous/current month, marked date and empty date | Only completed sessions mark dates; selected day opens the correct records                                   |
| C18 | History tab: search, Timed/Log Only filter, pagination              | Detailed records remain available and open correctly                                                         |
| C19 | Edit/delete a recorded session, then revisit totals/records         | Changes persist; history, volume and PR facts recalculate; templates remain                                  |
| C20 | Training summary and recovery check                                 | Frequency/volume/muscle allocation reflect logs; energy/soreness/sleep and optional stress/notes save/reopen |

Useful calculation: two completed sets of 8 reps at 10 kg give 16 reps and
160 kg external volume. Blank load is unknown and excluded from known-load volume;
zero is explicit zero added load. Do not lift beyond your ability to test numbers:
fictional Log Only records are enough. A template is distinct from a performed log.

### Pass D — manual nutrition (v0.4)

| ID  | Feature / action                                               | Expected result                                                                               |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| D01 | Food → Food options → Daily targets                            | Energy, macros and water save; earlier dates retain earlier effective targets                 |
| D02 | Search foods; switch Recent/Frequent/Favorites/Custom/Recipes  | Selection and pagination work; favorite changes persist                                       |
| D03 | Select food/preparation, unit and quantity                     | Portion preview scales calories/macros before saving; only known serving conversions offered  |
| D04 | Log Breakfast/Lunch/Dinner/Snacks and change diary date        | Entries reach the selected meal/date; meal and daily totals agree                             |
| D05 | Edit quantity and delete a diary entry                         | Totals recalculate; deletion confirms; editing uses the original nutrition snapshot           |
| D06 | Create/edit/archive a custom label food and serving equivalent | New logs use the changed definition; earlier logs retain their recorded values                |
| D07 | Build a recipe from ingredients, set servings and edit it      | Total and per-serving nutrition match ingredients; earlier diary snapshots stay               |
| D08 | Add cooked total weight and log arbitrary grams                | Recipe-by-weight scales from cooked yield; without yield use servings                         |
| D09 | Save a meal, log it again, delete the saved template           | Correct snapshot reused; old diary entries survive template deletion                          |
| D10 | Repeat meal, copy yesterday, copy meal/day to another date     | Copies append once; whole-day copies retain meal groups rather than replacing the destination |
| D11 | Add water in ml/L/US fl oz, then delete                        | Converted totals/remaining target and history are correct                                     |
| D12 | Invalid quantity, no results or failed save; retry             | Clear error, preserved input/frozen request and no duplicate acknowledged logs                |

Deterministic portion test: make a custom food with a 100 g base containing
200 kcal, 10 g protein, 30 g carbohydrate and 5 g fat. Log 150 g. Expect
300 kcal, 15 g protein, 45 g carbohydrate and 7.5 g fat. Source calories are
preserved; they are not recomputed from the macro formula.

### Pass E — habits, goals, body, activity and Today (v0.5)

| ID  | Feature / action                                                             | Expected result                                                                            |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| E01 | Create each of the five habit types using the examples above                 | Correct input, units, schedule and target comparison                                       |
| E02 | Choose start/end dates and reminder time; clear optional fields              | Calendar/time controls, no free-text date/time requirement; values survive reopen          |
| E03 | Complete a scheduled Check off habit from Habits and Today                   | Confirmed completion updates in place with a brief animation; no whole-page blanking       |
| E04 | Edit/remove a dated log; inspect habit history and rest days                 | Correct history/consistency; explicit zero and no report remain distinct                   |
| E05 | Change target/schedule/motivation; archive/restore habit                     | Dated changes do not rewrite older targets; chosen feedback and archived lists work        |
| E06 | Create/edit/delete/restore goals; test all 13 sources above                  | Actual source value, baseline, target, direction and percentage are understandable         |
| E07 | Test a future start, missing records and passed target date                  | Honest Not started / No recorded data / Target date passed states as appropriate           |
| E08 | Body records: save/replace/edit/delete weight and a named measurement        | Date/unit handling and history are correct; same date/name replaces rather than duplicates |
| E09 | iPhone: grant Motion once; open app, walk, leave and return                  | Automatic daily steps, live foreground updates and catch-up; no manual read/save button    |
| E10 | Deny Motion; open Steps & activity; set daily target; save optional distance | Useful permission guidance, target in the same section and no fabricated step count        |
| E11 | Compare Today cards with their source screens                                | Weight, steps, food totals, planned workout, habit/goal and training/recovery facts agree  |
| E12 | Quick log: use food, water, weight and other offered shortcuts               | Opens the correct actual logging flow; dismissing does not save fictional data             |

Steps use iPhone Motion history, not Apple Health/Watch aggregation. Expo Go does
not continuously deliver steps while backgrounded: test catch-up after returning.
Web/Android currently display synced history, not automatic full-day sensor totals.
Live device steps may lead cloud-based goals/analytics until the throttled cloud
save is acknowledged (normally at most one changed-total save per minute).

### Pass F — Progress and analytics (v0.6)

Create a few dated source records first. Empty charts on a new account are not
automatically a bug. Refresh after changing records; compare the same date range
and timezone on both screens.

| ID  | Module / action                                        | Expected result                                                                                             |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| F01 | Body: two dated weights, missing days and measurements | Real points/history, first-to-last change and recorded averages; gaps are not invented weigh-ins            |
| F02 | Nutrition: logged/unlogged days, target change         | Energy/protein averages, target days and adherence explain coverage; missing food is not zero intake        |
| F03 | Training → Frequency                                   | Completed sessions/distinct dates, mode counts and timed duration match history; unfinished drafts excluded |
| F04 | Training → Strength: choose a recorded exercise        | Heaviest load/estimated 1RM and changes match completed sets; estimate is labeled                           |
| F05 | Training → Volume                                      | Completed sets/reps/known-load volume and primary-muscle allocation match logs                              |
| F06 | Activity                                               | Steps/distance history, missing values, current target and recorded totals are clear                        |
| F07 | Habits                                                 | Scheduled completions, rest days, partial weeks and dated settings match habit history                      |
| F08 | 7D/30D/3M/6M/1Y/All and custom inclusive dates         | Correct bounds, future/reversed dates rejected; switching modules resets the range as explained             |
| F09 | Summary: weekly/monthly grouping                       | Monday-based weeks/calendar months, partial periods and coverage; only valid complete-period comparisons    |
| F10 | Edit/delete a source record and revisit Progress       | Correct recalculation after fresh reads, no stale overwritten updates or invented physiology                |

### Pass G — caching, resilience, privacy and quality (v0.9 + refinements)

| ID  | Feature / action                                                          | Expected result                                                                                                          |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| G01 | Today → Food → Today within 60 seconds, with no saves/auth changes        | Recent matching data reads reused; no full-page blanking for an already loaded source                                    |
| G02 | Save a record, return to its summary; use manual refresh                  | Writes invalidate reads; explicit refresh requests fresh data                                                            |
| G03 | Web reload/app restart; another device edits data                         | Memory cache does not survive full reload; cross-device changes may require expiry plus another read or explicit refresh |
| G04 | Slow/offline network: open data, attempt saves, reconnect/retry           | Useful error/retry; no fake success or silent duplicate. General offline sync is not promised                            |
| G05 | Sign out account A and sign in account B                                  | No A records/draft/notifications shown as B; cached reads do not leak across accounts                                    |
| G06 | Profile → Privacy & account data → Export                                 | Web JSON download/native share sheet; inspect your test records, with no password/token/API key                          |
| G07 | Preferences → Manage habit reminders; grant/deny/disable                  | Honest permission/status, local scheduled alerts and in-app web reminders                                                |
| G08 | Due reminder: foreground/background/tap; complete/archive habit, sign out | Tap opens appropriate Habits view; queue refreshes and account changes clear Actaro reminders when native APIs succeed   |
| G09 | Light/Dark, narrow screen, large text and keyboard open                   | Readable cards/forms, reachable actions, visible snackbars and no clipped essential controls                             |
| G10 | VoiceOver/TalkBack, keyboard focus and Reduce Motion                      | Meaningful labels/order, button alternatives to swipes, reduced completion motion                                        |
| G11 | Invalid/removed record, loading failure and retry/back                    | Safe empty/error view and usable recovery; no raw credentials or misleading success                                      |
| G12 | OPTIONAL: delete a disposable account using password + DELETE             | Explicit permanent-deletion confirmation, return to sign-in; another account unaffected                                  |

For G01, visually seeing a loader alone does not measure API traffic. On web,
DevTools Network can count `/rest/v1/` requests while preserving the log. Auth
verification can still make requests; it has no 60-second TTL cache. Do not export
or share unredacted network logs, which can contain credentials.

For reminders, web has no background notification delivery. Native reminders
schedule up to 48 occurrences over the next seven calendar days and refresh on
open/resume/edits. Notification delivery and native permission behavior need device
verification; record an Expo Go/platform restriction separately from an app bug.
See [quality testing](V09_TESTING.md) for full limits. An export is not an atomic
backup or import/restore tool. Account deletion is permanent; never use your main
account just to tick this test.

## 4. Practical testing sessions

1. **Session 1:** A01–A10, then all five habit examples and the three worked goal
   examples. This establishes account/navigation and how actions feed outcomes.
2. **Session 2:** B01–B05 and C01–C20. Use short fictional logs to test saving,
   timing, recovery, history/calendar and edits without needing a full workout.
3. **Session 3:** D01–D12, then E08–E12. Record known quantities and compare totals.
4. **Session 4:** F01–F10 and G01–G12 where available. Return over several days to
   check schedules, week boundaries, reminders and ordinary daily use.

## 5. What is outside this core test scope

Active minutes (v1.1), running/GPS (v1.2), advanced cross-metric analytics and
achievements (v1.3), food-photo AI (v1.4), full offline mutation sync (v1.5) and
Apple Health/Health Connect/wearables (v2.0) are not implemented core features.
Native/store builds and final release approval remain separate acceptance gates.

## 6. Report a finding

```text
Test ID:
Platform / OS / Expo Go version:
App commit:
Screen:
Steps to reproduce:
Expected result:
Actual result:
PASS / FAIL / NOT_TESTED / BLOCKED:
Reproducible always or sometimes:
Redacted screenshot or short recording:
```

Do not send passwords, email confirmation links/tokens, API secrets, private
exports or unredacted health data. Report lost/incorrect records and cross-account
access first, blocked workflows next, and cosmetic issues afterward.
