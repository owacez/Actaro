-- v0.3 task 2.1. Planned workouts never own performed facts.
create table public.workout_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index workout_templates_owner_idx on public.workout_templates(user_id, updated_at desc);

create table public.workout_template_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid not null,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position between 0 and 99),
  notes text check (char_length(notes) <= 2000),
  unique (id, user_id),
  unique (template_id, position) deferrable initially immediate,
  foreign key (template_id, user_id) references public.workout_templates(id, user_id) on delete cascade
);
create index workout_template_exercises_owner_idx on public.workout_template_exercises(user_id);
create index workout_template_exercises_catalog_idx on public.workout_template_exercises(exercise_id);

create table public.workout_template_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_exercise_id uuid not null,
  position integer not null check (position between 0 and 99),
  reps integer check (reps between 1 and 1000),
  weight_kg numeric(8,3) check (weight_kg between 0 and 10000),
  rest_seconds integer not null default 90 check (rest_seconds between 0 and 3600),
  rpe numeric(3,1) check (rpe between 1 and 10),
  notes text check (char_length(notes) <= 2000),
  unique (template_exercise_id, position) deferrable initially immediate,
  foreign key (template_exercise_id, user_id) references public.workout_template_exercises(id, user_id) on delete cascade
);
create index workout_template_sets_owner_idx on public.workout_template_sets(user_id);

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_id uuid,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  mode text not null check (mode in ('timed', 'log_only')),
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  started_at timestamptz not null default now() check (isfinite(started_at)),
  ended_at timestamptz check (isfinite(ended_at)),
  local_date date not null check (isfinite(local_date)),
  time_zone text not null check (private.is_valid_time_zone(time_zone)),
  duration_seconds integer check (duration_seconds between 0 and 604800),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (template_id, user_id) references public.workout_templates(id, user_id) on delete set null (template_id),
  check (local_date = (started_at at time zone time_zone)::date),
  check ((status = 'active' and ended_at is null) or (status <> 'active' and ended_at >= started_at)),
  check (status = 'active' or ended_at is not null),
  check (mode <> 'log_only' or duration_seconds is null),
  check (mode <> 'timed' or status <> 'completed' or duration_seconds is not null),
  check (duration_seconds is null or ended_at is null or duration_seconds <= extract(epoch from ended_at - started_at))
);
create index workout_sessions_history_idx on public.workout_sessions(user_id, local_date desc, started_at desc);
create index workout_sessions_template_idx on public.workout_sessions(template_id, user_id);

create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid not null,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null check (position between 0 and 99),
  exercise_name text not null default '',
  primary_muscle_ids uuid[] not null default '{}',
  notes text check (char_length(notes) <= 2000),
  unique (id, user_id),
  unique (session_id, position) deferrable initially immediate,
  foreign key (session_id, user_id) references public.workout_sessions(id, user_id) on delete cascade
);
create index workout_session_exercises_owner_idx on public.workout_session_exercises(user_id);
create index workout_session_exercises_catalog_idx on public.workout_session_exercises(exercise_id);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_exercise_id uuid not null,
  position integer not null check (position between 0 and 99),
  reps integer check (reps between 1 and 1000),
  weight_kg numeric(8,3) check (weight_kg between 0 and 10000),
  rest_seconds integer not null default 90 check (rest_seconds between 0 and 3600),
  rpe numeric(3,1) check (rpe between 1 and 10),
  notes text check (char_length(notes) <= 2000),
  completed_at timestamptz,
  check (completed_at is null or reps is not null),
  unique (session_exercise_id, position) deferrable initially immediate,
  foreign key (session_exercise_id, user_id) references public.workout_session_exercises(id, user_id) on delete cascade
);
create index workout_sets_owner_idx on public.workout_sets(user_id);

-- Capture catalog facts once. Catalog reimports must not rewrite past sessions.
create function private.snapshot_session_exercise()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  select e.name into new.exercise_name from public.exercises e where e.id = new.exercise_id;
  if not found then raise exception 'Exercise unavailable' using errcode = '23503'; end if;
  new.primary_muscle_ids := array(select m.muscle_id from public.exercise_muscles m
    where m.exercise_id = new.exercise_id and m.role = 'primary' order by m.muscle_id);
  return new;
end;
$$;
revoke all on function private.snapshot_session_exercise() from public, anon, authenticated, service_role;
create trigger workout_session_exercise_snapshot before insert on public.workout_session_exercises
for each row execute function private.snapshot_session_exercise();

create trigger workout_templates_touch_updated_at before update on public.workout_templates
for each row execute function private.touch_updated_at();
create trigger workout_sessions_touch_updated_at before update on public.workout_sessions
for each row execute function private.touch_updated_at();

-- Immutable identity/parent links are excluded from client UPDATE grants.
do $$
declare table_name text;
begin
  foreach table_name in array array['workout_templates', 'workout_template_exercises',
    'workout_template_sets', 'workout_sessions', 'workout_session_exercises', 'workout_sets'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, delete on public.%I to authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to service_role', table_name);
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_read', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete', table_name);
  end loop;
end;
$$;
grant insert (id, user_id, name, notes) on public.workout_templates to authenticated;
grant update (name, notes) on public.workout_templates to authenticated;
grant insert (id, user_id, template_id, exercise_id, position, notes) on public.workout_template_exercises to authenticated;
grant update (position, notes) on public.workout_template_exercises to authenticated;
grant insert (id, user_id, template_exercise_id, position, reps, weight_kg, rest_seconds, rpe, notes) on public.workout_template_sets to authenticated;
grant update (position, reps, weight_kg, rest_seconds, rpe, notes) on public.workout_template_sets to authenticated;
grant insert (id, user_id, template_id, name, mode, status, started_at, ended_at, local_date, time_zone, duration_seconds, notes) on public.workout_sessions to authenticated;
grant update (status, ended_at, duration_seconds, notes) on public.workout_sessions to authenticated;
grant insert (id, user_id, session_id, exercise_id, position, notes) on public.workout_session_exercises to authenticated;
grant update (position, notes) on public.workout_session_exercises to authenticated;
grant insert (id, user_id, session_exercise_id, position, reps, weight_kg, rest_seconds, rpe, notes, completed_at) on public.workout_sets to authenticated;
grant update (position, reps, weight_kg, rest_seconds, rpe, notes, completed_at) on public.workout_sets to authenticated;
