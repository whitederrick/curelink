-- CureLink trust, finance, and security layer.
-- Uses the existing partner_agencies / booking_requests model instead of
-- introducing a duplicate b2b_partners table.

alter table public.booking_requests
  drop constraint if exists booking_requests_status_check;

alter table public.booking_requests
  add constraint booking_requests_status_check
  check (status in (
    'PAYMENT_PENDING',
    'PAID',
    'MATCHING',
    'MATCHED',
    'COMPLETED',
    'CANCELED',
    'REFUNDED'
  ));

create table if not exists public.provider_reviews (
  id uuid primary key default gen_random_uuid(),
  match_log_id uuid references public.match_logs(id) on delete cascade,
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  customer_id uuid not null,
  provider_id uuid not null references public.providers(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  reviewer_ip_hash text,
  reviewer_device_hash text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  check (match_log_id is not null or booking_request_id is not null)
);

create index if not exists idx_provider_reviews_provider_created
  on public.provider_reviews (provider_id, created_at desc);

create index if not exists idx_provider_reviews_customer_provider
  on public.provider_reviews (customer_id, provider_id, created_at desc);

create unique index if not exists idx_provider_reviews_match_unique
  on public.provider_reviews (match_log_id)
  where match_log_id is not null;

create unique index if not exists idx_provider_reviews_booking_unique
  on public.provider_reviews (booking_request_id)
  where booking_request_id is not null;

create or replace function public.verify_review_integrity()
returns trigger
language plpgsql
as $$
declare
  v_match_status text;
  v_actual_customer uuid;
  v_actual_provider uuid;
  v_provider_user_id uuid;
  v_recent_review_count integer;
  v_related_booking_status text;
begin
  select user_id
  into v_provider_user_id
  from public.providers
  where id = new.provider_id;

  if not found then
    raise exception 'Provider does not exist for this review.';
  end if;

  if v_provider_user_id = new.customer_id then
    raise exception 'Self-review is not allowed.';
  end if;

  if new.match_log_id is not null then
    select status::text, customer_id, provider_id
    into v_match_status, v_actual_customer, v_actual_provider
    from public.match_logs
    where id = new.match_log_id;

    if not found then
      raise exception 'Review requires an existing match log.';
    end if;

    if v_match_status <> 'COMPLETED' then
      raise exception 'Reviews are allowed only after completed care.';
    end if;

    if new.customer_id is distinct from v_actual_customer
      or new.provider_id is distinct from v_actual_provider then
      raise exception 'Only the matched customer can review the assigned provider.';
    end if;
  end if;

  if new.booking_request_id is not null then
    select status
    into v_related_booking_status
    from public.booking_requests
    where id = new.booking_request_id
      and (customer_id = new.customer_id or customer_id is null);

    if not found then
      raise exception 'Review requires an existing booking request owned by the customer.';
    end if;

    if v_related_booking_status <> 'COMPLETED' then
      raise exception 'Booking reviews are allowed only after completion.';
    end if;
  end if;

  select count(*)
  into v_recent_review_count
  from public.provider_reviews
  where customer_id = new.customer_id
    and provider_id = new.provider_id
    and created_at >= timezone('utc'::text, now()) - interval '24 hours';

  if v_recent_review_count > 0 then
    raise exception 'Duplicate reviews for the same provider are blocked for 24 hours.';
  end if;

  if new.reviewer_ip_hash is not null and exists (
    select 1
    from public.provider_reviews
    where provider_id = new.provider_id
      and reviewer_ip_hash = new.reviewer_ip_hash
      and created_at >= timezone('utc'::text, now()) - interval '24 hours'
  ) then
    raise exception 'Suspicious repeated review source detected.';
  end if;

  if new.reviewer_device_hash is not null and exists (
    select 1
    from public.provider_reviews
    where provider_id = new.provider_id
      and reviewer_device_hash = new.reviewer_device_hash
      and created_at >= timezone('utc'::text, now()) - interval '24 hours'
  ) then
    raise exception 'Suspicious repeated review device detected.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_verify_review_integrity on public.provider_reviews;
create trigger trg_verify_review_integrity
before insert on public.provider_reviews
for each row
execute function public.verify_review_integrity();

alter table public.provider_reviews enable row level security;

drop policy if exists "Customers can read own provider reviews" on public.provider_reviews;
create policy "Customers can read own provider reviews"
on public.provider_reviews
for select
to authenticated
using (customer_id = auth.uid());

drop policy if exists "Providers can read reviews about themselves" on public.provider_reviews;
create policy "Providers can read reviews about themselves"
on public.provider_reviews
for select
to authenticated
using (
  exists (
    select 1
    from public.providers
    where providers.id = provider_reviews.provider_id
      and providers.user_id = auth.uid()
  )
);

drop policy if exists "Customers can create completed booking reviews" on public.provider_reviews;
create policy "Customers can create completed booking reviews"
on public.provider_reviews
for insert
to authenticated
with check (customer_id = auth.uid());

drop policy if exists "Matched users can read AI agent insights" on public.ai_agent_insights;
create policy "Matched users can read AI agent insights"
on public.ai_agent_insights
for select
to authenticated
using (
  exists (
    select 1
    from public.match_logs
    where match_logs.id = ai_agent_insights.match_id
      and (
        match_logs.customer_id = auth.uid()
        or exists (
          select 1
          from public.providers
          where providers.id = match_logs.provider_id
            and providers.user_id = auth.uid()
        )
      )
  )
  or exists (
    select 1
    from public.booking_requests
    where booking_requests.id = ai_agent_insights.booking_request_id
      and booking_requests.customer_id = auth.uid()
  )
);

create or replace function public.generate_partner_monthly_billings()
returns void
language plpgsql
as $$
declare
  v_target_month date;
  v_start_date timestamptz;
  v_end_date timestamptz;
  v_record record;
begin
  v_start_date := date_trunc('month', timezone('utc'::text, now()) - interval '1 month');
  v_end_date := date_trunc('month', timezone('utc'::text, now()));
  v_target_month := v_start_date::date;

  for v_record in
    select
      pa.id as partner_agency_id,
      pa.commission_rate,
      count(br.id)::integer as booking_count,
      coalesce(sum(br.total_amount), 0)::integer as gross_amount
    from public.partner_agencies pa
    left join public.booking_requests br
      on br.partner_agency_id = pa.id
      and br.status in ('MATCHED', 'COMPLETED')
      and br.created_at >= v_start_date
      and br.created_at < v_end_date
    where pa.is_active = true
    group by pa.id, pa.commission_rate
  loop
    if v_record.booking_count > 0 then
      insert into public.partner_billings (
        partner_agency_id,
        billing_month,
        booking_count,
        gross_amount,
        commission_amount,
        status
      )
      values (
        v_record.partner_agency_id,
        v_target_month,
        v_record.booking_count,
        v_record.gross_amount,
        round(v_record.gross_amount * (v_record.commission_rate / 100.0))::integer,
        'ISSUED'
      )
      on conflict (partner_agency_id, billing_month)
      do update set
        booking_count = excluded.booking_count,
        gross_amount = excluded.gross_amount,
        commission_amount = excluded.commission_amount,
        status = excluded.status,
        updated_at = timezone('utc'::text, now());
    end if;
  end loop;
end;
$$;

do $$
begin
  perform cron.unschedule('curelink-partner-monthly-billing-job');
exception
  when others then null;
end $$;

do $$
begin
  perform cron.schedule(
    'curelink-partner-monthly-billing-job',
    '0 2 1 * *',
    'select public.generate_partner_monthly_billings();'
  );
exception
  when invalid_schema_name or undefined_function or insufficient_privilege then
    raise notice 'pg_cron schedule was not registered. Enable pg_cron or use the Supabase Cron UI to call public.generate_partner_monthly_billings monthly.';
end $$;
