-- Actaro-authored editable templates, not endorsed programs or logged progress.
create table public.training_plans (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 name text not null,
 goal text not null check(goal in ('general','strength','hypertrophy')),
 experience text not null check(experience in ('beginner','intermediate','any')),
 days_per_week integer not null check(days_per_week between 1 and 7),
 description text not null,
 source_url text not null,
 workouts jsonb not null check(jsonb_typeof(workouts)='array' and jsonb_array_length(workouts) between 1 and 7),
 days jsonb not null check(jsonb_typeof(days)='array' and jsonb_array_length(days)=7)
);
alter table public.training_plans enable row level security;
revoke all on public.training_plans from public,anon,authenticated;
grant select on public.training_plans to authenticated;
grant select,insert,update,delete on public.training_plans to service_role;
create policy training_plans_read on public.training_plans for select to authenticated using (true);
alter table public.training_splits add column source_plan_id uuid references public.training_plans(id) on delete set null;
create index training_splits_source_plan_idx on public.training_splits(source_plan_id);
grant insert(source_plan_id) on public.training_splits to authenticated;

insert into public.training_plans(slug,name,goal,experience,days_per_week,description,source_url,workouts,days) values
('beginner-full-body','Beginner Full Body','general','beginner',3,'Editable full-body starting template. Choose suitable loads and adjust exercises/targets.','https://pubmed.ncbi.nlm.nih.gov/19204579/',
'[{"key":"a","name":"Full Body A","sets":2,"reps":8,"rest_seconds":120,"exercise_source_ids":["squat","bench-press","barbell-rear-delt-row"]}]','["a",null,"a",null,"a",null,null]'),
('push-pull-legs','Push / Pull / Legs','hypertrophy','intermediate',3,'Editable three-day split. Review each exercise and set target before training.','https://pubmed.ncbi.nlm.nih.gov/19204579/',
'[{"key":"push","name":"Push","sets":3,"reps":10,"rest_seconds":90,"exercise_source_ids":["bench-press","dumbbell-shoulder-press"]},{"key":"pull","name":"Pull","sets":3,"reps":10,"rest_seconds":90,"exercise_source_ids":["barbell-rear-delt-row","pull-up"]},{"key":"legs","name":"Legs","sets":3,"reps":10,"rest_seconds":120,"exercise_source_ids":["squat","bodyweight-reverse-lunge"]}]','["push",null,"pull",null,"legs",null,null]'),
('upper-lower','Upper / Lower','general','intermediate',4,'Editable upper/lower split with scheduled rest. Loads are intentionally unspecified.','https://pubmed.ncbi.nlm.nih.gov/19204579/',
'[{"key":"upper","name":"Upper","sets":3,"reps":8,"rest_seconds":120,"exercise_source_ids":["bench-press","barbell-rear-delt-row","dumbbell-shoulder-press"]},{"key":"lower","name":"Lower","sets":3,"reps":8,"rest_seconds":120,"exercise_source_ids":["squat","deadlift","bodyweight-reverse-lunge"]}]','["upper","lower",null,"upper","lower",null,null]'),
('strength','Strength','strength','intermediate',3,'Editable lower-repetition template with longer rest. Select loads yourself.','https://pubmed.ncbi.nlm.nih.gov/19204579/',
'[{"key":"a","name":"Strength A","sets":3,"reps":5,"rest_seconds":180,"exercise_source_ids":["squat","bench-press","barbell-rear-delt-row"]},{"key":"b","name":"Strength B","sets":3,"reps":5,"rest_seconds":180,"exercise_source_ids":["deadlift","dumbbell-shoulder-press","pull-up"]}]','["a",null,"b",null,"a",null,null]'),
('hypertrophy','Hypertrophy','hypertrophy','intermediate',4,'Editable four-day upper/lower starting template. No automatic load prescription.','https://pubmed.ncbi.nlm.nih.gov/19204579/',
'[{"key":"upper","name":"Hypertrophy Upper","sets":3,"reps":10,"rest_seconds":90,"exercise_source_ids":["db-bench-press","bent-over-db-row","dumbbell-shoulder-press"]},{"key":"lower","name":"Hypertrophy Lower","sets":3,"reps":10,"rest_seconds":90,"exercise_source_ids":["goblet-squat","bodyweight-reverse-lunge"]}]','["upper","lower",null,"upper","lower",null,null]'),
('home-workout','Home Workout','general','any',3,'Editable dumbbell template without a bench. Change any target or exercise.','https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
'[{"key":"home","name":"Home Full Body","sets":2,"reps":8,"rest_seconds":90,"exercise_source_ids":["goblet-squat","bent-over-db-row","dumbbell-shoulder-press"]}]','["home",null,"home",null,"home",null,null]'),
('bodyweight','Bodyweight','general','any',3,'Editable no-added-load template. Enter zero for bodyweight or leave unknown loads blank.','https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',
'[{"key":"body","name":"Bodyweight Full Body","sets":2,"reps":8,"rest_seconds":90,"exercise_source_ids":["bodyweight-squat","push-up","bodyweight-reverse-lunge","superman"]}]','["body",null,"body",null,"body",null,null]');

