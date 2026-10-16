# Figma implementation sync

Updated: 2026-10-16 (America/Los_Angeles).

Status: **BLOCKED — final visual corrections require Figma editing access after the Starter MCP limit resets.**

[Current implementation board](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-118)
· [Preserved future concepts](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=32-118)

## Applied changes

- Rebuilt the 33 existing core frames in place and added 45 views/states: **78 total**. Existing core frame IDs were preserved.
- Reconciled foundation labels with the current orange palette and Inter typography. Reused local color variables, added measured layout variables and source text styles, and created reusable input, button, choice, card-surface and navigation components.
- Preserved 23 future concepts separately, with release labels aligned to the canonical plan. Their contents were not implemented or deleted.
- Used the running Expo web export at a 390 × 844 viewport as a mobile content/layout reference, with disposable sample data. No real user's health records were copied. Verification/recovery UI captures used design-only responses/events; they are not live authentication acceptance evidence.
- Imported 29 discrete RepDB illustrations and assigned image fills to 66 current-screen image nodes. No complete UI screenshot was imported as a deliverable.
- Structural readback before the final auth batch found 2,986 editable text nodes, 1,554 component instances and no unexpected font families across 74 frames. The final batch brought the frame count to 78. This structural evidence does not establish visual fidelity.

## Visual checks and remaining work

Seven representative Figma previews were compared with the app references: Today, Fitness, timed workout, sign-up, dark Preferences, strength progress and the auth error/toast. Profile was also checked during construction, and an inherited frame-padding offset was corrected.

The final visual pass **did not pass completely**:

1. Short links such as Filters and Change dates can wrap because of browser/Figma text-metric differences. Apply intrinsic sizing to short link labels, then recheck their rows and navigation. Restore password/search placeholder styling and the toast's accent stripe/shadow from the source; the captured geometry alone did not preserve these details.
2. Exercise image fills exist structurally but appear blank in the MCP PNG previews. Verify the editor rendering and image hashes; try PNG-encoded versions of the same source illustrations if the WebP content is not rendered. Do not mark the media sync verified until images are visibly present.
3. Add the remaining captured empty-search/retry states and custom-date expansion if useful for the flow handoff. These are supplementary states, not missing app implementations.
4. Add source-based native-only reminders and iPhone step-reading variants. The current screen board uses the mobile web renderer; native safe areas, SF Symbols, OS permission sheets and native notification placement are not claimed pixel-matched.
5. Add an on-canvas scope/verification note, complete the visual correction pass and verify the final board structure.

The Starter MCP limit blocked both the corrective write and a subsequent screenshot request. The tool returned “You've reached the Figma MCP tool call limit on the Starter plan.” The connected computer/browser surface inventory was also empty, so no editor-UI fallback was available. No paid upgrade was attempted.

The local PDF remains a historical design reference; it cannot substitute for write access to the Figma file. The supplied PDF was preserved.

App source, dependencies, schema and release-completion accounting were unchanged. This design sync does not close deferred device/beta/release acceptance.

Repository validation: `npm run check` passed (TypeScript, ESLint, Prettier, 58 Jest suites / 288 tests, and six dataset-script tests: 294 tests total). `git diff --check` also passed. These commands validate the repository, not Figma visual fidelity.

The two disposable sample accounts remain pending explicit cleanup approval: automatic approval review rejected their permanent deletion. Their identities are recorded only in the ignored local fixture file; no credentials were added to this report.

## Synced frames

