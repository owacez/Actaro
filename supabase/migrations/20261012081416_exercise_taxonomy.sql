-- v0.2 shared reference data. Dataset mapping/import is a separate task.
-- UUIDs identify rows; stable slugs support repeatable imports without new IDs.
create table public.muscles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  constraint muscles_slug_check check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint muscles_name_check check (
    char_length(name) between 1 and 120
    and name = btrim(name) and name !~ '^[[:space:]]*$'
  )
);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now(),
  constraint equipment_slug_check check (
    char_length(slug) between 1 and 80
    and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  constraint equipment_name_check check (
    char_length(name) between 1 and 120
    and name = btrim(name) and name !~ '^[[:space:]]*$'
  )
);

alter table public.muscles enable row level security;
alter table public.equipment enable row level security;

revoke all on table public.muscles, public.equipment from public, anon, authenticated;
grant select on table public.muscles, public.equipment to authenticated;
grant select, insert, update, delete on table public.muscles, public.equipment to service_role;

-- These catalogs are shared, not user-owned rows. Clients can read, never edit.
-- Trusted imports use an administrative context; no privileged key enters Expo.
create policy muscles_read_authenticated on public.muscles
for select to authenticated using (true);
create policy equipment_read_authenticated on public.equipment
for select to authenticated using (true);
