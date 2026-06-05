create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  supabase_user_id uuid unique,
  full_name text,
  avatar_url text,
  unit_of_measure text not null default 'metric',
  height_cm numeric,
  weight_kg numeric,
  gender text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_unit_of_measure_check
    check (unit_of_measure in ('metric', 'imperial'))
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  workout_type text,
  duration_seconds integer,
  reps integer,
  sets integer,
  rest_seconds integer,
  distance_km numeric,
  calories_target integer,
  status text not null default 'upcoming',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workout_plans_status_check
    check (status in ('draft', 'upcoming', 'active', 'archived', 'completed'))
);

create table if not exists public.scheduled_workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_plan_id uuid not null references public.workout_plans(id) on delete cascade,
  scheduled_for timestamptz not null,
  reminder_enabled boolean not null default false,
  reminder_minutes_before integer not null default 15,
  status text not null default 'scheduled',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint scheduled_workouts_status_check
    check (status in ('scheduled', 'completed', 'cancelled', 'missed')),
  constraint scheduled_workouts_reminder_minutes_before_check
    check (reminder_minutes_before >= 0)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_plan_id uuid references public.workout_plans(id) on delete set null,
  scheduled_workout_id uuid references public.scheduled_workouts(id) on delete set null,
  title text not null,
  workout_type text,
  started_at timestamptz,
  completed_at timestamptz,
  duration_seconds integer,
  distance_km numeric,
  calories_burned integer,
  status text not null default 'completed',
  created_at timestamptz not null default timezone('utc', now()),
  constraint workout_sessions_status_check
    check (status in ('in_progress', 'completed', 'cancelled', 'abandoned'))
);

create table if not exists public.workout_session_steps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  label text not null,
  duration_seconds integer,
  order_index integer not null,
  completed boolean not null default false,
  completed_at timestamptz,
  constraint workout_session_steps_unique_session_order
    unique (session_id, order_index)
);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  workout_reminders_enabled boolean not null default true,
  ai_suggestions_enabled boolean not null default true,
  weekly_insights_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  vibration_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.weekly_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start_date date not null,
  total_workouts integer not null default 0,
  total_duration_seconds integer not null default 0,
  total_calories integer not null default 0,
  total_distance_km numeric not null default 0,
  ai_summary text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint weekly_insights_unique_user_week
    unique (user_id, week_start_date)
);

create index if not exists profiles_clerk_user_id_idx
  on public.profiles (clerk_user_id);

create index if not exists workout_plans_user_id_idx
  on public.workout_plans (user_id);

create index if not exists scheduled_workouts_user_id_idx
  on public.scheduled_workouts (user_id);

create index if not exists scheduled_workouts_scheduled_for_idx
  on public.scheduled_workouts (scheduled_for);

create index if not exists workout_sessions_user_id_idx
  on public.workout_sessions (user_id);

create index if not exists workout_sessions_completed_at_idx
  on public.workout_sessions (completed_at desc);

create index if not exists workout_session_steps_session_id_idx
  on public.workout_session_steps (session_id);

