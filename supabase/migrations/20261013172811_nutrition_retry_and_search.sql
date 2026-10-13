alter table public.food_logs add column request_food_id uuid,add column request_unit text;
create table public.nutrition_copy_requests (
 id uuid primary key,user_id uuid not null references public.profiles(id) on delete cascade,
 request jsonb not null,entry_count integer not null check(entry_count between 1 and 100)
);
create index nutrition_copy_requests_owner on public.nutrition_copy_requests(user_id,id);
alter table public.nutrition_copy_requests enable row level security;
revoke all on public.nutrition_copy_requests from public,anon,authenticated;
grant select,insert on public.nutrition_copy_requests to authenticated;
grant select,insert,update,delete on public.nutrition_copy_requests to service_role;
create policy nutrition_copy_requests_read on public.nutrition_copy_requests for select to authenticated using(user_id=(select auth.uid()));
create policy nutrition_copy_requests_insert on public.nutrition_copy_requests for insert to authenticated with check(user_id=(select auth.uid()));

create or replace function public.save_food_log(p_user_id uuid,p_id uuid,p_date date,p_time_zone text,p_meal text,p_food_id uuid,p_unit text,p_quantity numeric)
returns uuid language plpgsql security invoker set search_path='' as $$
declare item jsonb; existing public.food_logs;
begin
 perform private.nutrition_actor(p_user_id);
 perform id from public.profiles where id=p_user_id for update;
 select * into existing from public.food_logs where id=p_id and user_id=p_user_id;
 if found then
  if existing.local_date is distinct from p_date or existing.time_zone is distinct from p_time_zone or existing.meal is distinct from p_meal or existing.request_food_id is distinct from p_food_id or existing.request_unit is distinct from p_unit or existing.quantity is distinct from p_quantity then raise exception 'Request ID conflict' using errcode='22023';end if;
  return p_id;
 end if;
 item:=private.food_snapshot(p_food_id,p_unit,p_quantity);
 insert into public.food_logs(id,user_id,local_date,time_zone,meal,food_id,request_food_id,request_unit,food_name,source,source_external_id,base_unit,base_amount,base_calories,base_protein,base_carbs,base_fat,portion_label,portion_amount,quantity)
 values(p_id,p_user_id,p_date,p_time_zone,p_meal,p_food_id,p_food_id,p_unit,item->>'food_name',item->>'source',item->>'source_external_id',item->>'base_unit',(item->>'base_amount')::numeric,(item->>'base_calories')::numeric,(item->>'base_protein')::numeric,(item->>'base_carbs')::numeric,(item->>'base_fat')::numeric,item->>'portion_label',(item->>'portion_amount')::numeric,p_quantity);
 return p_id;
end; $$;

create or replace function public.copy_nutrition(p_user_id uuid,p_id uuid,p_date date,p_time_zone text,p_source_date date default null,p_source_meal text default null,p_saved_meal uuid default null,p_dest_meal text default null)
returns integer language plpgsql security invoker set search_path='' as $$
declare items jsonb;item jsonb;entry public.food_logs;counter integer:=0;food uuid;signature jsonb;previous public.nutrition_copy_requests;
begin
 perform private.nutrition_actor(p_user_id);
 perform id from public.profiles where id=p_user_id for update;
 signature:=jsonb_build_object('date',p_date,'zone',p_time_zone,'source_date',p_source_date,'source_meal',p_source_meal,'saved_meal',p_saved_meal,'dest_meal',p_dest_meal);
 select * into previous from public.nutrition_copy_requests where id=p_id and user_id=p_user_id;
 if found then
  if previous.request<>signature then raise exception 'Copy request ID conflict' using errcode='22023';end if;
  return previous.entry_count;
 end if;
 if (p_source_date is null)=(p_saved_meal is null) or p_id is null then raise exception 'Choose one copy source' using errcode='22023';end if;
 if p_saved_meal is not null then select saved.items into items from public.saved_meals saved where id=p_saved_meal and user_id=p_user_id;
 else select jsonb_agg(to_jsonb(log) order by log.id) into items from public.food_logs log where user_id=p_user_id and local_date=p_source_date and (p_source_meal is null or meal=p_source_meal);end if;
 if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 100 then raise exception 'Copy source empty or too large' using errcode='22023';end if;
 insert into public.nutrition_copy_requests values(p_id,p_user_id,signature,jsonb_array_length(items));
 for item in select value from jsonb_array_elements(items) loop
  entry:=jsonb_populate_record(null::public.food_logs,item);
  select id into food from public.foods where id=entry.food_id;
  insert into public.food_logs(id,user_id,local_date,time_zone,meal,food_id,food_name,source,source_external_id,base_unit,base_amount,base_calories,base_protein,base_carbs,base_fat,portion_label,portion_amount,quantity)
  values(md5(p_id::text||':'||counter::text)::uuid,p_user_id,p_date,p_time_zone,coalesce(p_dest_meal,entry.meal),food,entry.food_name,entry.source,entry.source_external_id,entry.base_unit,entry.base_amount,entry.base_calories,entry.base_protein,entry.base_carbs,entry.base_fat,entry.portion_label,entry.portion_amount,entry.quantity);
  counter:=counter+1;
 end loop;
 return counter;
end; $$;

create or replace function public.search_foods(p_query text default '',p_offset integer default 0,p_mode text default 'Search')
returns setof public.foods language sql stable security invoker set search_path='' as $$
 with query as (select coalesce(string_agg(quote_literal(word)||':*',' & '),'')::tsquery as value from regexp_split_to_table(lower(p_query),'[^[:alnum:]]+') word where word<>'')
 select food.* from public.foods food cross join query
 where auth.uid() is not null and not food.archived and length(p_query)<=200 and p_offset between 0 and 100000
 and (btrim(p_query)='' or to_tsvector('simple',food.name)@@query.value)
 and (p_mode='Search'
  or(p_mode='Favorites' and exists(select 1 from public.food_favorites fav where fav.user_id=(select auth.uid()) and fav.food_id=food.id))
  or(p_mode in ('Recent','Frequent') and exists(select 1 from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id))
  or(p_mode='Custom' and food.user_id=(select auth.uid()) and food.kind='custom')
  or(p_mode='Recipes' and food.user_id=(select auth.uid()) and food.kind='recipe'))
 order by
  case when p_mode='Recent' then(select max(log.created_at) from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id) end desc nulls last,
  case when p_mode='Frequent' then(select count(*) from public.food_logs log where log.user_id=(select auth.uid()) and log.food_id=food.id) end desc,
  food.name,food.id offset greatest(p_offset,0) limit 24;
$$;
