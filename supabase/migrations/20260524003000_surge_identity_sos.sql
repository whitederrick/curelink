-- CureLink survival controls: surge pricing, identity verification, and SOS audit pipeline.
-- These controls are designed for non-medical escort and daily-life support operations.

do $$
begin
  alter type match_status add value if not exists 'EMERGENCY';
exception
  when duplicate_object then null;
end $$;

alter table public.booking_requests
  add column if not exists location_district text,
  add column if not exists original_amount integer,
  add column if not exists surge_multiplier numeric(3, 2) not null default 1.00 check (surge_multiplier >= 1.00),
  add column if not exists incentive_bonus integer not null default 0 check (incentive_bonus >= 0),
  add column if not exists surge_reason text,
  add column if not exists surge_applied_at timestamptz,
  add column if not exists identity_verification_required boolean not null default false,
  add column if not exists identity_verification_status text not null default 'NOT_REQUIRED'
    check (identity_verification_status in ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED')),
  add column if not exists legal_disclaimer_agreed boolean not null default false,
  add column if not exists legal_disclaimer_agreed_at timestamptz;

alter table public.match_logs
  add column if not exists location_district text,
  add column if not exists total_amount integer check (total_amount is null or total_amount >= 0),
  add column if not exists original_amount integer check (original_amount is null or original_amount >= 0),
  add column if not exists surge_multiplier numeric(3, 2) not null default 1.00 check (surge_multiplier >= 1.00),
  add column if not exists incentive_bonus integer not null default 0 check (incentive_bonus >= 0),
  add column if not exists surge_reason text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists emergency_status text not null default 'NORMAL'
    check (emergency_status in ('NORMAL', 'SOS_TRIGGERED', 'RESOLVED')),
  add column if not exists b2b_billing_status text not null default 'NORMAL'
    check (b2b_billing_status in ('NORMAL', 'PENDING_INVESTIGATION', 'RELEASED', 'HELD'));

create table if not exists public.passport_verifications (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  match_log_id uuid references public.match_logs(id) on delete cascade,
  passport_number_hashed text not null,
  full_name_ocr varchar(120) not null,
  birth_date_ocr date,
  visa_type varchar(30) not null,
  visa_expiry_date date,
  is_identity_matched boolean not null default false,
  is_visa_valid boolean not null default false,
  legal_disclaimer_agreed boolean not null default false,
  disclaimer_version varchar(30) not null default 'escort-v1',
  electronic_signature_svg text,
  verified_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  check (booking_request_id is not null or match_log_id is not null)
);

create table if not exists public.partner_hospital_webhooks (
  id uuid primary key default gen_random_uuid(),
  hospital_code varchar(50) not null unique,
  hospital_name text not null,
  webhook_url text not null,
  signing_secret text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.emergency_events (
  id uuid primary key default gen_random_uuid(),
  match_log_id uuid references public.match_logs(id) on delete set null,
  booking_request_id uuid references public.booking_requests(id) on delete set null,
  event_type text not null default 'PATIENT_EMERGENCY_SOS',
  crew_name text not null,
  patient_name text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  emergency_memo text not null default '',
  status text not null default 'OPEN' check (status in ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  emergency_event_id uuid references public.emergency_events(id) on delete cascade,
  destination_type text not null,
  destination_url text,
  delivery_status text not null default 'PENDING' check (delivery_status in ('PENDING', 'SUCCESS', 'FAILED')),
  response_status integer,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_booking_requests_demand_window
  on public.booking_requests (location_district, status, created_at desc);

create index if not exists idx_booking_requests_identity
  on public.booking_requests (identity_verification_status, legal_disclaimer_agreed);

create index if not exists idx_passport_verification_booking
  on public.passport_verifications (
    booking_request_id,
    is_identity_matched,
    is_visa_valid,
    legal_disclaimer_agreed
  );

create index if not exists idx_passport_verification_match
  on public.passport_verifications (
    match_log_id,
    is_identity_matched,
    is_visa_valid,
    legal_disclaimer_agreed
  );

create index if not exists idx_emergency_events_open
  on public.emergency_events (status, created_at desc);

drop trigger if exists set_partner_hospital_webhooks_updated_at on public.partner_hospital_webhooks;
create trigger set_partner_hospital_webhooks_updated_at
before update on public.partner_hospital_webhooks
for each row
execute function public.set_updated_at();

alter table public.passport_verifications enable row level security;
alter table public.partner_hospital_webhooks enable row level security;
alter table public.emergency_events enable row level security;
alter table public.webhook_deliveries enable row level security;
