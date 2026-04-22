-- Rescue waitlist — rescues that want to join Second Tail during beta.
-- Run this once in Supabase SQL editor before merging the PR.

create table if not exists rescue_waitlist (
  id uuid primary key default gen_random_uuid(),
  org_name text not null,
  contact_name text not null,
  email text not null,
  phone text,
  city text,
  state text,
  website text,
  how_heard text,
  notes text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists rescue_waitlist_created_idx
  on rescue_waitlist (created_at desc);

create index if not exists rescue_waitlist_status_idx
  on rescue_waitlist (status);

alter table rescue_waitlist enable row level security;

-- Allow anyone (including unauthenticated visitors) to INSERT via the anon key
-- (this endpoint is public — that's the point of a waitlist).
create policy "Public can submit waitlist entries"
  on rescue_waitlist for insert
  with check (true);

-- Only org_admins can SELECT (you query directly via Supabase for the beta queue).
create policy "Org admins can view waitlist"
  on rescue_waitlist for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and org_role = 'org_admin'
    )
  );
