-- Add city, state, and referred_rescue columns to the waitlist table
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS referred_rescue text;
