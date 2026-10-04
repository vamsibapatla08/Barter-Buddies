-- Demo data for Barter Buddies. SQL twin of backend/scripts/seed.py.
--
-- Paste into the Supabase SQL Editor and run. Everything is
-- ON CONFLICT DO NOTHING, so running it twice inserts nothing the second time.
--
-- auth.users rows come first: profiles.id references auth.users (id).
-- The demo users have no password, so they cannot sign in.
-- Emails must end in @my.utsa.edu or the check_utsa_email trigger rejects them.
-- Every skill_id below comes from the skills seed in schema.sql.

-- 1. auth.users (6 rows)
insert into auth.users (
  instance_id, id, aud, role, email, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  person.id,
  'authenticated',
  'authenticated',
  person.email,
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '', '', '', ''
from (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'priya.s@my.utsa.edu'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'marisol.t@my.utsa.edu'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'devan.o@my.utsa.edu'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'jae.l@my.utsa.edu'),
    ('00000000-0000-4000-8000-000000000005'::uuid, 'ana.r@my.utsa.edu'),
    ('00000000-0000-4000-8000-000000000006'::uuid, 'sam.k@my.utsa.edu')
) as person (id, email)
on conflict (id) do nothing;

-- 2. profiles (6 rows)
insert into public.profiles (id, display_name, file_code)
values
  ('00000000-0000-4000-8000-000000000001', 'Priya S.',   'BB-1041'),
  ('00000000-0000-4000-8000-000000000002', 'Marisol T.', 'BB-1042'),
  ('00000000-0000-4000-8000-000000000003', 'Devan O.',   'BB-1043'),
  ('00000000-0000-4000-8000-000000000004', 'Jae L.',     'BB-1044'),
  ('00000000-0000-4000-8000-000000000005', 'Ana R.',     'BB-1045'),
  ('00000000-0000-4000-8000-000000000006', 'Sam K.',     'BB-1046')
on conflict (id) do nothing;

-- 3. listings (12 rows, 2 per person)
insert into public.listings (id, owner_id, skill_id, title, detail, meet_spot, mode, available_when, active)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'CALCULUS_TUTORING',
   'Calc I & II exam prep',
   'Two years of tutoring Calc I and II. We work through your practice exam together.',
   'JPL library, 2nd floor', 'in_person', 'Weekday evenings', true),

  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'PYTHON_HELP',
   'Python debugging help',
   'Stuck on a CS assignment? I will read your traceback and walk you through the fix.',
   'Zoom', 'online', 'Most nights after 7pm', true),

  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'GEL_MANICURE',
   'Gel manicure, full set',
   'Full gel set in the colour of your choice. Bring your own design ideas.',
   'Chisholm Hall lounge', 'in_person', 'Saturday mornings', true),

  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', 'NAIL_ART',
   'Hand-painted nail art',
   'Freehand art on top of an existing set. Takes about an hour.',
   'Chisholm Hall lounge', 'in_person', 'Weekends', true),

  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'AIRPORT_RIDE',
   'Ride to SAT airport',
   'I drive and I know the cheap parking. Room for two bags.',
   'Ximenes garage', 'in_person', 'Breaks and holiday weekends', true),

  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000003', 'GROCERY_RUN',
   'Grocery run to HEB',
   'Weekly HEB trip. Send me your list and I will bring it back to your dorm.',
   'Roadrunner Cafe entrance', 'in_person', 'Sunday afternoons', true),

  ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000004', 'LOGO_DESIGN',
   'Logo for your club or brand',
   'Three concepts, one revision round, final files as SVG and PNG.',
   'Figma and email', 'online', 'Within a week of asking', true),

  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000004', 'PHOTOGRAPHY',
   'Grad photos on campus',
   'An hour around the Sombrilla, 30 edited photos back to you.',
   'Sombrilla Plaza', 'in_person', 'Golden hour, most days', true),

  ('10000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000005', 'GUITAR_LESSON',
   'Beginner guitar lessons',
   'Chords, strumming patterns and your first few songs. Guitar provided.',
   'Arts building practice room', 'in_person', 'Tuesday and Thursday afternoons', true),

  ('10000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000005', 'BAKING',
   'Birthday cakes and cupcakes',
   'Everything from scratch. Tell me the flavour and how many people.',
   'Pickup near Tobin Ave', 'in_person', 'Two days notice, please', true),

  ('10000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000006', 'RESUME_REVIEW',
   'Resume and LinkedIn review',
   'A line-by-line edit plus the two changes that matter most for internships.',
   'Google Docs', 'online', 'Turnaround in 48 hours', true),

  ('10000000-0000-4000-8000-000000000012', '00000000-0000-4000-8000-000000000006', 'WORKOUT_PLAN',
   'Four-week workout plan',
   'Built around the RWC equipment and the days you can actually show up.',
   'Rec center, main floor', 'in_person', 'Weekday mornings', true)
on conflict (id) do nothing;

-- 4. wants (10 rows)
insert into public.wants (id, owner_id, skill_id)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'GEL_MANICURE'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', 'AIRPORT_RIDE'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'CALCULUS_TUTORING'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003', 'RESUME_REVIEW'),
  ('20000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'BAKING'),
  ('20000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', 'GUITAR_LESSON'),
  ('20000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000005', 'LOGO_DESIGN'),
  ('20000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000005', 'WORKOUT_PLAN'),
  ('20000000-0000-4000-8000-000000000009', '00000000-0000-4000-8000-000000000006', 'PHOTOGRAPHY'),
  ('20000000-0000-4000-8000-000000000010', '00000000-0000-4000-8000-000000000006', 'GROCERY_RUN')
on conflict (id) do nothing;

-- 5. What is on the board now (the demo rows this script owns)
select 'profiles' as table_name,
       count(*) as demo_rows
from public.profiles
where id::text like '00000000-0000-4000-8000-0000000000%'
union all
select 'listings',
       count(*)
from public.listings
where id::text like '10000000-0000-4000-8000-0000000000%'
union all
select 'wants',
       count(*)
from public.wants
where id::text like '20000000-0000-4000-8000-0000000000%';
