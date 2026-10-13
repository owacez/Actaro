create function private.nutrition_actor(p_user_id uuid)
returns void language plpgsql stable security invoker set search_path='' as $$
begin if auth.uid() is null or p_user_id is distinct from auth.uid() then raise exception 'Account changed' using errcode='42501';end if;end; $$;
revoke all on function private.nutrition_actor(uuid) from public,anon,authenticated;
grant execute on function private.nutrition_actor(uuid) to authenticated;

create function private.food_snapshot(p_food_id uuid,p_unit text,p_quantity numeric)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare food public.foods; amount numeric; label text; portion jsonb; factor numeric;
begin
 select * into food from public.foods where id=p_food_id and not archived;
 if not found then raise exception 'Food unavailable' using errcode='22023';end if;
 if p_quantity is null or p_quantity not between 0.000001 and 100000 then raise exception 'Invalid quantity' using errcode='22023';end if;
 if p_unit=food.base_unit then amount:=1;label:=p_unit;
 elsif p_unit='oz' and food.base_unit='g' then amount:=28.349523125;label:='oz';
 elsif p_unit~'^[0-9]{1,2}$' then
  portion:=food.portions->p_unit::integer; amount:=(portion->>'amount')::numeric;label:=portion->>'label';
 else raise exception 'Unsupported unit' using errcode='22023';end if;
 if amount is null or amount*p_quantity>100000 then raise exception 'Invalid portion' using errcode='22023';end if;
 factor:=amount*p_quantity/food.base_amount;
 return jsonb_build_object('food_id',food.id,'food_name',food.name,'source',food.source,'source_external_id',food.source_external_id,
  'base_unit',food.base_unit,'base_amount',food.base_amount,'base_calories',food.calories,'base_protein',food.protein,'base_carbs',food.carbs,'base_fat',food.fat,
  'portion_label',label,'portion_amount',amount,'quantity',p_quantity,
  'calories',food.calories*factor,'protein',food.protein*factor,'carbs',food.carbs*factor,'fat',food.fat*factor);
end; $$;
revoke all on function private.food_snapshot(uuid,text,numeric) from public,anon,authenticated;
grant execute on function private.food_snapshot(uuid,text,numeric) to authenticated;

create function public.save_food_log(p_user_id uuid,p_id uuid,p_date date,p_time_zone text,p_meal text,p_food_id uuid,p_unit text,p_quantity numeric)
returns uuid language plpgsql security invoker set search_path='' as $$
declare item jsonb;
begin
 perform private.nutrition_actor(p_user_id); item:=private.food_snapshot(p_food_id,p_unit,p_quantity);
 insert into public.food_logs(id,user_id,local_date,time_zone,meal,food_id,food_name,source,source_external_id,base_unit,base_amount,base_calories,base_protein,base_carbs,base_fat,portion_label,portion_amount,quantity)
 values(p_id,p_user_id,p_date,p_time_zone,p_meal,p_food_id,item->>'food_name',item->>'source',item->>'source_external_id',item->>'base_unit',(item->>'base_amount')::numeric,(item->>'base_calories')::numeric,(item->>'base_protein')::numeric,(item->>'base_carbs')::numeric,(item->>'base_fat')::numeric,item->>'portion_label',(item->>'portion_amount')::numeric,p_quantity)
 on conflict(id) do nothing;
 -- An existing retry ID must belong to this account and the exact same request.
 if not exists(select 1 from public.food_logs where id=p_id and user_id=p_user_id and local_date=p_date and time_zone=p_time_zone and meal=p_meal and food_id=p_food_id and quantity=p_quantity and portion_label=item->>'portion_label' and portion_amount=(item->>'portion_amount')::numeric) then raise exception 'Request ID conflict' using errcode='22023';end if;
 return p_id;
