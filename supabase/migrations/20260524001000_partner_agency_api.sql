-- CureLink partner agency API model
-- Supports medical tourism agencies without exposing patient data broadly.

create table if not exists public.partner_agencies (
  id uuid primary key default gen_random_uuid(),
  partner_code varchar(50) not null unique,
  name text not null,
  country_code varchar(2) not null default 'KR',
  contact_email text,
  api_key_hash text not null,
  commission_rate numeric(5, 2) not null default 12.00 check (commission_rate >= 0 and commission_rate <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.booking_requests
  add column if not exists partner_agency_id uuid references public.partner_agencies(id) on delete set null,
  add column if not exists source_partner_code varchar(50),
  add column if not exists external_booking_id text,
  add column if not exists quoted_currency varchar(3) not null default 'KRW',
  add column if not exists partner_metadata jsonb not null default '{}'::jsonb;

alter table public.match_logs
  add column if not exists hospital_code varchar(50),
  add column if not exists health_tags text[] not null default '{}',
  add column if not exists is_paid_by_hospital boolean not null default false,
  add column if not exists source_partner_code varchar(50);

create table if not exists public.partner_billings (
  id uuid primary key default gen_random_uuid(),
  partner_agency_id uuid not null references public.partner_agencies(id) on delete cascade,
  billing_month date not null,
  booking_count integer not null default 0 check (booking_count >= 0),
  gross_amount integer not null default 0 check (gross_amount >= 0),
  commission_amount integer not null default 0 check (commission_amount >= 0),
  status text not null default 'OPEN' check (status in ('OPEN', 'ISSUED', 'PAID', 'VOID')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (partner_agency_id, billing_month)
);

create table if not exists public.partner_api_events (
  id uuid primary key default gen_random_uuid(),
  partner_agency_id uuid references public.partner_agencies(id) on delete set null,
  event_type text not null,
  external_booking_id text,
  request_status text not null default 'SUCCESS',
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_partner_agencies_code_active
  on public.partner_agencies (partner_code, is_active);

create index if not exists idx_booking_requests_partner
  on public.booking_requests (partner_agency_id, created_at desc);

create index if not exists idx_booking_requests_external
  on public.booking_requests (source_partner_code, external_booking_id);

create index if not exists idx_match_logs_hospital
  on public.match_logs (hospital_code);

create index if not exists idx_match_logs_health_tags
  on public.match_logs using gin (health_tags);

create index if not exists idx_partner_api_events_partner
  on public.partner_api_events (partner_agency_id, created_at desc);

drop trigger if exists set_partner_agencies_updated_at on public.partner_agencies;
create trigger set_partner_agencies_updated_at
before update on public.partner_agencies
for each row
execute function public.set_updated_at();

drop trigger if exists set_partner_billings_updated_at on public.partner_billings;
create trigger set_partner_billings_updated_at
before update on public.partner_billings
for each row
execute function public.set_updated_at();

alter table public.partner_agencies enable row level security;
alter table public.partner_billings enable row level security;
alter table public.partner_api_events enable row level security;

insert into public.partner_agencies (
  partner_code,
  name,
  country_code,
  contact_email,
  api_key_hash,
  commission_rate
)
values (
  'MT_DEMO_SEA',
  'Demo Southeast Asia Medical Tourism Agency',
  'VN',
  'partner-demo@example.com',
  '102da9f0136268b5e1df954e09d18caf0d8218e56d69397c0b0cf6a45a0e21db',
  12.00
)
on conflict (partner_code) do update
set
  name = excluded.name,
  country_code = excluded.country_code,
  contact_email = excluded.contact_email,
  api_key_hash = excluded.api_key_hash,
  commission_rate = excluded.commission_rate,
  is_active = true;
