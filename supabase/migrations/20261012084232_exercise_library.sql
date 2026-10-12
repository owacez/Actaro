-- Shared reference catalog; custom user exercises belong to their later task.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160 and name = btrim(name)),
  description text,
  instructions text[] not null check (cardinality(instructions) between 1 and 40
    and array_position(instructions, null) is null and array_position(instructions, '') is null),
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  category text,
  movement_pattern text,
  source text not null check (source in ('repdb', 'system')),
  source_external_id text not null check (char_length(source_external_id) between 1 and 120),
  source_revision text not null check (char_length(source_revision) between 1 and 80),
  license text not null check (char_length(btrim(license)) > 0),
  attribution text not null check (char_length(btrim(attribution)) > 0),
  created_at timestamptz not null default now(),
  unique (source, source_external_id)
);

create table public.exercise_muscles (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_id uuid not null references public.muscles(id) on delete restrict,
  role text not null check (role in ('primary', 'secondary')),
  primary key (exercise_id, muscle_id)
);
create index exercise_muscles_filter_idx on public.exercise_muscles (muscle_id, exercise_id);

create table public.exercise_equipment (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  primary key (exercise_id, equipment_id)
);
create index exercise_equipment_filter_idx on public.exercise_equipment (equipment_id, exercise_id);

alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
alter table public.exercise_equipment enable row level security;
revoke all on public.exercises, public.exercise_muscles, public.exercise_equipment from public, anon, authenticated;
grant select on public.exercises, public.exercise_muscles, public.exercise_equipment to authenticated;
grant select, insert, update, delete on public.exercises, public.exercise_muscles, public.exercise_equipment to service_role;
create policy exercises_read_authenticated on public.exercises for select to authenticated using (true);
create policy exercise_muscles_read_authenticated on public.exercise_muscles for select to authenticated using (true);
create policy exercise_equipment_read_authenticated on public.exercise_equipment for select to authenticated using (true);
