-- Create table for organization support/help settings
CREATE TABLE IF NOT EXISTS help_request_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_phone TEXT,
  emergency_phone TEXT,
  allowed_supply_types JSONB DEFAULT '["Food", "Pee Pads", "Crate", "Toys", "Leash", "Medications", "Other"]'::jsonb,
  allowed_appointment_types JSONB DEFAULT '["Vet Visit", "Checkup", "Vaccination", "Dental", "Emergency"]'::jsonb,
  appointment_booking_enabled BOOLEAN DEFAULT true,
  supplies_request_enabled BOOLEAN DEFAULT true,
  emergency_support_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Add RLS policies
ALTER TABLE help_request_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rescue admins can manage their settings"
  ON help_request_settings
  FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Foster users can view settings for their org"
  ON help_request_settings
  FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage all settings"
  ON help_request_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index
CREATE INDEX idx_help_request_settings_org ON help_request_settings(organization_id);
