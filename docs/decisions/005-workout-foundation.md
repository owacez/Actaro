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

References:

- [Supabase grants and RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [PostgreSQL composite foreign keys and selective SET NULL](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)
