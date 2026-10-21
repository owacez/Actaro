# Running testing and limits

Updated 2026-10-21. The user approved this v1.2 implementation early, including
background GPS, with native builds and physical acceptance **DEFERRED**.

## Start and test

From the repository root, install dependencies with `npm install`, then run
`npm start -- --go` for Expo Go or `npm run web` for browser testing. Existing
Supabase public environment variables are sufficient; no map key is needed.
This project's two running migrations have been applied. A separate Supabase
project must apply all committed migrations before testing.

1. Open **Train → Run**. Read the location explanation and start explicitly.
   Deny permission once: the app should explain how to retry without inventing a run.
   Enable location services and precise location, then start outdoors.
2. Walk/run a short known route. Time, distance, average pace and the route outline
   should update. GPS needs a usable signal; browser location can be coarse.
3. Pause, move, then resume. Paused time and travel must be excluded. The route
   should not draw a connecting line across the pause.
4. Go back during recording. Choose to keep recording where supported, pause/save
   the draft, or explicitly discard. Reopen the saved draft from Train or Today.
5. Stop, review, optionally add notes, then **Save run**. Stopping alone must not
   upload the run. After a failed network save, retry the same review: one run,
   with the same duration and ID, should be saved.
6. Open history/detail, Today and Progress → Running. Compare date, time, distance
   and average pace. Test km/mi preferences and Progress periods. Confirm deletion
   removes only the selected run. Check a second account cannot read its route.
7. Record briefly offline after signing in, then reconnect before saving. Points
   remain on this device; recording does not send Supabase requests per GPS fix.

## Background and lifecycle acceptance — DEFERRED

Expo Go and web are foreground-only. Leaving the app pauses these runs; return
and resume explicitly. Native background tracking needs a newly installed
development build containing Expo Location/TaskManager and the configured native
permissions. No EAS/native build was started, and no paid service was enabled.

When a development build is authorized, test iPhone Always/precise permission and
Android background permission/foreground notification, lock-screen recording,
normal background/foreground transitions, permission revocation, battery behavior,
sign-out/account switching and storage failure. OS/vendor restrictions and force
quit can stop tracking. Cold restoration pauses interrupted recording at its last
saved location rather than claiming the missing interval was tracked.

## Metrics, privacy and cost

- Time excludes explicit pauses; standing still while recording still counts.
  Average pace is recorded time divided by distance, not instantaneous speed.
- GPS is an estimate. Fixes worse than 35 m accuracy, movement below 5 m and
  implausible same-segment speeds above 12 m/s are rejected. Gaps over 60 seconds
  start a new segment. Limits are 20,000 points and 24 hours per run.
- The app draws route outlines, not street maps. No elevation, calorie/intensity,
  heart-rate, active-minute or running-goal inference is implemented. Running
  distance is separate from steps; saving a run does not duplicate daily activity.
- A device draft is account-bound. Only explicit save uploads coordinates to the
  owner's RLS-protected `run_sessions` row. The database validates the route and
  derives distance and a bounded preview; summaries avoid fetching full routes.
  Progress fetches metrics; detail fetches the full route.
- Account exports include private GPS routes and the local draft. Confirmed
  account deletion cascades saved routes and clears its local draft. Device drafts
  are not an encrypted health vault or a cross-device sync system.
- No Redis, map provider, independent backend or new credential is introduced.

## Verification evidence

- `npm.cmd run check`: strict typecheck, lint, formatting and existing test suites.
  Exact final counts are recorded in Development Status.
- `supabase/tests/running_sessions.sql`: rollback-only ownership, malformed input,
  distance, pause gaps, retry, preview bounds and deletion-cascade checks passed
  against both isolated Postgres and the hosted project. No test users remain.
- Web export and the isolated browser fixture cover recipe calculation/logging,
  simulated GPS, pause/review/save, history, Today, Progress and narrow dark/desktop
  layouts. Fixture requests were intercepted: zero live Supabase requests. These
  checks do not prove outdoor GPS accuracy or background native operation.
- Hosted advisors reported no running-specific finding. Existing disabled leaked
  password protection and unrelated workout/split index advisories are retained,
  not silently fixed by this task. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

SDK references: [Expo 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/)
and [TaskManager](https://docs.expo.dev/versions/v57.0.0/sdk/task-manager/).

Next three actions: outdoor foreground GPS/recipe checks on iPhone; later authorize
and test a development build with locked-screen GPS; verify Android lifecycle and
permission behavior when a device is available. Core release approval stays open.
