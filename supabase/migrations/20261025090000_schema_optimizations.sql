-- Schema optimizations from the 2026-10-25 database review. No table is removed: every table
-- is used by the app, a database function or a foreign key.

-- 1. Time-zone validation. The CHECK on 12 tables called a function that read the whole
--    pg_timezone_names view on every row (about 14 ms per call when measured). The same
--    function now reads a small indexed table, so every CHECK keeps its meaning.
create table private.time_zones (name text primary key);
insert into private.time_zones select name from pg_catalog.pg_timezone_names on conflict do nothing;
revoke all on private.time_zones from public, anon, authenticated;
grant select on private.time_zones to authenticated, service_role;

create or replace function private.is_valid_time_zone(zone_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (select 1 from private.time_zones where name = zone_name);
$$;

-- Adds zones from newer time-zone data after a Postgres upgrade. Existing zones are kept so
-- stored records stay valid. Run as an administrator: select private.refresh_time_zones();
create function private.refresh_time_zones()
returns integer
language sql
security invoker
set search_path = ''
as $$
  with added as (
    insert into private.time_zones select name from pg_catalog.pg_timezone_names
    on conflict do nothing returning 1
  )
  select count(*)::integer from added;
$$;
revoke all on function private.refresh_time_zones() from public, anon, authenticated;
grant execute on function private.refresh_time_zones() to service_role;

-- 2. Redundant indexes: habit_id leads an existing unique key on both tables, which already
--    serves the composite foreign-key checks.
drop index public.habit_logs_habit_owner_fk;     -- covered by primary key (habit_id, local_date)
drop index public.habit_versions_habit_owner_fk; -- covered by unique (habit_id, effective_from)

-- 3. Per-exercise history (strength progression, PRs, "last time" while logging) filters a
--    user's logged exercises by exercise; previously only (user_id, session_id) existed.
create index workout_session_exercises_owner_exercise_idx
  on public.workout_session_exercises (user_id, exercise_id);

-- 4. Read-only reporting functions: none writes, so they can be planned as stable.
alter function public.get_exercise_performance(uuid[], timestamptz, uuid) stable;
alter function public.get_training_history(integer, text, text) stable;
alter function public.get_training_overview(date, date) stable;
alter function public.get_training_plans(text, text, integer, boolean) stable;

-- 5. Copy-request ledger: it exists only so a retried copy is not applied twice. Rows now
--    record when they were made, and a user's rows older than 30 days are removed as new
--    ones arrive, so the ledger no longer grows without bound.
alter table public.nutrition_copy_requests add column created_at timestamptz not null default now();
create function private.prune_nutrition_copy_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.nutrition_copy_requests
  where user_id = new.user_id and created_at < now() - interval '30 days';
  return null;
end;
$$;
revoke all on function private.prune_nutrition_copy_requests() from public, anon, authenticated;
create trigger nutrition_copy_requests_prune
  after insert on public.nutrition_copy_requests
  for each row execute function private.prune_nutrition_copy_requests();
create index nutrition_copy_requests_owner_age on public.nutrition_copy_requests (user_id, created_at);
drop index public.nutrition_copy_requests_owner; -- (user_id, id): id is already the primary key
