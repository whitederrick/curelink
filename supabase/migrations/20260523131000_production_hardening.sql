-- CureLink production hardening
-- Adds provider reliability fields, matching offer lifecycle fields,
-- UTC schedule metadata, and stricter RLS policies for sensitive care data.

alter type match_status add value if not exists 'PENDING';
alter type match_status add value if not exists 'TIMEOUT';

alter table public.providers
  add column if not exists no_show_count integer not null default 0 check (no_show_count >= 0),
  add column if not exists acceptance_rate numeric(5, 2) not null default 100.00 check (acceptance_rate >= 0 and acceptance_rate <= 100),
  add column if not exists last_no_show_at timestamptz;

alter table public.provider_schedules
  add column if not exists local_timezone text not null default 'Asia/Seoul',
  add column if not exists start_at_utc timestamptz,
  add column if not exists end_at_utc timestamptz;

alter table public.match_logs
  add column if not exists proposed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists timed_out_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists canceled_at timestamptz;

create index if not exists idx_providers_reliability_rank
  on public.providers (
    is_active,
    acceptance_rate desc,
    no_show_count asc,
    rating_avg desc,
    total_matches desc
  );

create index if not exists idx_provider_schedules_utc_window
  on public.provider_schedules (start_at_utc, end_at_utc, is_available, provider_id);

create index if not exists idx_match_logs_offer_expiry
  on public.match_logs (status, expires_at);

drop policy if exists "Providers can read own match logs" on public.match_logs;
drop policy if exists "Providers can insert own match logs" on public.match_logs;
drop policy if exists "Providers can update own active match logs" on public.match_logs;
drop policy if exists "Customers can read own active match logs" on public.match_logs;

create policy "Providers can read own active match logs"
on public.match_logs
for select
to authenticated
using (
  status::text in ('PENDING', 'MATCHED', 'ONGOING')
  and exists (
    select 1
    from public.providers
    where providers.id = match_logs.provider_id
      and providers.user_id = auth.uid()
  )
);

create policy "Customers can read own active match logs"
on public.match_logs
for select
to authenticated
using (
  status::text in ('PENDING', 'MATCHED', 'ONGOING')
  and customer_id = auth.uid()
);

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

create policy "Providers can update own ongoing match logs"
on public.match_logs
for update
to authenticated
using (
  status::text = 'ONGOING'
  and exists (
    select 1
    from public.providers
    where providers.id = match_logs.provider_id
      and providers.user_id = auth.uid()
  )
)
with check (
  status::text in ('ONGOING', 'COMPLETED')
  and exists (
    select 1
    from public.providers
    where providers.id = match_logs.provider_id
      and providers.user_id = auth.uid()
  )
);