| Screen/state                         | Figma frame                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| 01 · Today                           | [3:133](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-133)     |
| 02 · Fitness · Exercise Library      | [3:231](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-231)     |
| 03 · Nutrition diary                 | [3:293](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-293)     |
| 04 · Progress · Weight               | [3:352](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-352)     |
| 05 · More                            | [3:421](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-421)     |
| 06 · Exercise filters                | [3:465](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-465)     |
| 07 · Exercise detail                 | [3:538](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-538)     |
| 08 · Workout preview                 | [3:561](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-561)     |
| 09 · Workout mode                    | [3:636](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-636)     |
| 10 · Timed workout                   | [3:653](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-653)     |
| 11 · Log Only workout                | [3:728](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-728)     |
| 12 · Workout summary                 | [3:785](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-785)     |
| 13 · Habits                          | [3:818](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-818)     |
| 14 · Goals & progress                | [3:846](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=3-846)     |
| 15 · Sign in                         | [6:101](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-101)     |
| 16 · Sign up                         | [6:127](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-127)     |
| 17 · Password reset                  | [6:157](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-157)     |
| 18 · Food search results             | [6:171](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-171)     |
| 19 · Food portion                    | [6:240](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-240)     |
| 20 · Edit food log                   | [6:276](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-276)     |
| 21 · Recipe editor                   | [6:327](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=6-327)     |
| 22 · Workout builder                 | [19:150](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-150)   |
| 23 · Training plan library           | [19:208](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-208)   |
| 24 · Training plan preview           | [19:248](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-248)   |
| 25 · Workout history                 | [19:289](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-289)   |
| 26 · Edit recorded workout           | [19:331](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-331)   |
| 27 · Habit editor                    | [19:373](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-373)   |
| 28 · Goal editor                     | [19:412](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-412)   |
| 29 · Edit saved goal                 | [19:446](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-446)   |
| 30 · Custom food editor              | [19:488](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-488)   |
| 31 · Saved meals                     | [19:529](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-529)   |
| 32 · Profile management              | [19:562](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-562)   |
| 33 · Preferences                     | [19:599](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=19-599)   |
| 34 · My workouts                     | [39:2827](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-2827) |
| 35 · Training splits                 | [39:2858](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-2858) |
| 36 · Seven-day split editor          | [39:2874](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-2874) |
| 37 · Training summary                | [39:2962](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-2962) |
| 38 · Recovery check                  | [39:2990](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-2990) |
| 39 · Available equipment             | [39:3072](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3072) |
| 40 · Privacy & account data          | [39:3293](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3293) |
| 41 · Habit reminders · web           | [39:3318](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3318) |
| 42 · Profile · Change email          | [39:3333](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3333) |
| 43 · Profile · Change password       | [39:3363](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3363) |
| 44 · Daily nutrition targets         | [39:3396](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3396) |
| 45 · Recipes                         | [39:3428](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3428) |
| 46 · Log habit                       | [39:3480](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=39-3480) |
| 47 · Habit history                   | [41:1051](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-1051) |
| 48 · Body records · Weight           | [41:1340](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-1340) |
| 49 · Body records · Measurements     | [41:1410](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-1410) |
| 50 · Steps & activity                | [41:1459](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-1459) |
| 51 · Progress · Nutrition            | [41:1799](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-1799) |
| 52 · Progress · Frequency            | [41:2041](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2041) |
| 53 · Progress · Strength             | [41:2195](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2195) |
| 54 · Progress · Volume               | [41:2399](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2399) |
| 55 · Progress · Steps                | [41:2557](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2557) |
| 56 · Progress · Habits               | [41:2772](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2772) |
| 57 · Progress · Summary              | [41:2937](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-2937) |
| 58 · Food search · Initial           | [41:3223](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3223) |
| 59 · New workout · Empty             | [41:3416](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3416) |
| 60 · Email verification instructions | [43:2047](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=43-2047) |
| 61 · Recovery · Set password         | [43:2071](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=43-2071) |
| 62 · Email confirmed                 | [41:3440](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3440) |
| 63 · Auth link · Error               | [41:3451](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3451) |
| 64 · Email change · Other inbox      | [41:3460](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3460) |
| 65 · Sign in · Validation & toast    | [43:2090](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=43-2090) |
| 66 · Preferences · Dark              | [41:3470](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3470) |
| 67 · Today · Dark                    | [41:3550](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3550) |
| 68 · Nutrition · Dark                | [41:3695](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3695) |
| 69 · Progress · Dark                 | [41:3845](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-3845) |
| 70 · More · Dark                     | [43:2126](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=43-2126) |
| 71 · Save meal template              | [41:4014](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4014) |
| 72 · Recipe ingredient selection     | [41:4153](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4153) |
| 73 · Workout builder · Set editor    | [41:4359](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4359) |
| 74 · Workout · Rest timer            | [41:4478](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4478) |
| 75 · Workout · Paused                | [41:4556](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4556) |
| 76 · Workout · Discard confirmation  | [41:4622](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4622) |
| 77 · Deleted habits                  | [41:4690](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4690) |
| 78 · Deleted goals                   | [41:4715](https://www.figma.com/design/7u3UDAzE64TiTUzGjA22XW?node-id=41-4715) |
