# Running testing and limits

Updated 2026-10-21. The user approved this v1.2 implementation early, including
background GPS, with native builds and physical acceptance **DEFERRED**.

## Street maps and stationary accuracy update

The user's follow-up authorizes street maps and a recording flow informed by
Strava. User decision (2026-10-21): one free map on every platform. iPhone,
Android and web use MapLibre GL JS 6.15.0 with
[OpenFreeMap](https://openfreemap.org/) vector tiles (iOS/Android WebView, web
sandboxed frame); the interim Apple Maps surface and `react-native-maps` were removed.
Light mode uses the muted `positron` style and dark mode `dark`. The route is an
accent line over a contrasting casing, with start (green), live position (accent)
and finish (dark) markers. Recording shows a large map with time as the primary
value and distance/live pace/average moving pace/moving time beneath it. Review
leads with distance, and review/detail list per-km/mi moving-pace splits derived
from the saved route; splits sum to the same distance and moving time as the summary.

iPhone worker fix (2026-10-21, unverified on device): the user's retest reported
**Map stopped at: style · Worker failed to load**. The library loaded, but
MapLibre's default worker, a blob importing the cross-origin
`maplibre-gl-worker.mjs`, was refused. The worker is one self-contained module with
no static imports. The page now downloads that pinned file, wraps it in a
same-origin blob and passes it to `setWorkerUrl` before creating the map. A new
`worker` stage separates download failures from start-up failures.

Edge (Chromium) loaded the generated page from an `http://127.0.0.1` origin with a
fictional route. It reached `ready`, rendered positron tiles, the cased route and
markers, and the worker ran from a same-origin blob. A `file://` page is not
comparable, because its blob origin differs from the page origin. WebKit/iPhone
behaviour still needs the user's retest. Fit route now pads the top so the
finish marker clears the map buttons.

Earlier iPhone map fix (unverified on device): MapLibre 6.15.0 starts a module worker from
a blob URL that imports its cross-origin worker script. A WebView page loaded from
a string has an opaque origin on iOS, where WebKit can refuse that worker. The page
now has the secure non-routable origin `https://actaro-map.localhost/` (no request
is sent there) and its CSP also allows `blob:` scripts/children for WebKit's
worker-src fallback. If the map still fails, the fallback shows **Map stopped at:
&lt;stage&gt; · &lt;reason&gt;** (stages: page, library, style, tiles); report that
line to identify the remaining cause. The map follows the recorded position; drag
to explore, use **Recenter** to follow again or **Fit route** for the whole route.
History/Today keep lightweight outlines rather than creating many live maps.
No API key, billing account, Redis or independent backend is needed. Internet
access is needed for map tiles and the pinned MapLibre CDN files on every platform. Attribution
stays visible. A loading failure offers an outline and retry without stopping GPS.

The map has no auth/session bridge and does not request its own location permission.
Only route geometry is passed to the map. The OpenFreeMap and unpkg CDN providers
receive normal resource requests, including viewed tile areas and IP address; Supabase
credentials and personal profile/health fields are never passed to the map.
These public provider URLs are service endpoints, not personal configuration.

The earlier fallback text incorrectly suggested an inaccurate GPS signal when
there was just one valid route point. It now says the start point is recorded and
the route will appear with movement. A map loading failure and GPS acquisition
remain separate states. Every run starts from a confirmed GPS fix and saved routes
are never empty, so the map always has a real start position. Physical iPhone
rendering of the embedded map still needs the user's retest (see the fix above).

Live pace uses recent accepted movement and becomes **—** when stopped or stale.
Average moving pace uses moving time, which freezes without accepted movement.
The separate elapsed timer still includes standing time, excluding manual pauses.
The database derives `moving_seconds` from route segments, bounded by elapsed time;
Today, history and Progress use that same moving-time estimate. Old routes retain
only the evidence they originally recorded; this cannot reconstruct missing fixes.

GPS filtering now uses device speed, reported accuracy and two consistent fixes
when speed is unavailable. Speed below 0.6 m/s is treated as stopped; displacement
inside 1.5 times the combined accuracy radius is ignored. Live pace expires after
10 seconds without accepted movement. GPS remains active to detect resumption;
auto-pause here freezes movement metrics rather than turning location off. The
filter is deliberately conservative and may omit very short/slow movements.
GPS accuracy and battery impact still need outdoor phone acceptance.

Verification: `npm.cmd run check` **PASS**, 389 Jest tests in 74 suites plus six
dataset tests (**395 total**), including stationary drift, missing speed,
resumption, stale pace, map gap geometry, fallback/retry and ingredient search.
Hosted rollback-only SQL checks **PASS**, including generated moving time,
ownership and rejection of injected moving-time values. The isolated local
Postgres runner could not start because its WebAssembly runtime ran out of memory;
no local SQL pass is claimed for this update. Final
`npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/run-map-export-final`
**PASS** for Android/iOS Hermes bundles and web static routes. This is a bundle
export, not an installed native build. Live-tile/native rendering acceptance remains
**DEFERRED**. The attempted browser fixture timed out; no real-tile pass is claimed.

After `npm install`, restart Metro with `npm start -- --go --clear`. Test outdoors:
stand still for a minute, move along a known route, stop, resume, pan/recenter the
map, then review/save and compare history/Progress. Test missing internet separately
from GPS permission/signal. Background acceptance still requires a development build.

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

- Elapsed time excludes explicit pauses; standing while recording still counts
  there. Moving time excludes detected stops; average moving pace uses moving time.
- GPS is an estimate. Fixes worse than 35 m accuracy, movement below 5 m and
  implausible same-segment speeds above 12 m/s are rejected. Gaps over 60 seconds
  start a new segment. Limits are 20,000 points and 24 hours per run.
- Active/review/detail show street maps; compact cards keep route outlines.
  No elevation, calorie/intensity,
  heart-rate, active-minute or running-goal inference is implemented. Running
  distance is separate from steps; saving a run does not duplicate daily activity.
- A device draft is account-bound. Only explicit save uploads coordinates to the
  owner's RLS-protected `run_sessions` row. The database validates the route and
  derives distance and a bounded preview; summaries avoid fetching full routes.
  Progress fetches metrics; detail fetches the full route.
- Account exports include private GPS routes and the local draft. Confirmed
  account deletion cascades saved routes and clears its local draft. Device drafts
  are not an encrypted health vault or a cross-device sync system.
- OpenFreeMap is the public map provider. No Redis, independent backend or new
  credential is introduced.

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
