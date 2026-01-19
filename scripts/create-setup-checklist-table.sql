-- Create table to track organization setup completion status
CREATE TABLE IF NOT EXISTS organization_setup_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  setup_step_id TEXT NOT NULL, -- e.g., "org_profile", "help_settings", "first_dog", etc.
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setup_step_id)
);

-- Enable RLS
ALTER TABLE organization_setup_status ENABLE ROW LEVEL SECURITY;

-- Policy: Rescue users can view their org's setup status
CREATE POLICY "Users can view their org setup status"
  ON organization_setup_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_setup_status.organization_id
      AND organizations.id IN (
        SELECT organization_id FROM profiles WHERE profiles.id = auth.uid()
      )
    )
  );

-- Policy: Org admins can update their org's setup status
CREATE POLICY "Org admins can update setup status"
  ON organization_setup_status
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = organization_setup_status.organization_id
      AND profiles.org_role = 'org_admin'
    )
  );

-- Policy: Org admins can insert their org's setup status
CREATE POLICY "Org admins can insert setup status"
  ON organization_setup_status
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = organization_setup_status.organization_id
      AND profiles.org_role = 'org_admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_setup_status_org ON organization_setup_status(organization_id);
CREATE INDEX idx_setup_status_completed ON organization_setup_status(is_completed);
