begin;
select set_config('actaro.recovery_a',gen_random_uuid()::text,true),set_config('actaro.recovery_b',gen_random_uuid()::text,true);
insert into auth.users(id) values(current_setting('actaro.recovery_a')::uuid),(current_setting('actaro.recovery_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.recovery_a'),'role','authenticated')::text,true);
select public.save_recovery_check(auth.uid(),current_date,'UTC',3,0,3,null,' Self report ');
select public.save_recovery_check(auth.uid(),current_date,'UTC',2,1,2,1,'Updated self report');
do $$ begin
 begin perform public.save_recovery_check(current_setting('actaro.recovery_b')::uuid,current_date,'UTC',3,0,3);raise exception 'Mismatched actor accepted';exception when insufficient_privilege then null;end;
 if (select count(*) from public.recovery_check_ins)<>1 or (select energy from public.recovery_check_ins)<>2 then raise exception 'Daily upsert failed';end if;
 begin perform public.save_recovery_check(auth.uid(),current_date,'UTC',4,0,3);raise exception 'Invalid category accepted';exception when check_violation then null;end;
 begin perform public.save_recovery_check(auth.uid(),current_date-1,'UTC',3,0,3);raise exception 'Old date accepted';exception when invalid_parameter_value then null;end;
 begin update public.recovery_check_ins set user_id=current_setting('actaro.recovery_b')::uuid;raise exception 'Ownership changed';exception when insufficient_privilege then null;end;
end; $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('actaro.recovery_b'),'role','authenticated')::text,true);
do $$ declare affected integer;begin
 if exists(select 1 from public.recovery_check_ins) then raise exception 'Foreign check visible';end if;
 delete from public.recovery_check_ins where user_id=current_setting('actaro.recovery_a')::uuid;get diagnostics affected=row_count;if affected<>0 then raise exception 'Foreign check removed';end if;
end; $$;
reset role;set local role anon;
do $$ begin
 begin perform count(*) from public.recovery_check_ins;raise exception 'Anonymous read accepted';exception when insufficient_privilege then null;end;
 begin perform public.save_recovery_check(auth.uid(),current_date,'UTC',3,0,3);raise exception 'Anonymous save accepted';exception when insufficient_privilege then null;end;
end; $$;
reset role;rollback;
