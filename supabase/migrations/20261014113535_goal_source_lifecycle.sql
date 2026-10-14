create or replace function private.validate_goal_source() returns trigger language plpgsql security invoker set search_path='' as $$
declare kind text;begin
 if tg_op='UPDATE' and new.habit_id is not distinct from old.habit_id and new.metric=old.metric then return new;end if;
 if new.habit_id is not null then
  select h.kind into kind from public.habits h where h.id=new.habit_id and h.user_id=new.user_id and not h.archived;
  if not found or(new.metric='habit_frequency_week' and kind<>'frequency')or(new.metric='habit_completion_week' and kind='frequency') then raise exception 'Choose an active compatible habit' using errcode='22023';end if;
 end if;
 return new;
end;$$;
create or replace function public.save_steps_target(p_user_id uuid,p_target integer)
returns integer language plpgsql security invoker set search_path='' as $$begin
 if auth.uid() is null or auth.uid() is distinct from p_user_id then raise exception 'Account changed' using errcode='42501';end if;
 insert into public.activity_targets(user_id,steps_target)values(p_user_id,p_target)on conflict(user_id)do update set steps_target=excluded.steps_target;
 return p_target;
end;$$;
alter table public.activity_targets add column created_at timestamptz not null default now();
create trigger activity_targets_touch before update on public.activity_targets for each row execute function private.touch_updated_at();
