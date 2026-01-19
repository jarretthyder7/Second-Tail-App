-- Create appointment_types table
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointment types in their organization"
  ON appointment_types FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Rescue users can manage appointment types"
  ON appointment_types FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'rescue'
    )
  );

-- Insert default appointment types for all organizations
INSERT INTO appointment_types (organization_id, name, color, is_default)
SELECT DISTINCT id, 'Vet Visit', '#EF4444', true FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE organization_id = organizations.id AND name = 'Vet Visit'
);

INSERT INTO appointment_types (organization_id, name, color, is_default)
SELECT DISTINCT id, 'Home Check', '#F59E0B', true FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE organization_id = organizations.id AND name = 'Home Check'
);

INSERT INTO appointment_types (organization_id, name, color, is_default)
SELECT DISTINCT id, 'Meet & Greet', '#10B981', true FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE organization_id = organizations.id AND name = 'Meet & Greet'
);

COMMIT;
