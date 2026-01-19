-- Add branding column to organizations table if it doesn't exist
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "primary_color": "#D76B1A",
  "accent_color": "#F7E2BD",
  "logo_url": null
}'::jsonb;

-- Update RLS policy to allow org admins to update branding
-- (The existing UPDATE policy already covers this)
