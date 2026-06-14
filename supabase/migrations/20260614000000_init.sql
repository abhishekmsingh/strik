-- ============================================================
-- strik: initial schema
-- profiles, streaks, streak_logs + auto-profile trigger + RLS
-- ============================================================

-- ---- profiles (mirrors auth.users) ----
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- ---- streaks ----
create table public.streaks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  freezes_per_month int not null default 0
    check (freezes_per_month between 0 and 10),
  reminder_hour int not null default 20
    check (reminder_hour between 0 and 23),
  shared_streak_id uuid not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create index streaks_owner_idx on public.streaks(owner_id);
create index streaks_shared_idx on public.streaks(shared_streak_id);

-- ---- streak_logs ----
create table public.streak_logs (
  id uuid primary key default gen_random_uuid(),
  streak_id uuid not null references public.streaks(id) on delete cascade,
  log_date date not null,
  status text not null check (status in ('done', 'missed', 'freeze')),
  note text,
  logged_at timestamptz not null default now(),
  unique (streak_id, log_date)
);

create index streak_logs_streak_date_idx
  on public.streak_logs(streak_id, log_date desc);

-- ============================================================
-- triggers
-- ============================================================

-- auto-create a profile when a new auth.users row appears
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- default shared_streak_id to the row's own id
create or replace function public.set_shared_streak_id()
returns trigger
language plpgsql
as $$
begin
  if new.shared_streak_id is null then
    new.shared_streak_id := new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists set_shared_streak_id_trigger on public.streaks;
create trigger set_shared_streak_id_trigger
  before insert on public.streaks
  for each row execute function public.set_shared_streak_id();

-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles    enable row level security;
alter table public.streaks     enable row level security;
alter table public.streak_logs enable row level security;

-- profiles: authed users can read all, only update own
create policy "profiles select all authed"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles update own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- streaks: see own + co-enrolled peers; only mutate own
create policy "streaks select own or peer"
  on public.streaks for select
  to authenticated
  using (
    owner_id = auth.uid()
    or shared_streak_id in (
      select s.shared_streak_id
      from public.streaks s
      where s.owner_id = auth.uid()
    )
  );

create policy "streaks insert own"
  on public.streaks for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "streaks update own"
  on public.streaks for update
  to authenticated
  using (owner_id = auth.uid());

create policy "streaks delete own"
  on public.streaks for delete
  to authenticated
  using (owner_id = auth.uid());

-- streak_logs: visible if I can see the parent streak; only insert/delete on own streaks
create policy "logs select if can see streak"
  on public.streak_logs for select
  to authenticated
  using (
    streak_id in (
      select id from public.streaks
      where owner_id = auth.uid()
         or shared_streak_id in (
           select s.shared_streak_id
           from public.streaks s
           where s.owner_id = auth.uid()
         )
    )
  );

create policy "logs insert own"
  on public.streak_logs for insert
  to authenticated
  with check (
    streak_id in (
      select id from public.streaks where owner_id = auth.uid()
    )
  );

create policy "logs delete own"
  on public.streak_logs for delete
  to authenticated
  using (
    streak_id in (
      select id from public.streaks where owner_id = auth.uid()
    )
  );
