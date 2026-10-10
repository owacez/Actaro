-- v0.1 only: private profiles and initial preferences. Auth owns credentials.
create schema private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create function private.is_valid_time_zone(zone_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_timezone_names where name = zone_name
  );
$$;
revoke all on function private.is_valid_time_zone(text) from public, anon, authenticated;
grant execute on function private.is_valid_time_zone(text) to authenticated, service_role;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_check check (
    display_name is null or (
      char_length(display_name) between 1 and 80
      and display_name !~ '^[[:space:]]*$'
    )
  )
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  time_zone text not null default 'UTC',
  weight_unit text not null default 'kg' check (weight_unit in ('kg', 'lb')),
  length_unit text not null default 'cm' check (length_unit in ('cm', 'in')),
  distance_unit text not null default 'km' check (distance_unit in ('km', 'mi')),
  energy_unit text not null default 'kcal' check (energy_unit in ('kcal', 'kJ')),
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  notifications_enabled boolean not null default false,
  gamification_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preferences_time_zone_check check (private.is_valid_time_zone(time_zone))
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;

revoke all on table public.profiles, public.user_preferences from public, anon, authenticated;
grant select on table public.profiles, public.user_preferences to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant update (
  time_zone, weight_unit, length_unit, distance_unit, energy_unit, theme,
  notifications_enabled, gamification_enabled
) on table public.user_preferences to authenticated;
grant select, insert, update, delete on table public.profiles, public.user_preferences to service_role;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy user_preferences_select_own on public.user_preferences
for select to authenticated using ((select auth.uid()) = user_id);
create policy user_preferences_update_own on public.user_preferences
for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public, anon, authenticated, service_role;

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function private.touch_updated_at();
create trigger user_preferences_touch_updated_at before update on public.user_preferences
for each row execute function private.touch_updated_at();

-- Auth inserts can occur without a caller JWT. Ownership comes solely from
-- auth.users NEW.id; no user-editable metadata is trusted. This private trigger
-- needs definer privileges to write across schemas and is not a client RPC.
create function private.initialize_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_schema <> 'auth' or tg_table_name <> 'users' or tg_op <> 'INSERT' then
    raise exception 'Invalid profile initialization trigger';
  end if;
  insert into public.profiles (id) values (new.id);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;
revoke all on function private.initialize_user_profile() from public, anon, authenticated, service_role;

create trigger actaro_initialize_user_profile after insert on auth.users
for each row execute function private.initialize_user_profile();

-- Confirmed existing account count was inspected before deployment. No identity
-- values are hardcoded, and no existing Auth data is modified.
insert into public.profiles (id)
select id from auth.users where email_confirmed_at is not null;
insert into public.user_preferences (user_id)
select id from public.profiles;

-- Atomic signup-trigger smoke test: failure aborts the migration. The generated
-- fixture is removed, including cascaded records; no email is sent.
do $$
declare
  fixture_id uuid := gen_random_uuid();
begin
  insert into auth.users (id) values (fixture_id);
  if not exists (
    select 1 from public.profiles p join public.user_preferences s on s.user_id = p.id
    where p.id = fixture_id and s.time_zone = 'UTC' and s.weight_unit = 'kg'
  ) then
    raise exception 'Profile initialization smoke test failed';
  end if;
  delete from auth.users where id = fixture_id;
  if exists (select 1 from public.profiles where id = fixture_id)
    or exists (select 1 from public.user_preferences where user_id = fixture_id) then
    raise exception 'Profile cascade smoke test failed';
  end if;
end;
$$;
