-- CureLink MVP core schema
-- Providers, weekly availability schedules, and care logs.

create extension if not exists pgcrypto;

do $$
begin
  create type provider_tier as enum ('BRONZE', 'SILVER', 'GOLD', 'MASTER');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type provider_religion as enum ('CHRISTIAN', 'BUDDHIST', 'CATHOLIC', 'NONE');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type match_status as enum ('MATCHED', 'ONGOING', 'COMPLETED', 'CANCELED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type meal_status as enum ('GOOD', 'FAIR', 'POOR');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type condition_status as enum ('GOOD', 'NORMAL', 'BAD');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name varchar(80) not null,
  phone varchar(30) unique,
  email varchar(120) unique,
  avatar_url text,
  certificates text[] not null default '{}',
  specialties text[] not null default '{}',
  languages_spoken varchar(10)[] not null default array['ko']::varchar(10)[],
  religion provider_religion not null default 'NONE',
  tier provider_tier not null default 'BRONZE',
  rating_avg numeric(3, 2) not null default 5.00 check (rating_avg >= 0 and rating_avg <= 5),
  total_matches integer not null default 0 check (total_matches >= 0),
  bank_name varchar(50),
  account_number varchar(120),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_schedules (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (provider_id, day_of_week, start_time, end_time)
);

create table if not exists public.match_logs (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  provider_id uuid references public.providers(id) on delete set null,
  customer_id uuid,
  status match_status not null default 'MATCHED',
  meal_status meal_status,
  condition_status condition_status,
  medication_checked boolean not null default false,
  raw_log_lang varchar(10) not null default 'ko',
  raw_log_text text not null default '',
  translated_log_text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_providers_active_rating
  on public.providers (is_active, rating_avg desc, total_matches desc);

create index if not exists idx_providers_religion
  on public.providers (religion);

create index if not exists idx_providers_languages_spoken
  on public.providers using gin (languages_spoken);

create index if not exists idx_provider_schedules_lookup
  on public.provider_schedules (day_of_week, start_time, end_time, is_available, provider_id);

create index if not exists idx_provider_schedules_provider
  on public.provider_schedules (provider_id);

create index if not exists idx_match_logs_provider_created
  on public.match_logs (provider_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_providers_updated_at on public.providers;
create trigger set_providers_updated_at
before update on public.providers
for each row
execute function public.set_updated_at();

drop trigger if exists set_provider_schedules_updated_at on public.provider_schedules;
create trigger set_provider_schedules_updated_at
before update on public.provider_schedules
for each row
execute function public.set_updated_at();

drop trigger if exists set_match_logs_updated_at on public.match_logs;
create trigger set_match_logs_updated_at
before update on public.match_logs
for each row
execute function public.set_updated_at();

alter table public.providers enable row level security;
alter table public.provider_schedules enable row level security;
alter table public.match_logs enable row level security;

drop policy if exists "Providers are readable by authenticated users" on public.providers;
create policy "Providers are readable by authenticated users"
on public.providers
for select
to authenticated
using (true);

drop policy if exists "Providers can update own profile" on public.providers;
create policy "Providers can update own profile"
on public.providers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Provider schedules are readable by authenticated users" on public.provider_schedules;
create policy "Provider schedules are readable by authenticated users"
on public.provider_schedules
for select
to authenticated
using (true);

drop policy if exists "Providers can manage own schedules" on public.provider_schedules;
create policy "Providers can manage own schedules"
on public.provider_schedules
for all
to authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = provider_schedules.provider_id
      and providers.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.providers
    where providers.id = provider_schedules.provider_id
      and providers.user_id = auth.uid()
  )
);

drop policy if exists "Providers can read own match logs" on public.match_logs;
create policy "Providers can read own match logs"
on public.match_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = match_logs.provider_id
      and providers.user_id = auth.uid()
  )
);

drop policy if exists "Providers can insert own match logs" on public.match_logs;
create policy "Providers can insert own match logs"
on public.match_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.providers
    where providers.id = match_logs.provider_id
      and providers.user_id = auth.uid()
  )
);
