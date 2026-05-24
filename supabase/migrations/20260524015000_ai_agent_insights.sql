create table if not exists public.ai_agent_insights (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.match_logs(id) on delete cascade,
  booking_request_id uuid references public.booking_requests(id) on delete cascade,
  ai_refined_summary_ko text,
  ai_medical_report_json jsonb not null default '{}'::jsonb,
  dispatcher_recommendation_json jsonb not null default '{}'::jsonb,
  readmission_risk_score numeric(5, 2) not null default 0,
  crew_churn_risk_score numeric(5, 2) not null default 0,
  anomaly_detected boolean not null default false,
  anomaly_type varchar(40),
  severity varchar(20) not null default 'INFO',
  model_version varchar(40) not null default 'rules-v1',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_ai_urgency_check
  on public.ai_agent_insights (anomaly_detected, readmission_risk_score desc, created_at desc);

create index if not exists idx_ai_match_lookup
  on public.ai_agent_insights (match_id, created_at desc);

create index if not exists idx_ai_booking_lookup
  on public.ai_agent_insights (booking_request_id, created_at desc);

alter table public.ai_agent_insights enable row level security;