create index if not exists weekly_insights_user_id_idx
  on public.weekly_insights (user_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_workout_plans_updated_at on public.workout_plans;
create trigger set_workout_plans_updated_at
before update on public.workout_plans
for each row
execute function public.set_updated_at();

drop trigger if exists set_scheduled_workouts_updated_at on public.scheduled_workouts;
create trigger set_scheduled_workouts_updated_at
before update on public.scheduled_workouts
for each row
execute function public.set_updated_at();

drop trigger if exists set_notification_preferences_updated_at on public.notification_preferences;
create trigger set_notification_preferences_updated_at
before update on public.notification_preferences
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_steps enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.weekly_insights enable row level security;

revoke all on public.profiles from anon;
revoke all on public.workout_plans from anon;
revoke all on public.scheduled_workouts from anon;
revoke all on public.workout_sessions from anon;
revoke all on public.workout_session_steps from anon;
revoke all on public.notification_preferences from anon;
revoke all on public.weekly_insights from anon;

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.workout_plans to authenticated;
grant select, insert, update, delete on public.scheduled_workouts to authenticated;
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_session_steps to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.weekly_insights to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (clerk_user_id = (select auth.jwt()->>'sub'));

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (clerk_user_id = (select auth.jwt()->>'sub'));

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (clerk_user_id = (select auth.jwt()->>'sub'))
with check (clerk_user_id = (select auth.jwt()->>'sub'));

create policy "profiles_delete_own"
on public.profiles
for delete
to authenticated
using (clerk_user_id = (select auth.jwt()->>'sub'));

drop policy if exists "workout_plans_select_own" on public.workout_plans;
drop policy if exists "workout_plans_insert_own" on public.workout_plans;
drop policy if exists "workout_plans_update_own" on public.workout_plans;
drop policy if exists "workout_plans_delete_own" on public.workout_plans;

create policy "workout_plans_select_own"
on public.workout_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_plans.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_plans_insert_own"
on public.workout_plans
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_plans.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_plans_update_own"
on public.workout_plans
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_plans.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_plans.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_plans_delete_own"
on public.workout_plans
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_plans.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

drop policy if exists "scheduled_workouts_select_own" on public.scheduled_workouts;
drop policy if exists "scheduled_workouts_insert_own" on public.scheduled_workouts;
drop policy if exists "scheduled_workouts_update_own" on public.scheduled_workouts;
drop policy if exists "scheduled_workouts_delete_own" on public.scheduled_workouts;

create policy "scheduled_workouts_select_own"
on public.scheduled_workouts
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = scheduled_workouts.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "scheduled_workouts_insert_own"
on public.scheduled_workouts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = scheduled_workouts.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "scheduled_workouts_update_own"
on public.scheduled_workouts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = scheduled_workouts.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = scheduled_workouts.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "scheduled_workouts_delete_own"
on public.scheduled_workouts
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = scheduled_workouts.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

drop policy if exists "workout_sessions_select_own" on public.workout_sessions;
drop policy if exists "workout_sessions_insert_own" on public.workout_sessions;
drop policy if exists "workout_sessions_update_own" on public.workout_sessions;
drop policy if exists "workout_sessions_delete_own" on public.workout_sessions;

create policy "workout_sessions_select_own"
on public.workout_sessions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_sessions.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_sessions_insert_own"
on public.workout_sessions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_sessions.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_sessions_update_own"
on public.workout_sessions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_sessions.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_sessions.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_sessions_delete_own"
on public.workout_sessions
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = workout_sessions.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

drop policy if exists "workout_session_steps_select_own" on public.workout_session_steps;
drop policy if exists "workout_session_steps_insert_own" on public.workout_session_steps;
drop policy if exists "workout_session_steps_update_own" on public.workout_session_steps;
drop policy if exists "workout_session_steps_delete_own" on public.workout_session_steps;

create policy "workout_session_steps_select_own"
on public.workout_session_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.profiles p on p.id = ws.user_id
    where ws.id = workout_session_steps.session_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_session_steps_insert_own"
on public.workout_session_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.workout_sessions ws
    join public.profiles p on p.id = ws.user_id
    where ws.id = workout_session_steps.session_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_session_steps_update_own"
on public.workout_session_steps
for update
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.profiles p on p.id = ws.user_id
    where ws.id = workout_session_steps.session_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.workout_sessions ws
    join public.profiles p on p.id = ws.user_id
    where ws.id = workout_session_steps.session_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "workout_session_steps_delete_own"
on public.workout_session_steps
for delete
to authenticated
using (
  exists (
    select 1
    from public.workout_sessions ws
    join public.profiles p on p.id = ws.user_id
    where ws.id = workout_session_steps.session_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
drop policy if exists "notification_preferences_insert_own" on public.notification_preferences;
drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
drop policy if exists "notification_preferences_delete_own" on public.notification_preferences;

create policy "notification_preferences_select_own"
on public.notification_preferences
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = notification_preferences.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "notification_preferences_insert_own"
on public.notification_preferences
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = notification_preferences.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "notification_preferences_update_own"
on public.notification_preferences
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = notification_preferences.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = notification_preferences.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "notification_preferences_delete_own"
on public.notification_preferences
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = notification_preferences.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

drop policy if exists "weekly_insights_select_own" on public.weekly_insights;
drop policy if exists "weekly_insights_insert_own" on public.weekly_insights;
drop policy if exists "weekly_insights_update_own" on public.weekly_insights;
drop policy if exists "weekly_insights_delete_own" on public.weekly_insights;

create policy "weekly_insights_select_own"
on public.weekly_insights
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = weekly_insights.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "weekly_insights_insert_own"
on public.weekly_insights
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = weekly_insights.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "weekly_insights_update_own"
on public.weekly_insights
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = weekly_insights.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = weekly_insights.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

create policy "weekly_insights_delete_own"
on public.weekly_insights
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = weekly_insights.user_id
      and p.clerk_user_id = (select auth.jwt()->>'sub')
  )
);

comment on table public.profiles is
  'User-owned profile records connected to Clerk through clerk_user_id.';

comment on table public.scheduled_workouts is
  'Per-workout reminder timing lives here. reminder_minutes_before defaults to 15.';

comment on table public.workout_sessions is
  'Completed and in-progress workout history backing Home and success/history screens.';

notify pgrst, 'reload schema';
