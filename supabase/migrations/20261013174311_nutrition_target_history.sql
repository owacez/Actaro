-- Historical diary goals use the target effective on that date.
create table public.nutrition_target_history (
 like public.nutrition_targets including defaults including constraints,
 effective_date date not null check(isfinite(effective_date)),
 primary key(user_id,effective_date),
 foreign key(user_id) references public.profiles(id) on delete cascade
);
alter table public.nutrition_target_history enable row level security;
revoke all on public.nutrition_target_history from public,anon,authenticated;
grant select,insert,update on public.nutrition_target_history to authenticated;
grant select,insert,update,delete on public.nutrition_target_history to service_role;
create policy nutrition_target_history_read on public.nutrition_target_history for select to authenticated using(user_id=(select auth.uid()));
create policy nutrition_target_history_insert on public.nutrition_target_history for insert to authenticated with check(user_id=(select auth.uid()));
create policy nutrition_target_history_update on public.nutrition_target_history for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function private.record_nutrition_target_history()
returns trigger language plpgsql security invoker set search_path='' as $$
declare zone text;
begin
 select time_zone into zone from public.user_preferences where user_id=new.user_id;
 insert into public.nutrition_target_history(user_id,effective_date,calories,protein,carbs,fat,water_ml,created_at,updated_at)
 values(new.user_id,(now() at time zone zone)::date,new.calories,new.protein,new.carbs,new.fat,new.water_ml,new.created_at,new.updated_at)
 on conflict(user_id,effective_date) do update set calories=excluded.calories,protein=excluded.protein,carbs=excluded.carbs,fat=excluded.fat,water_ml=excluded.water_ml,updated_at=excluded.updated_at;
 return new;
end; $$;
revoke all on function private.record_nutrition_target_history() from public,anon,authenticated,service_role;
create trigger nutrition_targets_history after insert or update on public.nutrition_targets for each row execute function private.record_nutrition_target_history();
insert into public.nutrition_target_history(user_id,effective_date,calories,protein,carbs,fat,water_ml,created_at,updated_at)
select targets.user_id,(targets.updated_at at time zone preferences.time_zone)::date,targets.calories,targets.protein,targets.carbs,targets.fat,targets.water_ml,targets.created_at,targets.updated_at
from public.nutrition_targets targets join public.user_preferences preferences on preferences.user_id=targets.user_id;
