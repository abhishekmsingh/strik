-- ============================================================
-- Fix recursive RLS on public.streaks.
--
-- Original "select own or peer" policy referenced public.streaks inside its
-- own USING clause. Postgres blocks recursive RLS evaluation, so the inner
-- subquery returned no rows and the outer policy hid everything except
-- via the owner_id branch — and that branch was itself part of the same
-- recursive expression, which can also evaluate to false depending on plan.
--
-- Fix: extract the "what shared groups am I in?" check into a
-- SECURITY DEFINER function so it runs without RLS, then express the
-- policies as straightforward owner-or-membership checks.
-- ============================================================

create or replace function public.my_shared_groups()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select shared_streak_id from public.streaks where owner_id = auth.uid();
$$;

revoke all on function public.my_shared_groups() from public;
grant execute on function public.my_shared_groups() to authenticated;

-- ---- streaks ----
drop policy if exists "streaks select own or peer" on public.streaks;

create policy "streaks select own"
  on public.streaks for select
  to authenticated
  using (owner_id = auth.uid());

create policy "streaks select peer"
  on public.streaks for select
  to authenticated
  using (shared_streak_id in (select public.my_shared_groups()));

-- ---- streak_logs ----
drop policy if exists "logs select if can see streak" on public.streak_logs;

create policy "logs select own"
  on public.streak_logs for select
  to authenticated
  using (
    streak_id in (
      select id from public.streaks where owner_id = auth.uid()
    )
  );

create policy "logs select peer"
  on public.streak_logs for select
  to authenticated
  using (
    streak_id in (
      select id from public.streaks
      where shared_streak_id in (select public.my_shared_groups())
    )
  );
