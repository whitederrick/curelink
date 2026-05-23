-- Demo data for local verification and the match-api function.

insert into public.providers (
  id,
  name,
  phone,
  email,
  avatar_url,
  certificates,
  specialties,
  languages_spoken,
  religion,
  tier,
  rating_avg,
  total_matches,
  is_active
)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'Alex Kim',
    '010-0000-0101',
    'alex.crew@example.com',
    null,
    array['요양보호사', '의료통역사'],
    array['퇴원후케어', '의료관광에스코트'],
    array['ko', 'en']::varchar(10)[],
    'CHRISTIAN',
    'GOLD',
    4.92,
    128,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Minh Tran',
    '010-0000-0102',
    'minh.crew@example.com',
    null,
    array['간병인'],
    array['시니어케어', '퇴원후케어'],
    array['ko', 'vi']::varchar(10)[],
    'NONE',
    'SILVER',
    4.81,
    74,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Sara Lee',
    '010-0000-0103',
    'sara.crew@example.com',
    null,
    array['간호조무사'],
    array['의료관광에스코트'],
    array['ko', 'en', 'zh']::varchar(10)[],
    'CATHOLIC',
    'MASTER',
    4.98,
    201,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  phone = excluded.phone,
  email = excluded.email,
  certificates = excluded.certificates,
  specialties = excluded.specialties,
  languages_spoken = excluded.languages_spoken,
  religion = excluded.religion,
  tier = excluded.tier,
  rating_avg = excluded.rating_avg,
  total_matches = excluded.total_matches,
  is_active = excluded.is_active;

insert into public.provider_schedules (
  provider_id,
  day_of_week,
  start_time,
  end_time,
  is_available
)
values
  ('00000000-0000-0000-0000-000000000101', 1, '09:00:00', '13:00:00', true),
  ('00000000-0000-0000-0000-000000000101', 1, '13:00:00', '18:00:00', true),
  ('00000000-0000-0000-0000-000000000101', 3, '09:00:00', '13:00:00', true),
  ('00000000-0000-0000-0000-000000000102', 1, '09:00:00', '13:00:00', true),
  ('00000000-0000-0000-0000-000000000102', 6, '13:00:00', '18:00:00', true),
  ('00000000-0000-0000-0000-000000000103', 1, '09:00:00', '13:00:00', true),
  ('00000000-0000-0000-0000-000000000103', 2, '18:00:00', '22:00:00', true)
on conflict (provider_id, day_of_week, start_time, end_time) do update
set is_available = excluded.is_available;
