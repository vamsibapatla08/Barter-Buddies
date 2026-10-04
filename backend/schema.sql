-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  file_code text unique,
  major text,
  year text,
  bio text,
  meet_style text,
  rating_avg numeric(3, 2) default 0,
  created_at timestamptz not null default now(),
  constraint profiles_meet_style_check check (
    meet_style is null
    or meet_style in ('in_person', 'online', 'either')
  )
);

create table if not exists public.skills (
  id text primary key,
  label text not null,
  category text not null
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  skill_id text not null references public.skills (id),
  title text not null,
  detail text,
  meet_spot text,
  mode text,
  available_when text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint listings_mode_check check (
    mode is null
    or mode in ('in_person', 'online')
  )
);

create table if not exists public.wants (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  skill_id text not null references public.skills (id)
);

create table if not exists public.exchanges (
  id uuid primary key default gen_random_uuid (),
  requester_id uuid not null references public.profiles (id),
  recipient_id uuid not null references public.profiles (id),
  requester_listing_id uuid not null references public.listings (id),
  recipient_listing_id uuid not null references public.listings (id),
  status text not null default 'proposed',
  terms_when text not null,
  terms_where text not null,
  terms_mode text not null,
  note text,
  source text not null,
  locked_at timestamptz,
  requester_completed boolean not null default false,
  recipient_completed boolean not null default false,
  created_at timestamptz not null default now(),
  constraint exchanges_status_check check (
    status in (
      'proposed',
      'accepted',
      'locked',
      'completed',
      'declined'
    )
  ),
  constraint exchanges_source_check check (source in ('browse', 'match')),
  constraint exchanges_different_users_check check (requester_id <> recipient_id),
  constraint exchanges_terms_mode_check check (terms_mode in ('in_person', 'online'))
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid (),
  exchange_id uuid not null references public.exchanges (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  reviewee_id uuid not null references public.profiles (id),
  stars integer not null,
  note text,
  created_at timestamptz not null default now(),
  constraint reviews_stars_check check (stars between 1 and 5),
  constraint reviews_different_users_check check (reviewer_id <> reviewee_id),
  constraint reviews_one_per_person_per_exchange unique (exchange_id, reviewer_id)
);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid (),
  exchange_id uuid not null unique references public.exchanges (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid (),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  exchange_id uuid references public.exchanges (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

alter table public.skills enable row level security;

alter table public.listings enable row level security;

alter table public.wants enable row level security;

alter table public.exchanges enable row level security;

alter table public.reviews enable row level security;

alter table public.threads enable row level security;

alter table public.messages enable row level security;

alter table public.notifications enable row level security;

-- grants
grant select on public.profiles to authenticated;
grant update on public.profiles to authenticated;

grant select on public.skills to authenticated;

grant select on public.listings to authenticated;
grant update on public.listings to authenticated;
grant insert on public.listings to authenticated;
grant delete on public.listings to authenticated;

grant select on public.wants to authenticated;
grant update on public.wants to authenticated;
grant insert on public.wants to authenticated;
grant delete on public.wants to authenticated;

grant select on public.exchanges to authenticated;

grant select on public.reviews to authenticated;

grant select on public.threads to authenticated;

grant select on public.messages to authenticated;
grant insert on public.messages to authenticated;

grant select on public.notifications to authenticated;
grant update on public.notifications to authenticated;

-- Policies
drop policy if exists "profiles readable by authenticated users" on public.profiles;
create policy "profiles readable by authenticated users" on public.profiles for
select
  to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update
  to authenticated using (auth.uid () = id)
with
  check (auth.uid () = id);

drop policy if exists "skills readable by authenticated users" on public.skills;
create policy "skills readable by authenticated users" on public.skills for
select
  to authenticated using (true);

drop policy if exists "listings readable by authenticated users" on public.listings;
create policy "listings readable by authenticated users" on public.listings for
select
  to authenticated using (true);

drop policy if exists "users create own listings" on public.listings;
create policy "users create own listings" on public.listings for insert to authenticated
with
  check (auth.uid () = owner_id);

drop policy if exists "users update own listings" on public.listings;
create policy "users update own listings" on public.listings
for update
  to authenticated using (auth.uid () = owner_id)
with
  check (auth.uid () = owner_id);

drop policy if exists "users delete own listings" on public.listings;
create policy "users delete own listings" on public.listings for delete to authenticated using (auth.uid () = owner_id);

drop policy if exists "wants readable by authenticated users" on public.wants;
create policy "wants readable by authenticated users" on public.wants for
select
  to authenticated using (true);

drop policy if exists "users create own wants" on public.wants;
create policy "users create own wants" on public.wants for insert to authenticated
with
  check (auth.uid () = owner_id);

drop policy if exists "users update own wants" on public.wants;
create policy "users update own wants" on public.wants
for update
  to authenticated using (auth.uid () = owner_id)
with
  check (auth.uid () = owner_id);

drop policy if exists "users delete own wants" on public.wants;
create policy "users delete own wants" on public.wants for delete to authenticated using (auth.uid () = owner_id);

drop policy if exists "participants read exchanges" on public.exchanges;
create policy "participants read exchanges" on public.exchanges for
select
  to authenticated using (
    auth.uid () = requester_id
    or auth.uid () = recipient_id
  );

drop policy if exists "reviews readable by authenticated users" on public.reviews;
create policy "reviews readable by authenticated users" on public.reviews for
select
  to authenticated using (true);

drop policy if exists "participants read threads" on public.threads;
create policy "participants read threads" on public.threads for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.exchanges e
      where
        e.id = threads.exchange_id
        and (
          e.requester_id = auth.uid ()
          or e.recipient_id = auth.uid ()
        )
    )
  );

drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.threads t
        join public.exchanges e on e.id = t.exchange_id
      where
        t.id = messages.thread_id
        and (
          e.requester_id = auth.uid ()
          or e.recipient_id = auth.uid ()
        )
    )
  );

drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages for insert to authenticated
with
  check (
    sender_id = auth.uid ()
    and exists (
      select
        1
      from
        public.threads t
        join public.exchanges e on e.id = t.exchange_id
      where
        t.id = messages.thread_id
        and (
          e.requester_id = auth.uid ()
          or e.recipient_id = auth.uid ()
        )
    )
  );

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
for select to authenticated
using ( (select auth.uid()) = user_id);

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications
for update
to authenticated
using (
    auth.uid() = user_id
)
with check (
    auth.uid() = user_id
);

insert into public.skills (id, label, category) values

-- Tutoring
('CALCULUS_TUTORING', 'Calculus tutoring', 'tutoring'),
('CS_TUTORING', 'CS tutoring', 'tutoring'),
('PHYSICS_TUTORING', 'Physics tutoring', 'tutoring'),
('WRITING_HELP', 'Writing help', 'tutoring'),

-- Beauty
('GEL_MANICURE', 'Gel manicure', 'beauty'),
('NAIL_ART', 'Nail art', 'beauty'),
('HAIRCUT', 'Haircut', 'beauty'),
('BRAIDS', 'Braids', 'beauty'),

-- Rides
('AIRPORT_RIDE', 'Airport ride', 'rides'),
('GROCERY_RUN', 'Grocery run', 'rides'),
('CAMPUS_RIDE', 'Campus ride', 'rides'),

-- Creative
('LOGO_DESIGN', 'Logo design', 'creative'),
('FLYER_DESIGN', 'Flyer design', 'creative'),
('PHOTOGRAPHY', 'Photography', 'creative'),
('VIDEO_EDITING', 'Video editing', 'creative'),

-- Tech
('PYTHON_HELP', 'Python help', 'tech'),
('WEB_DEV', 'Web development', 'tech'),
('RESUME_REVIEW', 'Resume review', 'tech'),
('EXCEL_HELP', 'Excel help', 'tech'),

-- Fitness
('GYM_SPOTTER', 'Gym spotter', 'fitness'),
('WORKOUT_PLAN', 'Workout plan', 'fitness'),

-- Food
('HOME_COOKING', 'Home cooking', 'food'),
('BAKING', 'Baking', 'food'),

-- Music
('GUITAR_LESSON', 'Guitar lesson', 'music'),
('PIANO_LESSON', 'Piano lesson', 'music')

on conflict (id) do nothing;

-- Email trigger
create or replace function public.check_utsa_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if lower(new.email) not like '%@my.utsa.edu' then
        raise exception 'Only UTSA email addresses are allowed';
    end if;

    return new;
end;
$$;

create trigger check_utsa_email_before_signup
before insert on auth.users
for each row
execute function public.check_utsa_email();

create trigger check_utsa_email_before_signup
before insert on auth.users
for each row
execute function public.check_utsa_email();

-- Edges
-- Create a profile row for every new signup
create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup
after insert on auth.users
for each row execute function public.create_profile_on_signup();

create or replace view public.edges as
select
    l.owner_id as giver_id,
    w.owner_id as receiver_id,
    l.id as listing_id,
    l.skill_id
from public.listings l
join public.wants w
    on w.skill_id = l.skill_id
where l.active = true
  and l.owner_id <> w.owner_id;

--Indexes
create index if not exists idx_listings_owner on public.listings (owner_id);

create index if not exists idx_listings_skill on public.listings (skill_id);

create index if not exists idx_listings_active_skill on public.listings (skill_id)
where
  active = true;

create index if not exists idx_wants_owner on public.listings (owner_id);

create index if not exists idx_wants_skill on public.listings (skill_id);

create index if not exists idx_exchanges_requester on public.exchanges (requester_id);

create index if not exists idx_exchanges_recipient on public.exchanges (recipient_id);

create index if not exists idx_exchanges_status on public.exchanges (status);

create index if not exists idx_reviews_reviewee on public.reviews (reviewee_id);

create index if not exists idx_messages_thread_created on public.messages (thread_id, created_at);

create index if not exists idx_notifications_user_unread on public.notifications (user_id)
where
  read_at is null;