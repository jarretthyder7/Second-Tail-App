-- Add unique code column to invitations table for foster sign-up link validation
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS code text;

-- Backfill existing pending invitations with a random code so they are not broken
UPDATE invitations
SET code = substr(md5(random()::text || id::text), 1, 12)
WHERE code IS NULL;

-- Create a unique index on code (non-null values only)
CREATE UNIQUE INDEX IF NOT EXISTS invitations_code_unique ON invitations (code)
WHERE code IS NOT NULL;
