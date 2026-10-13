create table public.training_splits (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 100),
 is_active boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(id,user_id)
);
create unique index training_splits_active_owner_idx on public.training_splits(user_id) where is_active;
create index training_splits_owner_idx on public.training_splits(user_id,updated_at desc);
create table public.training_split_days (
 split_id uuid not null,
 user_id uuid not null references public.profiles(id) on delete cascade,
 weekday integer not null check(weekday between 0 and 6),
 is_rest boolean not null,
 workout_id uuid,
 primary key(split_id,weekday),
 check(not(is_rest and workout_id is not null)),
 foreign key(split_id,user_id) references public.training_splits(id,user_id) on delete cascade,
 foreign key(workout_id,user_id) references public.workout_templates(id,user_id) on delete set null(workout_id)
);
create index training_split_days_owner_idx on public.training_split_days(user_id,split_id);
create index training_split_days_workout_idx on public.training_split_days(workout_id,user_id);
create trigger training_splits_touch before update on public.training_splits
for each row execute function private.touch_updated_at();
do $$ declare t text; begin
 foreach t in array array['training_splits','training_split_days'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select,delete on public.%I to authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to service_role',t);
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid())=user_id)',t||'_read',t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid())=user_id)',t||'_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t||'_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid())=user_id)',t||'_delete',t);
 end loop;
end; $$;
grant insert(id,user_id,name,is_active),update(name,is_active) on public.training_splits to authenticated;
grant insert(split_id,user_id,weekday,is_rest,workout_id) on public.training_split_days to authenticated;
create function public.save_training_split(p_id uuid,p_name text,p_is_active boolean,p_days jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:=auth.uid(); saved uuid; day jsonb; day_index integer:=0;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_id is null or p_name is null or char_length(btrim(p_name)) not between 1 and 100 or p_is_active is null
  or jsonb_typeof(p_days) is distinct from 'array' then raise exception 'Invalid split' using errcode='22023'; end if;
 if jsonb_array_length(p_days)<>7 then raise exception 'Choose seven days' using errcode='22023'; end if;
 -- Serialize this owner's active selection; the unique index is the final guard.
 perform id from public.profiles where id=owner_id for update;
 if p_is_active then update public.training_splits set is_active=false where user_id=owner_id and is_active; end if;
 insert into public.training_splits(id,user_id,name,is_active) values(p_id,owner_id,btrim(p_name),p_is_active)
 on conflict(id) do update set name=excluded.name,is_active=excluded.is_active
 where training_splits.user_id=owner_id returning id into saved;
 if saved is null then raise exception 'Split unavailable' using errcode='42501'; end if;
 delete from public.training_split_days where split_id=saved and user_id=owner_id;
 for day in select value from jsonb_array_elements(p_days) loop
  if jsonb_typeof(day) is distinct from 'object' or jsonb_typeof(day->'is_rest') is distinct from 'boolean'
   or ((day->>'is_rest')::boolean and day->>'workout_id' is not null)
   or (not (day->>'is_rest')::boolean and day->>'workout_id' is null) then
   raise exception 'Choose a workout or rest for every day' using errcode='22023';
  end if;
  insert into public.training_split_days(split_id,user_id,weekday,is_rest,workout_id)
  values(saved,owner_id,day_index,(day->>'is_rest')::boolean,(day->>'workout_id')::uuid);
  day_index:=day_index+1;
 end loop;
 return saved;
end; $$;
revoke all on function public.save_training_split(uuid,text,boolean,jsonb) from public,anon,authenticated;
grant execute on function public.save_training_split(uuid,text,boolean,jsonb) to authenticated;
