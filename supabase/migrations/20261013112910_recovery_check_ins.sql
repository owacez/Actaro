create table public.recovery_check_ins (
 user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(isfinite(local_date)),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),
 energy integer not null check(energy between 1 and 3),
 soreness integer not null check(soreness between 0 and 3),
 sleep_quality integer not null check(sleep_quality between 1 and 3),
 stress integer check(stress between 1 and 3),
 notes text check(char_length(notes)<=2000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 primary key(user_id,local_date),
 check(local_date=(created_at at time zone time_zone)::date)
);
alter table public.recovery_check_ins enable row level security;
revoke all on public.recovery_check_ins from public,anon,authenticated;
grant select,delete on public.recovery_check_ins to authenticated;
grant insert(user_id,local_date,time_zone,energy,soreness,sleep_quality,stress,notes) on public.recovery_check_ins to authenticated;
grant update(energy,soreness,sleep_quality,stress,notes) on public.recovery_check_ins to authenticated;
grant select,insert,update,delete on public.recovery_check_ins to service_role;
create policy recovery_check_ins_read on public.recovery_check_ins for select to authenticated using((select auth.uid())=user_id);
create policy recovery_check_ins_insert on public.recovery_check_ins for insert to authenticated with check((select auth.uid())=user_id);
create policy recovery_check_ins_update on public.recovery_check_ins for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy recovery_check_ins_delete on public.recovery_check_ins for delete to authenticated using((select auth.uid())=user_id);
create trigger recovery_check_ins_touch before update on public.recovery_check_ins for each row execute function private.touch_updated_at();
create function public.save_recovery_check(p_date date,p_time_zone text,p_energy integer,p_soreness integer,p_sleep integer,p_stress integer default null,p_notes text default '')
returns date language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_date is null or not private.is_valid_time_zone(p_time_zone) or p_date<>(now() at time zone p_time_zone)::date then raise exception 'Only today can be checked in; reload after a date change' using errcode='22023';end if;
 insert into public.recovery_check_ins(user_id,local_date,time_zone,energy,soreness,sleep_quality,stress,notes)
 values(auth.uid(),p_date,p_time_zone,p_energy,p_soreness,p_sleep,p_stress,nullif(btrim(p_notes),''))
 on conflict(user_id,local_date) do update set energy=excluded.energy,soreness=excluded.soreness,sleep_quality=excluded.sleep_quality,stress=excluded.stress,notes=excluded.notes;
 return p_date;
end; $$;
revoke all on function public.save_recovery_check(date,text,integer,integer,integer,integer,text) from public,anon,authenticated;
grant execute on function public.save_recovery_check(date,text,integer,integer,integer,integer,text) to authenticated;
