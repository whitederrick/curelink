-- CureLink app write endpoints
-- Adds a booking request table and an external care-log key for demo/API writes.

alter table public.match_logs
  add column if not exists external_match_key text;

create index if not exists idx_match_logs_external_match_key
  on public.match_logs (external_match_key);

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references auth.users(id) on delete set null,
  care_type text not null check (care_type in ('BRIDGE', 'TOURISM', 'EMERGENCY')),
  required_day integer not null default 1 check (required_day between 0 and 6),
  required_time_slot text not null default 'SLOT_MORNING',
  required_language varchar(10) not null default 'ko',
  required_religion provider_religion not null default 'NONE',
  requires_wheelchair boolean not null default false,
  patient_name text not null,
  patient_note text not null default '',
  total_amount integer not null check (total_amount >= 0),
  status text not null default 'PAYMENT_PENDING'
    check (status in ('PAYMENT_PENDING', 'PAID', 'MATCHING', 'MATCHED', 'CANCELED')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_booking_requests_status_created
  on public.booking_requests (status, created_at desc);

drop trigger if exists set_booking_requests_updated_at on public.booking_requests;
create trigger set_booking_requests_updated_at
before update on public.booking_requests
for each row
execute function public.set_updated_at();

alter table public.booking_requests enable row level security;

drop policy if exists "Customers can read own booking requests" on public.booking_requests;
create policy "Customers can read own booking requests"
on public.booking_requests
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Customers can create own booking requests" on public.booking_requests;
create policy "Customers can create own booking requests"
on public.booking_requests
for insert
to authenticated
with check (customer_id = auth.uid());
