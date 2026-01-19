-- Create dashboard_configs table for storing organization dashboard layouts
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE dashboard_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view their org's dashboard config
CREATE POLICY "Users can view their org's dashboard config"
  ON dashboard_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Org admins can update their org's dashboard config  
CREATE POLICY "Org admins can update their org's dashboard config"
  ON dashboard_configs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND org_role = 'org_admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_org_id ON dashboard_configs(organization_id);
