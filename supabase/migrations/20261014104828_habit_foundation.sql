create function private.valid_habit_days(days smallint[])
returns boolean language sql immutable security invoker set search_path='' as $$
 select days is not null and cardinality(days) between 1 and 7 and not exists(select 1 from unnest(days) day where day is null or day not between 1 and 7) and cardinality(days)=(select count(distinct day) from unnest(days) day);
$$;
revoke all on function private.valid_habit_days(smallint[]) from public,anon,authenticated;
grant execute on function private.valid_habit_days(smallint[]) to authenticated,service_role;
create table public.habits (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 120),
 kind text not null check(kind in ('boolean','numeric','duration','frequency','avoidance')),
 unit text not null check(length(btrim(unit)) between 1 and 40),
 start_date date not null check(start_date between date '1900-01-01' and date '2100-12-31'),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(id,user_id),
 check((kind='boolean' and unit='done')or(kind='duration' and unit='minutes')or(kind in ('frequency','avoidance') and unit='times')or kind='numeric')
);
create index habits_owner on public.habits(user_id,id);
create table public.habit_versions (
 id uuid primary key default gen_random_uuid(),habit_id uuid not null,user_id uuid not null,
 effective_from date not null check(effective_from between date '1900-01-01' and date '2100-12-31'),
 target numeric not null check(target between 0 and 1000000),
 weekdays smallint[] not null check(private.valid_habit_days(weekdays)),
 end_date date check(end_date between date '1900-01-01' and date '2100-12-31'),
 motivation text not null check(motivation in ('streak','weekly','percentage','none')),
 reminder_time text check(reminder_time~'^([01][0-9]|2[0-3]):[0-5][0-9]$'),
 foreign key(habit_id,user_id) references public.habits(id,user_id) on delete cascade,
 unique(habit_id,effective_from),unique(id,habit_id,user_id)
);
create index habit_versions_owner on public.habit_versions(user_id,habit_id,effective_from);
create table public.habit_logs (
 habit_id uuid not null,user_id uuid not null,local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),version_id uuid not null,
 value numeric not null check(value between 0 and 1000000),notes text check(length(notes)<=2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 primary key(habit_id,local_date),
 foreign key(habit_id,user_id) references public.habits(id,user_id) on delete cascade,
 foreign key(version_id,habit_id,user_id) references public.habit_versions(id,habit_id,user_id)
);
create index habit_logs_owner_date on public.habit_logs(user_id,local_date,habit_id);
create index habit_logs_version_fk on public.habit_logs(version_id,habit_id,user_id);
do $$ declare name text;begin
 foreach name in array array['habits','habit_versions','habit_logs'] loop
  execute format('alter table public.%I enable row level security',name);
  execute format('revoke all on public.%I from public,anon,authenticated',name);
  execute format('grant select,insert on public.%I to authenticated',name);
  execute format('grant select,insert,update,delete on public.%I to service_role',name);
  execute format('create policy %I on public.%I for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',name||'_own',name);
 end loop;
end; $$;
grant update(name,archived) on public.habits to authenticated;
grant update(target,weekdays,end_date,motivation,reminder_time) on public.habit_versions to authenticated;
grant update(version_id,value,notes) on public.habit_logs to authenticated;
grant delete on public.habit_logs to authenticated;
create trigger habits_touch before update on public.habits for each row execute function private.touch_updated_at();
create trigger habit_logs_touch before update on public.habit_logs for each row execute function private.touch_updated_at();
create function private.validate_habit_version()
returns trigger language plpgsql security invoker set search_path='' as $$
declare habit public.habits;
begin
 select * into habit from public.habits where id=new.habit_id and user_id=new.user_id;
 if not found or new.effective_from<habit.start_date or(new.end_date is not null and new.end_date<habit.start_date) or(habit.kind='boolean' and new.target<>1)or(habit.kind<>'avoidance' and new.target<=0)or(habit.kind in ('frequency','avoidance') and new.target<>trunc(new.target)) then raise exception 'Invalid habit settings' using errcode='22023';end if;
 return new;
