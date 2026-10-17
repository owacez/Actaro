# Core redesign implementation

Updated: 2026-10-17 (America/Los_Angeles).

Status: **DONE** — implementation and local verification for this revision.
Exact visual/device acceptance remains **DEFERRED**.

The user's 32-page [Actaro v1 redesign](Actaro-v1-redesign.pdf) is the current
visual authority. All pages were rendered and inspected. The canonical product
rules and release order remain in force. This is a visual revision of the
implemented core, with no new database schema, dependency, credentials or paid
service. No Figma file was changed.

| Reference pages                     | Implemented changes and principal files                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2–3, 32: foundation/navigation      | Chalk/Carbon semantic colors, Inter hierarchy, solid content surfaces; `actaro-theme.ts`, shared `auth-components.tsx`, `product-ui.tsx`. Floating Today/Train/Food/Progress/You tabs and separate Quick log in `(tabs)/_layout.tsx`. Glass uses installed Expo GlassView only where supported, with a solid fallback for Reduce Transparency and other platforms. |
| 4–5: authentication                 | Updated wordmark, spacing, inline validation, password visibility and confirmation/reset states in `auth-screen.tsx`. Existing auth behavior and session persistence retained.                                                                                                                                                                                     |
| 6–7: Today/Quick log                | Workout hero, compact actual-record metrics, macro meters, hydration and habit actions in `today-screen.tsx`; six real logging destinations and frozen-request water retry in `quick-log-sheet.tsx`. Empty accounts show setup actions instead of sample health values.                                                                                            |
| 8–14: Train                         | Workouts/Library/Plans switch, real scheduled-workout/week strip, compact library/workout rows, exercise media toggle, pinned detail actions, mode/filter sheets, session header/rest controls, completed-set signals and compact set fields. Files under `features/exercises` and `features/workouts`, including `scheduled-training.tsx`.                        |
| 15: Running concept                 | **DEFERRED** — belongs to v1.2, no running feature or misleading navigation added.                                                                                                                                                                                                                                                                                 |
| 16–19: Food                         | Date/week selector, remaining energy/macro meters, four compact meal groups, food/meal/edit/delete/copy/hydration sheets, row-based search and quantity/target steppers. Existing source data, units, portion calculations and retry ownership remain in nutrition services/models.                                                                                |
| 20–23: Progress                     | Body/Nutrition/Training/Activity/Habits/Summary grouping; Frequency/Strength/Volume remain within Training. Header actions, period segments, calendar date selection, two-column metrics and a line chart from actual dated weigh-ins; no fabricated/interpolated records.                                                                                         |
| 24–30: You/records/settings/privacy | Grouped account rows, profile identity, email/password sheets, unit/theme segments, habit calendar/action sheets, numeric record/goal controls, focused delete-account sheet. Existing reminders, ownership and destructive-action guards remain in place.                                                                                                         |
| 31: loading/empty/error             | Shared controls and feedback retain loading, no-data, inline validation and safe retry states. No success placeholders replace failed saves.                                                                                                                                                                                                                       |

## Retained interaction differences

The PDF is a visual reference rather than authorization to fabricate functionality.
Existing explicit reorder/delete controls remain accessible instead of introducing
new drag/swipe gestures. Food portion selection remains a dedicated route, while
diary actions use sheets. Detailed history, split, recipe and custom-food forms
inherit the new foundation but do not reproduce every illustrated row grouping.
You displays real identity and navigation without invented sample counts.
Persistent sign-in uses the existing session behavior; no decorative checkbox or
nonfunctional mail-app action was added. Exact visual matching is not claimed.

Saved food snapshots keep their recorded quantity/unit semantics. Suspicious
historical values are not silently relabelled or rewritten during a visual task.

## Verification

- `npm.cmd run check`: **PASS**, TypeScript, lint, formatting, 293 Jest tests across 59 suites and six dataset tests (299 total). Windows validation used `cmd.exe /d /c "npm.cmd run check > .actaro-tools/redesign-final-check.log 2>&1"` to capture native stderr without PowerShell converting successful Jest output into error records; exit code 0.
- `npm.cmd exec -- expo export --platform all --output-dir .actaro-tools/redesign-export`: **PASS**, iOS/Android/web JavaScript bundles and 39 static routes. No native build launched.
- `node --env-file=.env .actaro-tools/check-redesign-browser.mjs`: **PASS**, 16 isolated sample-data captures covering all five tabs, Profile, Preferences, Quick log, sign-in/sign-up, light/dark, 320/390px mobile and 1280px desktop layouts. No document overflow or runtime exceptions. All 288 fixture requests were intercepted; **zero live Supabase requests**. Screenshots inspected, including compact Food and narrow dark Progress.
- `node .actaro-tools/check-redesign-artifacts.mjs`: **PASS**, all 147 exported artifacts exclude the privileged Supabase key.
- `git diff --check`: **PASS**.

The browser harness and generated captures are local ignored tooling under
`.actaro-tools/`. Browser checks use an isolated profile and fictional fixtures,
intercepted before network delivery. They do not create accounts or use real
health records. Shared UI regression tests are tracked in
`__tests__/redesign-controls.test.tsx`; existing flow tests were updated for the
new controls without dropping their validation, persistence or retry assertions.

Physical iPhone/Android visual acceptance, native glass/reduced-transparency
behavior, keyboard placement and existing deferred integration checks remain
**DEFERRED** to user testing. A JavaScript export is not a native build or device
test. This work earns no additional release weight and does not approve v1.0.

## Header reconciliation

User follow-up, 2026-10-17: the top bar looked like an attached strip. The newer
instruction refines the PDF's full-width header treatment. The supplied PDF was
preserved; exact matching to that treatment is no longer intended.

- `src/components/product-ui.tsx`: ScreenHeader is a transparent page-heading row, with title/subtitle spacing and room for actions; removed its white/glass wrapper.
- `src/features/auth/auth-components.tsx`: headings share the content column and scroll naturally; a narrow `pinnedHeader` option retains operational controls where needed.
- `src/features/exercises/library-screen.tsx`: Train heading moves into the existing virtualized list header so it follows the same scroll/margin behavior.
- `src/features/workouts/session-screen.tsx`: explicitly retains the pinned workout timer/finish header on the screen canvas. Existing footer rest controls remain available.

Validation: **DONE** locally. `npm.cmd run check` passed TypeScript, lint,
formatting, 293 Jest tests / 59 suites and six dataset tests. The command ran
through the same Windows `cmd.exe` wrapper described above, with exit code 0.
`npm.cmd exec -- expo export --platform web --output-dir .actaro-tools/redesign-export`
passed. `node --env-file=.env .actaro-tools/check-header-browser.mjs` passed 16
offline layout captures, including light/dark and 320/390/1280px widths, with
zero document overflow/runtime exceptions and zero live Supabase calls. It also
verified that all five main headings are inside their scroll container and move
when scrolled. Food, Today, narrow dark Progress and Preferences captures were
visually inspected. `git diff --check` passed. No package or backend change.

Physical-device visual approval remains **DEFERRED**; next actions below remain
the testing handoff. Release completion weights are unchanged.

## Next three actions

1. Review Today, Train, Food, Progress and You on iPhone in both themes, including Quick log and keyboard/safe-area placement.
2. Exercise a workout set/rest/finish flow, food quantity/copy/delete flow and account sheets with real owned records; report any regression.
3. Resolve visual observations, then complete the retained device/beta/release gates before v1.0 approval. Native builds remain user-deferred.
