-- Reimbursements feature toggles.
--
-- 1. Org-wide: help_request_settings.reimbursements_enabled
--    Default true so existing rescues are unaffected.
-- 2. Per-foster override: profiles.reimbursements_enabled (nullable)
--    null  → inherit org default (default behavior for everyone)
--    true  → force enabled even if org disables the feature
--    false → force disabled even if org enables it
--
-- Run once in the Supabase SQL editor.

alter table help_request_settings
  add column if not exists reimbursements_enabled boolean not null default true;

alter table profiles
  add column if not exists reimbursements_enabled boolean;

comment on column profiles.reimbursements_enabled is
  'Per-foster override for the reimbursements feature. null = inherit org default; true/false = force.';
