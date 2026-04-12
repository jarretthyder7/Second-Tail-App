-- Add organization_name column to waitlist table for rescue organizations
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS organization_name text;
