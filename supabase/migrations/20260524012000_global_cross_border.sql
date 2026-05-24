-- Global cross-border readiness.
-- Keeps sensitive medical identity data referenced by region instead of forcing it
-- into the Korea operational database.

alter table public.partner_agencies
  add column if not exists settlement_currency varchar(3) not null default 'USD',
  add column if not exists country_code varchar(5) not null default 'KR',
  add column if not exists compliance_region varchar(10) not null default 'KR',
  add column if not exists data_residency_required boolean not null default false;

alter table public.providers
  add column if not exists did_credential_hash text,
  add column if not exists did_issuer text,
  add column if not exists did_verified_at timestamptz,
  add column if not exists home_country varchar(5) not null default 'KR';

alter table public.booking_requests
  add column if not exists customer_country_code varchar(5) not null default 'KR',
  add column if not exists data_region varchar(10) not null default 'KR',
  add column if not exists currency_code varchar(3) not null default 'KRW',
  add column if not exists exchange_rate numeric(14, 6) not null default 1.000000,
  add column if not exists base_currency_code varchar(3) not null default 'KRW',
  add column if not exists base_amount_krw integer,
  add column if not exists fx_snapshot_id uuid,
  add column if not exists encrypted_medical_passport_ref text,
  add column if not exists sensitive_profile_ref text;

alter table public.match_logs
  add column if not exists customer_country_code varchar(5) not null default 'KR',
  add column if not exists data_region varchar(10) not null default 'KR',
  add column if not exists currency_code varchar(3) not null default 'KRW',
  add column if not exists exchange_rate numeric(14, 6) not null default 1.000000,
  add column if not exists encrypted_medical_passport_ref text,
  add column if not exists sensitive_profile_ref text;

create table if not exists public.data_region_routes (
  id uuid primary key default gen_random_uuid(),
  region_code varchar(10) not null unique,
  display_name varchar(80) not null,
  storage_provider varchar(30) not null default 'SUPABASE',
  storage_region varchar(50) not null,
  privacy_framework text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.fx_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  base_currency varchar(3) not null default 'KRW',
  quote_currency varchar(3) not null,
  exchange_rate numeric(14, 6) not null,
  source varchar(40) not null default 'STATIC_POLICY',
  captured_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.provider_did_credentials (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  credential_hash text not null,
  issuer_name text not null,
  issuer_country_code varchar(5) not null,
  credential_type varchar(50) not null default 'CARE_TRAINING',
  verification_status varchar(20) not null default 'PENDING',
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (provider_id, credential_hash)
);

create index if not exists idx_partner_agencies_global_region
  on public.partner_agencies (country_code, compliance_region, settlement_currency);

create index if not exists idx_providers_home_country_did
  on public.providers (home_country, did_verified_at);

create index if not exists idx_booking_requests_global_routing
  on public.booking_requests (data_region, currency_code, customer_country_code, created_at desc);

create index if not exists idx_match_logs_global_routing
  on public.match_logs (data_region, currency_code, customer_country_code);

create index if not exists idx_fx_rate_snapshots_quote
  on public.fx_rate_snapshots (quote_currency, captured_at desc);

create index if not exists idx_provider_did_credentials_lookup
  on public.provider_did_credentials (provider_id, verification_status);

alter table public.data_region_routes enable row level security;
alter table public.fx_rate_snapshots enable row level security;
alter table public.provider_did_credentials enable row level security;

insert into public.data_region_routes (
  region_code,
  display_name,
  storage_provider,
  storage_region,
  privacy_framework
)
values
  ('KR', 'Korea operational region', 'SUPABASE', 'ap-northeast-2', array['PIPA']),
  ('US', 'United States protected health data region', 'EXTERNAL_VAULT', 'us-east-1', array['HIPAA']),
  ('EU', 'European Union personal data region', 'EXTERNAL_VAULT', 'eu-central-1', array['GDPR']),
  ('SEA', 'Southeast Asia partner routing region', 'EXTERNAL_VAULT', 'ap-southeast-1', array['LOCAL_PRIVACY'])
on conflict (region_code) do update
set
  display_name = excluded.display_name,
  storage_provider = excluded.storage_provider,
  storage_region = excluded.storage_region,
  privacy_framework = excluded.privacy_framework;

insert into public.fx_rate_snapshots (quote_currency, exchange_rate)
values
  ('KRW', 1.000000),
  ('USD', 0.000740),
  ('VND', 18.850000),
  ('JPY', 0.116000),
  ('EUR', 0.000680)
on conflict do nothing;
