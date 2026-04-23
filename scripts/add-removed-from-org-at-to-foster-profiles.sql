-- Track when a foster was removed from an org's network.
-- Used to show a friendly banner on the unconnected foster dashboard.
-- Run once in Supabase SQL editor before merging.

alter table foster_profiles
  add column if not exists removed_from_org_at timestamptz;
