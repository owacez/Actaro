create table public.user_equipment (
  user_id uuid not null references public.profiles(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete restrict,
  primary key (user_id, equipment_id)
);
create index user_equipment_equipment_idx on public.user_equipment(equipment_id);
alter table public.user_equipment enable row level security;
revoke all on public.user_equipment from public, anon, authenticated;
grant select, insert, delete on public.user_equipment to authenticated, service_role;
create policy user_equipment_read on public.user_equipment for select to authenticated
using ((select auth.uid()) = user_id);
create policy user_equipment_insert on public.user_equipment for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy user_equipment_delete on public.user_equipment for delete to authenticated
using ((select auth.uid()) = user_id);

create function public.save_equipment_profile(p_equipment_ids uuid[])
returns setof public.user_equipment language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid();
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_equipment_ids is null or cardinality(p_equipment_ids) > 100
    or array_position(p_equipment_ids, null) is not null then
    raise exception 'Invalid equipment selection' using errcode = '22023';
  end if;
  -- Serialize replacements for this account; a failed FK rolls the whole RPC back.
  perform id from public.profiles where id = owner_id for update;
  if not found then raise exception 'Profile unavailable' using errcode = '42501'; end if;
  delete from public.user_equipment where user_id = owner_id;
  insert into public.user_equipment (user_id, equipment_id)
  select owner_id, selected from (select distinct unnest(p_equipment_ids) selected) choices;
  return query select * from public.user_equipment where user_id = owner_id order by equipment_id;
end;
$$;
revoke all on function public.save_equipment_profile(uuid[]) from public, anon;
grant execute on function public.save_equipment_profile(uuid[]) to authenticated;

create function public.search_exercises(
  p_query text default '', p_muscle_id uuid default null, p_equipment_id uuid default null,
  p_bodyweight boolean default false, p_available_only boolean default false,
  p_offset integer default 0, p_limit integer default 24
)
returns table (id uuid, name text, difficulty text, muscles text[], equipment text[],
  thumbnail_path text, total_count bigint)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if p_query is null or char_length(p_query) > 120 or p_offset is null or p_offset not between 0 and 10000
    or p_limit is null or p_limit not between 1 and 100 then
    raise exception 'Invalid search parameters' using errcode = '22023';
  end if;
  return query select e.id, e.name, e.difficulty,
    array(select m.name from public.exercise_muscles em join public.muscles m on m.id = em.muscle_id
      where em.exercise_id = e.id and em.role = 'primary' order by m.name),
    array(select q.name from public.exercise_equipment ee join public.equipment q on q.id = ee.equipment_id
      where ee.exercise_id = e.id order by q.name),
    (select media.storage_path from public.exercise_media media where media.exercise_id = e.id
      order by case media.pose when 'start' then 0 when 'main' then 1 else 2 end limit 1),
    count(*) over()
  from public.exercises e
  where strpos(lower(e.name), lower(btrim(p_query))) > 0
    and (p_muscle_id is null or exists (select 1 from public.exercise_muscles em
      where em.exercise_id = e.id and em.muscle_id = p_muscle_id))
    and (p_equipment_id is null or exists (select 1 from public.exercise_equipment ee
      where ee.exercise_id = e.id and ee.equipment_id = p_equipment_id))
    and (not coalesce(p_bodyweight, false) or not exists
      (select 1 from public.exercise_equipment ee where ee.exercise_id = e.id))
    and (not coalesce(p_available_only, false) or not exists
      (select 1 from public.exercise_equipment ee where ee.exercise_id = e.id and not exists
        (select 1 from public.user_equipment ue where ue.user_id = (select auth.uid())
          and ue.equipment_id = ee.equipment_id)))
  order by lower(e.name), e.id limit p_limit offset p_offset;
end;
$$;
revoke all on function public.search_exercises(text, uuid, uuid, boolean, boolean, integer, integer) from public, anon;
grant execute on function public.search_exercises(text, uuid, uuid, boolean, boolean, integer, integer) to authenticated;
