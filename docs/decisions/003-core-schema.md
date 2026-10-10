# 003 — Schema foundation and historical analytics

Date: 2026-10-09

Status: first profile/preferences migration and typed services implemented; database ownership and SDK request tests passed. Profile UI and live authenticated application persistence remain pending.

## Scope and authority

The user requested a schema suitable for later analytics and confirmed that the
Supabase project is newly created. Source of Truth §§6, 14, 19–22 define the
requirements; the Development Plan determines when each domain is implemented.
This document records design decisions and the first migration specification.
Future-domain entries are planning, not implemented tables or final column APIs.
Inspect the actual project's schema before applying even the first migration.

Use PostgreSQL/Supabase Auth/RLS/Storage. No separate analytics service, event bus,
generic event-store table, or pre-created future-domain tables are needed.

## First migration: profiles and initial preferences (v0.1)

Keep authentication identity in `auth.users`. Do not copy passwords, tokens or
email verification state into public tables. Start with two owned records:

| Table              | Fields and constraints                                                                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | `id uuid primary key references auth.users(id) on delete cascade`; optional nonblank `display_name` (maximum 80 characters); server-managed `created_at` and `updated_at timestamptz`   |
| `user_preferences` | `user_id uuid primary key references profiles(id) on delete cascade`; validated IANA `time_zone`; unit choices; theme; notification/gamification preferences; server-managed timestamps |

Initial unit columns: `weight_unit` (`kg`, `lb`), `length_unit` (`cm`, `in`),
`distance_unit` (`km`, `mi`), `energy_unit` (`kcal`, `kJ`). Theme allows `system`,
`light`, `dark`. Use SQL CHECK constraints for these small sets, rather than
arbitrary JSON settings. Proposed initial defaults are kg/cm/km/kcal, system
theme, UTC until the app supplies the device's IANA zone, and notifications and
gamification disabled until chosen. Defaults are implementation decisions,
not claims that the canonical documents prescribed them.

All profile/preferences data is private. Do not add a public-profile option or
invent broad privacy toggles. Exact privacy controls, granular notification
settings and any additional profile fields must follow their actual UI/behavior
task. Dashboard customization stays deferred. No avatar bucket, health measurements,
date of birth or nutrition-target fields are added without their corresponding need.

Use an atomic, minimal auth-user creation trigger to create the profile and its
default preference row. Do not trust user-editable metadata for ownership or
authorization. Its SECURITY DEFINER function must have a fixed empty search path,
qualified object names, restricted direct execution and only the required writes.
Test the trigger before deploying: a broken signup trigger can block account creation.
Backfill only verified existing accounts, with explicit evidence if any are found.
The first deployment verified one existing account, already email-confirmed, and
created its two foundation records without copying identity or credential fields.

Grant `authenticated` only the required SELECT and column-level UPDATE access;
initial records are created by the trusted trigger. Revoke anonymous access and
client INSERT/DELETE. Users cannot update identity IDs or timestamps. RLS on both
tables permits SELECT and UPDATE only when `(select auth.uid())` equals the row's
owner; UPDATE needs both USING and WITH CHECK. The preference foreign key, allowed
values and timezone validation must also reject malformed writes. Add a timestamp
trigger for updates. Account deletion belongs to a verified server-side flow,
with cascading deletion covered by tests; no mobile administrative credential.

Generate the TypeScript database types from the applied schema. Profile queries
belong in feature data-access code, not route components. Profile/preferences and
RLS roadmap items remain incomplete until persistence and ownership tests pass.

## Historical data rules for each later domain

1. Preserve recorded facts separately from mutable templates, catalogs and display
   preferences. Editing a workout plan, food entry or unit preference must not
   rewrite previously recorded performance/nutrition. Capture the required source
   values and calculation version on a log when that domain is implemented.
2. Persist instants as `timestamptz`. For day-based logs, also persist the user's
   intended local `date` and recording timezone. Traveling or changing today's
   timezone must not move old meals, habits or sessions between days. Store actual
   start/end instants for sessions; order sets explicitly rather than by creation time.
3. Use canonical units for calculation: kilograms, centimetres, metres, seconds,
   kcal and grams as appropriate. Convert only at input/display boundaries. Use
   PostgreSQL `numeric` where rounding affects food/weight calculations; apply
   domain-specific ranges, nonnegative checks and documented rounding rules.
   Do not persist rounded display strings as the source for analytics.
4. Give every owned fact an immutable UUID and explicit owner. For child records,
   use ownership-preserving foreign keys: for example, a unique parent
   `(id, user_id)` referenced by the child's `(parent_id, user_id)`. RLS and write
   validation must prevent attaching a row to another user's session or recipe.
