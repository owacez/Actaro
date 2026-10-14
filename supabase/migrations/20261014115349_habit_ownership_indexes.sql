create index habit_versions_habit_owner_fk on public.habit_versions(habit_id,user_id);
create index habit_logs_habit_owner_fk on public.habit_logs(habit_id,user_id);
