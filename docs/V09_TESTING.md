# v0.9 personal beta handoff

Updated: 2026-10-15 (America/Los_Angeles).

Automated/browser verification supports implementation completion, not a personal
beta pass. Real daily use, device acceptance, native builds and v1.0 approval remain
**DEFERRED** at the user's request. Record findings before release approval.

## Run the current app

From the checkout containing `package.json`, run `npm ci`, then
`npm start -- --go --lan`. Keep Metro running and open the QR code in a compatible
Expo Go. Web: `npm run web`. Use `npm.cmd` on Windows if PowerShell blocks npm's
script shim. See the README's tunnel troubleshooting if the phone cannot reach LAN.
No build, subscription, custom SMTP or new API key is needed for this beta.

Only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are app
configuration. Administrative keys remain outside the client. Email callbacks must
still match the initiating browser/device; follow [Auth testing](AUTH_TESTING.md).
Do not repeatedly request emails to work around rate limits.

## New flows

**More → Profile → Privacy & account data**:

- Export downloads JSON on web or opens the native share sheet. Save it privately.
  It includes all 28 owned tables, selected account metadata and this device's active
  workout draft. No session/password/API key is exported. Reference catalogs are
  excluded; recipe/saved-meal JSON and recorded snapshots remain in their owned rows.
- Avoid editing during export. It is collected over an interval, not an atomic
  database backup or an import/restore facility. Incomplete pages fail visibly.
- Account deletion requires the current password and typing `DELETE`. It is permanent.
  **Use a separate test account**, export first, and check that its records disappear
  while another account remains unchanged. Export files/backups on other devices
  are not remotely erased. Supabase's own backup retention is outside the app.

**More → Preferences → Manage habit reminders**:

- Set reminder time and weekdays in the habit editor. Enable permission explicitly
  on the phone. The account opt-in and device permission are both required.
- Local reminders schedule up to the earliest 48 occurrences over seven calendar
  days. Reopen/return to Actaro regularly; app resume and habit/preference edits
  refresh the queue. No remote push or background synchronization is provided.
- Messages use generic text to avoid putting habit/health details on the lock screen.
  Foreground/launch taps open Habits only for the current owner. Sign-out/account
  switches clear Actaro's pending/presented reminders when the native API succeeds.
- Completed, archived, expired and unscheduled habits are skipped on refresh.
  Completion on another device is reflected after this device refreshes. The app
  cannot cancel already scheduled local alerts remotely while it is closed/offline.
- Habit time zones apply. A nonexistent spring-forward time is skipped; a repeated
  fall-back time schedules once. OS focus/battery settings can delay/silence delivery.
- Web shows due reminders inside Actaro; background browser delivery is unsupported.

## Deferred acceptance checklist

| Area               | Verify during real use                                                                                                          | Status   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------- | -------- |
| Account            | Confirm/reset/email change on the initiating platform; reopen signed in; sign out                                               | DEFERRED |
| Workouts           | Build/split/start both modes; set/rest controls; background/reopen/offline draft; save/edit/delete; history/PR totals           | DEFERRED |
| Nutrition          | Food search, units/portions, diary edits, copy, recipes by weight and hydration                                                 | DEFERRED |
| Daily tracking     | Habits/rest days, goal sources, body records, manual/device steps and Today agreement                                           | DEFERRED |
| Analytics          | Presets/custom bounds, recorded gaps, units and weekly/monthly summaries against logs                                           | DEFERRED |
| Privacy            | Native export save/cancel; delete a disposable account and reopen                                                               | DEFERRED |
| Notifications      | iPhone/Android permission granted/denied, foreground/background/closed app, tap, opt-out, logout and archive/completion refresh | DEFERRED |
| Accessibility      | VoiceOver/TalkBack order and labels, large text, keyboard/focus, narrow layouts and both themes                                 | DEFERRED |
| Device performance | Long-history load, cold start, memory, active-workout background behavior                                                       | DEFERRED |
| Visual/native      | Exact Figma states, approved store icon/splash assets, custom native builds                                                     | DEFERRED |
| Personal beta      | Real daily logging across consecutive days; report bugs and data discrepancies                                                  | DEFERRED |

For a finding, share platform/OS, app commit, screen, steps, expected/actual result
and reproducibility. Include a redacted screenshot if useful. Never share passwords,
tokens, confirmation URLs or private exports. Severity: lost/incorrect data or
cross-account access first, blocked core flows next, visual issues afterward.

## Quality findings retained for release review

- Dependency audit still reports affected packages. Compatible SDK 57 patches and
  non-breaking fixes were applied; forced Expo/Jest/React Native major replacements
  were not used. Review the current `npm audit` report before release. These include
  development/build tooling chains and a runtime URI-decoding chain; this is not a
  claim that deployed app inputs are safe. Avoid exposing Metro to untrusted networks.
  [URI advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr),
  [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
  [forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
  [sprintf advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c),
  [UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
- Supabase's security advisor reports leaked-password protection disabled. Paid
  services were not enabled. [Remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- Performance advisor retains five INFO composite-FK index suggestions. Existing
  leading-parent indexes already cover bounded child reads; no speculative indexes
  or removals were introduced. Reassess with production-size query plans.
  [Advisor details](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).
- Error recovery is local: safe route fallback, retryable requests and durable
  workout drafts. No external crash-reporting service or private telemetry was added;
  native OS crashes still require device logs/testing.
- Exact unprovided Figma states and starter icon artwork remain acceptance work.
  Accessibility uses the verified charcoal foreground on orange actions and small
  labels; original small white/orange combinations did not provide sufficient contrast.

These findings are tracked, not silently waived. v1.0 cannot be approved from
passing lint/tests or JavaScript exports alone.
