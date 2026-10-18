# Testing feedback implementation

Subsequent guided-set revision: left swipe now logs and right swipe undoes;
one card/progress bars/Show all sets supersede the initial list described below.
See [current test steps](APP_TEST_PLAN.md) and Development Status for newer evidence.

Updated: 2026-10-18 (America/Los_Angeles).

Status: **DONE** for implementation and local verification; physical-device acceptance remains **DEFERRED**.
This tracks the user's testing refinements without adding release weight or
closing retained device/beta/v1.0 gates. Ponytail full mode was applied.

| Request                    | Implementation                                                                                                                                                                                                                                                                                                                   | Status |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Automatic steps and target | One account-scoped iPhone observer starts at app load, catches up on resume, reads full-day Motion totals and updates shared Today/Activity state. No manual step input or read/save button. The target remains in Steps & activity.                                                                                             | DONE   |
| Date/time inputs           | Habit start/end dates use the existing calendar; reminders use the Expo-compatible native time picker and `type=time` on web. Optional fields can be cleared. Goal dates also use calendar controls.                                                                                                                             | DONE   |
| Habit completion           | Quick checks patch only the acknowledged habit log in place. Completion pulses respect Reduce Motion. Failed/uncertain writes remain frozen for identical retry and never show success early.                                                                                                                                    | DONE   |
| Caching and refresh        | Authorization-keyed, bounded memory cache; matching reads share a request, recent successful reads reuse results for 60 seconds. Writes clear reads before/after; auth changes clear them. Existing data stays visible on soft refresh and stale requests cannot undo acknowledged changes. Explicit refresh forces fresh reads. | DONE   |
| Habit/goal clarity         | Friendly habit types/examples, scheduled days and clear completion; goals explain source records, show current value/target/baseline and link to the relevant logging section.                                                                                                                                                   | DONE   |
| Workout history            | Calendar is the default, marked only from owned completed sessions for the selected month. A selected day opens its workouts; History retains the detailed searchable list and safe edit/delete flows.                                                                                                                           | DONE   |
| Active workout             | Centered rectangular 200px exercise image; planned set rows swipe right to log, left to unlog. Buttons provide the same actions, Edit exposes actual reps/load/RPE/notes and removal, and Add set retains planned targets. Repeated log actions are idempotent.                                                                  | DONE   |

## Decisions and limits

- Steps use iPhone **Core Motion**, not Apple Health or Watch aggregation. Already-granted permission is reused. Previously denied permission is not repeatedly requested; Settings is the recovery path.
- Expo Go does not deliver pedometer events while backgrounded. The app catches up using iPhone history when foregrounded. Native foreground readings are throttled to five seconds; the full-day count is re-queried rather than adding an overlapping sensor delta. Cloud writes occur only for changed totals, normally at most once a minute, with a best-effort departure flush. OS background execution is not claimed.
- Android/web display synced records without a fabricated full-day count or manual step fallback. Optional distance entry and existing historical manual records remain available. Health integrations remain v2.0.
- This is an in-memory performance cache, not persistent offline health storage or a mutation queue. It holds at most 100 successful query responses; read RPCs and signed image URL requests are explicitly distinguished from writes. Independently cancellable reads bypass sharing. Remote auth verification is only coalesced while in flight, with no TTL cache. RLS and existing owner checks remain intact.
- Calendar marks are queried for the whole month, independently of the detailed history's ten-row pages. Up to 500 sessions are displayed; a 501st result produces a visible limit error rather than silently incomplete marks.
- A left swipe **unlogs** a performed set; it does not delete the planned row. Removing a set is an explicit edit action. Only completed sets are included when finishing, using the existing local persistence and frozen network-retry flow.
- The only new dependency is the SDK-compatible `@react-native-community/datetimepicker`, installed with `expo install` and already bundled in compatible Expo Go. No HealthKit, background-task, state-management or caching framework was added. Native builds remain deferred.

## Changed areas

- `src/lib/supabase/read-cache.ts`, client wiring and AuthProvider: shared request reuse and auth cleanup.
- `nutrition-ui.tsx` / `useRecords` consumers: visible data retention, acknowledged updates, stale-response protection and explicit refresh.
- Activity step provider/service/screen and root coordinator: automatic permission-aware observation, throttled persistence, read-only count and target settings.
- Habit/goal models/screens and date/time/completion controls: clearer forms, real picker inputs and confirmed completion feedback.
- Workout history service/calendar/screen and set logger/session screen: calendar-first history, larger image and directional logging with manual alternatives.
- Tests cover cache identity/expiry/mutation races, visible data retention, native observer startup/resume/cleanup, calendar ownership/month boundaries, picker conversion, habit retries and swipe/scroll separation. Existing security/persistence assertions remain in place.

## Verification

- `npm.cmd run check`: **PASS**, strict TypeScript, lint, formatting, **308 Jest tests across 63 suites plus six dataset tests (314 total)**. Windows command wrapper: `cmd.exe /d /c "npm.cmd run check > .actaro-tools/feedback-final-check.log 2>&1"`, exit 0.
- `npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/feedback-export`: **PASS**, iOS/Android/web JavaScript bundles and 39 static routes. No native or cloud build was launched.
- `node .actaro-tools/check-feedback-artifacts.mjs`: **PASS**, 147 final export artifacts exclude the privileged Supabase key.
- `git diff --check`: **PASS**.
- `node --env-file=.env .actaro-tools/check-feedback-browser.mjs`: **PASS**, 28 layout captures across light/dark, narrow mobile and desktop; native-style touch input logged and unlogged a set and the local draft reflected both states. Habit completion, picker inputs and calendar/list flows passed. Returning from Food to Today issued **zero additional REST data requests** within the cache window. All 186 Supabase fixture requests were intercepted; zero live Supabase requests or external requests. No real accounts, emails or health data were used. Native sensors and gesture feel remain **DEFERRED** to device QA.

The observer tests cover launch/resume, permission/read races, account unmount,
cloud-write throttling and persistent unsynced feedback until an acknowledged
retry. Swipe tests cover scroll separation, thresholds, log/undo, accessible
buttons, editor disclosure and keeping the responder stable across rerenders.

## Next three checks

1. iPhone: grant Motion once, walk with Actaro open, background it, walk and return. Compare the live count with the iPhone Motion source, then set a daily target.
2. Choose a habit end date and reminder time, save/reopen, complete a scheduled habit and retry a failed save. Check that completion updates without hiding the page.
3. Open marked workout dates and detailed History; start a workout, swipe log/undo, edit actual reps/load, add/remove a set, reopen the draft and finish. Confirm only completed sets are saved.