5. Preserve distinctions such as draft/completed/cancelled sessions, actual versus
   planned sets, and missing versus zero values. Historical reports must define
   which states qualify; missing input must not become a fabricated measurement.
6. Index actual query paths, starting with owner plus date/time and relationship
   keys when the table is introduced. Validate range-query plans with EXPLAIN;
   do not create a large speculative index set or partition an empty database.
7. Compute deterministic reports from recorded facts first. Add cached/materialized
   summaries only after a measured need, with ownership/RLS, rebuild/invalidation
   rules and calculation versions. Derived summaries must be reproducible after
   a correction or deletion. Do not let a view or definer function bypass ownership.

## Domain introduction order

| Release  | Planned entities / historical focus                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1     | Profiles and preferences; Auth ownership, constraints, timestamps, RLS and typed access                                                  |
| v0.2     | Shared muscles/equipment/exercises/media, source IDs and import provenance; owned available-equipment selections                         |
| v0.3     | Owned workout templates/plans, ordered exercises/sets, sessions and performed sets; preserve actual load/reps/duration and session state |
| v0.4     | Foods and serving conversions, recipes/ingredients, diary entries and nutrition snapshots; recipes/logs retain values used at recording  |
| v0.5     | Habits and dated entries, goals, bodyweight/measurements, steps with source provenance; idempotent daily updates and user-local dates    |
| v0.6     | Basic deterministic SQL/application reports over those facts; explicit periods and missing-data handling                                 |
| v0.9–1.0 | Ownership/deletion/export and calculation audit, performance checks and core release gates                                               |
| v1.1–2.0 | Activity minutes, running/GPS, advanced reports/badges, food-photo AI, sync and health integrations in their approved sequence           |

Running tracks, nutrition AI, sync conflict metadata and wearable samples are not
created now. Their retention, provider/source IDs and unit/time handling will be
defined in those releases. Retained/deferred requirements stay in Development Status.

## First migration acceptance and verification

- Inspect tables, grants, RLS, functions/triggers, migrations and Auth configuration
  through the authorized connection. Preserve anything that already exists.
- Apply only the profile/preferences migration; save the exact SQL in the repo and
  verify the migration history plus generated database types.
- With disposable test users A and B, verify initial row creation and own-row
  reads/updates; A cannot read/update B, spoof IDs, insert extra records or alter
  server timestamps. Anonymous requests receive no private rows.
- Reject invalid units/theme/timezone/display names; verify timestamp updates.
- Verify deletion cascades using disposable accounts and remove test fixtures.
  Use server/admin context only for controlled setup/cleanup, never the mobile client.
- Run `npm run check` and meaningful database ownership checks. A passing mocked
  client test or SQL text review does not establish schema/RLS completion.

## Deployment evidence (2026-10-09)

- Supabase MCP applied `profile_preferences_foundation`; migration history reports
  version `20261009165708`. The CLI-generated local SQL filename was aligned with
  that actual remote version. SQL is saved in `supabase/migrations/`.
- `supabase/tests/profile_preferences.sql` passed against the real database via
  MCP execute_sql. It impersonates anonymous/authenticated roles with disposable
  users and rolls back all fixtures. It verifies defaults, ownership, updates,
  protected IDs/timestamps, invalid values, trigger privileges and cascades.
- Post-test counts: one Auth account, one profile, one preferences record; no
  missing confirmed profiles/preferences. Both tables have RLS and four policies
  total. Private functions use an empty search path; only the Auth insert trigger
  uses definer privileges. No signup emails were sent by SQL tests.
- Generated `src/lib/supabase/database.types.ts` from the applied database and
  wired it into the shared client. Generated Update types reflect columns, not
  grants; feature services now restrict updates to permitted editable fields.
- `src/features/profile/` provides typed Auth-derived reads/updates, field/value
  validation and safe errors. Its 36 SDK transport/validation tests use simulated
  responses; the rerun live SQL ownership suite passes with rollback. UI and
  live authenticated service integration remain separate acceptance tasks.
- Performance advisor: no findings. Security advisor: no table/RLS findings;
  existing [leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
  remains. No paid service or Auth setting was enabled.
- This is database foundation evidence, not a completed Profile screen or
  verified application profile persistence. Future-domain tables remain absent.

References:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase user data and signup triggers](https://supabase.com/docs/guides/auth/managing-user-data)
- [PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Supabase generated TypeScript types](https://supabase.com/docs/guides/api/rest/generating-types)