end; $$;
revoke all on function public.save_food_log(uuid,uuid,date,text,text,uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.save_food_log(uuid,uuid,date,text,text,uuid,text,numeric) to authenticated;

create function public.save_recipe(p_user_id uuid,p_id uuid,p_name text,p_ingredients jsonb,p_servings numeric,p_cooked_weight numeric default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare ingredient jsonb; snapshot jsonb; snapshots jsonb:='[]';energy numeric:=0;protein_total numeric:=0;carbs_total numeric:=0;fat_total numeric:=0;divisor numeric;portions jsonb;
begin
 perform private.nutrition_actor(p_user_id);
 if p_ingredients is null or jsonb_typeof(p_ingredients)<>'array' or jsonb_array_length(p_ingredients) not between 1 and 100 or p_servings is null or p_servings not between 0.000001 and 10000 or (p_cooked_weight is not null and p_cooked_weight not between 0.000001 and 100000) then raise exception 'Invalid recipe' using errcode='22023';end if;
 for ingredient in select value from jsonb_array_elements(p_ingredients) loop
  if (ingredient->>'food_id')::uuid=p_id then raise exception 'Recipe cannot include itself' using errcode='22023';end if;
  snapshot:=private.food_snapshot((ingredient->>'food_id')::uuid,ingredient->>'unit',(ingredient->>'quantity')::numeric);
  snapshots:=snapshots||jsonb_build_array(snapshot);
  energy:=energy+(snapshot->>'calories')::numeric;protein_total:=protein_total+(snapshot->>'protein')::numeric;carbs_total:=carbs_total+(snapshot->>'carbs')::numeric;fat_total:=fat_total+(snapshot->>'fat')::numeric;
 end loop;
 divisor:=coalesce(p_cooked_weight/100,p_servings);
 portions:=case when p_cooked_weight is null then '[]'::jsonb else jsonb_build_array(jsonb_build_object('label','1 serving','unit','serving','amount',p_cooked_weight/p_servings)) end;
 insert into public.foods(id,user_id,name,kind,source,base_unit,base_amount,calories,protein,carbs,fat,portions,ingredients,recipe_servings,cooked_weight_g)
 values(p_id,p_user_id,btrim(p_name),'recipe','user',case when p_cooked_weight is null then 'serving' else 'g' end,case when p_cooked_weight is null then 1 else 100 end,energy/divisor,protein_total/divisor,carbs_total/divisor,fat_total/divisor,portions,snapshots,p_servings,p_cooked_weight)
 on conflict(id) do update set name=excluded.name,base_unit=excluded.base_unit,base_amount=excluded.base_amount,calories=excluded.calories,protein=excluded.protein,carbs=excluded.carbs,fat=excluded.fat,portions=excluded.portions,ingredients=excluded.ingredients,recipe_servings=excluded.recipe_servings,cooked_weight_g=excluded.cooked_weight_g
 where foods.user_id=p_user_id and foods.kind='recipe';
 if not found then raise exception 'Recipe unavailable' using errcode='22023';end if;
 return p_id;
end; $$;
revoke all on function public.save_recipe(uuid,uuid,text,jsonb,numeric,numeric) from public,anon,authenticated;
grant execute on function public.save_recipe(uuid,uuid,text,jsonb,numeric,numeric) to authenticated;

create function public.save_meal(p_user_id uuid,p_id uuid,p_name text,p_date date,p_meal text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare items jsonb;
begin
 perform private.nutrition_actor(p_user_id);
 select jsonb_agg(to_jsonb(log) order by log.id) into items from public.food_logs log where user_id=p_user_id and local_date=p_date and meal=p_meal;
 if items is null then raise exception 'Log foods before saving a meal' using errcode='22023';end if;
 insert into public.saved_meals(id,user_id,name,items) values(p_id,p_user_id,btrim(p_name),items)
 on conflict(id) do update set name=excluded.name,items=excluded.items where saved_meals.user_id=p_user_id;
 return p_id;
end; $$;
revoke all on function public.save_meal(uuid,uuid,text,date,text) from public,anon,authenticated;
grant execute on function public.save_meal(uuid,uuid,text,date,text) to authenticated;

create function public.copy_nutrition(p_user_id uuid,p_id uuid,p_date date,p_time_zone text,p_source_date date default null,p_source_meal text default null,p_saved_meal uuid default null,p_dest_meal text default null)
returns integer language plpgsql security invoker set search_path='' as $$
declare items jsonb;item jsonb;entry public.food_logs;counter integer:=0;food uuid;
begin
 perform private.nutrition_actor(p_user_id);
 if (p_source_date is null)=(p_saved_meal is null) or p_id is null then raise exception 'Choose one copy source' using errcode='22023';end if;
 if p_saved_meal is not null then
  select saved.items into items from public.saved_meals saved where id=p_saved_meal and user_id=p_user_id;
 else
  select jsonb_agg(to_jsonb(log) order by log.id) into items from public.food_logs log where user_id=p_user_id and local_date=p_source_date and (p_source_meal is null or meal=p_source_meal);
 end if;
 if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 100 then raise exception 'Copy source empty or too large' using errcode='22023';end if;
 for item in select value from jsonb_array_elements(items) loop
  entry:=jsonb_populate_record(null::public.food_logs,item);
  select id into food from public.foods where id=entry.food_id;
  insert into public.food_logs(id,user_id,local_date,time_zone,meal,food_id,food_name,source,source_external_id,base_unit,base_amount,base_calories,base_protein,base_carbs,base_fat,portion_label,portion_amount,quantity)
  values(md5(p_id::text||':'||counter::text)::uuid,p_user_id,p_date,p_time_zone,coalesce(p_dest_meal,entry.meal),food,entry.food_name,entry.source,entry.source_external_id,entry.base_unit,entry.base_amount,entry.base_calories,entry.base_protein,entry.base_carbs,entry.base_fat,entry.portion_label,entry.portion_amount,entry.quantity)
  on conflict(id) do nothing;
  counter:=counter+1;
 end loop;
 return counter;
end; $$;
revoke all on function public.copy_nutrition(uuid,uuid,date,text,date,text,uuid,text) from public,anon,authenticated;
grant execute on function public.copy_nutrition(uuid,uuid,date,text,date,text,uuid,text) to authenticated;

create function public.search_foods(p_query text default '',p_offset integer default 0,p_mode text default 'Search')
returns setof public.foods language sql stable security invoker set search_path='' as $$
 select food.* from public.foods food
 where not food.archived and length(p_query)<=200 and p_offset between 0 and 100000
 and (btrim(p_query)='' or to_tsvector('simple',food.name)@@plainto_tsquery('simple',p_query))
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
revoke all on function public.search_foods(text,integer,text) from public,anon,authenticated;
grant execute on function public.search_foods(text,integer,text) to authenticated;
