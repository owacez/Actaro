-- v0.5: recorded body/activity facts and measurable owned goals.
create table public.body_weights (
 user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),
 weight_kg numeric not null check(weight_kg>0 and weight_kg<=1000),
 time_zone text not null check(private.is_valid_time_zone(time_zone)), notes text check(length(notes)<=2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,local_date)
);
create table public.body_measurements (
 user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),
 measurement text not null check(measurement=lower(btrim(measurement)) and length(measurement) between 1 and 80),
 value_cm numeric not null check(value_cm>0 and value_cm<=1000),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),notes text check(length(notes)<=2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,measurement,local_date)
);
create index body_measurements_owner_date on public.body_measurements(user_id,local_date);
create table public.activity_targets (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 steps_target integer not null check(steps_target between 1 and 1000000),
 updated_at timestamptz not null default now()
);
create table public.daily_activity (
 user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),
 steps integer check(steps between 0 and 1000000),distance_km numeric check(distance_km between 0 and 1000),
 steps_source text check(steps_source in ('manual','ios_pedometer')),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),primary key(user_id,local_date),
 check(steps is not null or distance_km is not null),check((steps is null)=(steps_source is null))
);
create table public.goals (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 120),
 metric text not null check(metric in ('body_weight','body_measurement','workouts_week','lift_weight','exercise_pr','steps_day','distance_day','active_days_week','calories_day','protein_day','macro_adherence_day','habit_completion_week','habit_frequency_week')),
 baseline numeric not null check(baseline between 0 and 1000000),target numeric not null check(target>0 and target<=1000000),
 direction text not null check(direction in ('at_least','at_most')),tolerance numeric not null default 10 check(tolerance between 0 and 100),
 start_date date not null check(start_date between date '1900-01-01' and date '2100-12-31'),
 end_date date check(end_date between start_date and date '2100-12-31'),time_zone text not null check(private.is_valid_time_zone(time_zone)),
 habit_id uuid,exercise_id uuid references public.exercises(id) on delete restrict,
 measurement text check(measurement=lower(btrim(measurement)) and length(measurement) between 1 and 80),archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 foreign key(habit_id,user_id) references public.habits(id,user_id) on delete restrict,
 check((metric in ('habit_completion_week','habit_frequency_week'))=(habit_id is not null)),
 check((metric in ('lift_weight','exercise_pr'))=(exercise_id is not null)),
 check((metric='body_measurement')=(measurement is not null)),
 check(metric not in ('macro_adherence_day','habit_completion_week') or(target<=100 and baseline<=100)),
 check(metric<>'active_days_week' or(target<=7 and baseline<=7)),
 check(metric not in ('steps_day','workouts_week','active_days_week','habit_frequency_week') or(target=trunc(target) and baseline=trunc(baseline))),
 check((direction='at_least' and target>baseline)or(direction='at_most' and target<baseline)),
 check(metric not in ('workouts_week','lift_weight','exercise_pr','steps_day','distance_day','active_days_week','protein_day','macro_adherence_day','habit_completion_week','habit_frequency_week') or direction='at_least')
);
create index goals_owner on public.goals(user_id,archived,id);
create index goals_habit_fk on public.goals(habit_id,user_id);
create index goals_exercise_fk on public.goals(exercise_id);
do $$ declare t text;begin
 foreach t in array array['body_weights','body_measurements','activity_targets','daily_activity','goals'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,insert,delete on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('create policy %I on public.%I for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',t||'_own',t);
 end loop;
end;$$;
grant update(weight_kg,time_zone,notes) on public.body_weights to authenticated;
grant update(value_cm,time_zone,notes) on public.body_measurements to authenticated;
grant update(steps_target) on public.activity_targets to authenticated;
grant update(steps,distance_km,steps_source,time_zone) on public.daily_activity to authenticated;
grant update(name,metric,baseline,target,direction,tolerance,start_date,end_date,time_zone,habit_id,exercise_id,measurement,archived) on public.goals to authenticated;
create function private.validate_recorded_day() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.local_date>(now() at time zone new.time_zone)::date then raise exception 'Cannot log a future date' using errcode='22023';end if;
 return new;
end;$$;
revoke all on function private.validate_recorded_day() from public,anon,authenticated,service_role;
do $$ declare t text;begin
 foreach t in array array['body_weights','body_measurements','daily_activity'] loop
  execute format('create trigger %I before insert or update on public.%I for each row execute function private.validate_recorded_day()',t||'_validate',t);
  execute format('create trigger %I before update on public.%I for each row execute function private.touch_updated_at()',t||'_touch',t);
 end loop;
end;$$;
create trigger goals_touch before update on public.goals for each row execute function private.touch_updated_at();
create function private.validate_goal_source() returns trigger language plpgsql security invoker set search_path='' as $$
declare kind text;begin
 if new.habit_id is not null then
  select h.kind into kind from public.habits h where h.id=new.habit_id and h.user_id=new.user_id and not h.archived;
  if not found or(new.metric='habit_frequency_week' and kind<>'frequency')or(new.metric='habit_completion_week' and kind='frequency') then raise exception 'Choose an active compatible habit' using errcode='22023';end if;
 end if;
 return new;
end;$$;
revoke all on function private.validate_goal_source() from public,anon,authenticated,service_role;
create trigger goals_validate before insert or update on public.goals for each row execute function private.validate_goal_source();
