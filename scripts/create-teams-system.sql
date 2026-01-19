-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('foster', 'medical', 'adoption', 'operations', 'custom')),
  description TEXT,
  lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members junction table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create staff_invitations table
CREATE TABLE IF NOT EXISTS staff_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL DEFAULT 'staff' CHECK (org_role IN ('org_admin', 'staff')),
  assigned_teams UUID[] DEFAULT ARRAY[]::UUID[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_teams_organization ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_email ON staff_invitations(email);
CREATE INDEX IF NOT EXISTS idx_staff_invitations_org ON staff_invitations(organization_id);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invitations ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams in their organization"
  ON teams FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Org admins can manage teams"
  ON teams FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND org_role = 'org_admin'
    )
  );

-- Team members policies
CREATE POLICY "Users can view team members in their organization"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Team leads and admins can manage team members"
  ON team_members FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      INNER JOIN profiles p ON p.id = auth.uid()
      WHERE t.organization_id = p.organization_id
      AND (p.org_role = 'org_admin' OR t.lead_id = auth.uid())
    )
  );

-- Staff invitations policies
CREATE POLICY "Org admins can manage staff invitations"
  ON staff_invitations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND org_role = 'org_admin'
    )
  );

CREATE POLICY "Invited users can view and update their invitations"
  ON staff_invitations FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Invited users can update their invitations"
  ON staff_invitations FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));