create function public.get_training_plans(p_goal text default null,p_experience text default null,p_days integer default null,p_available_only boolean default false)
returns table(id uuid,name text,goal text,experience text,days_per_week integer,description text,source_url text,required_equipment text[],schedule text[],workouts jsonb)
language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501';end if;
 if (p_goal is not null and p_goal not in ('general','strength','hypertrophy')) or (p_experience is not null and p_experience not in ('beginner','intermediate','any')) or (p_days is not null and p_days not between 1 and 7) then raise exception 'Invalid filters' using errcode='22023';end if;
 return query
 select p.id,p.name,p.goal,p.experience,p.days_per_week,p.description,p.source_url,
 array(select distinct eq.name from jsonb_array_elements(p.workouts)w cross join lateral jsonb_array_elements_text(w->'exercise_source_ids')x join public.exercises e on e.source='repdb' and e.source_external_id=x.value join public.exercise_equipment ee on ee.exercise_id=e.id join public.equipment eq on eq.id=ee.equipment_id order by eq.name),
 array(select (select recipe->>'name' from jsonb_array_elements(p.workouts)recipe where recipe->>'key'=day.value#>>'{}') from jsonb_array_elements(p.days) with ordinality day order by day.ordinality),
 (select jsonb_agg(jsonb_build_object('name',w.value->>'name','sets',(w.value->>'sets')::integer,'reps',(w.value->>'reps')::integer,'rest_seconds',(w.value->>'rest_seconds')::integer,'exercises',(select jsonb_agg(e.name order by x.ordinality) from jsonb_array_elements_text(w.value->'exercise_source_ids') with ordinality x join public.exercises e on e.source='repdb' and e.source_external_id=x.value)) order by w.ordinality) from jsonb_array_elements(p.workouts) with ordinality w)
 from public.training_plans p
 where (p_goal is null or p.goal=p_goal) and (p_experience is null or p.experience in (p_experience,'any')) and (p_days is null or p.days_per_week=p_days)
 and not exists(select 1 from jsonb_array_elements(p.workouts)w cross join lateral jsonb_array_elements_text(w->'exercise_source_ids')x where not exists(select 1 from public.exercises e where e.source='repdb' and e.source_external_id=x.value))
 and (not p_available_only or not exists(select 1 from jsonb_array_elements(p.workouts)w cross join lateral jsonb_array_elements_text(w->'exercise_source_ids')x join public.exercises e on e.source='repdb' and e.source_external_id=x.value join public.exercise_equipment ee on ee.exercise_id=e.id where not exists(select 1 from public.user_equipment ue where ue.user_id=auth.uid() and ue.equipment_id=ee.equipment_id)))
 order by p.name limit 50;
end; $$;
revoke all on function public.get_training_plans(text,text,integer,boolean) from public,anon,authenticated;
grant execute on function public.get_training_plans(text,text,integer,boolean) to authenticated;

create function public.adopt_training_plan(p_plan_id uuid,p_split_id uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:=auth.uid();plan public.training_plans;existing public.training_splits;w jsonb;x text;exercise_id uuid;template_id uuid;targets jsonb;items jsonb;mapping jsonb:='{}';days jsonb:='[]';day jsonb;set_index integer;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501';end if;
 if p_split_id is null then raise exception 'Invalid split' using errcode='22023';end if;
 perform id from public.profiles where id=owner_id for update;
 select * into plan from public.training_plans where id=p_plan_id;if not found then raise exception 'Plan unavailable' using errcode='22023';end if;
 select * into existing from public.training_splits where id=p_split_id;
 if found then
  if existing.user_id=owner_id and existing.source_plan_id=p_plan_id then return existing.id;end if;
  raise exception 'Split already exists' using errcode='22023';
 end if;
 for w in select value from jsonb_array_elements(plan.workouts) loop
  items:='[]';
  for x in select value from jsonb_array_elements_text(w->'exercise_source_ids') loop
   select e.id into exercise_id from public.exercises e where e.source='repdb' and e.source_external_id=x;
   if not found then raise exception 'Plan exercise unavailable' using errcode='23503';end if;
   targets:='[]';
   for set_index in 1..(w->>'sets')::integer loop targets:=targets||jsonb_build_array(jsonb_build_object('reps',(w->>'reps')::integer,'weight_kg',null,'rest_seconds',(w->>'rest_seconds')::integer));end loop;
   items:=items||jsonb_build_array(jsonb_build_object('exercise_id',exercise_id,'sets',targets));
  end loop;
  template_id:=gen_random_uuid();perform public.save_workout_template(template_id,w->>'name','Created from '||plan.name||'. Editable targets; choose loads before training.',items);
  mapping:=mapping||jsonb_build_object(w->>'key',template_id);
 end loop;
 for day in select value from jsonb_array_elements(plan.days) loop
  if day='null'::jsonb then days:=days||jsonb_build_array(jsonb_build_object('is_rest',true,'workout_id',null));
  else template_id:=(mapping->>(day#>>'{}'))::uuid;if template_id is null then raise exception 'Invalid plan day' using errcode='22023';end if;days:=days||jsonb_build_array(jsonb_build_object('is_rest',false,'workout_id',template_id));end if;
 end loop;
 -- Create linked identity before the shared saver fills and activates the week.
 insert into public.training_splits(id,user_id,name,is_active,source_plan_id) values(p_split_id,owner_id,plan.name,false,plan.id);
 perform public.save_training_split(p_split_id,plan.name,true,days);
 return p_split_id;
end; $$;
revoke all on function public.adopt_training_plan(uuid,uuid) from public,anon,authenticated;
grant execute on function public.adopt_training_plan(uuid,uuid) to authenticated;
