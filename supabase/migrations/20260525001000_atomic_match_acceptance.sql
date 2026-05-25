create or replace function public.accept_pending_match(p_match_id uuid)
returns table (
  id uuid,
  provider_id uuid,
  status text,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with locked_match as (
    select match_logs.id
    from public.match_logs
    where match_logs.id = p_match_id
      and match_logs.status = 'PENDING'
      and match_logs.expires_at > now()
    for update skip locked
  )
  update public.match_logs
  set
    status = 'MATCHED',
    accepted_at = now()
  from locked_match
  where public.match_logs.id = locked_match.id
  returning
    public.match_logs.id,
    public.match_logs.provider_id,
    public.match_logs.status::text,
    public.match_logs.accepted_at;
end;
$$;
