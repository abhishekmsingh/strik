-- ============================================================
-- Allow any authenticated user to read just the join-template fields
-- (name, freezes_per_month, reminder_hour) of a shared streak by its
-- shared_streak_id, even before they're enrolled.
--
-- Without this, the join page can't render — RLS hides every streak
-- row from users who aren't already in the shared group.
-- ============================================================

create or replace function public.get_shared_streak_template(code uuid)
returns table (
  name text,
  freezes_per_month int,
  reminder_hour int
)
language sql
security definer
set search_path = public
stable
as $$
  select name, freezes_per_month, reminder_hour
  from public.streaks
  where shared_streak_id = code
  limit 1;
$$;

revoke all on function public.get_shared_streak_template(uuid) from public;
grant execute on function public.get_shared_streak_template(uuid) to authenticated;