end; $$;
revoke all on function private.validate_habit_version() from public,anon,authenticated,service_role;
create trigger habit_versions_validate before insert or update on public.habit_versions for each row execute function private.validate_habit_version();
create function private.validate_habit_log()
returns trigger language plpgsql security invoker set search_path='' as $$
declare habit public.habits;version public.habit_versions;
begin
 select * into habit from public.habits where id=new.habit_id and user_id=new.user_id;
 select * into version from public.habit_versions where habit_id=new.habit_id and user_id=new.user_id and effective_from<=new.local_date order by effective_from desc limit 1;
 if habit.id is null or habit.archived or version.id is distinct from new.version_id or new.local_date<habit.start_date or (version.end_date is not null and new.local_date>version.end_date) or new.local_date>(now() at time zone habit.time_zone)::date or(habit.kind='boolean' and new.value not in (0,1)) or(habit.kind in ('frequency','avoidance') and new.value<>trunc(new.value)) then raise exception 'Invalid habit log' using errcode='22023';end if;
 return new;
end; $$;
revoke all on function private.validate_habit_log() from public,anon,authenticated,service_role;
create trigger habit_logs_validate before insert or update on public.habit_logs for each row execute function private.validate_habit_log();
create function public.save_habit(p_user_id uuid,p_id uuid,p_name text,p_kind text,p_unit text,p_start date,p_zone text,p_target numeric,p_days smallint[],p_motivation text,p_end date default null,p_reminder text default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare previous public.habits;effective date;
begin
 if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Account changed' using errcode='42501';end if;
 perform id from public.profiles where id=p_user_id for update;
 select * into previous from public.habits where id=p_id and user_id=p_user_id;
 if found then
  if previous.archived or previous.kind<>p_kind or previous.unit<>btrim(p_unit) or previous.start_date<>p_start or previous.time_zone<>p_zone then raise exception 'Habit type, unit, start and zone are fixed; create another habit' using errcode='22023';end if;
  effective:=greatest(p_start,(now() at time zone p_zone)::date);
  if p_end is not null and p_end<effective then raise exception 'End cannot precede this change' using errcode='22023';end if;
  update public.habits set name=btrim(p_name) where id=p_id and user_id=p_user_id;
 else
  insert into public.habits(id,user_id,name,kind,unit,start_date,time_zone) values(p_id,p_user_id,btrim(p_name),p_kind,btrim(p_unit),p_start,p_zone);
  effective:=p_start;
 end if;
 insert into public.habit_versions(habit_id,user_id,effective_from,target,weekdays,end_date,motivation,reminder_time)
 values(p_id,p_user_id,effective,p_target,p_days,p_end,p_motivation,p_reminder)
 on conflict(habit_id,effective_from) do update set target=excluded.target,weekdays=excluded.weekdays,end_date=excluded.end_date,motivation=excluded.motivation,reminder_time=excluded.reminder_time;
 return p_id;
end; $$;
revoke all on function public.save_habit(uuid,uuid,text,text,text,date,text,numeric,smallint[],text,date,text) from public,anon,authenticated;
grant execute on function public.save_habit(uuid,uuid,text,text,text,date,text,numeric,smallint[],text,date,text) to authenticated;
create function public.log_habit(p_user_id uuid,p_habit_id uuid,p_date date,p_value numeric,p_notes text default '')
returns date language plpgsql security invoker set search_path='' as $$
declare version uuid;
begin
 if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Account changed' using errcode='42501';end if;
 select id into version from public.habit_versions where habit_id=p_habit_id and user_id=p_user_id and effective_from<=p_date order by effective_from desc limit 1;
 insert into public.habit_logs(habit_id,user_id,local_date,version_id,value,notes) values(p_habit_id,p_user_id,p_date,version,p_value,nullif(btrim(p_notes),''))
 on conflict(habit_id,local_date) do update set version_id=excluded.version_id,value=excluded.value,notes=excluded.notes;
 return p_date;
end; $$;
revoke all on function public.log_habit(uuid,uuid,date,numeric,text) from public,anon,authenticated;
grant execute on function public.log_habit(uuid,uuid,date,numeric,text) to authenticated;
