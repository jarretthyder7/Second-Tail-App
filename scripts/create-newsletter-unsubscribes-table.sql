-- Unsubscribe tracking for newsletters.
-- Run this once in Supabase SQL editor before merging PR.

create table if not exists newsletter_unsubscribes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  unsubscribed_at timestamptz not null default now(),
  source text,
  constraint newsletter_unsubscribes_org_email_uniq unique (organization_id, email)
);

create index if not exists newsletter_unsubscribes_email_idx
  on newsletter_unsubscribes (email);

-- RLS: users can only see their own org's rows; service role bypasses RLS.
alter table newsletter_unsubscribes enable row level security;

create policy "Org admins can view their unsubscribes"
  on newsletter_unsubscribes for select
  using (
    organization_id in (
      select organization_id from profiles
      where id = auth.uid() and org_role = 'org_admin'
    )
  );
