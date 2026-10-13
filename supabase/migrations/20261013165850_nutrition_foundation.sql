-- Manual nutrition only. Shared reference foods; all personal data stays owned.
create function private.valid_food_portions(items jsonb)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare item jsonb;
begin
 if items is null or jsonb_typeof(items)<>'array' or jsonb_array_length(items)>80 then return false; end if;
 for item in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(item)<>'object' or coalesce(length(item->>'label'),0) not between 1 and 160
   or coalesce(item->>'unit','') not in ('serving','piece','slice','cup','tbsp','tsp','ml')
   or jsonb_typeof(item->'amount')<>'number' or (item->>'amount')::numeric not between 0.000001 and 100000 then return false;end if;
 end loop;
 return true;
exception when others then return false;
end; $$;
revoke all on function private.valid_food_portions(jsonb) from public,anon,authenticated;
grant execute on function private.valid_food_portions(jsonb) to authenticated,service_role;

create table public.foods (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 200),
 brand text check(length(brand)<=160),
 kind text not null check(kind in ('reference','custom','recipe')),
 source text not null check(source in ('usda_sr_legacy','user')),
 source_external_id text, source_revision text, license text, attribution text,
 base_unit text not null check(base_unit in ('g','ml','serving')),
 base_amount numeric not null check(base_amount between 0.000001 and 100000),
 calories numeric not null check(calories between 0 and 100000),
 protein numeric not null check(protein between 0 and 100000),
 carbs numeric not null check(carbs between 0 and 100000),
 fat numeric not null check(fat between 0 and 100000),
 portions jsonb not null default '[]' check(private.valid_food_portions(portions)),
 ingredients jsonb not null default '[]' check(jsonb_typeof(ingredients)='array' and jsonb_array_length(ingredients)<=100),
 recipe_servings numeric check(recipe_servings between 0.000001 and 10000),
 cooked_weight_g numeric check(cooked_weight_g between 0.000001 and 100000),
 archived boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((user_id is null and kind='reference' and source='usda_sr_legacy' and source_external_id is not null and license='CC0-1.0' and attribution is not null)
  or(user_id is not null and kind in ('custom','recipe') and source='user' and source_external_id is null)),
 check((kind='recipe' and recipe_servings is not null and jsonb_array_length(ingredients)>0)
  or(kind<>'recipe' and recipe_servings is null and cooked_weight_g is null and ingredients='[]'::jsonb)),
 unique(source,source_external_id)
);
create index foods_owner on public.foods(user_id,id);
create index foods_search on public.foods using gin(to_tsvector('simple',name));
alter table public.foods enable row level security;
revoke all on public.foods from public,anon,authenticated;
grant select,insert,update,delete on public.foods to authenticated,service_role;
create policy foods_read on public.foods for select to authenticated using(user_id is null or user_id=(select auth.uid()));
create policy foods_insert on public.foods for insert to authenticated with check(user_id=(select auth.uid()) and source='user');
create policy foods_update on public.foods for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and source='user');
create policy foods_delete on public.foods for delete to authenticated using(user_id=(select auth.uid()));
create trigger foods_touch before update on public.foods for each row execute function private.touch_updated_at();

create table public.nutrition_targets (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 calories numeric not null check(calories between 1 and 20000),
 protein numeric not null check(protein between 0 and 2000),carbs numeric not null check(carbs between 0 and 3000),fat numeric not null check(fat between 0 and 1000),
 water_ml numeric not null check(water_ml between 1 and 20000),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.food_logs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),
 meal text not null check(meal in ('Breakfast','Lunch','Dinner','Snacks')),
 food_id uuid references public.foods(id) on delete set null,
 food_name text not null check(length(btrim(food_name)) between 1 and 200),
 source text not null,source_external_id text,
 base_unit text not null check(base_unit in ('g','ml','serving')),
 base_amount numeric not null check(base_amount between 0.000001 and 100000),
 base_calories numeric not null check(base_calories between 0 and 100000),base_protein numeric not null check(base_protein between 0 and 100000),base_carbs numeric not null check(base_carbs between 0 and 100000),base_fat numeric not null check(base_fat between 0 and 100000),
 portion_label text not null check(length(portion_label) between 1 and 160),
 portion_amount numeric not null check(portion_amount between 0.000001 and 100000),
 quantity numeric not null check(quantity between 0.000001 and 100000),
 calories numeric generated always as (base_calories*portion_amount*quantity/base_amount) stored,
 protein numeric generated always as (base_protein*portion_amount*quantity/base_amount) stored,
 carbs numeric generated always as (base_carbs*portion_amount*quantity/base_amount) stored,
 fat numeric generated always as (base_fat*portion_amount*quantity/base_amount) stored,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(portion_amount*quantity<=100000)
);
create index food_logs_owner_date on public.food_logs(user_id,local_date,meal,id);
create index food_logs_owner_food on public.food_logs(user_id,food_id,created_at desc);
create index food_logs_food_fk on public.food_logs(food_id);
create table public.food_favorites (
 user_id uuid not null references public.profiles(id) on delete cascade,food_id uuid not null references public.foods(id) on delete cascade,
 primary key(user_id,food_id)
);
create index food_favorites_food_fk on public.food_favorites(food_id);
create table public.saved_meals (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(length(btrim(name)) between 1 and 160),
 items jsonb not null check(jsonb_typeof(items)='array' and jsonb_array_length(items) between 1 and 100),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index saved_meals_owner on public.saved_meals(user_id,id);
create table public.water_logs (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,
 local_date date not null check(local_date between date '1900-01-01' and date '2100-12-31'),
 time_zone text not null check(private.is_valid_time_zone(time_zone)),
 amount_ml numeric not null check(amount_ml between 1 and 20000),created_at timestamptz not null default now()
);
create index water_logs_owner_date on public.water_logs(user_id,local_date,id);
do $$ declare name text;begin
 foreach name in array array['nutrition_targets','food_logs','food_favorites','saved_meals','water_logs'] loop
  execute format('alter table public.%I enable row level security',name);
  execute format('revoke all on public.%I from public,anon,authenticated',name);
  execute format('grant select,insert,update,delete on public.%I to authenticated,service_role',name);
  execute format('create policy %I on public.%I for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',name||'_own',name);
 end loop;
 foreach name in array array['nutrition_targets','food_logs','saved_meals'] loop
  execute format('create trigger %I before update on public.%I for each row execute function private.touch_updated_at()',name||'_touch',name);
 end loop;
end; $$;
-- A reference to another person's custom food is forbidden even though the FK exists.
create function private.check_nutrition_food_owner()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.food_id is not null and not exists(select 1 from public.foods where id=new.food_id and (user_id is null or user_id=new.user_id)) then
  raise exception 'Food unavailable' using errcode='42501';
 end if;
 return new;
end; $$;
revoke all on function private.check_nutrition_food_owner() from public,anon,authenticated,service_role;
create trigger food_logs_food_owner before insert or update of food_id,user_id on public.food_logs for each row execute function private.check_nutrition_food_owner();
create trigger food_favorites_food_owner before insert or update on public.food_favorites for each row execute function private.check_nutrition_food_owner();
