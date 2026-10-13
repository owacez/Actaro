# 005 — Workout templates and recorded sessions

Date: 2026-10-12. Scope: v0.3 task 2.1.

Separate six owned tables: templates, template exercises, planned sets, sessions,
session exercises and performed sets. Ordered positions allow repeated exercises
and per-set targets. Weights use canonical kilograms with three decimal places;
missing weight remains null, while bodyweight can be explicitly zero. Reps, rest,
RPE and notes are validated; advanced set types remain deferred.

Each child carries its owner and references `(parent_id, user_id)`. RLS allows only
the current Auth owner; column grants prevent changing identity and parent links.
Anonymous access is revoked. New session exercise inserts snapshot the real catalog
name and primary muscle IDs in a private invoker trigger. Clients cannot replace
those snapshots. Template edits/deletion and catalog reimports preserve performed
facts. Deleting an account/session cascades its owned data; deleting a template
clears only the optional template reference in existing sessions.

Sessions record Timed or Log Only, active/completed/cancelled status, finite start
and end instants, the matching local date and validated recording timezone. Log
Only has no total duration; completed Timed sessions require a nonnegative duration
no greater than elapsed wall time. Timer pause/resume logic remains task 2.7.
History queries use owner/date/time indexes. No calculated PR/volume cache, offline
sync, predefined-plan schema or UI is introduced by this database task.

Technical input ceilings: 100 exercises/sets per parent, 1,000 reps per set,
10,000 kg, 3,600 seconds rest and seven days total duration. These are validation
bounds, not training recommendations. A completed performed set requires reps;
unmeasured weight is not invented. Analytics will explicitly handle missing values.

Two applied migrations and generated types are in the repository. Rollback SQL
tests run both locally and against hosted Supabase, without confirmation emails or
real user data changes. The combined `(user_id, parent_id)` indexes cover owner
queries and equality-based composite FK lookups. The advisor still reports four
order-sensitive FK notices; a catalog inspection confirms coverage for every FK
and an actual `EXPLAIN` (with sequential scan disabled solely for demonstration)
uses the combined index with both equality conditions. No duplicate indexes were
added just to silence that notice. Unused-index INFO notices are expected on new,
empty tables. The existing Auth leaked-password warning remains unchanged.

## Custom builder (task 2.2)

The approved PDF's compact exercise list is reused, with real thumbnails and
expandable per-set editing for the canonical targets/rest/RPE/notes. Existing
shared controls and functional dark colors remain in use; unshown dark Figma parity
is not claimed. My workouts lists ten templates per page; the exercise picker
reuses the existing search/filter/pagination screen.

`save_workout_template` is an authenticated invoker RPC with Auth-derived owner,
bounded validated children and atomic replacement. A stable client UUID makes
retrying a new workout update its same row. Only this user's template can be
updated; invalid children roll the transaction back. The service validates inputs
and account identity, translates kg/lb deterministically and keeps raw database
errors out of UI messages. Missing load differs from an unavailable edit target.

Three-decimal kilogram storage is retained; display conversion rounds to three
decimals and RPE entry allows one decimal. Last-save-wins is an explicit current
ceiling, with version checks deferred until concurrent editing is required.
Builder drafts stay in React state and survive a failed request, but are not an
offline queue or persistent active session. Timers, plans and performed logging
remain separate roadmap tasks. No new dependency was added.

The search/detail shortcut (2026-10-13) carries only a validated exercise UUID to
the existing workout chooser/builder. The builder fetches actual catalog details,
appends one exercise to the loaded draft and retains its unchanged saved baseline
for discard. Both picker entry paths share the same defaults. No mutation occurs
until Save; unavailable selections or full workouts cannot produce a partial save.
Chooser replacement and clearing the selection after Save prevent an old selection
from being reapplied by normal back navigation. Reloading an unsaved draft still
uses the unchanged saved template plus one selected exercise. Account/ownership
checks, atomic save and documented last-save-wins semantics remain unchanged.

Seven-day splits store owned ordered day rows independently from session facts.
Exactly seven explicit workout/rest selections are required for a save; deleting
a template may later leave an unassigned day, which the editor exposes. A unique
partial index and an owner-profile row lock allow one active split without racing
concurrent selections. Split deletion removes only its schedule. New workout
creation returns to the open split draft; unsaved planning drafts do not survive
termination. No scheduling daemon or notification service is introduced.

References:

The performed session flow (2026-10-13) uses one account-scoped AsyncStorage
draft and serialized writes. Starting another workout requires resolving the
existing draft. A completed pending payload is frozen with a stable mutation UUID;
an acknowledgement is required before claiming cloud save or clearing its copy.
No periodic timer tick writes to Supabase. Timer anchors use wall time rather than
counted intervals, excluding explicit pauses and recovering elapsed time after
foreground/restart. The rest clock is independent in both modes. This is minimum
active-workout resilience, not v1.5 multi-device offline synchronization.

`save_workout_session` is an invoker transaction with owner/profile lock,
revision checks and lost-response retry acknowledgement. Stable exercise/set IDs
retain recorded catalog snapshots during edits. Invalid facts roll back; deleted
versioned sessions cannot be recreated by stale edits. Completed timestamps must
fall inside the session. A removed owned template becomes an absent optional
reference; performed facts remain independent. History UI remains the next task.

Previous/best performance comes from completed owned sessions before the start
instant, with optional current-session exclusion for history recalculation.
Working-set volume counts known external kilograms times reps; unknown and zero
loads stay distinct. Rep records compare the same known load. Epley estimates
cover 2–10 reps with positive load; one rep uses actual load. First measurements
are labeled separately from improvements. Muscle allocation/frequency and history
recalculation remain pending; no physiological recovery claim is made.

Predefined strength plans (task 2.3, 2026-10-13) are read-only shared recipes
referencing stable RepDB source IDs. The catalog resolves real exercise names and
equipment, excludes incomplete recipes, and filters against the owner's saved
equipment. Seven Actaro-authored starting families cover Beginner Full Body,
Push/Pull/Legs, Upper/Lower, Strength, Hypertrophy, Home and Bodyweight. General
programming references are shown without implying endorsement or prescribing loads.
Beginner Running is retained but deferred to v1.2 because strength set logging
cannot represent its running sessions correctly.

Adoption is an authenticated invoker transaction: resolve actual catalog IDs,
clone editable private targets, then create/activate the owner's seven-day split.
Stable adoption UUIDs make retries recover the same copy. Missing exercises or
foreign identity collisions roll back all copies and preserve the old active split.
Shared recipes are not changed by users' edits. No external dataset runtime
dependency, new package or fabricated progress was introduced.

Programming basis: [ACSM resistance-training progression position stand](https://pubmed.ncbi.nlm.nih.gov/19204579/)
and [CDC adult activity guidance](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html).

- [Supabase grants and RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL composite foreign keys and selective SET NULL](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
