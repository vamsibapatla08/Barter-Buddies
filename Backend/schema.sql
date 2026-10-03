-- Core tables for Barter Buddies. Run in the Supabase SQL editor.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    file_code text UNIQUE,
    bio text,
    location text,
    rank text NOT NULL DEFAULT 'Newcomer',
    rating double precision NOT NULL DEFAULT 0,
    review_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Signup happens directly in Supabase; provision a matching API profile automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, file_code)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(COALESCE(NEW.email, 'New member'), '@', 1)),
        NEW.raw_user_meta_data ->> 'file_code'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

CREATE TABLE IF NOT EXISTS listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text NOT NULL,
    category text NOT NULL,
    kind text NOT NULL CHECK (kind IN ('offer', 'want')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listings_feed_idx ON listings (kind, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS listings_owner_idx ON listings (owner_id, kind);

CREATE TABLE IF NOT EXISTS exchanges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid NOT NULL REFERENCES profiles(id),
    recipient_id uuid NOT NULL REFERENCES profiles(id),
    requester_listing_id uuid NOT NULL REFERENCES listings(id),
    recipient_listing_id uuid NOT NULL REFERENCES listings(id),
    terms jsonb NOT NULL,
    source text NOT NULL CHECK (source IN ('browse', 'match')),
    status text NOT NULL CHECK (status IN ('proposed', 'accepted', 'locked', 'completed', 'declined')),
    created_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    requester_completed boolean NOT NULL DEFAULT false,
    recipient_completed boolean NOT NULL DEFAULT false,
    thread_id uuid,
    response_reason text,
    CHECK (requester_id <> recipient_id)
);
CREATE INDEX IF NOT EXISTS exchanges_parties_idx ON exchanges (requester_id, recipient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id uuid NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES profiles(id),
    reviewee_id uuid NOT NULL REFERENCES profiles(id),
    stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (exchange_id, reviewer_id),
    CHECK (reviewer_id <> reviewee_id)
);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews (reviewee_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id uuid NOT NULL REFERENCES profiles(id),
    reported_user_id uuid REFERENCES profiles(id),
    listing_id uuid REFERENCES listings(id),
    reason text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (reported_user_id IS NOT NULL OR listing_id IS NOT NULL)
);
